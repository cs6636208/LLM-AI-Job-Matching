import express from 'express';
import { PrismaClient, PipelineStage } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import logger from '../logger.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/export/job/{jobId}:
 *   get:
 *     tags: [Export]
 *     summary: Export job analysis as JSON (for frontend PDF generation)
 *     description: Returns structured data that the frontend renders into a PDF
 */
router.get('/job/:jobId', requireAuth, async (req, res) => {
  try {
    const jobId = Number(req.params.jobId);

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        rubrics: true,
        jobCandidates: {
          include: { candidate: true },
          orderBy: { aiScore: 'desc' },
        },
        interviews: {
          include: {
            candidate: { select: { id: true, name: true } },
            interviewer: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Organize candidates by stage
    const byStage = {};
    for (const stage of Object.values(PipelineStage)) {
      byStage[stage] = job.jobCandidates
        .filter(jc => jc.stage === stage)
        .map(jc => ({
          name: jc.candidate.name,
          role: jc.candidate.currentRole,
          experience: jc.candidate.yearsOfExperience,
          education: jc.candidate.education,
          aiScore: jc.aiScore,
          aiAnalysis: jc.aiAnalysis ? JSON.parse(jc.aiAnalysis) : null,
        }));
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.name,
      job: {
        title: job.title,
        description: job.description,
        department: job.department,
        location: job.location,
        employmentType: job.employmentType,
        salaryRange: job.salaryRange,
        status: job.status,
        createdAt: job.createdAt,
      },
      rubrics: job.rubrics.map(r => ({ name: r.name, weight: r.weight, description: r.description })),
      pipeline: byStage,
      interviews: job.interviews.map(i => ({
        candidate: i.candidate.name,
        interviewer: i.interviewer.name,
        scheduledAt: i.scheduledAt,
        status: i.status,
        score: i.score,
        feedback: i.feedback,
      })),
      stats: {
        total: job.jobCandidates.length,
        applied: byStage.APPLIED?.length || 0,
        screening: byStage.SCREENING?.length || 0,
        interview: byStage.INTERVIEW?.length || 0,
        offer: byStage.OFFER?.length || 0,
        hired: byStage.HIRED?.length || 0,
        rejected: byStage.REJECTED?.length || 0,
      },
    };

    res.json(exportData);
  } catch (err) {
    logger.error({ err }, 'Export job error');
    res.status(500).json({ error: 'Error exporting job data' });
  }
});

/**
 * @swagger
 * /api/export/candidates/{jobId}:
 *   get:
 *     tags: [Export]
 *     summary: Export candidates list as CSV-compatible JSON
 */
router.get('/candidates/:jobId', requireAuth, async (req, res) => {
  try {
    const jobCandidates = await prisma.jobCandidate.findMany({
      where: { jobId: Number(req.params.jobId) },
      include: { candidate: true },
      orderBy: { aiScore: 'desc' },
    });

    const csv = jobCandidates.map(jc => ({
      Name: jc.candidate.name,
      Role: jc.candidate.currentRole,
      Experience: jc.candidate.yearsOfExperience,
      Education: jc.candidate.education,
      Skills: jc.candidate.skills,
      Stage: jc.stage,
      AIScore: jc.aiScore || 'N/A',
      AppliedAt: jc.appliedAt.toISOString(),
    }));

    res.json(csv);
  } catch (err) {
    logger.error({ err }, 'Export candidates error');
    res.status(500).json({ error: 'Error exporting candidates' });
  }
});

export default router;
