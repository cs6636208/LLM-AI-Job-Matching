import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';
import logger from '../logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get notes for a candidate (viewers see all, interviewers see non-private only)
router.get('/:candidateId', requireAuth, async (req, res) => {
  try {
    const where = { candidateId: req.params.candidateId };

    // Interviewers can't see private notes from others
    if (req.user.role === 'INTERVIEWER') {
      where.OR = [
        { isPrivate: false },
        { userId: req.user.id },
      ];
    }

    const notes = await prisma.note.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(notes);
  } catch (err) {
    logger.error({ err }, 'Get notes error');
    res.status(500).json({ error: 'Error fetching notes' });
  }
});

// Create a note for a candidate
router.post('/:candidateId', requireAuth, async (req, res) => {
  try {
    const { content, isPrivate } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const note = await prisma.note.create({
      data: {
        userId: req.user.id,
        candidateId: req.params.candidateId,
        content: content.trim(),
        isPrivate: isPrivate || false,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    await logActivity(prisma, req.user.id, 'note_added', 'candidate', req.params.candidateId, {
      noteId: note.id,
      isPrivate: note.isPrivate,
    });

    res.status(201).json(note);
  } catch (err) {
    logger.error({ err }, 'Create note error');
    res.status(500).json({ error: 'Error creating note' });
  }
});

// Update a note
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const note = await prisma.note.findUnique({ where: { id: Number(req.params.id) } });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Can only edit your own notes' });
    }

    const updated = await prisma.note.update({
      where: { id: Number(req.params.id) },
      data: {
        content: req.body.content || note.content,
        isPrivate: req.body.isPrivate !== undefined ? req.body.isPrivate : note.isPrivate,
      },
    });

    res.json(updated);
  } catch (err) {
    logger.error({ err }, 'Update note error');
    res.status(500).json({ error: 'Error updating note' });
  }
});

// Delete a note
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const note = await prisma.note.findUnique({ where: { id: Number(req.params.id) } });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Can only delete your own notes' });
    }

    await prisma.note.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    logger.error({ err }, 'Delete note error');
    res.status(500).json({ error: 'Error deleting note' });
  }
});

export default router;
