import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';
import logger from '../logger.js';

const router = express.Router();
const prisma = new PrismaClient();

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

// Get all interviews (optionally filtered by job or interviewer)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { jobId, status } = req.query;
    const where = {};
    if (jobId) where.jobId = Number(jobId);
    if (status) where.status = status;

    // Interviewers only see their own interviews
    if (req.user.role === 'INTERVIEWER') {
      where.interviewerId = req.user.id;
    }

    const interviews = await prisma.interview.findMany({
      where,
      include: {
        candidate: true,
        job: { select: { id: true, title: true } },
        interviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json(interviews);
  } catch (err) {
    logger.error({ err }, 'Get interviews error');
    res.status(500).json({ error: 'Error fetching interviews' });
  }
});

// Schedule a new interview
router.post('/', requireAuth, requireRole('ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { jobId, candidateId, interviewerId, scheduledAt, durationMin, location, notes } = req.body;

    if (!jobId || !candidateId || !interviewerId || !scheduledAt) {
      return res.status(400).json({ error: 'jobId, candidateId, interviewerId, and scheduledAt are required' });
    }

    const interview = await prisma.interview.create({
      data: {
        jobId,
        candidateId,
        interviewerId,
        scheduledAt: new Date(scheduledAt),
        durationMin: durationMin || 60,
        location: location || '',
        notes: notes || '',
      },
      include: {
        candidate: true,
        job: { select: { id: true, title: true } },
        interviewer: { select: { id: true, name: true } },
      },
    });

    await logActivity(prisma, req.user.id, 'interview_scheduled', 'interview', String(interview.id), {
      candidateName: interview.candidate.name,
      jobTitle: interview.job.title,
      scheduledAt,
    });

    res.status(201).json(interview);
  } catch (err) {
    logger.error({ err }, 'Create interview error');
    res.status(500).json({ error: 'Error scheduling interview' });
  }
});

// Update interview (status, feedback, score)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { status, feedback, score, notes } = req.body;

    const interview = await prisma.interview.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(status !== undefined && { status }),
        ...(feedback !== undefined && { feedback }),
        ...(score !== undefined && { score: score !== null ? Number(score) : null }),
        ...(notes !== undefined && { notes }),
      },
      include: { candidate: true, job: { select: { id: true, title: true } } },
    });

    await logActivity(prisma, req.user.id, 'interview_updated', 'interview', String(interview.id), {
      status, score,
    });

    res.json(interview);
  } catch (err) {
    logger.error({ err }, 'Update interview error');
    res.status(500).json({ error: 'Error updating interview' });
  }
});

// Delete interview
router.delete('/:id', requireAuth, requireRole('ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    await prisma.interview.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Interview deleted' });
  } catch (err) {
    logger.error({ err }, 'Delete interview error');
    res.status(500).json({ error: 'Error deleting interview' });
  }
});

export default router;
