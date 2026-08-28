import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import logger from '../logger.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/activity:
 *   get:
 *     tags: [Activity]
 *     summary: Get recent activity logs (filtered by job or user)
 *     parameters:
 *       - in: query
 *         name: jobId
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { jobId, limit = 50 } = req.query;

    const where = {};
    if (jobId) {
      where.details = { contains: `"jobId":${jobId}` };
    }
    // Non-admins only see their own activity
    if (req.user.role !== 'ADMIN') {
      where.userId = req.user.id;
    }

    const logs = await prisma.activityLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit), 200),
    });

    res.json(logs);
  } catch (err) {
    logger.error({ err }, 'Get activity logs error');
    res.status(500).json({ error: 'Error fetching activity logs' });
  }
});

export default router;
