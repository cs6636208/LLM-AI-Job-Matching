import express from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { validate, registerSchema, loginSchema } from '../validate.js';
import logger from '../logger.js';

const router = express.Router();
const prisma = new PrismaClient();

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
if (!ACCESS_TOKEN_SECRET || ACCESS_TOKEN_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters');
}
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || `${ACCESS_TOKEN_SECRET}_refresh`;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const IS_PROD = process.env.NODE_ENV === 'production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ id: payload.id }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { accessToken, refreshToken };
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const hashRefreshToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const persistRefreshToken = async (userId, token) => {
  await prisma.refreshToken.create({
    data: {
      userId,
      token: hashRefreshToken(token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 */
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: role || 'HR_MANAGER' }
    });
    logger.info({ userId: user.id, email }, 'User registered successfully');
    const { accessToken, refreshToken } = generateTokens({ id: user.id, email: user.email, name: user.name, role: user.role });
    await persistRefreshToken(user.id, refreshToken);
    setRefreshTokenCookie(res, refreshToken);
    res.status(201).json({ token: accessToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    logger.error({ err: error }, 'Registration error');
    res.status(500).json({ error: 'Server error during registration' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 */
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    logger.info({ userId: user.id, email }, 'User logged in');
    const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const { accessToken, refreshToken } = generateTokens(payload);
    await persistRefreshToken(user.id, refreshToken);
    setRefreshTokenCookie(res, refreshToken);
    res.json({ token: accessToken, user: payload });
  } catch (error) {
    logger.error({ err: error }, 'Login error');
    res.status(500).json({ error: 'Server error during login' });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token provided' });
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const storedToken = await prisma.refreshToken.findUnique({ where: { token: hashRefreshToken(refreshToken) } });
    if (!storedToken || storedToken.expiresAt <= new Date() || storedToken.userId !== decoded.id) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: 'User no longer exists' });

    const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload);
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: storedToken.id } }),
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: hashRefreshToken(newRefreshToken),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);
    logger.debug({ userId: user.id }, 'Token refreshed');
    setRefreshTokenCookie(res, newRefreshToken);
    res.json({ token: accessToken, user: payload });
  } catch (err) {
    logger.error({ err }, 'Refresh token error');
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  const { refreshToken } = req.cookies;
  try {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: hashRefreshToken(refreshToken) } });
    }
  } catch (err) {
    logger.warn({ err }, 'Could not revoke refresh token during logout');
  }
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     tags: [Auth]
 *     summary: List all users (for interview assignment)
 */
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    logger.error({ err }, 'Get users error');
    res.status(500).json({ error: 'Error fetching users' });
  }
});

export default router;
