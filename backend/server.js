import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import logger from './logger.js';
import swaggerSpec from './swagger.js';
import { createUserRateLimit } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import candidateRoutes from './routes/candidates.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Structured HTTP request logging
const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
});
app.use(httpLogger);

// Security: Helmet sets various HTTP headers
app.use(helmet());

// Security: Cookie parser for refresh tokens
app.use(cookieParser());

// CORS: restrict to allowed origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));

// API Documentation — Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'LLM-AI Job Matching API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// User-aware Rate Limiting
const authRateLimit = createUserRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many authentication attempts, please try again later.',
});

const apiRateLimit = createUserRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});

app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api', apiRateLimit, aiRoutes);
app.use('/api/candidates', apiRateLimit, candidateRoutes);

// Health check route (also verifies DB connectivity)
app.get('/health', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error({ err }, 'Unhandled error');

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed by CORS policy' });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// Start the server
app.listen(PORT, () => {
  logger.info({ port: PORT, allowedOrigins }, '🔒 Secure Backend Server started');
  logger.info({ url: `http://localhost:${PORT}/api-docs` }, '📖 API Documentation available');
});
