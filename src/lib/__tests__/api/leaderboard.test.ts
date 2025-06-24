import { NextRequest } from 'next/server';
import { GET as getTop } from '@/app/api/leaderboard/top/route';
import { GET as getWinners } from '@/app/api/leaderboard/winners/route';
import { 
  SeasonService,
  SeasonPointsService
} from '@/lib/database';
import { mockSeason, resetMocks } from '../setup';

// Mock los servicios
jest.mock('@/lib/database', () => ({
  SeasonService: {
    findByName: jest.fn(),
    getCurrentSeason: jest.fn(),
    getSeasonStatus: jest.fn(),
    getAll: jest.fn()
  },
  SeasonPointsService: {
    getLeaderboard: jest.fn()
  }
}));

describe('Leaderboard APIs', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  describe('GET /api/leaderboard/top', () => {
    const mockLeaderboard = [
      { farcaster_id: '12345', username: 'user1', score: 10000 },
      { farcaster_id: '67890', username: 'user2', score: 8000 }
    ];

    it('should return leaderboard for current season', async () => {
      (SeasonService.getCurrentSeason as jest.Mock).mockResolvedValue(mockSeason);
      (SeasonPointsService.getLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboard);
      (SeasonService.getSeasonStatus as jest.Mock).mockResolvedValue({
        status: 'active',
        message: '¡La temporada está activa!'
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/leaderboard/top')
      );

      const response = await getTop(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.season).toBe(mockSeason.name);
      expect(data.status).toBe('active');
      expect(data.leaderboard).toEqual(mockLeaderboard);
    });

    it('should handle ended season', async () => {
      const endedSeason = { ...mockSeason, is_active: false };
      (SeasonService.findByName as jest.Mock).mockResolvedValue(endedSeason);
      (SeasonPointsService.getLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboard);
      (SeasonService.getSeasonStatus as jest.Mock).mockResolvedValue({
        status: 'ended',
        message: 'La temporada ha finalizado'
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/leaderboard/top?seasonId=Season%2007')
      );

      const response = await getTop(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ended');
      expect(data.nextSeason).toBeDefined();
    });

    it('should handle pagination', async () => {
      (SeasonService.getCurrentSeason as jest.Mock).mockResolvedValue(mockSeason);
      (SeasonPointsService.getLeaderboard as jest.Mock).mockResolvedValue([mockLeaderboard[0]]);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/leaderboard/top?limit=1')
      );

      const response = await getTop(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toHaveLength(1);
    });
  });

  describe('GET /api/leaderboard/winners', () => {
    const mockWinners = [
      {
        season: 'Season 06',
        winner: { farcaster_id: '12345', username: 'winner1', score: 15000 },
        status: 'ended',
        message: 'Temporada finalizada',
        startDate: new Date('2023-07-01'),
        endDate: new Date('2023-07-31')
      }
    ];

    it('should return winners from completed seasons', async () => {
      const completedSeasons = [
        { ...mockSeason, name: 'Season 06', is_active: false }
      ];
      (SeasonService.getAll as jest.Mock).mockResolvedValue(completedSeasons);
      (SeasonPointsService.getLeaderboard as jest.Mock).mockResolvedValue([mockWinners[0].winner]);
      (SeasonService.getSeasonStatus as jest.Mock).mockResolvedValue({
        status: 'ended',
        message: 'Temporada finalizada'
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/leaderboard/winners')
      );

      const response = await getWinners(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.winners).toHaveLength(1);
      expect(data.nextSeason).toBeDefined();
    });

    it('should handle no completed seasons', async () => {
      (SeasonService.getAll as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/leaderboard/winners')
      );

      const response = await getWinners(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.winners).toHaveLength(0);
      expect(data.message).toBe('Aún no hay temporadas finalizadas');
    });

    it('should handle pagination', async () => {
      const manyWinners = Array(5).fill(mockWinners[0]);
      const completedSeasons = manyWinners.map((_, i) => ({
        ...mockSeason,
        name: `Season 0${i}`,
        is_active: false
      }));

      (SeasonService.getAll as jest.Mock).mockResolvedValue(completedSeasons);
      (SeasonPointsService.getLeaderboard as jest.Mock)
        .mockResolvedValue([mockWinners[0].winner]);
      (SeasonService.getSeasonStatus as jest.Mock).mockResolvedValue({
        status: 'ended',
        message: 'Temporada finalizada'
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/leaderboard/winners?limit=2&offset=1')
      );

      const response = await getWinners(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.winners).toHaveLength(2);
    });
  });
}); 