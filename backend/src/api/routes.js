import express from 'express';
import authRoutes from './auth/routes/auth.routes.js';
import questionsRoutes from './question/routes/question.routes.js'
import answerRoutes from './answer/routes/answer.routes.js'
import ragRoutes from './rag/rag.routes.js';


export const mainRouter = express.Router();

// Authentication routes
mainRouter.use('/auth', authRoutes);

//  /api/questions
mainRouter.use('/questions', questionsRoutes);

//  /api/answer
mainRouter.use('/answers', answerRoutes);
mainRouter.use('/rag', ragRoutes);
