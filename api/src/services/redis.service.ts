/**
 * Redis Service
 *
 * Redis 관련 유틸리티 함수
 */

import { Redis } from 'ioredis';

/**
 * 활성 사용자 추적
 */
export async function trackActiveUser(redis: Redis, loginid: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const key = `active_users:${today}`;

  await redis.sadd(key, loginid);
  await redis.expire(key, 60 * 60 * 24 * 7); // 7일 보관
}

/**
 * 오늘 활성 사용자 수 조회
 */
export async function getActiveUserCount(redis: Redis, date?: string): Promise<number> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const key = `active_users:${targetDate}`;

  return redis.scard(key);
}

/**
 * 큐 상태 캐시 저장
 */
export async function setQueueStatus(redis: Redis, spaceId: string, status: object): Promise<void> {
  const key = `queue:status:${spaceId}`;
  await redis.set(key, JSON.stringify(status), 'EX', 60); // 1분 캐시
}

/**
 * 큐 상태 캐시 조회
 */
export async function getQueueStatus(redis: Redis, spaceId: string): Promise<object | null> {
  const key = `queue:status:${spaceId}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * 요청 진행 상태 저장
 */
export async function setRequestProgress(redis: Redis, requestId: string, progress: object): Promise<void> {
  const key = `request:progress:${requestId}`;
  await redis.set(key, JSON.stringify(progress), 'EX', 3600); // 1시간 캐시
}

/**
 * 요청 진행 상태 조회
 */
export async function getRequestProgress(redis: Redis, requestId: string): Promise<object | null> {
  const key = `request:progress:${requestId}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * 사용자 세션 정보 저장
 */
export async function setUserSession(redis: Redis, loginid: string, sessionData: object): Promise<void> {
  const key = `session:${loginid}`;
  await redis.set(key, JSON.stringify(sessionData), 'EX', 86400); // 24시간
}

/**
 * 사용자 세션 정보 조회
 */
export async function getUserSession(redis: Redis, loginid: string): Promise<object | null> {
  const key = `session:${loginid}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * 사용자 세션 삭제
 */
export async function deleteUserSession(redis: Redis, loginid: string): Promise<void> {
  const key = `session:${loginid}`;
  await redis.del(key);
}

/**
 * LLM Agent History 캐시 저장
 */
export async function setAgentHistory(redis: Redis, requestId: string, history: object[]): Promise<void> {
  const key = `agent:history:${requestId}`;
  await redis.set(key, JSON.stringify(history), 'EX', 7200); // 2시간 캐시
}

/**
 * LLM Agent History 캐시 조회
 */
export async function getAgentHistory(redis: Redis, requestId: string): Promise<object[] | null> {
  const key = `agent:history:${requestId}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * LLM Agent History 캐시 삭제
 */
export async function deleteAgentHistory(redis: Redis, requestId: string): Promise<void> {
  const key = `agent:history:${requestId}`;
  await redis.del(key);
}
