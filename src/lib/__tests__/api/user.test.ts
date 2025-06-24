import { NextRequest } from 'next/server';
import { GET as getStatus } from '@/app/api/user/status/route';
import { GET as getStats } from '@/app/api/user/stats/route';
import { GET as getScore } from '@/app/api/user/score/route';
import { POST as postEarlyAccess } from '@/app/api/user/early-access/route';
import { 
  UserService,
  SeasonService,
  UserResponseService,
  SeasonPointsService
} from '@/lib/database';
import { mockUser, mockSeason, mockUserStats, resetMocks } from '../setup';

// Mock los servicios
jest.mock('@/lib/database', () => ({
  UserService: {
    findByFarcasterId: jest.fn(),
    createOrUpdate: jest.fn()
  },
  SeasonService: {
    findByName: jest.fn(),
    getCurrentSeason: jest.fn(),
    getSeasonStatus: jest.fn()
  },
  UserResponseService: {
    getUserStats: jest.fn()
  },
  SeasonPointsService: {
    getUserScore: jest.fn()
  }
}));

describe('User APIs', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  describe('GET /api/user/status', () => {
    it('should return user status when found', async () => {
      (UserService.findByFarcasterId as jest.Mock).mockResolvedValue(mockUser);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/user/status?userId=12345')
      );

      const response = await getStatus(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.early_access_requested).toBe(false);
      expect(data.is_whitelisted).toBe(false);
    });

    it('should return default status for new user', async () => {
      (UserService.findByFarcasterId as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/user/status?userId=12345')
      );

      const response = await getStatus(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.early_access_requested).toBe(false);
      expect(data.is_whitelisted).toBe(false);
    });
  });

  describe('GET /api/user/stats', () => {
    it('should return user stats for current season', async () => {
      (UserService.findByFarcasterId as jest.Mock).mockResolvedValue(mockUser);
      (SeasonService.getCurrentSeason as jest.Mock).mockResolvedValue(mockSeason);
      (UserResponseService.getUserStats as jest.Mock).mockResolvedValue(mockUserStats);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/user/stats?userId=12345')
      );

      const response = await getStats(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.gamesPlayed).toBe(mockUserStats.gamesPlayed);
      expect(data.totalScore).toBe(mockUserStats.totalScore);
      expect(data.averageResponseTime).toBe(mockUserStats.averageResponseTime);
    });

    it('should return default stats for new user', async () => {
      (UserService.findByFarcasterId as jest.Mock).mockResolvedValue(null);
      (SeasonService.getCurrentSeason as jest.Mock).mockResolvedValue(mockSeason);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/user/stats?userId=12345')
      );

      const response = await getStats(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.gamesPlayed).toBe(0);
      expect(data.totalScore).toBe(0);
      expect(data.averageResponseTime).toBe(0);
    });
  });

  describe('GET /api/user/score', () => {
    it('should return user score for season', async () => {
      (UserService.findByFarcasterId as jest.Mock).mockResolvedValue(mockUser);
      (SeasonService.findByName as jest.Mock).mockResolvedValue(mockSeason);
      (SeasonPointsService.getUserScore as jest.Mock).mockResolvedValue(5000);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/user/score?userId=12345&seasonId=Season%2007')
      );

      const response = await getScore(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.score).toBe(5000);
    });

    it('should return 0 score for new user', async () => {
      (UserService.findByFarcasterId as jest.Mock).mockResolvedValue(null);
      (SeasonService.findByName as jest.Mock).mockResolvedValue(mockSeason);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/user/score?userId=12345&seasonId=Season%2007')
      );

      const response = await getScore(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.score).toBe(0);
    });
  });

  describe('POST /api/user/early-access', () => {
    it('should handle early access request', async () => {
      (UserService.createOrUpdate as jest.Mock).mockResolvedValue({
        ...mockUser,
        early_access_requested: false,
        is_whitelisted: false
      });

      const request = new NextRequest(
        'http://localhost:3000/api/user/early-access',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: '12345',
            username: 'testuser'
          })
        }
      );

      const response = await postEarlyAccess(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.early_access_requested).toBe(false);
      expect(data.is_whitelisted).toBe(false);
    });

    it('should handle invalid request', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/user/early-access',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: '',
            username: ''
          })
        }
      );

      const response = await postEarlyAccess(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
}); 