import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  analyzeSchema,
  judgeSchema,
  extractSchema,
  bulkCandidateSchema,
} from '../validate.js';

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = registerSchema.safeParse({
      email: 'john@example.com',
      password: 'SecurePass1',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toContain('name');
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'not-an-email',
      password: 'SecurePass1',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toContain('email');
  });

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: 'Sec1',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.message.includes('8 characters'))).toBe(true);
  });

  it('rejects password without uppercase', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: 'securepass1',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.message.includes('uppercase'))).toBe(true);
  });

  it('rejects password without lowercase', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: 'SECUREPASS1',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.message.includes('lowercase'))).toBe(true);
  });

  it('rejects password without number', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: 'SecurePass',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.message.includes('number'))).toBe(true);
  });
});

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'john@example.com',
      password: 'password',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'john@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('analyzeSchema', () => {
  const validCandidates = [
    { name: 'Alice', currentRole: 'Engineer', yearsOfExperience: 5, skills: ['React'] },
  ];

  it('accepts valid analysis request', () => {
    const result = analyzeSchema.safeParse({
      jobReq: 'Looking for a senior React developer with 5+ years experience',
      candidates: validCandidates,
    });
    expect(result.success).toBe(true);
  });

  it('rejects short job requirements', () => {
    const result = analyzeSchema.safeParse({
      jobReq: 'short',
      candidates: validCandidates,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty candidates array', () => {
    const result = analyzeSchema.safeParse({
      jobReq: 'Looking for a senior React developer with 5+ years experience',
      candidates: [],
    });
    expect(result.success).toBe(false);
  });

  it('applies defaults to candidate fields', () => {
    const result = analyzeSchema.safeParse({
      jobReq: 'Looking for a senior React developer with 5+ years experience',
      candidates: [{ name: 'Bob' }],
    });
    expect(result.success).toBe(true);
    expect(result.data.candidates[0].currentRole).toBe('Unknown');
    expect(result.data.candidates[0].yearsOfExperience).toBe(0);
  });
});

describe('judgeSchema', () => {
  it('accepts valid judge request', () => {
    const result = judgeSchema.safeParse({
      jobReq: 'Looking for a senior React developer with 5+ years experience',
      candidates: [{ name: 'Alice' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects more than 50 candidates', () => {
    const candidates = Array.from({ length: 51 }, (_, i) => ({ name: `Candidate ${i}` }));
    const result = judgeSchema.safeParse({
      jobReq: 'Looking for a senior React developer with 5+ years experience',
      candidates,
    });
    expect(result.success).toBe(false);
  });
});

describe('extractSchema', () => {
  it('accepts valid resume text', () => {
    const result = extractSchema.safeParse({
      text: 'John Doe is a software engineer with 5 years of experience in React and Node.js. He has a Master\'s degree from MIT.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects text shorter than 20 characters', () => {
    const result = extractSchema.safeParse({
      text: 'Too short',
    });
    expect(result.success).toBe(false);
  });
});

describe('bulkCandidateSchema', () => {
  it('accepts valid bulk candidates', () => {
    const result = bulkCandidateSchema.safeParse({
      candidates: [{ name: 'Alice' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty array', () => {
    const result = bulkCandidateSchema.safeParse({
      candidates: [],
    });
    expect(result.success).toBe(false);
  });
});
