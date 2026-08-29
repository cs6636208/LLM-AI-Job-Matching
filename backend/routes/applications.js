import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';
import logger from '../logger.js';

const router = express.Router();
const prisma = new PrismaClient();
const uploadRoot = path.resolve(process.env.UPLOAD_DIR || './uploads/resumes');
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_RESUME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const ALLOWED_RESUME_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);

const saveResume = async ({ name, mimeType, data }) => {
  if (!name || !data || !ALLOWED_RESUME_TYPES.has(mimeType)) {
    throw new Error('A PDF, DOC, or DOCX resume is required');
  }
  const extension = path.extname(name).toLowerCase();
  if (!ALLOWED_RESUME_EXTENSIONS.has(extension)) throw new Error('Resume file extension is not supported');
  const buffer = Buffer.from(data, 'base64');
  if (!buffer.length || buffer.length > MAX_RESUME_BYTES) {
    throw new Error('Resume must be no larger than 5MB');
  }
  await fs.mkdir(uploadRoot, { recursive: true });
  const storageKey = `${crypto.randomUUID()}${extension}`;
  await fs.writeFile(path.join(uploadRoot, storageKey), buffer, { flag: 'wx' });
  return storageKey;
};

const APPLICATION_STATUSES = ['NEW', 'REVIEWING', 'INTERVIEW', 'REJECTED', 'HIRED'];
const STATUS_TO_STAGE = {
  NEW: 'APPLIED',
  REVIEWING: 'SCREENING',
  INTERVIEW: 'INTERVIEW',
  REJECTED: 'REJECTED',
  HIRED: 'HIRED',
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

const publicJobSelect = {
  id: true,
  title: true,
  description: true,
  department: true,
  location: true,
  employmentType: true,
  salaryRange: true,
  createdAt: true,
  rubrics: { select: { id: true, name: true, description: true, weight: true }, orderBy: { weight: 'desc' } },
  _count: { select: { applications: true } },
};

/**
 * @swagger
 * /api/public/jobs:
 *   get:
 *     tags: [Public Jobs]
 *     summary: List active public job postings
 *     responses:
 *       200:
 *         description: Public job cards without private HR data
 */
router.get('/jobs', async (_req, res) => {
  try {
    const jobs = await prisma.job.findMany({ where: { status: 'active' }, select: publicJobSelect, orderBy: { createdAt: 'desc' } });
    res.json(jobs);
  } catch (err) {
    logger.error({ err }, 'Get public jobs error');
    res.status(500).json({ error: 'Error fetching public jobs' });
  }
});

/**
 * @swagger
 * /api/public/jobs/{jobId}:
 *   get:
 *     tags: [Public Jobs]
 *     summary: Get a public job posting
 */
router.get('/jobs/:jobId', async (req, res) => {
  try {
    const job = await prisma.job.findFirst({ where: { id: Number(req.params.jobId), status: 'active' }, select: publicJobSelect });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    logger.error({ err }, 'Get public job error');
    res.status(500).json({ error: 'Error fetching public job' });
  }
});

/**
 * @swagger
 * /api/public/jobs/{jobId}/applications:
 *   post:
 *     tags: [Public Jobs]
 *     summary: Submit a candidate application without authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, phone, consentAccepted]
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               resumeName: { type: string }
 *               coverNote: { type: string }
 *               consentAccepted: { type: boolean }
 */
router.post('/jobs/:jobId/applications', async (req, res) => {
  try {
    const jobId = Number(req.params.jobId);
    const fullName = String(req.body.fullName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const resumeName = req.body.resumeName ? String(req.body.resumeName).slice(0, 255) : null;
    const resumeMimeType = req.body.resumeMimeType ? String(req.body.resumeMimeType) : null;
    const resumeData = req.body.resumeData ? String(req.body.resumeData) : null;
    const coverNote = req.body.coverNote ? String(req.body.coverNote).slice(0, 5000) : null;

    if (!Number.isInteger(jobId) || !fullName || !email || !phone) {
      return res.status(400).json({ error: 'fullName, email, phone, and a valid jobId are required' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'A valid email is required' });
    if (req.body.consentAccepted !== true) return res.status(400).json({ error: 'Candidate consent is required' });
    if (!resumeName || !resumeData) return res.status(400).json({ error: 'A resume file is required' });
    if (!/^[A-Za-z0-9+/=]+$/.test(resumeData)) return res.status(400).json({ error: 'Invalid resume file data' });

    const job = await prisma.job.findFirst({ where: { id: jobId, status: 'active' }, select: { id: true, title: true, userId: true } });
    if (!job) return res.status(404).json({ error: 'Job not found or no longer accepting applications' });

    let storageKey;
    try {
      storageKey = await saveResume({ name: resumeName, mimeType: resumeMimeType, data: resumeData });
    } catch (fileError) {
      return res.status(400).json({ error: fileError.message });
    }

    try {
      const application = await prisma.$transaction(async (tx) => {
      let candidate = await tx.candidate.findFirst({ where: { userId: job.userId, email } });

      if (!candidate) {
        candidate = await tx.candidate.create({
          data: {
            userId: job.userId,
            name: fullName,
            email,
            phone,
            currentRole: 'Applicant',
            yearsOfExperience: 0,
            skills: '[]',
            education: '',
            summary: coverNote || 'Applied via public job board',
          },
        });
      }

      const existing = await tx.application.findUnique({ where: { jobId_candidateId: { jobId, candidateId: candidate.id } } });
      if (existing) {
        const duplicateError = new Error('This candidate has already applied to this job');
        duplicateError.code = 'DUPLICATE_APPLICATION';
        throw duplicateError;
      }

      await tx.jobCandidate.createMany({ data: [{ jobId, candidateId: candidate.id, stage: 'APPLIED' }], skipDuplicates: true });
      return tx.application.create({
        data: { jobId, candidateId: candidate.id, resumeName, resumeUrl: storageKey, coverNote, consentAccepted: true },
        select: { id: true, status: true, appliedAt: true, job: { select: { id: true, title: true } } },
      });
      });

      await logActivity(prisma, job.userId, 'public_application_received', 'application', String(application.id), { jobId, jobTitle: job.title });
      res.status(201).json({ ...application, resumeAvailable: true });
    } catch (err) {
      await fs.unlink(path.join(uploadRoot, storageKey)).catch(() => {});
      throw err;
    }
  } catch (err) {
    if (err.code === 'DUPLICATE_APPLICATION') return res.status(409).json({ error: err.message });
    logger.error({ err }, 'Create public application error');
    res.status(500).json({ error: 'Error submitting application' });
  }
});

router.get('/:id/resume', requireAuth, async (req, res) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: Number(req.params.id) },
      include: { job: { select: { userId: true } } },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (req.user.role !== 'ADMIN' && application.job.userId !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (!application.resumeUrl) return res.status(404).json({ error: 'Resume not found' });

    const filePath = path.resolve(uploadRoot, application.resumeUrl);
    if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) return res.status(400).json({ error: 'Invalid resume path' });
    await fs.access(filePath);
    res.download(filePath, application.resumeName || 'resume');
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Resume not found' });
    logger.error({ err }, 'Download application resume error');
    res.status(500).json({ error: 'Error downloading resume' });
  }
});

/**
 * @swagger
 * /api/applications:
 *   get:
 *     tags: [Applications]
 *     summary: List applications for the current HR workspace
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { job: { userId: req.user.id } };
    if (req.query.jobId) where.jobId = Number(req.query.jobId);
    if (req.query.status && APPLICATION_STATUSES.includes(req.query.status)) where.status = req.query.status;

    const applications = await prisma.application.findMany({
      where,
      include: {
        job: { select: { id: true, title: true } },
        candidate: { select: { id: true, name: true, email: true, phone: true, currentRole: true, yearsOfExperience: true, skills: true, education: true, summary: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });

    res.json(applications.map((application) => ({
      ...application,
      candidate: { ...application.candidate, skills: JSON.parse(application.candidate.skills || '[]') },
    })));
  } catch (err) {
    logger.error({ err }, 'Get applications error');
    res.status(500).json({ error: 'Error fetching applications' });
  }
});

/**
 * @swagger
 * /api/applications/{id}:
 *   put:
 *     tags: [Applications]
 *     summary: Update application status and sync pipeline stage
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', requireAuth, requireRole('ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const status = String(req.body.status || '').toUpperCase();
    if (!APPLICATION_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid application status' });

    const application = await prisma.application.findUnique({ where: { id: Number(req.params.id) }, include: { job: true, candidate: true } });
    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (req.user.role !== 'ADMIN' && application.job.userId !== req.user.id) return res.status(403).json({ error: 'Insufficient permissions' });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.jobCandidate.update({ where: { jobId_candidateId: { jobId: application.jobId, candidateId: application.candidateId } }, data: { stage: STATUS_TO_STAGE[status] } });
      return tx.application.update({ where: { id: application.id }, data: { status }, include: { job: { select: { id: true, title: true } }, candidate: true } });
    });

    await logActivity(prisma, req.user.id, 'application_status_changed', 'application', String(updated.id), { status, jobId: updated.jobId, candidateId: updated.candidateId });
    res.json(updated);
  } catch (err) {
    logger.error({ err }, 'Update application error');
    res.status(500).json({ error: 'Error updating application' });
  }
});

export default router;
