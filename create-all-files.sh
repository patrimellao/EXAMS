#!/bin/bash

# Create all source files for REWORK infrastructure

echo "🚀 Creating Redis client..."
cat > lib/redis/client.ts << 'EOF'
import { Redis } from 'ioredis';

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  return 'redis://localhost:6379';
};

export const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      return null;
    }
    return Math.min(times * 200, 1000);
  },
  reconnectOnError: (err) => {
    const targetErrors = ['READONLY', 'ECONNREFUSED'];
    return targetErrors.some(e => err.message.includes(e));
  }
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

export default redis;
EOF

echo "🚀 Creating Leaderboard service..."
cat > lib/redis/leaderboard.ts << 'EOF'
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
EOF

echo "✅ All files created successfully!"
echo "Next steps:"
echo "1. Run create-dirs.bat (Windows) to create directories"
echo "2. Run npm install to install dependencies"
echo "3. Run docker-compose up -d to start services"
