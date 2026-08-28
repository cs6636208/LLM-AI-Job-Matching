import express from 'express';
import { PrismaClient, PipelineStage } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';
import logger from '../logger.js';

const router = express.Router();
const prisma = new PrismaClient();

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

/**
 * @swagger
 * /api/pipeline/{jobId}:
 *   get:
 *     tags: [Pipeline]
 *     summary: Get all candidates in a job organized by pipeline stage
 */
router.get('/:jobId', requireAuth, async (req, res) => {
  try {
    const jobId = Number(req.params.jobId);
    const jobCandidates = await prisma.jobCandidate.findMany({
      where: { jobId },
      include: { candidate: true },
      orderBy: { appliedAt: 'asc' },
    });

    // Group by stage
    const pipeline = {};
    for (const stage of Object.values(PipelineStage)) {
      pipeline[stage] = jobCandidates.filter(jc => jc.stage === stage);
    }

    res.json({ jobId, pipeline });
  } catch (err) {
    logger.error({ err }, 'Get pipeline error');
    res.status(500).json({ error: 'Error fetching pipeline' });
  }
});

/**
 * @swagger
 * /api/pipeline/{jobId}/{candidateId}:
 *   put:
 *     tags: [Pipeline]
 *     summary: Move a candidate to a new pipeline stage
 */
router.put('/:jobId/:candidateId', requireAuth, requireRole('ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const jobId = Number(req.params.jobId);
    const { candidateId } = req.params;
    const { stage } = req.body;

    if (!stage || !Object.values(PipelineStage).includes(stage)) {
      return res.status(400).json({ error: `Invalid stage. Must be one of: ${Object.values(PipelineStage).join(', ')}` });
    }

    const jc = await prisma.jobCandidate.findUnique({
      where: { jobId_candidateId: { jobId, candidateId } },
      include: { candidate: true, job: true },
    });

    if (!jc) return res.status(404).json({ error: 'Candidate not found in this job' });

    const oldStage = jc.stage;
    const updated = await prisma.jobCandidate.update({
      where: { jobId_candidateId: { jobId, candidateId } },
      data: { stage },
      include: { candidate: true },
    });

    await logActivity(prisma, req.user.id, 'stage_changed', 'candidate', candidateId, {
      jobId,
      jobTitle: jc.job.title,
      candidateName: jc.candidate.name,
      from: oldStage,
      to: stage,
    });

    res.json(updated);
  } catch (err) {
    logger.error({ err }, 'Update pipeline stage error');
    res.status(500).json({ error: 'Error updating pipeline stage' });
  }
});

/**
 * @swagger
 * /api/pipeline/stats/{jobId}:
 *   get:
 *     tags: [Pipeline]
 *     summary: Get pipeline statistics (count per stage)
 */
router.get('/stats/:jobId', requireAuth, async (req, res) => {
  try {
    const jobId = Number(req.params.jobId);

    const stats = await prisma.jobCandidate.groupBy({
      by: ['stage'],
      where: { jobId },
      _count: true,
    });

    const result = {};
    for (const stage of Object.values(PipelineStage)) {
      const found = stats.find(s => s.stage === stage);
      result[stage] = found ? found._count : 0;
    }

    res.json({ jobId, stats: result });
  } catch (err) {
    logger.error({ err }, 'Get pipeline stats error');
    res.status(500).json({ error: 'Error fetching pipeline stats' });
  }
});

export default router;
