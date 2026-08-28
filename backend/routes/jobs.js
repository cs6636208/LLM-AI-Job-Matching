import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';
import logger from '../logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// ── Helper: RBAC check ───────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: Get all jobs for the current user (or all if ADMIN)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN'
      ? {}
      : { userId: req.user.id };

    const jobs = await prisma.job.findMany({
      where,
      include: {
        _count: { select: { jobCandidates: true, rubrics: true, interviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(jobs);
  } catch (err) {
    logger.error({ err }, 'Get jobs error');
    res.status(500).json({ error: 'Error fetching jobs' });
  }
});

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     tags: [Jobs]
 *     summary: Create a new job posting
 */
router.post('/', requireAuth, requireRole('ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { title, description, department, location, employmentType, salaryRange, rubrics } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const job = await prisma.job.create({
      data: {
        userId: req.user.id,
        title: title.trim(),
        description: description || '',
        department: department || '',
        location: location || '',
        employmentType: employmentType || 'Full-time',
        salaryRange: salaryRange || '',
        // Create default rubrics if provided
        ...(rubrics?.length > 0 && {
          rubrics: {
            create: rubrics.map(r => ({
              name: r.name,
              weight: r.weight || 10,
              description: r.description || '',
            })),
          },
        }),
      },
      include: { rubrics: true },
    });

    await logActivity(prisma, req.user.id, 'job_created', 'job', String(job.id), { title: job.title });

    res.status(201).json(job);
  } catch (err) {
    logger.error({ err }, 'Create job error');
    res.status(500).json({ error: 'Error creating job' });
  }
});

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get a single job with candidates, rubrics, and interviews
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        rubrics: true,
        jobCandidates: {
          include: { candidate: true },
          orderBy: { aiScore: 'desc' },
        },
        interviews: {
          include: { candidate: true, interviewer: { select: { id: true, name: true, email: true } } },
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });

    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    logger.error({ err }, 'Get job error');
    res.status(500).json({ error: 'Error fetching job' });
  }
});

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     tags: [Jobs]
 *     summary: Update a job posting
 */
router.put('/:id', requireAuth, requireRole('ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { title, description, department, location, employmentType, salaryRange, status } = req.body;

    const job = await prisma.job.findUnique({ where: { id: Number(req.params.id) } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const updated = await prisma.job.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(department !== undefined && { department }),
        ...(location !== undefined && { location }),
        ...(employmentType !== undefined && { employmentType }),
        ...(salaryRange !== undefined && { salaryRange }),
        ...(status !== undefined && { status }),
      },
    });

    await logActivity(prisma, req.user.id, 'job_updated', 'job', String(job.id), { changes: req.body });

    res.json(updated);
  } catch (err) {
    logger.error({ err }, 'Update job error');
    res.status(500).json({ error: 'Error updating job' });
  }
});

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     tags: [Jobs]
 *     summary: Delete a job posting (ADMIN only)
 */
router.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.job.delete({ where: { id: Number(req.params.id) } });
    await logActivity(prisma, req.user.id, 'job_deleted', 'job', req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (err) {
    logger.error({ err }, 'Delete job error');
    res.status(500).json({ error: 'Error deleting job' });
  }
});

/**
 * @swagger
 * /api/jobs/{id}/candidates:
 *   post:
 *     tags: [Jobs]
 *     summary: Add a candidate to a job (moves them to APPLIED stage)
 */
router.post('/:id/candidates', requireAuth, requireRole('ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    const { candidateId } = req.body;

    if (!candidateId) return res.status(400).json({ error: 'candidateId is required' });

    const existing = await prisma.jobCandidate.findUnique({
      where: { jobId_candidateId: { jobId, candidateId } },
    });

    if (existing) return res.status(400).json({ error: 'Candidate already in this job' });

    const jc = await prisma.jobCandidate.create({
      data: { jobId, candidateId, stage: 'APPLIED' },
      include: { candidate: true },
    });

    await logActivity(prisma, req.user.id, 'candidate_added_to_job', 'candidate', candidateId, { jobId, jobTitle: (await prisma.job.findUnique({ where: { id: jobId } }))?.title });

    res.status(201).json(jc);
  } catch (err) {
    logger.error({ err }, 'Add candidate to job error');
    res.status(500).json({ error: 'Error adding candidate to job' });
  }
});

export default router;
