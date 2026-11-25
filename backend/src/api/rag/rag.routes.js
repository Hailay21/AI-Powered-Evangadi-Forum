import express from 'express';
import { authenticateUser } from '../../middleware/authentication.js';
import {
  createDocumentController,
  deleteDocumentController,
  getDocumentFileController,
  getDocumentMetaController,
  listDocumentsController,
  queryDocumentController,
  searchInDocumentController,
} from './rag.controller.js';
import { createDocumentMulterErrorHandler } from './rag.upload.config.js';
import {
  documentIdParamValidation,
  queryDocumentValidation,
  searchDocumentValidation,
} from './rag.validation.js';

const router = express.Router();

router.use(authenticateUser);

router.post(
  '/documents',
  createDocumentMulterErrorHandler,
  createDocumentController,
);
router.get('/documents', listDocumentsController);
router.get(
  '/documents/:documentId/search',
  searchDocumentValidation,
  searchInDocumentController,
);
router.post(
  '/documents/:documentId/query',
  queryDocumentValidation,
  queryDocumentController,
);
router.get(
  '/documents/:documentId/file',
  documentIdParamValidation,
  getDocumentFileController,
);
router.delete(
  '/documents/:documentId',
  documentIdParamValidation,
  deleteDocumentController,
);
router.get(
  '/documents/:documentId',
  documentIdParamValidation,
  getDocumentMetaController,
);

export default router;
