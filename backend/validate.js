import { z } from 'zod';

/**
 * Express middleware factory: validates req.body against a Zod schema.
 * Returns 400 with structured error details on failure.
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const formattedErrors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors,
    });
  }

  req.body = result.data;
  next();
};

// ── Password Complexity ──────────────────────────────────────────
// Requirements: ≥8 chars, at least 1 uppercase, 1 lowercase, 1 number
const passwordComplexity = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// ── Auth Schemas ─────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name is too long'),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address'),
  password: passwordComplexity,
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

// ── AI Schemas ───────────────────────────────────────────────────

const candidateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Candidate name is required'),
  currentRole: z.string().default('Unknown'),
  yearsOfExperience: z.number().int().min(0).default(0),
  skills: z.array(z.string()).default([]),
  education: z.string().default(''),
  summary: z.string().default(''),
});

export const analyzeSchema = z.object({
  jobReq: z
    .string({ required_error: 'Job requirements are required' })
    .min(10, 'Job requirements must be at least 10 characters')
    .max(10000, 'Job requirements are too long'),
  candidates: z
    .array(candidateSchema)
    .min(1, 'At least one candidate is required')
    .max(500, 'Cannot analyze more than 500 candidates at once'),
});

export const judgeSchema = z.object({
  jobReq: z
    .string({ required_error: 'Job requirements are required' })
    .min(10, 'Job requirements must be at least 10 characters'),
  candidates: z
    .array(candidateSchema)
    .min(1, 'At least one candidate is required')
    .max(50, 'Cannot judge more than 50 candidates at once'),
});

export const extractSchema = z.object({
  text: z
    .string({ required_error: 'Resume text is required' })
    .min(20, 'Resume text seems too short to be a real resume')
    .max(50000, 'Resume text is too long'),
});

// ── Candidates Schemas ───────────────────────────────────────────

export const bulkCandidateSchema = z.object({
  candidates: z
    .array(candidateSchema)
    .min(1, 'At least one candidate is required'),
});

export const shortlistParamsSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
});

export const shortlistBodySchema = z.object({
  score: z.number().int().min(0).max(100).optional(),
  matchedSkills: z.array(z.string()).optional(),
  missingSkills: z.array(z.string()).optional(),
});
