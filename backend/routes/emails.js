import express from 'express';
import { PrismaClient, EmailType } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import logger from '../logger.js';

const router = express.Router();
const prisma = new PrismaClient();

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

// ── Email Templates ──────────────────────────────────────────────

// Get all templates for the current user
router.get('/templates', requireAuth, async (req, res) => {
  try {
    const templates = await prisma.emailTemplate.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(templates);
  } catch (err) {
    logger.error({ err }, 'Get email templates error');
    res.status(500).json({ error: 'Error fetching email templates' });
  }
});

// Create an email template
router.post('/templates', requireAuth, requireRole('ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { name, type, subject, body } = req.body;
    if (!name || !subject || !body) {
      return res.status(400).json({ error: 'name, subject, and body are required' });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        userId: req.user.id,
        name,
        type: type || 'CUSTOM',
        subject,
        body,
      },
    });

    res.status(201).json(template);
  } catch (err) {
    logger.error({ err }, 'Create email template error');
    res.status(500).json({ error: 'Error creating email template' });
  }
});

// Update a template
router.put('/templates/:id', requireAuth, requireRole('ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { name, type, subject, body } = req.body;
    const template = await prisma.emailTemplate.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(subject !== undefined && { subject }),
        ...(body !== undefined && { body }),
      },
    });
    res.json(template);
  } catch (err) {
    logger.error({ err }, 'Update email template error');
    res.status(500).json({ error: 'Error updating email template' });
  }
});

// Delete a template
router.delete('/templates/:id', requireAuth, requireRole('ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    await prisma.emailTemplate.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    logger.error({ err }, 'Delete email template error');
    res.status(500).json({ error: 'Error deleting email template' });
  }
});

// ── Send Emails (simulated — logs to DB) ─────────────────────────

/**
 * @swagger
 * /api/emails/send:
 *   post:
 *     tags: [Emails]
 *     summary: Send an email (simulated — saved to DB, can integrate with real SMTP later)
 */
router.post('/send', requireAuth, requireRole('ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { jobId, toEmail, subject, body, templateId } = req.body;

    if (!toEmail || !subject || !body) {
      return res.status(400).json({ error: 'toEmail, subject, and body are required' });
    }

    const sentEmail = await prisma.sentEmail.create({
      data: {
        jobId: jobId || null,
        toEmail,
        subject,
        body,
        templateId: templateId || null,
      },
    });

    logger.info({ toEmail, subject }, 'Email sent (simulated)');
    res.status(201).json({ message: 'Email sent successfully', id: sentEmail.id });
  } catch (err) {
    logger.error({ err }, 'Send email error');
    res.status(500).json({ error: 'Error sending email' });
  }
});

// Get sent emails for a job
router.get('/sent', requireAuth, async (req, res) => {
  try {
    const { jobId } = req.query;
    const where = {};
    if (jobId) where.jobId = Number(jobId);

    const emails = await prisma.sentEmail.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: 100,
    });

    res.json(emails);
  } catch (err) {
    logger.error({ err }, 'Get sent emails error');
    res.status(500).json({ error: 'Error fetching sent emails' });
  }
});

export default router;
