/**
 * Log an activity to the ActivityLog table.
 *
 * @param {PrismaClient} prisma
 * @param {number} userId
 * @param {string} action     e.g. "stage_changed", "shortlisted"
 * @param {string} entityType e.g. "candidate", "job"
 * @param {string} entityId
 * @param {object} details    optional JSON-serializable context
 */
export async function logActivity(prisma, userId, action, entityType, entityId, details = null) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: String(entityId),
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (err) {
    // Don't let logging failures break the main request
    console.error('[ActivityLog] Failed to write:', err.message);
  }
}
