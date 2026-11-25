import { StatusCodes } from 'http-status-codes';
import {
  createDocumentFromUploadService,
  deleteDocumentService,
  getDocumentFileService,
  getDocumentMetaService,
  listDocumentsForUserService,
  queryDocumentService,
  searchInDocumentService,
} from './rag.service.js';

export const createDocumentController = async (req, res, next) => {
  try {
    const data = await createDocumentFromUploadService({
      file: req.file,
      userId: req.user.id,
    });
    res.status(StatusCodes.CREATED).json({
      success: true,
      message:
        data.status === 'ready'
          ? 'Document uploaded and processed.'
          : 'Document uploaded, but processing failed.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const listDocumentsController = async (req, res, next) => {
  try {
    const data = await listDocumentsForUserService(req.user.id);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Documents fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentMetaController = async (req, res, next) => {
  try {
    const data = await getDocumentMetaService({
      documentId: req.params.documentId,
      userId: req.user.id,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentFileController = async (req, res, next) => {
  try {
    const { absolutePath, title } = await getDocumentFileService({
      documentId: req.params.documentId,
      userId: req.user.id,
    });
    res.type('application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pathSafeTitle(title)}"`);
    res.sendFile(absolutePath, error => {
      if (error) next(error);
    });
  } catch (error) {
    next(error);
  }
};

const pathSafeTitle = title =>
  String(title).replace(/[\r\n"\\]/g, '_').slice(0, 200);

export const searchInDocumentController = async (req, res, next) => {
  try {
    const data = await searchInDocumentService({
      documentId: req.params.documentId,
      userId: req.user.id,
      query: req.query.query,
      k: req.query.k,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Ranked chunk excerpts.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const queryDocumentController = async (req, res, next) => {
  try {
    const data = await queryDocumentService({
      documentId: req.params.documentId,
      userId: req.user.id,
      query: req.body.query,
      k: req.body.k,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Answer and citations.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocumentController = async (req, res, next) => {
  try {
    const data = await deleteDocumentService({
      documentId: req.params.documentId,
      userId: req.user.id,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document deleted successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
};
