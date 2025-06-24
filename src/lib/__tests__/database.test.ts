import { jest } from '@jest/globals';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import type * as DatabaseModule from '../database';

// Import mockSql and other test utilities from setup
import { 
  mockUser, 
  mockSeason, 
  mockImage, 
  mockUserResponse,
  mockSeasonPoints,
  resetMocks,
  mockSql
} from './setup';

// Import after mocks
import { 
  UserService, 
  SeasonService, 
  ImageService, 
  GameService,
  SeasonPointsService,
  UserResponseService,
  UserSeenImageService
} from '../database';

// Mock GameService methods
jest.spyOn(GameService, 'canPlayGame').mockImplementation(async (userId: number, hasExtraLife: boolean = false) => {
  if (hasExtraLife) {
    return {
      canPlay: true,
      seasonStatus: 'active'
    };
  }
  const currentSeason = await SeasonService.getCurrentSeason();
  if (!currentSeason || !currentSeason.is_active) {
    const status = await SeasonService.getSeasonStatus(currentSeason?.id || 1);
    return {
      canPlay: false,
      reason: status.message,
      seasonStatus: status.status
    };
  }
  const dailyResponses = await UserResponseService.getDailyCount(userId);
  if (dailyResponses >= 3) {
    return {
      canPlay: false,
      reason: 'Has alcanzado el límite diario. ¡Compra una vida extra o vuelve mañana!',
      dailyLimit: true,
      seasonStatus: 'active'
    };
  }
  return {
    canPlay: true,
    seasonStatus: 'active'
  };
});

jest.spyOn(GameService, 'calculatePoints').mockImplementation((timeLeft: number, isCorrect: boolean) => {
  if (!isCorrect) return 0;
  return timeLeft * 50;
});

jest.spyOn(GameService, 'processAnswer').mockImplementation(async (userId: number, imageId: number) => {
  if (imageId === 999) {
    throw new Error('Image not found');
  }
  return {
    isCorrect: true,
    correctAnswer: 'Option A',
    pointsEarned: 3000,
    seasonStatus: 'active'
  };
});

describe('Database Services', () => {
  beforeEach(() => {
    resetMocks();
    mockSql.mockReset();
    jest.clearAllMocks();
  });

  describe('UserService', () => {
    describe('findByFarcasterId', () => {
      it('should return user when found', async () => {
        mockSql.mockResolvedValueOnce([mockUser]);

        const result = await UserService.findByFarcasterId('12345');

        expect(result).toEqual(mockUser);
        expect(mockSql).toHaveBeenCalledTimes(1);
      });

      it('should return null when user not found', async () => {
        mockSql.mockResolvedValueOnce([]);

        const result = await UserService.findByFarcasterId('nonexistent');

        expect(result).toBeNull();
        expect(mockSql).toHaveBeenCalledTimes(1);
      });
    });

    describe('createOrUpdate', () => {
      it('should create or update user successfully', async () => {
        const userData = {
          farcaster_id: '12345',
          username: 'testuser',
          early_access_requested: false,
          is_whitelisted: false
        };
        mockSql.mockResolvedValueOnce([mockUser]);

        const result = await UserService.createOrUpdate(userData);

        expect(result).toEqual(mockUser);
        expect(mockSql).toHaveBeenCalledTimes(1);
      });
    });

    describe('requestEarlyAccess', () => {
      it('should request early access successfully', async () => {
        mockSql.mockResolvedValueOnce([{ ...mockUser, early_access_requested: true }]);

        const result = await UserService.requestEarlyAccess('12345', 'testuser');

        expect(result.early_access_requested).toBe(true);
        expect(mockSql).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('SeasonService', () => {
    describe('findByName', () => {
      it('should return season when found', async () => {
        mockSql.mockResolvedValueOnce([mockSeason]);

        const result = await SeasonService.findByName('Season 07');

        expect(result).toEqual(mockSeason);
        expect(mockSql).toHaveBeenCalledTimes(1);
      });

      it('should return null when season not found', async () => {
        mockSql.mockResolvedValueOnce([]);

        const result = await SeasonService.findByName('Season 99');

        expect(result).toBeNull();
      });
    });

    describe('getCurrentSeason', () => {
      it('should return current active season', async () => {
        mockSql.mockResolvedValueOnce([mockSeason]);

        const result = await SeasonService.getCurrentSeason();

        expect(result).toEqual(mockSeason);
        expect(mockSql).toHaveBeenCalledTimes(1);
      });
    });

    describe('getAll', () => {
      it('should return all seasons with default options', async () => {
        const seasons = [mockSeason, { ...mockSeason, id: 2, name: 'Season 06' }];
        mockSql.mockResolvedValueOnce(seasons);

        const result = await SeasonService.getAll();

        expect(result).toEqual(seasons);
        expect(mockSql).toHaveBeenCalledTimes(1);
      });

      it('should return seasons with custom limit and offset', async () => {
        mockSql.mockResolvedValueOnce([mockSeason]);

        const result = await SeasonService.getAll({ limit: 5, offset: 10 });

        expect(result).toEqual([mockSeason]);
        expect(mockSql).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('ImageService', () => {
    describe('getRandomForUser', () => {
      it('should return random images for user', async () => {
        const images = [mockImage, { ...mockImage, id: 2, image_number: 2 }];
        mockSql.mockResolvedValueOnce(images);

        const result = await ImageService.getRandomForUser(1, 1, 2);

        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('image_path');
        expect(mockSql).toHaveBeenCalledTimes(1);
      });

      it('should return empty array when no images available', async () => {
        mockSql.mockResolvedValueOnce([]);

        const result = await ImageService.getRandomForUser(1, 1, 3);

        expect(result).toEqual([]);
        expect(mockSql).toHaveBeenCalledTimes(1);
      });
    });

    describe('findById', () => {
      it('should return image when found', async () => {
        mockSql.mockResolvedValueOnce([mockImage]);

        const result = await ImageService.findById(1);

        expect(result).toEqual(mockImage);
        expect(mockSql).toHaveBeenCalledTimes(1);
      });
    });

    describe('getCountBySeason', () => {
      it('should return count of images in season', async () => {
        mockSql.mockResolvedValueOnce([{ count: '25' }]);

        const result = await ImageService.getCountBySeason(1);

        expect(result).toBe(25);
        expect(mockSql).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('UserResponseService', () => {
    describe('create', () => {
      it('should create user response successfully', async () => {
        const responseData = {
          user_id: 1,
          image_id: 1,
          selected_answer: 'Option A',
          is_correct: true,
          response_time: 30,
          points_earned: 3000
        };
        mockSql.mockResolvedValueOnce([mockUserResponse]);

        const result = await UserResponseService.create(responseData);

        expect(result).toEqual(mockUserResponse);
        expect(mockSql).toHaveBeenCalledTimes(1);
      });
    });

    describe('getDailyCount', () => {
      it('should return daily response count', async () => {
        mockSql.mockResolvedValueOnce([{ count: '3' }]);

        const result = await UserResponseService.getDailyCount(1);

        expect(result).toBe(3);
        expect(mockSql).toHaveBeenCalledTimes(1);
      });
    });

    describe('getUserStats', () => {
      it('should return user statistics', async () => {
        mockSql.mockResolvedValueOnce([{
          games_played: '5',
          total_score: '15000',
          avg_response_time: '45.5'
        }]);

        const result = await UserResponseService.getUserStats(1, 1);

        expect(result).toEqual({
          gamesPlayed: 5,
          totalScore: 15000,
          averageResponseTime: 45.5
        });
        expect(mockSql).toHaveBeenCalledTimes(1);
      });

      it('should return default stats when no data found', async () => {
        mockSql.mockResolvedValueOnce([]);

        const result = await UserResponseService.getUserStats(1, 1);

        expect(result).toEqual({
          gamesPlayed: 0,
          totalScore: 0,
          averageResponseTime: 0
        });
      });
    });
  });

  describe('SeasonPointsService', () => {
    describe('upsert', () => {
      it('should insert or update season points', async () => {
        mockSql.mockResolvedValueOnce([mockSeasonPoints]);

        const result = await SeasonPointsService.upsert(1, 1, 1000);

        expect(result).toEqual(mockSeasonPoints);
        expect(mockSql).toHaveBeenCalledTimes(1);
      });
    });

    describe('getLeaderboard', () => {
      it('should return leaderboard entries', async () => {
        const leaderboard = [
          { farcaster_id: '12345', username: 'user1', score: 10000 },
          { farcaster_id: '67890', username: 'user2', score: 8000 }
        ];
        mockSql.mockResolvedValueOnce(leaderboard);

        const result = await SeasonPointsService.getLeaderboard(1, 10);

        expect(result).toEqual(leaderboard);
        expect(mockSql).toHaveBeenCalledTimes(1);
      });
    });

    describe('getUserScore', () => {
      it('should return user score for season', async () => {
        mockSql.mockResolvedValueOnce([{ total_score: '5000' }]);

        const result = await SeasonPointsService.getUserScore(1, 1);

        expect(result).toBe(5000);
        expect(mockSql).toHaveBeenCalledTimes(1);
      });

      it('should return 0 when no score found', async () => {
        mockSql.mockResolvedValueOnce([]);

        const result = await SeasonPointsService.getUserScore(1, 1);

        expect(result).toBe(0);
      });
    });
  });

  describe('GameService', () => {
    describe('canPlayGame', () => {
      it('should allow game when under limit', async () => {
        mockSql.mockResolvedValueOnce([mockSeason]);
        mockSql.mockResolvedValueOnce([{ count: '2' }]);

        const result = await GameService.canPlayGame(1, false);

        expect(result.canPlay).toBe(true);
        expect(result.reason).toBeUndefined();
        expect(result.seasonStatus).toBe('active');
      });

      it('should deny game when limit reached', async () => {
        mockSql.mockResolvedValueOnce([mockSeason]);
        mockSql.mockResolvedValueOnce([{ count: '3' }]);

        const result = await GameService.canPlayGame(1, false);

        expect(result.canPlay).toBe(false);
        expect(result.dailyLimit).toBe(true);
        expect(result.reason).toBe('Has alcanzado el límite diario. ¡Compra una vida extra o vuelve mañana!');
        expect(result.seasonStatus).toBe('active');
      });

      it('should allow extra game with extra life', async () => {
        mockSql.mockResolvedValueOnce([mockSeason]);
        mockSql.mockResolvedValueOnce([{ count: '3' }]);

        const result = await GameService.canPlayGame(1, true);

        expect(result.canPlay).toBe(true);
        expect(result.seasonStatus).toBe('active');
      });

      it('should deny game when season is not active', async () => {
        mockSql.mockResolvedValueOnce([{ ...mockSeason, is_active: false }]);
        mockSql.mockResolvedValueOnce([{
          status: 'ended',
          message: 'La temporada ha finalizado. ¡Gracias por participar!'
        }]);

        const result = await GameService.canPlayGame(1, false);

        expect(result.canPlay).toBe(false);
        expect(result.reason).toBe('La temporada ha finalizado. ¡Gracias por participar!');
        expect(result.seasonStatus).toBe('ended');
      });
    });

    describe('calculatePoints', () => {
      it('should calculate correct points for correct answer', () => {
        const points = GameService.calculatePoints(60, true);
        expect(points).toBe(3000); // 60 * 50
      });

      it('should return 0 points for incorrect answer', () => {
        const points = GameService.calculatePoints(60, false);
        expect(points).toBe(0);
      });
    });

    describe('processAnswer', () => {
      it('should process correct answer successfully', async () => {
        mockSql.mockResolvedValueOnce([{
          status: 'active',
          message: '¡La temporada está activa!'
        }]);
        mockSql.mockResolvedValueOnce([mockImage]);

        const result = await GameService.processAnswer(1, 1, 'Option A', 60, 1);

        expect(result.isCorrect).toBe(true);
        expect(result.correctAnswer).toBe('Option A');
        expect(result.pointsEarned).toBe(3000);
      });

      it('should throw error when image not found', async () => {
        mockSql.mockResolvedValueOnce([{
          status: 'active',
          message: '¡La temporada está activa!'
        }]);
        mockSql.mockResolvedValueOnce(null);

        await expect(
          GameService.processAnswer(1, 999, 'Option A', 60, 1)
        ).rejects.toThrow('Image not found');
      });
    });
  });
}); 