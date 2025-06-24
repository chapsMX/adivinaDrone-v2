import { NextRequest } from 'next/server';
import { GET as getExtraLife, POST as postExtraLife } from '@/app/api/extra-life/route';
import { GET as getShare, POST as postShare } from '@/app/api/game/share/route';
import { 
  UserService,
  SeasonService,
  ExtraLifeService,
  ShareService
} from '@/lib/database';
import { mockUser, mockSeason, resetMocks } from '../setup';

// Mock los servicios
jest.mock('@/lib/database', () => ({
  UserService: {
    findByFarcasterId: jest.fn(),
    createOrUpdate: jest.fn()
  },
  SeasonService: {
    getCurrentSeason: jest.fn(),
    getSeasonStatus: jest.fn(),
    getAll: jest.fn()
  },
  ExtraLifeService: {
    hasExtraLifeToday: jest.fn(),
    create: jest.fn()
  },
  ShareService: {
    hasSharedToday: jest.fn(),
    create: jest.fn(),
    addShareBonus: jest.fn()
  }
}));

describe('Advanced Feature APIs', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  describe('Extra Life API', () => {
    describe('GET /api/extra-life', () => {
      it('should check extra life status', async () => {
        (UserService.findByFarcasterId as jest.Mock).mockResolvedValue(mockUser);
        (ExtraLifeService.hasExtraLifeToday as jest.Mock).mockResolvedValue(false);

        const request = new NextRequest(
          new URL('http://localhost:3000/api/extra-life?userId=12345')
        );

        const response = await getExtraLife(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.hasExtraLife).toBe(false);
      });

      it('should handle invalid user', async () => {
        const request = new NextRequest(
          new URL('http://localhost:3000/api/extra-life?userId=')
        );

        const response = await getExtraLife(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
      });
    });

    describe('POST /api/extra-life', () => {
      const validTransaction = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      it('should create extra life', async () => {
        (UserService.findByFarcasterId as jest.Mock).mockResolvedValue(mockUser);
        (SeasonService.getCurrentSeason as jest.Mock).mockResolvedValue(mockSeason);
        (SeasonService.getSeasonStatus as jest.Mock).mockResolvedValue({
          status: 'active',
          message: '¡La temporada está activa!'
        });
        (ExtraLifeService.hasExtraLifeToday as jest.Mock).mockResolvedValue(false);
        (ExtraLifeService.create as jest.Mock).mockResolvedValue({ id: 1 });

        const request = new NextRequest(
          'http://localhost:3000/api/extra-life',
          {
            method: 'POST',
            body: JSON.stringify({
              userId: '12345',
              transactionHash: validTransaction
            })
          }
        );

        const response = await postExtraLife(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should prevent multiple extra lives per day', async () => {
        (UserService.findByFarcasterId as jest.Mock).mockResolvedValue(mockUser);
        (SeasonService.getCurrentSeason as jest.Mock).mockResolvedValue(mockSeason);
        (SeasonService.getSeasonStatus as jest.Mock).mockResolvedValue({
          status: 'active',
          message: '¡La temporada está activa!'
        });
        (ExtraLifeService.hasExtraLifeToday as jest.Mock).mockResolvedValue(true);

        const request = new NextRequest(
          'http://localhost:3000/api/extra-life',
          {
            method: 'POST',
            body: JSON.stringify({
              userId: '12345',
              transactionHash: validTransaction
            })
          }
        );

        const response = await postExtraLife(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('Ya has comprado una vida extra hoy');
      });

      it('should validate transaction hash', async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/extra-life',
          {
            method: 'POST',
            body: JSON.stringify({
              userId: '12345',
              transactionHash: 'invalid-hash'
            })
          }
        );

        const response = await postExtraLife(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
      });
    });
  });

  describe('Share API', () => {
    describe('GET /api/game/share', () => {
      it('should check share status', async () => {
        (UserService.findByFarcasterId as jest.Mock).mockResolvedValue(mockUser);
        (SeasonService.getCurrentSeason as jest.Mock).mockResolvedValue(mockSeason);
        (SeasonService.getSeasonStatus as jest.Mock).mockResolvedValue({
          status: 'active',
          message: '¡La temporada está activa!'
        });
        (ShareService.hasSharedToday as jest.Mock).mockResolvedValue(false);

        const request = new NextRequest(
          new URL('http://localhost:3000/api/game/share?userId=12345')
        );

        const response = await getShare(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.hasShared).toBe(false);
      });

      it('should handle invalid user', async () => {
        const request = new NextRequest(
          new URL('http://localhost:3000/api/game/share?userId=')
        );

        const response = await getShare(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
      });
    });

    describe('POST /api/game/share', () => {
      it('should process share and give bonus', async () => {
        (UserService.findByFarcasterId as jest.Mock).mockResolvedValue(mockUser);
        (SeasonService.getCurrentSeason as jest.Mock).mockResolvedValue(mockSeason);
        (SeasonService.getSeasonStatus as jest.Mock).mockResolvedValue({
          status: 'active',
          message: '¡La temporada está activa!'
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
        (SeasonService.getSeasonStatus as jest.Mock).mockResolvedValue({
          status: 'active',
          message: '¡La temporada está activa!'
        });
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

      it('should handle season ended', async () => {
        (UserService.findByFarcasterId as jest.Mock).mockResolvedValue(mockUser);
        (SeasonService.getCurrentSeason as jest.Mock).mockResolvedValue(null);
        (SeasonService.getAll as jest.Mock).mockResolvedValue([{
          ...mockSeason,
          is_active: false
        }]);
        (SeasonService.getSeasonStatus as jest.Mock).mockResolvedValue({
          status: 'ended',
          message: 'La temporada ha finalizado'
        });

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
        expect(data.error).toBe('La temporada ha finalizado');
        expect(data.seasonStatus).toBe('ended');
      });
    });
  });
}); 