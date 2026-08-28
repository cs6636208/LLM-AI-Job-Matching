import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../validate.js';

describe('validate middleware', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().int().min(0),
  });

  const createMockReq = (body) => ({ body });
  const createMockRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  it('calls next() when validation passes', () => {
    const middleware = validate(testSchema);
    const req = createMockReq({ name: 'John', age: 30 });
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: 'John', age: 30 });
  });

  it('returns 400 with error details when validation fails', () => {
    const middleware = validate(testSchema);
    const req = createMockReq({ name: '', age: -5 });
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'age' }),
        ]),
      })
    );
  });

  it('returns 400 when body is empty', () => {
    const middleware = validate(testSchema);
    const req = createMockReq({});
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
