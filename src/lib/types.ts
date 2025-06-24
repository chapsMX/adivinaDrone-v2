// Database Types - Based on updated schema
export interface User {
  id: number;
  username?: string;
  created_at: Date;
}

export interface Season {
  id: number;
  name: string;
  start_date: Date;
  end_date: Date;
  is_early_access: boolean;
  is_active: boolean;
  created_at?: Date;
}

export interface Image {
  id: number;
  season_id: number;
  image_number: number;
  correct_answer: string;
  option_1: string;
  option_2: string;
  option_3: string;
  created_at?: Date;
  image_path?: string; // Computed field
}

export interface UserResponse {
  id: number;
  user_id: number;
  image_id: number;
  selected_answer: string;
  is_correct: boolean;
  response_time: number;
  points_earned: number;
  created_at: Date;
}

export interface SeasonPoints {
  id: number;
  user_id: number;
  season_id: number;
  total_points: number;
  last_updated: Date;
}

export interface UserSeenImage {
  id: number;
  user_id: number;
  image_id: number;
  season_id: number;
  seen_at: Date;
}

export interface ExtraLife {
  id: number;
  user_id: number;
  season_id: number;
  transaction_hash: string;
  is_used: boolean;
  created_at: Date;
}

export interface Share {
  id: number;
  user_id: number;
  season_id: number;
  created_at: Date;
}

// API Request/Response Types
export interface GameRequest {
  userId: string;
  username?: string;
  seasonId?: string;
  extraLife?: boolean;
}

export interface GameResponse {
  images: Image[];
  error?: string;
  dailyLimit?: boolean;
  extraLifeUsed?: boolean;
}

export interface AnswerRequest {
  userId: string;
  imageId: number;
  seasonId: string;
  answer: string;
  timeLeft: number;
}

export interface AnswerResponse {
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
  pointsEarned?: number;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  rank?: number;
}

export interface UserStats {
  gamesPlayed: number;
  totalScore: number;
  averageResponseTime: number;
}

export interface UserStatus {
  early_access_requested: boolean;
  is_whitelisted: boolean;
}

// Utility Types
export interface DatabaseError {
  error: string;
  details?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Enums
export enum SeasonName {
  SEASON_01 = 'Season 01',
  SEASON_02 = 'Season 02',
  SEASON_03 = 'Season 03',
  SEASON_04 = 'Season 04',
  SEASON_05 = 'Season 05',
  SEASON_06 = 'Season 06',
  SEASON_07 = 'Season 07',
}

export enum GameLimits {
  MAX_DAILY_GAMES = 3,
  MAX_DAILY_GAMES_WITH_EXTRA_LIFE = 4,
  GAME_TIME_LIMIT = 90,
  POINTS_MULTIPLIER = 50,
  SHARE_BONUS_POINTS = 1000,
}

// Extended types with relationships
export interface UserWithStats extends User {
  stats?: UserStats;
  seasonPoints?: SeasonPoints[];
}

export interface ImageWithSeason extends Image {
  season?: Season;
}

export interface UserResponseWithRelations extends UserResponse {
  user?: User;
  image?: Image;
}

export interface LeaderboardWithMeta {
  entries: LeaderboardEntry[];
  season: Season;
  totalPlayers: number;
  lastUpdated: Date;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Database operation types
export type CreateUserData = {
  username?: string;
};

export type UpdateUserData = Partial<Omit<User, 'id' | 'created_at'>>;
export type CreateSeasonData = Omit<Season, 'id' | 'created_at'>;
export type UpdateSeasonData = Partial<Omit<Season, 'id' | 'created_at'>>;

// Query options
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  filters?: Record<string, any>;
}

// Transaction types
export interface TransactionContext {
  commit(): Promise<void>;
  rollback(): Promise<void>;
} 