import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { validate, bulkCandidateSchema } from '../validate.js';
import logger from '../logger.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/candidates:
 *   get:
 *     tags: [Candidates]
 *     summary: Get all candidates for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of candidates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Candidate'
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    
    const formatted = candidates.map(c => ({
      ...c,
      skills: JSON.parse(c.skills)
    }));
    
    res.json(formatted);
  } catch (err) {
    logger.error({ err, userId: req.user?.id }, 'Get candidates error');
    res.status(500).json({ error: 'Error fetching candidates' });
  }
});

/**
 * @swagger
 * /api/candidates/bulk:
 *   post:
 *     tags: [Candidates]
 *     summary: Create multiple candidates at once
 *     description: Used for syncing mock data or bulk importing from resume parsing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [candidates]
 *             properties:
 *               candidates:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Candidate'
 *     responses:
 *       200:
 *         description: Candidates saved successfully
 *       400:
 *         description: Validation error
 */
router.post('/bulk', requireAuth, validate(bulkCandidateSchema), async (req, res) => {
  try {
    const { candidates } = req.body;

    const dbData = candidates.map(c => ({
      userId: req.user.id,
      name: c.name,
      currentRole: c.currentRole,
      yearsOfExperience: c.yearsOfExperience,
      education: c.education || '',
      summary: c.summary || '',
      skills: JSON.stringify(c.skills || []),
      isMock: c.id?.includes('RAND') || false
    }));

    await prisma.candidate.createMany({ data: dbData });

    logger.info({ userId: req.user.id, count: candidates.length }, 'Bulk candidates saved');
    res.json({ message: 'Saved successfully' });
  } catch (err) {
    logger.error({ err, userId: req.user?.id }, 'Bulk save error');
    res.status(500).json({ error: 'Error saving candidates' });
  }
});

/**
 * @swagger
 * /api/candidates/shortlist/{candidateId}:
 *   post:
 *     tags: [Candidates]
 *     summary: Toggle shortlist status for a candidate
 *     description: Adds or removes a candidate from the user's shortlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               matchedSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               missingSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Shortlist toggled successfully
 */
router.post('/shortlist/:candidateId', requireAuth, async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { score, matchedSkills, missingSkills } = req.body;

    const existing = await prisma.shortlist.findUnique({
      where: { userId_candidateId: { userId: req.user.id, candidateId } }
    });

    if (existing) {
      await prisma.shortlist.delete({ where: { id: existing.id }});
      logger.info({ userId: req.user.id, candidateId }, 'Removed from shortlist');
      return res.json({ message: 'Removed from shortlist', isShortlisted: false });
    } else {
      await prisma.shortlist.create({
        data: {
          userId: req.user.id,
          candidateId,
          score,
          matchedSkills: JSON.stringify(matchedSkills || []),
          missingSkills: JSON.stringify(missingSkills || [])
        }
      });
      logger.info({ userId: req.user.id, candidateId }, 'Added to shortlist');
      return res.json({ message: 'Added to shortlist', isShortlisted: true });
    }
  } catch (err) {
    logger.error({ err, userId: req.user?.id }, 'Shortlist error');
    res.status(500).json({ error: 'Error toggling shortlist' });
  }
});

/**
 * @swagger
 * /api/candidates/shortlists:
 *   get:
 *     tags: [Candidates]
 *     summary: Get all shortlisted candidates
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shortlisted candidates with scores
 */
router.get('/shortlists', requireAuth, async (req, res) => {
  try {
    const items = await prisma.shortlist.findMany({
      where: { userId: req.user.id },
      include: { candidate: true },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = items.map(s => ({
      ...s.candidate,
      skills: JSON.parse(s.candidate.skills),
      score: s.score,
      matchedSkills: s.matchedSkills ? JSON.parse(s.matchedSkills) : [],
      missingSkills: s.missingSkills ? JSON.parse(s.missingSkills) : [],
      shortlistId: s.id
    }));

    res.json(formatted);
  } catch (err) {
    logger.error({ err, userId: req.user?.id }, 'Get shortlists error');
    res.status(500).json({ error: 'Error fetching shortlists' });
  }
});

export default router;
