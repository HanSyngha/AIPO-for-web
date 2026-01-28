/**
 * Authentication Middleware
 *
 * SSO/JWT 인증 및 권한 체크
 * Dashboard와 동일한 패턴 사용
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

export interface JWTPayload {
  loginid: string;
  deptname: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  userId?: string;
  isSuperAdmin?: boolean;
  isTeamAdmin?: boolean;
  teamAdminTeamIds?: string[];
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';

/**
 * 환경변수에서 개발자 목록 가져오기
 */
function getDevelopers(): string[] {
  const developers = process.env.DEVELOPERS || '';
  return developers.split(',').map(d => d.trim()).filter(Boolean);
}

/**
 * Super Admin 여부 확인 (환경변수 DEVELOPERS)
 */
export function isSuperAdmin(loginid: string): boolean {
  const developers = getDevelopers();
  return developers.includes(loginid);
}

/**
 * deptname에서 businessUnit 추출
 * "AI플랫폼팀(DS부문)" → "DS부문"
 */
export function extractBusinessUnit(deptname: string): string {
  if (!deptname) return '';
  const match = deptname.match(/\(([^)]+)\)/);
  if (match) return match[1];
  const parts = deptname.split('/');
  return parts[0]?.trim() || '';
}

/**
 * deptname에서 팀명 추출
 * "AI플랫폼팀(DS부문)" → "AI플랫폼팀"
 */
export function extractTeamName(deptname: string): string {
  if (!deptname) return '';
  const match = deptname.match(/^([^(]+)/);
  if (match) return match[1].trim();
  const parts = deptname.split('/');
  return parts[parts.length - 1]?.trim() || deptname;
}

/**
 * URL 인코딩된 텍스트 디코딩
 */
function safeDecodeURIComponent(str: string): string {
  if (!str) return '';
  try {
    if (str.includes('%')) {
      return decodeURIComponent(str);
    }
    return str;
  } catch {
    return str;
  }
}

/**
 * SSO 토큰 디코딩 (Unicode-safe base64)
 */
function decodeSSOToken(base64Token: string): JWTPayload | null {
  try {
    const binaryString = Buffer.from(base64Token, 'base64').toString('binary');
    const jsonString = decodeURIComponent(
      binaryString.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    const payload = JSON.parse(jsonString);

    return {
      loginid: safeDecodeURIComponent(payload.loginid || ''),
      deptname: safeDecodeURIComponent(payload.deptname || ''),
      username: safeDecodeURIComponent(payload.username || ''),
    };
  } catch (error) {
    console.error('SSO token decode error:', error);
    return null;
  }
}

/**
 * JWT 토큰 디코딩
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadBase64 = parts[1]!
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));

    const loginid = payload.loginid || payload.sub || payload.user_id || '';
    const deptname = payload.deptname || payload.department || '';
    const username = payload.username || payload.name || '';

    return {
      loginid: safeDecodeURIComponent(loginid),
      deptname: safeDecodeURIComponent(deptname),
      username: safeDecodeURIComponent(username),
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

/**
 * 내부 토큰 검증
 */
export function verifyInternalToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * 내부 토큰 발급
 */
export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * JWT 토큰 인증 미들웨어
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    // 1. 내부 토큰 확인
    const internalPayload = verifyInternalToken(token);
    if (internalPayload && internalPayload.loginid) {
      req.user = internalPayload;
      next();
      return;
    }

    // 2. SSO 토큰 형식 확인 (sso.base64EncodedData)
    if (token.startsWith('sso.')) {
      const ssoData = decodeSSOToken(token.substring(4));
      if (ssoData && ssoData.loginid) {
        req.user = ssoData;
        next();
        return;
      }
    }

    // 3. JWT 디코딩
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.loginid) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ error: 'Invalid token' });
  }
}

/**
 * Super Admin 권한 체크 미들웨어
 */
export async function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (isSuperAdmin(req.user.loginid)) {
    req.isSuperAdmin = true;
    next();
    return;
  }

  res.status(403).json({ error: 'Super admin access required' });
}

/**
 * Team Admin 또는 Super Admin 권한 체크 미들웨어
 */
export async function requireTeamAdminOrHigher(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Super Admin은 모든 권한
  if (isSuperAdmin(req.user.loginid)) {
    req.isSuperAdmin = true;
    next();
    return;
  }

  // Team Admin 체크
  const user = await prisma.user.findUnique({
    where: { loginid: req.user.loginid },
    include: {
      teamAdmins: {
        select: { teamId: true },
      },
    },
  });

  if (user && user.teamAdmins.length > 0) {
    req.isTeamAdmin = true;
    req.teamAdminTeamIds = user.teamAdmins.map((ta: { teamId: string }) => ta.teamId);
    next();
    return;
  }

  res.status(403).json({ error: 'Team admin or higher access required' });
}

/**
 * 사용자 ID 로드 미들웨어 (인증 후 사용)
 */
export async function loadUserId(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { loginid: req.user.loginid },
      select: { id: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Load user ID error:', error);
    res.status(500).json({ error: 'Failed to load user' });
  }
}
