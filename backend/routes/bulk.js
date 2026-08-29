import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import logger from '../logger.js';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/upload', requireAuth, async (req, res) => {
  try {
    const { candidates, jobId } = req.body;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ error: 'candidates array is required' });
    }
    const seen = new Set();
    const unique = candidates.filter(c => {
      const key = c.name?.toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const created = await prisma.$transaction(
      unique.map(c =>
        prisma.candidate.create({
          data: {
            userId: req.user.id,
            name: c.name,
            currentRole: c.currentRole || 'Unknown',
            yearsOfExperience: c.yearsOfExperience || 0,
            skills: JSON.stringify(c.skills || []),
            education: c.education || '',
            summary: c.summary || '',
            email: c.email || null,
            phone: c.phone || null,
          },
        })
      )
    );
    let addedToJob = 0;
    if (jobId) {
      const job = await prisma.job.findFirst({
        where: {
          id: Number(jobId),
          ...(req.user.role === 'ADMIN' ? {} : { userId: req.user.id }),
        },
      });
      if (job) {
        await prisma.jobCandidate.createMany({
          data: created.map(c => ({ jobId: Number(jobId), candidateId: c.id, stage: 'APPLIED' })),
          skipDuplicates: true,
        });
        addedToJob = created.length;
      }
    }
    logger.info({ count: created.length }, 'Bulk candidates uploaded');
    res.status(201).json({
      message: `Successfully imported ${created.length} candidates`,
      imported: created.length,
      duplicatesSkipped: candidates.length - created.length,
      addedToJob,
      candidates: created.map(c => ({ id: c.id, name: c.name })),
    });
  } catch (err) {
    logger.error({ err }, 'Bulk upload error');
    res.status(500).json({ error: 'Error during bulk upload' });
  }
});

router.post('/parse-text', requireAuth, async (req, res) => {
  try {
    const { texts } = req.body;
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'texts array is required' });
    }
    if (texts.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 resumes at a time' });
    }
    const API_KEY = process.env.TYPHOON_API_KEY;
    const API_URL = 'https://api.opentyphoon.ai/v1/chat/completions';

    const extractOne = async (resumeText, index) => {
      const prompt = 'Extract candidate profile as JSON: {"name":"","currentRole":"","yearsOfExperience":0,"skills":[],"education":"","summary":""}\n\nResume:\n"""' + resumeText + '"""';
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({
          model: 'typhoon-v2.5-30b-a3b-instruct',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.1,
        }),
      });
      if (!response.ok) {
        logger.warn({ index, status: response.status }, '[BULK] Extract failed');
        return null;
      }
      const data = await response.json();
      let rawText = data.choices[0].message.content;
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) rawText = match[0];
      rawText = rawText.replace(/^```json[\r\n]*/gi, '').replace(/```$/g, '').trim();
      try {
        return JSON.parse(rawText);
      } catch {
        rawText = rawText.replace(/,\s*([\]}])/g, '$1');
        try { return JSON.parse(rawText); } catch { return null; }
      }
    };

    const results = [];
    for (let i = 0; i < texts.length; i += 5) {
      const batch = texts.slice(i, i + 5);
      const batchResults = await Promise.all(batch.map((t, idx) => extractOne(t, i + idx)));
      results.push(...batchResults);
    }
    const successful = results.filter(Boolean);
    res.json({ extracted: successful, total: texts.length, successful: successful.length, failed: results.filter(r => r === null).length });
  } catch (err) {
    logger.error({ err }, 'Bulk parse error');
    res.status(500).json({ error: 'Error parsing resumes' });
  }
});

export default router;
