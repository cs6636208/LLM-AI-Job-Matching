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

// Get all rubrics for a job
router.get('/:jobId', requireAuth, async (req, res) => {
  try {
    const rubrics = await prisma.rubric.findMany({
      where: { jobId: Number(req.params.jobId) },
      orderBy: { weight: 'desc' },
    });
    res.json(rubrics);
  } catch (err) {
    logger.error({ err }, 'Get rubrics error');
    res.status(500).json({ error: 'Error fetching rubrics' });
  }
});

// Create a rubric for a job
router.post('/:jobId', requireAuth, requireRole('ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { name, weight, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Rubric name is required' });

    const rubric = await prisma.rubric.create({
      data: {
        jobId: Number(req.params.jobId),
        name,
        weight: weight || 10,
        description: description || '',
      },
    });

    await logActivity(prisma, req.user.id, 'rubric_created', 'rubric', String(rubric.id), { name, weight });
    res.status(201).json(rubric);
  } catch (err) {
    logger.error({ err }, 'Create rubric error');
    res.status(500).json({ error: 'Error creating rubric' });
  }
});

// Update a rubric
router.put('/:id', requireAuth, requireRole('ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { name, weight, description } = req.body;
    const rubric = await prisma.rubric.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(weight !== undefined && { weight }),
        ...(description !== undefined && { description }),
      },
    });
    res.json(rubric);
  } catch (err) {
    logger.error({ err }, 'Update rubric error');
    res.status(500).json({ error: 'Error updating rubric' });
  }
});

// Delete a rubric
router.delete('/:id', requireAuth, requireRole('ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    await prisma.rubric.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Rubric deleted' });
  } catch (err) {
    logger.error({ err }, 'Delete rubric error');
    res.status(500).json({ error: 'Error deleting rubric' });
  }
});

export default router;
