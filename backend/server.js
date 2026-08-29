import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import logger from './logger.js';
import swaggerSpec from './swagger.js';
import { createUserRateLimit } from './middleware/rateLimit.js';

// Routes
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import candidateRoutes from './routes/candidates.js';
import jobRoutes from './routes/jobs.js';
import pipelineRoutes from './routes/pipeline.js';
import activityRoutes from './routes/activity.js';
import rubricRoutes from './routes/rubrics.js';
import interviewRoutes from './routes/interviews.js';
import noteRoutes from './routes/notes.js';
import offerRoutes from './routes/offers.js';
import emailRoutes from './routes/emails.js';
import exportRoutes from './routes/export.js';
import bulkRoutes from './routes/bulk.js';
import applicationRoutes from './routes/applications.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────

const httpLogger = pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url === '/health' },
});
app.use(httpLogger);
app.use(helmet());
app.use(cookieParser());

const configuredOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// Vite may move from 5173 to 5174 when the first port is occupied.
// Keep this convenience limited to local development; production still uses
// the explicit ALLOWED_ORIGINS allow-list.
const developmentOrigins = process.env.NODE_ENV === 'production'
  ? []
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ];

const allowedOrigins = [...new Set([...developmentOrigins, ...configuredOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// ── Rate Limiting ────────────────────────────────────────────────

const authRateLimit = createUserRateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: 'Too many auth attempts' });
const apiRateLimit = createUserRateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests' });

// ── API Documentation ────────────────────────────────────────────

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'LLM-AI Job Matching API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// ── Routes ───────────────────────────────────────────────────────

app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api', apiRateLimit, aiRoutes);
app.use('/api/candidates', apiRateLimit, candidateRoutes);
app.use('/api/jobs', apiRateLimit, jobRoutes);
app.use('/api/pipeline', apiRateLimit, pipelineRoutes);
app.use('/api/activity', apiRateLimit, activityRoutes);
app.use('/api/rubrics', apiRateLimit, rubricRoutes);
app.use('/api/interviews', apiRateLimit, interviewRoutes);
app.use('/api/notes', apiRateLimit, noteRoutes);
app.use('/api/offers', apiRateLimit, offerRoutes);
app.use('/api/emails', apiRateLimit, emailRoutes);
app.use('/api/export', apiRateLimit, exportRoutes);
app.use('/api/bulk', apiRateLimit, bulkRoutes);
// Public job board/application endpoints share the same rate limit by IP when unauthenticated.
app.use('/api/public', apiRateLimit, applicationRoutes);
// Authenticated HR application inbox/status management.
app.use('/api/applications', apiRateLimit, applicationRoutes);

// ── Health Check ─────────────────────────────────────────────────

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

// ── Global Error Handler ─────────────────────────────────────────

app.use((err, req, res, next) => {
  logger.error({ err }, 'Unhandled error');
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed by CORS policy' });
  }
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── Start ────────────────────────────────────────────────────────

app.listen(PORT, () => {
  logger.info({ port: PORT, allowedOrigins }, '🔒 Secure Backend Server started');
  logger.info({ url: `http://localhost:${PORT}/api-docs` }, '📖 API Documentation available');
});
