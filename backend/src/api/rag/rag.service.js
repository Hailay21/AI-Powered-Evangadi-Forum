import { readFile, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';
import { safeExecute } from '../../../db/config.js';
import {
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
} from '../../utils/errors/index.js';
import { calculateCosineSimilarity, generateQuestionEmbedding } from '../question/service/vector.service.js';
import {
  ragStorageDirectory,
  resolveRagStoragePath,
} from './rag.upload.config.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TEXT_MODEL =
  process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash-lite';
const readNumberSetting = (name, fallback, min, max) => {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === '') return fallback;
  const value = Number(rawValue);
  return Number.isFinite(value) && value >= min && value <= max
    ? value
    : fallback;
};
const RAG_SIMILARITY_THRESHOLD = readNumberSetting(
  'RAG_SEARCH_THRESHOLD',
  0.45,
  0,
  1,
);
const CHUNK_SIZE = Math.floor(
  readNumberSetting('RAG_CHUNK_CHARS', 1000, 100, 10000),
);
const CHUNK_OVERLAP = Math.floor(
  readNumberSetting(
    'RAG_CHUNK_OVERLAP',
    Math.min(150, Math.floor(CHUNK_SIZE / 2)),
    0,
    Math.floor(CHUNK_SIZE / 2),
  ),
);
const MAX_CHUNKS_PER_DOCUMENT = Math.floor(
  readNumberSetting('RAG_MAX_CHUNKS_PER_DOC', 1000, 1, 10000),
);
const MAX_DOCUMENTS_PER_USER = Math.floor(
  readNumberSetting('RAG_MAX_PDFS_PER_USER', 20, 1, 1000),
);
const MIN_TEXT_CHARACTERS = Math.floor(
  readNumberSetting('RAG_MIN_TEXT_CHARS', 50, 1, 100000),
);
const DEFAULT_SEARCH_RESULTS = Math.floor(
  readNumberSetting('RAG_SEARCH_K', 10, 1, 20),
);

const removeUnregisteredUpload = async filePath => {
  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
};

const mapDocument = row => ({
  documentId: row.documentId,
  userId: row.userId,
  title: row.title,
  mimeType: row.mimeType,
  byteSize: Number(row.byteSize),
  status: row.status,
  errorMessage: row.errorMessage,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  storagePath: row.storagePath,
});

export const chunkDocumentText = (
  text,
  chunkSize = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP,
) => {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  if (!normalizedText) return [];
  if (chunkSize <= 0 || overlap < 0 || overlap > Math.floor(chunkSize / 2)) {
    throw new RangeError('Chunk overlap must not exceed half of the chunk size.');
  }

  const chunks = [];
  let start = 0;
  while (start < normalizedText.length) {
    let end = Math.min(start + chunkSize, normalizedText.length);
    if (end < normalizedText.length) {
      const boundary = normalizedText.lastIndexOf(' ', end);
      if (boundary > start + Math.max(Math.floor(chunkSize * 0.6), overlap)) {
        end = boundary;
      }
    }
    const chunk = normalizedText.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end === normalizedText.length) break;
    start = end - overlap;
  }
  return chunks;
};

export const assertOwnedDocument = async (
  documentId,
  userId,
  { requireReady = false } = {},
) => {
  const rows = await safeExecute(
    `SELECT
       document_id AS documentId,
       user_id AS userId,
       title,
       mime_type AS mimeType,
       storage_path AS storagePath,
       byte_size AS byteSize,
       status,
       error_message AS errorMessage,
       created_at AS createdAt,
       updated_at AS updatedAt
     FROM documents
     WHERE document_id = ? AND user_id = ?
     LIMIT 1`,
    [documentId, userId],
  );
  if (rows.length === 0) throw new NotFoundError('Document not found.');
  if (requireReady && rows[0].status !== 'ready') {
    throw new BadRequestError(
      `Document is not ready for use (status: ${rows[0].status}).`,
    );
  }
  return rows[0];
};

export const listDocumentsForUserService = async userId => {
  const rows = await safeExecute(
    `SELECT
       document_id AS documentId,
       user_id AS userId,
       title,
       mime_type AS mimeType,
       storage_path AS storagePath,
       byte_size AS byteSize,
       status,
       error_message AS errorMessage,
       created_at AS createdAt,
       updated_at AS updatedAt
     FROM documents
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId],
  );
  return rows.map(mapDocument);
};

export const getDocumentMetaService = async ({ documentId, userId }) =>
  mapDocument(await assertOwnedDocument(documentId, userId));

export const getDocumentFileService = async ({ documentId, userId }) => {
  const document = await assertOwnedDocument(documentId, userId);
  const absolutePath = resolveRagStoragePath(document.storagePath);
  await stat(absolutePath);
  return { absolutePath, title: document.title };
};

export const createDocumentFromUploadService = async ({ file, userId }) => {
  if (!file) throw new BadRequestError('A PDF file is required.');

  const fileBuffer = await readFile(file.path);
  if (fileBuffer.subarray(0, 5).toString() !== '%PDF-') {
    await removeUnregisteredUpload(file.path);
    throw new BadRequestError('The uploaded file is not a valid PDF.');
  }

  let countRows;
  try {
    countRows = await safeExecute(
      'SELECT COUNT(*) AS total FROM documents WHERE user_id = ?',
      [userId],
    );
  } catch (error) {
    await removeUnregisteredUpload(file.path);
    throw error;
  }
  if (Number(countRows[0]?.total || 0) >= MAX_DOCUMENTS_PER_USER) {
    await removeUnregisteredUpload(file.path);
    throw new BadRequestError(
      `You can upload at most ${MAX_DOCUMENTS_PER_USER} PDF documents.`,
    );
  }

  const storagePath = path
    .relative(ragStorageDirectory, file.path)
    .split(path.sep)
    .join('/');
  let insertResult;
  try {
    insertResult = await safeExecute(
      `INSERT INTO documents
         (user_id, title, mime_type, storage_path, byte_size, status)
       VALUES (?, ?, 'application/pdf', ?, ?, 'processing')`,
      [userId, path.basename(file.originalname), storagePath, file.size],
    );
  } catch (error) {
    await removeUnregisteredUpload(file.path).catch(cleanupError => {
      console.error('Failed to remove unrecorded RAG upload:', cleanupError);
    });
    throw error;
  }

  const documentId = insertResult.insertId;
  try {
    const parser = new PDFParse({ data: fileBuffer });
    let extractedText;
    try {
      const result = await parser.getText();
      extractedText = result.text;
    } finally {
      await parser.destroy();
    }

    const chunks = chunkDocumentText(extractedText);
    if (extractedText.trim().length < MIN_TEXT_CHARACTERS || chunks.length === 0) {
      throw new BadRequestError('The PDF does not contain enough readable text.');
    }
    if (chunks.length > MAX_CHUNKS_PER_DOCUMENT) {
      throw new BadRequestError(
        `This PDF is too large to index (maximum ${MAX_CHUNKS_PER_DOCUMENT} text sections).`,
      );
    }

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      const content = chunks[chunkIndex];
      const chunkResult = await safeExecute(
        `INSERT INTO document_chunks (document_id, chunk_index, content)
         VALUES (?, ?, ?)`,
        [documentId, chunkIndex, content],
      );
      const embeddingResult = await generateQuestionEmbedding(content, {
        taskType: 'RETRIEVAL_DOCUMENT',
      });
      await safeExecute(
        `INSERT INTO document_chunk_vectors
           (chunk_id, source_text, embedding, status)
         VALUES (?, ?, ?, 'ready')`,
        [
          chunkResult.insertId,
          content,
          JSON.stringify(embeddingResult.embedding),
        ],
      );
    }

    await safeExecute(
      `UPDATE documents
       SET status = 'ready', error_message = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE document_id = ? AND user_id = ?`,
      [documentId, userId],
    );
  } catch (error) {
    const errorMessage =
      error instanceof BadRequestError
        ? error.message
        : 'Document processing failed. Please try uploading it again.';
    console.error(`Failed to process RAG document ${documentId}:`, error);
    await safeExecute(
      `UPDATE documents
       SET status = 'failed', error_message = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE document_id = ? AND user_id = ?`,
      [errorMessage, documentId, userId],
    );
  }

  return getDocumentMetaService({ documentId, userId });
};

export const searchInDocumentService = async ({
  documentId,
  userId,
  query,
  k = DEFAULT_SEARCH_RESULTS,
}) => {
  await assertOwnedDocument(documentId, userId, { requireReady: true });
  const queryEmbedding = await generateQuestionEmbedding(query, {
    taskType: 'RETRIEVAL_QUERY',
  });
  const rows = await safeExecute(
    `SELECT
       c.chunk_id AS chunkId,
       c.chunk_index AS chunkIndex,
       c.content,
       v.embedding
     FROM document_chunks c
     JOIN document_chunk_vectors v ON v.chunk_id = c.chunk_id
     WHERE c.document_id = ? AND v.status = 'ready'`,
    [documentId],
  );

  const rankedChunks = [];
  for (const row of rows) {
    try {
      const embedding =
        typeof row.embedding === 'string'
          ? JSON.parse(row.embedding)
          : row.embedding;
      const score = calculateCosineSimilarity(
        queryEmbedding.embedding,
        embedding,
      );
      if (score >= RAG_SIMILARITY_THRESHOLD) {
        rankedChunks.push({ ...row, score });
      }
    } catch (error) {
      console.warn(`Skipping invalid vector for chunk ${row.chunkId}:`, error);
    }
  }

  rankedChunks.sort((a, b) => b.score - a.score);
  return {
    query,
    results: rankedChunks.slice(0, Math.min(Number(k) || 5, 20)).map(row => ({
      chunkId: row.chunkId,
      chunkIndex: row.chunkIndex,
      score: Number(row.score.toFixed(6)),
      excerpt: row.content,
    })),
  };
};

const generateGroundedAnswer = async ({ query, results }) => {
  if (!GEMINI_API_KEY) {
    throw new ServiceUnavailableError(
      'AI document answers are not configured on this server.',
    );
  }
  const context = results
    .map(
      (result, index) =>
        `[${index + 1}] Chunk ${result.chunkIndex}:\n${result.excerpt}`,
    )
    .join('\n\n');
  const prompt = `Answer the user's question using only the document excerpts below.
If the excerpts do not contain the answer, say that the document does not provide enough information.
Do not use outside knowledge. Cite supporting excerpts inline using [1], [2], etc.

DOCUMENT EXCERPTS:
${context}

USER QUESTION:
${query}`;

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { maxOutputTokens: 1200, temperature: 0.2 },
    });
    if (typeof response.text !== 'string' || !response.text.trim()) {
      throw new Error('Gemini returned an empty answer.');
    }
    return response.text.trim();
  } catch (error) {
    console.error('RAG answer generation failed:', error);
    throw new ServiceUnavailableError(
      'AI document answers are temporarily unavailable.',
    );
  }
};

export const queryDocumentService = async ({
  documentId,
  userId,
  query,
  k = DEFAULT_SEARCH_RESULTS,
}) => {
  const search = await searchInDocumentService({
    documentId,
    userId,
    query,
    k,
  });
  if (search.results.length === 0) {
    return {
      answer:
        'I could not find relevant information for that question in this document.',
      citations: [],
      chunksUsed: [],
    };
  }

  const answer = await generateGroundedAnswer({
    query,
    results: search.results,
  });
  return {
    answer,
    citations: search.results.map((result, index) => ({
      ref: index + 1,
      chunkIndex: result.chunkIndex,
    })),
    chunksUsed: search.results.map(result => result.chunkId),
  };
};

export const deleteDocumentService = async ({ documentId, userId }) => {
  const document = await assertOwnedDocument(documentId, userId);
  const absolutePath = resolveRagStoragePath(document.storagePath);
  try {
    await unlink(absolutePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await safeExecute(
    'DELETE FROM documents WHERE document_id = ? AND user_id = ?',
    [documentId, userId],
  );
  return { id: Number(documentId) };
};
