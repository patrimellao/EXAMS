import { redis } from './client';

export class LeaderboardService {
  async addPoints(userId: string, points: number, subjectId?: number) {
    const key = subjectId 
      ? `leaderboard:subject:${subjectId}` 
      : 'leaderboard:global';
    
    await redis.zincrby(key, points, userId);
  }
  
  async getTopN(limit: number = 100, subjectId?: number): Promise<Array<{ userId: string; points: number }>> {
    const key = subjectId 
      ? `leaderboard:subject:${subjectId}` 
      : 'leaderboard:global';
    
    const results = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
    
    const leaderboard = [];
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        userId: results[i],
        points: parseInt(results[i + 1])
      });
    }
    
    return leaderboard;
  }
  
  async getUserRank(userId: string, subjectId?: number): Promise<number> {
    const key = subjectId 
      ? `leaderboard:subject:${subjectId}` 
      : 'leaderboard:global';
    
    const rank = await redis.zrevrank(key, userId);
    return rank !== null ? rank + 1 : 0;
  }
  
  async getUsersAround(userId: string, range: number = 5, subjectId?: number) {
    const key = subjectId 
      ? `leaderboard:subject:${subjectId}` 
      : 'leaderboard:global';
    
    const userRank = await redis.zrevrank(key, userId);
    if (userRank === null) return [];
    
    const start = Math.max(0, userRank - range);
    const end = userRank + range;
    
    return await redis.zrevrange(key, start, end, 'WITHSCORES');
  }
  
  async clear(subjectId?: number) {
    const key = subjectId 
      ? `leaderboard:subject:${subjectId}` 
      : 'leaderboard:global';
    
    await redis.del(key);
  }
}

export const leaderboardService = new LeaderboardService();
