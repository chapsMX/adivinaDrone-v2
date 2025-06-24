import { NextRequest } from 'next/server';
import { GET as getGame } from '@/app/api/game/route';
import { POST as postAnswer } from '@/app/api/game/answer/route';
import { POST as postShare } from '@/app/api/game/share/route';
import { 
  UserService,
  SeasonService,
  ImageService,
  GameService,
  ShareService
} from '@/lib/database';
import { mockUser, mockSeason, mockImage, resetMocks } from '../setup';

// Mock los servicios
jest.mock('@/lib/database', () => ({
  UserService: {
    findByFarcasterId: jest.fn(),
    createOrUpdate: jest.fn()
  },
  SeasonService: {
    findByName: jest.fn(),
    getCurrentSeason: jest.fn(),
    getSeasonStatus: jest.fn(),
    getAll: jest.fn()
  },
  ImageService: {
    getRandomForUser: jest.fn(),
    findById: jest.fn(),
    getCountBySeason: jest.fn()
  },
  GameService: {
    canPlayGame: jest.fn(),
    processAnswer: jest.fn()
  },
  ShareService: {
    hasSharedToday: jest.fn(),
    create: jest.fn(),
    addShareBonus: jest.fn()
  }
}));

describe('Game APIs', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  describe('GET /api/game', () => {
    it('should return images when user can play', async () => {
      // Mock servicios
      (UserService.createOrUpdate as jest.Mock).mockResolvedValue(mockUser);
      (SeasonService.findByName as jest.Mock).mockResolvedValue(mockSeason);
      (SeasonService.getCurrentSeason as jest.Mock).mockResolvedValue(mockSeason);
      (SeasonService.getSeasonStatus as jest.Mock).mockResolvedValue({
        status: 'active',
        message: '¡La temporada está activa!',
        season: mockSeason
      });
      (GameService.canPlayGame as jest.Mock).mockResolvedValue({ 
        canPlay: true,
        seasonStatus: 'active'
      });
      (ImageService.getCountBySeason as jest.Mock).mockResolvedValue(10);
      (ImageService.getRandomForUser as jest.Mock).mockResolvedValue([{
        ...mockImage,
        created_at: new Date(mockImage.created_at).toISOString()
      }]);

      // Crear request
      const request = new NextRequest(
        new URL('http://localhost:3000/api/game?userId=12345&seasonId=Season%2007&username=test')
      );

      const response = await getGame(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.images).toHaveLength(1);
      expect(data.images[0]).toEqual({
        ...mockImage,
        created_at: new Date(mockImage.created_at).toISOString()
      });
    });

    it('should return error when user cannot play', async () => {
      (UserService.createOrUpdate as jest.Mock).mockResolvedValue(mockUser);
      (SeasonService.getCurrentSeason as jest.Mock).mockResolvedValue(mockSeason);
      (SeasonService.getSeasonStatus as jest.Mock).mockResolvedValue({
        status: 'active',
        message: '¡La temporada está activa!',
        season: mockSeason
      });
      (GameService.canPlayGame as jest.Mock).mockResolvedValue({ 
        canPlay: false,
        reason: 'Daily limit reached',
        dailyLimit: true,
        seasonStatus: 'active'
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/game?userId=12345&seasonId=Season%2007')
      );

      const response = await getGame(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Daily limit reached');
      expect(data.dailyLimit).toBe(true);
    });

    it('should handle season not found', async () => {
      (UserService.createOrUpdate as jest.Mock).mockResolvedValue(mockUser);
      (SeasonService.getCurrentSeason as jest.Mock).mockResolvedValue(null);
      (SeasonService.getAll as jest.Mock).mockResolvedValue([{
        ...mockSeason,
        is_active: false
      }]);
      (SeasonService.getSeasonStatus as jest.Mock).mockResolvedValue({
        status: 'ended',
        message: 'La temporada ha finalizado. ¡Gracias por participar!',
        season: { ...mockSeason, is_active: false }
      });
      (GameService.canPlayGame as jest.Mock).mockResolvedValue({
        canPlay: false,
        reason: 'La temporada ha finalizado. ¡Gracias por participar!',
        seasonStatus: 'ended'
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/game?userId=12345&seasonId=Season%2007')
      );

      const response = await getGame(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('La temporada ha finalizado. ¡Gracias por participar!');
      expect(data.seasonStatus).toBe('ended');
    });
  });

  describe('POST /api/game/answer', () => {
    it('should process correct answer', async () => {
      (UserService.createOrUpdate as jest.Mock).mockResolvedValue(mockUser);
      (SeasonService.getCurrentSeason as jest.Mock).mockResolvedValue(mockSeason);
      (SeasonService.getSeasonStatus as jest.Mock).mockResolvedValue({
        status: 'active',
        message: '¡La temporada está activa!',
        season: mockSeason
      });
      (GameService.processAnswer as jest.Mock).mockResolvedValue({
        isCorrect: true,
        correctAnswer: 'Option A',
        pointsEarned: 3000,
        seasonStatus: 'active'
      });

      const request = new NextRequest(
        'http://localhost:3000/api/game/answer',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: '12345',
            imageId: 1,
            seasonId: 'Season 07',
            answer: 'Option A',
            timeLeft: 60
          })
        }
      );

      const response = await postAnswer(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isCorrect).toBe(true);
      expect(data.pointsEarned).toBe(3000);
    });

    it('should handle invalid answer request', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/game/answer',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: '',
            imageId: -1,
            answer: '',
            timeLeft: -10
          })
        }
      );

      const response = await postAnswer(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/game/share', () => {
    it('should process share successfully', async () => {
      (UserService.findByFarcasterId as jest.Mock).mockResolvedValue(mockUser);
      (SeasonService.getCurrentSeason as jest.Mock).mockResolvedValue(mockSeason);
      (SeasonService.getSeasonStatus as jest.Mock).mockResolvedValue({
        status: 'active',
        message: '¡La temporada está activa!',
        season: mockSeason
      });
      (ShareService.hasSharedToday as jest.Mock).mockResolvedValue(false);
      (ShareService.create as jest.Mock).mockResolvedValue({ id: 1 });

      const request = new NextRequest(
        'http://localhost:3000/api/game/share',
        {
          method: 'POST',
          body: JSON.stringify({ userId: '12345' })
        }
      );

      const response = await postShare(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(ShareService.addShareBonus).toHaveBeenCalled();
    });

    it('should prevent multiple shares per day', async () => {
      (UserService.findByFarcasterId as jest.Mock).mockResolvedValue(mockUser);
      (SeasonService.getCurrentSeason as jest.Mock).mockResolvedValue(mockSeason);
      (ShareService.hasSharedToday as jest.Mock).mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/game/share',
        {
          method: 'POST',
          body: JSON.stringify({ userId: '12345' })
        }
      );

      const response = await postShare(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Ya has compartido hoy');
    });
  });
}); 