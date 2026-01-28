/**
 * Settings Routes
 *
 * 사용자 설정 관련 엔드포인트
 */

import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, AuthenticatedRequest, loadUserId } from '../middleware/auth.js';

export const settingsRoutes = Router();

settingsRoutes.use(authenticateToken);
settingsRoutes.use(loadUserId);

/**
 * GET /settings
 * 사용자 설정 조회
 */
settingsRoutes.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    let settings = await prisma.userSetting.findUnique({
      where: { userId: req.userId },
    });

    // 설정이 없으면 기본값 생성
    if (!settings) {
      settings = await prisma.userSetting.create({
        data: {
          userId: req.userId!,
          language: 'ko',
          theme: 'light',
        },
      });
    }

    res.json({
      settings: {
        language: settings.language,
        theme: settings.theme,
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

/**
 * PUT /settings
 * 사용자 설정 변경
 */
settingsRoutes.put('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { language, theme } = req.body;

    // 유효성 검증
    if (language && !['ko', 'en', 'cn'].includes(language)) {
      res.status(400).json({ error: 'Invalid language. Use ko, en, or cn.' });
      return;
    }

    if (theme && !['light', 'dark'].includes(theme)) {
      res.status(400).json({ error: 'Invalid theme. Use light or dark.' });
      return;
    }

    const updateData: { language?: string; theme?: string } = {};
    if (language) updateData.language = language;
    if (theme) updateData.theme = theme;

    const settings = await prisma.userSetting.upsert({
      where: { userId: req.userId },
      update: updateData,
      create: {
        userId: req.userId!,
        language: language || 'ko',
        theme: theme || 'light',
      },
    });

    res.json({
      settings: {
        language: settings.language,
        theme: settings.theme,
      },
      message: '설정이 저장되었습니다.',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});
