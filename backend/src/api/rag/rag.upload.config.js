import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { BadRequestError } from '../../utils/errors/index.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(currentDirectory, '../../..');
export const ragStorageDirectory = path.resolve(
  backendDirectory,
  process.env.RAG_UPLOAD_DIR || 'storage/rag',
);

const configuredUploadLimitMb = Number(process.env.RAG_MAX_UPLOAD_MB ?? 10);
const maxUploadBytes =
  Number.isFinite(configuredUploadLimitMb) && configuredUploadLimitMb > 0
    ? Math.min(configuredUploadLimitMb, 10) * 1024 * 1024
    : 10 * 1024 * 1024;

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      const userDirectory = path.join(
        ragStorageDirectory,
        String(req.user.id),
      );
      fs.mkdir(userDirectory, { recursive: true })
        .then(() => callback(null, userDirectory))
        .catch(callback);
    },
    filename(req, file, callback) {
      callback(null, `${crypto.randomUUID()}.pdf`);
    },
  }),
  limits: { fileSize: maxUploadBytes, files: 1 },
  fileFilter(req, file, callback) {
    const hasPdfMimeType = [
      'application/pdf',
      'application/x-pdf',
    ].includes(file.mimetype);
    const hasPdfExtension = path.extname(file.originalname).toLowerCase() === '.pdf';
    if (!hasPdfMimeType || !hasPdfExtension) {
      callback(new BadRequestError('Only PDF files are accepted.'));
      return;
    }
    callback(null, true);
  },
});

export const createDocumentMulterErrorHandler = (req, res, next) => {
  upload.single('file')(req, res, error => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(
          new BadRequestError(
            `PDF files must be ${Math.floor(maxUploadBytes / (1024 * 1024))} MB or smaller.`,
          ),
        );
        return;
      }
      next(new BadRequestError(error.message));
      return;
    }
    next(error);
  });
};

export const resolveRagStoragePath = storagePath => {
  const absolutePath = path.resolve(ragStorageDirectory, storagePath);
  const storageRoot = `${path.resolve(ragStorageDirectory)}${path.sep}`;
  if (!absolutePath.startsWith(storageRoot)) {
    throw new BadRequestError('Invalid document storage path.');
  }
  return absolutePath;
};
