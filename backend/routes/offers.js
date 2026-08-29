import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { logActivity } from "../utils/activity.js";
import logger from "../logger.js";

const router = express.Router();
const prisma = new PrismaClient();

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: "Insufficient permissions" });
    next();
  };

// Get all offers (optionally filtered by job)
router.get("/", requireAuth, async (req, res) => {
  try {
    const { jobId } = req.query;
    const where = req.user.role === 'ADMIN' ? {} : { candidate: { userId: req.user.id } };
    if (jobId) where.jobId = Number(jobId);

    const offers = await prisma.offer.findMany({
      where,
      include: {
        candidate: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(offers);
  } catch (err) {
    logger.error({ err }, "Get offers error");
    res.status(500).json({ error: "Error fetching offers" });
  }
});

// Create an offer
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "HR_MANAGER"),
  async (req, res) => {
    try {
      const { candidateId, jobId, salary, position, startDate, notes } =
        req.body;

      if (!candidateId || !jobId) {
        return res
          .status(400)
          .json({ error: "candidateId and jobId are required" });
      }

      const [job, candidate] = await Promise.all([
        prisma.job.findUnique({ where: { id: Number(jobId) }, select: { userId: true } }),
        prisma.candidate.findUnique({ where: { id: candidateId }, select: { userId: true } }),
      ]);
      if (!job || !candidate) return res.status(404).json({ error: "Job or candidate not found" });
      if (req.user.role !== "ADMIN" && (job.userId !== req.user.id || candidate.userId !== req.user.id)) return res.status(403).json({ error: "Insufficient permissions" });

      const offer = await prisma.offer.create({
        data: {
          candidateId,
          jobId,
          salary: salary || "",
          position: position || "",
          startDate: startDate ? new Date(startDate) : null,
          notes: notes || "",
          status: "draft",
        },
        include: { candidate: true },
      });

      await logActivity(
        prisma,
        req.user.id,
        "offer_created",
        "offer",
        String(offer.id),
        {
          candidateName: offer.candidate.name,
          salary,
          position,
        },
      );

      res.status(201).json(offer);
    } catch (err) {
      logger.error({ err }, "Create offer error");
      res.status(500).json({ error: "Error creating offer" });
    }
  },
);

// Update offer status (sent, accepted, rejected)
router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "HR_MANAGER"),
  async (req, res) => {
    try {
      const { status, salary, position, startDate, notes } = req.body;

      const existing = await prisma.offer.findUnique({ where: { id: Number(req.params.id) }, include: { candidate: { select: { userId: true } } } });
      if (!existing) return res.status(404).json({ error: "Offer not found" });
      if (req.user.role !== "ADMIN" && existing.candidate.userId !== req.user.id) return res.status(403).json({ error: "Insufficient permissions" });
      const offer = await prisma.offer.update({
        where: { id: Number(req.params.id) },
        data: {
          ...(status !== undefined && { status }),
          ...(salary !== undefined && { salary }),
          ...(position !== undefined && { position }),
          ...(startDate !== undefined && {
            startDate: startDate ? new Date(startDate) : null,
          }),
          ...(notes !== undefined && { notes }),
        },
        include: { candidate: true },
      });

      await logActivity(
        prisma,
        req.user.id,
        "offer_updated",
        "offer",
        String(offer.id),
        { status },
      );

      res.json(offer);
    } catch (err) {
      logger.error({ err }, "Update offer error");
      res.status(500).json({ error: "Error updating offer" });
    }
  },
);

// Delete an offer
router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const existing = await prisma.offer.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) return res.status(404).json({ error: "Offer not found" });
    await prisma.offer.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Offer deleted" });
  } catch (err) {
    logger.error({ err }, "Delete offer error");
    res.status(500).json({ error: "Error deleting offer" });
  }
});

export default router;
