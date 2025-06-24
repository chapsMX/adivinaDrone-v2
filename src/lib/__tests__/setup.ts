// Test setup file
import { jest } from '@jest/globals';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Create a mock SQL function that handles template literals
export const mockSql: any = jest.fn().mockImplementation(() => Promise.resolve([]));
mockSql.transaction = jest.fn();

// Add template literal support
Object.assign(mockSql, {
  unsafe: jest.fn()
});

// Mock Neon DB
jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => mockSql)
}));

// Global test data
export const mockUser = {
  id: 1,
  farcaster_id: '12345',
  username: 'testuser',
  early_access_requested: false,
  is_whitelisted: false,
  created_at: new Date('2024-01-01T00:00:00Z')
};

export const mockSeason = {
  id: 1,
  name: 'Season 07',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
  is_early_access: false,
  is_active: true,
  created_at: new Date('2024-01-01T00:00:00Z')
};

export const mockImage = {
  id: 1,
  season_id: 1,
  image_number: 1,
  correct_answer: 'Option A',
  option_1: 'Option A',
  option_2: 'Option B',
  option_3: 'Option C',
  created_at: new Date('2024-01-01T00:00:00Z'),
  image_path: '/images/seasons/1/adivinadrone_001.jpg'
};

export const mockUserResponse = {
  id: 1,
  user_id: 1,
  image_id: 1,
  selected_answer: 'Option A',
  is_correct: true,
  response_time: 30,
  points_earned: 3000,
  created_at: new Date('2024-01-01T00:00:00Z')
};

export const mockSeasonPoints = {
  id: 1,
  user_id: 1,
  season_id: 1,
  total_points: 5000,
  last_updated: new Date('2024-01-01T00:00:00Z')
};

export const mockUserStats = {
  gamesPlayed: 5,
  totalScore: 15000,
  averageResponseTime: 45.5
};

// Helper to reset all mocks
export const resetMocks = () => {
  jest.clearAllMocks();
  mockSql.mockReset();
  mockSql.mockImplementation(() => Promise.resolve([]));
}; 