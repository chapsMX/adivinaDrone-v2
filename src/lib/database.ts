import { neon } from '@neondatabase/serverless';
import type {
  User, Season, Image, UserResponse, SeasonPoints, UserSeenImage,
  ExtraLife, Share, CreateUserData, UpdateUserData, CreateSeasonData,
  UpdateSeasonData, QueryOptions, LeaderboardEntry, UserStats
} from './types';
import { GameLimits } from './types';

const sql = neon(process.env.DATABASE_URL!);

// User Operations
export class UserService {
  static async findByFarcasterId(farcaster_id: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users 
      WHERE farcaster_id = ${farcaster_id}
    `;
    return (result[0] as User) || null;
  }

  static async createOrUpdate(data: CreateUserData): Promise<User> {
    const result = await sql`
      INSERT INTO users (farcaster_id, username, early_access_requested, is_whitelisted)
      VALUES (${data.farcaster_id}, ${data.username || null}, ${data.early_access_requested}, ${data.is_whitelisted})
      ON CONFLICT (farcaster_id) 
      DO UPDATE SET 
        username = COALESCE(EXCLUDED.username, users.username),
        early_access_requested = EXCLUDED.early_access_requested,
        is_whitelisted = EXCLUDED.is_whitelisted
      RETURNING *
    `;
    return result[0] as User;
  }

  static async updateById(id: number, data: UpdateUserData): Promise<User | null> {
    // For Neon, we'll need to handle updates differently
    if (data.username !== undefined) {
      const result = await sql`
        UPDATE users 
        SET username = ${data.username}
        WHERE id = ${id}
        RETURNING *
      `;
      return (result[0] as User) || null;
    }
    
    if (data.early_access_requested !== undefined) {
      const result = await sql`
        UPDATE users 
        SET early_access_requested = ${data.early_access_requested}
        WHERE id = ${id}
        RETURNING *
      `;
      return (result[0] as User) || null;
    }
    
    if (data.is_whitelisted !== undefined) {
      const result = await sql`
        UPDATE users 
        SET is_whitelisted = ${data.is_whitelisted}
        WHERE id = ${id}
        RETURNING *
      `;
      return (result[0] as User) || null;
    }
    
    return null;
  }

  static async requestEarlyAccess(farcaster_id: string, username?: string): Promise<User> {
    const result = await sql`
      INSERT INTO users (farcaster_id, username, early_access_requested)
      VALUES (${farcaster_id}, ${username || null}, true)
      ON CONFLICT (farcaster_id) 
      DO UPDATE SET 
        early_access_requested = true,
        username = COALESCE(EXCLUDED.username, users.username)
      RETURNING *
    `;
    return result[0] as User;
  }
}

// Season Operations
export class SeasonService {
  static async findByName(name: string): Promise<Season | null> {
    const result = await sql`
      SELECT * FROM seasons 
      WHERE name = ${name}
    `;
    return (result[0] as Season) || null;
  }

  static async getCurrentSeason(): Promise<Season | null> {
    const result = await sql`
      SELECT * FROM seasons 
      WHERE CURRENT_DATE BETWEEN start_date AND end_date
      ORDER BY start_date DESC
      LIMIT 1
    `;
    return (result[0] as Season) || null;
  }

  static async getAll(options: QueryOptions = {}): Promise<Season[]> {
    const { limit = 50, offset = 0 } = options;
    
    const result = await sql`
      SELECT 
        id,
        name,
        start_date,
        end_date,
        CASE 
          WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN true
          ELSE false
        END as is_current,
        is_early_access,
        is_active
      FROM seasons
      ORDER BY start_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    return result as Season[];
  }

  static async create(data: CreateSeasonData): Promise<Season> {
    const result = await sql`
      INSERT INTO seasons (name, start_date, end_date, is_early_access, is_active)
      VALUES (${data.name}, ${data.start_date}, ${data.end_date}, ${data.is_early_access}, ${data.is_active})
      RETURNING *
    `;
    return result[0] as Season;
  }
}

// Image Operations
export class ImageService {
  static async getRandomForUser(
    userId: number, 
    seasonId: number, 
    limit: number = 3
  ): Promise<Image[]> {
    const result = await sql`
      SELECT 
        i.id,
        i.image_number,
        i.correct_answer,
        i.option_1,
        i.option_2,
        i.option_3,
        i.season_id
      FROM images i
      WHERE i.season_id = ${seasonId}
      AND i.id NOT IN (
        SELECT image_id 
        FROM user_seen_images 
        WHERE user_id = ${userId}
        AND season_id = ${seasonId}
      )
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;

    // Add computed image path
    return (result as any[]).map(img => ({
      ...img,
      image_path: `/images/seasons/${seasonId}/adivinadrone_${String(img.image_number).padStart(3, '0')}.jpg`
    })) as Image[];
  }

  static async findById(id: number): Promise<Image | null> {
    const result = await sql`
      SELECT * FROM images WHERE id = ${id}
    `;
    return (result[0] as Image) || null;
  }

  static async getCountBySeason(seasonId: number): Promise<number> {
    const result = await sql`
      SELECT COUNT(*) as count FROM images WHERE season_id = ${seasonId}
    `;
    return parseInt((result[0] as any).count);
  }
}

// User Response Operations
export class UserResponseService {
  static async create(data: Omit<UserResponse, 'id' | 'created_at'>): Promise<UserResponse> {
    const result = await sql`
      INSERT INTO user_responses (
        user_id, image_id, selected_answer, is_correct, response_time, points_earned
      )
      VALUES (
        ${data.user_id}, ${data.image_id}, ${data.selected_answer}, 
        ${data.is_correct}, ${data.response_time}, ${data.points_earned}
      )
      RETURNING *
    `;
    return result[0] as UserResponse;
  }

  static async getDailyCount(userId: number, date: Date = new Date()): Promise<number> {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM user_responses ur
      JOIN images i ON ur.image_id = i.id
      WHERE ur.user_id = ${userId}
      AND DATE(ur.created_at) = DATE(${date.toISOString()})
    `;
    return parseInt((result[0] as any).count);
  }

  static async getUserStats(userId: number, seasonId: number): Promise<UserStats> {
    const result = await sql`
      WITH user_stats AS (
        SELECT 
          COUNT(DISTINCT DATE(ur.created_at)) as games_played,
          COALESCE(sp.total_points, 0) as total_score,
          ROUND(AVG(ur.response_time)::numeric, 1) as avg_response_time
        FROM users u
        LEFT JOIN user_responses ur ON u.id = ur.user_id
        LEFT JOIN images i ON ur.image_id = i.id
        LEFT JOIN season_points sp ON u.id = sp.user_id AND sp.season_id = ${seasonId}
        WHERE u.id = ${userId}
        AND i.season_id = ${seasonId}
        GROUP BY sp.total_points
      )
      SELECT 
        COALESCE(games_played, 0) as games_played,
        COALESCE(total_score, 0) as total_score,
        COALESCE(avg_response_time, 0) as avg_response_time
      FROM user_stats
    `;

    const stats = (result[0] as any) || { games_played: 0, total_score: 0, avg_response_time: 0 };
    return {
      gamesPlayed: parseInt(stats.games_played),
      totalScore: parseInt(stats.total_score),
      averageResponseTime: parseFloat(stats.avg_response_time)
    };
  }
}

// Season Points Operations
export class SeasonPointsService {
  static async upsert(userId: number, seasonId: number, points: number): Promise<SeasonPoints> {
    const result = await sql`
      INSERT INTO season_points (user_id, season_id, total_points)
      VALUES (${userId}, ${seasonId}, ${points})
      ON CONFLICT (user_id, season_id) 
      DO UPDATE SET 
        total_points = season_points.total_points + ${points},
        last_updated = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result[0] as SeasonPoints;
  }

  static async getLeaderboard(seasonId: number, limit: number = 10): Promise<LeaderboardEntry[]> {
    const result = await sql`
      SELECT DISTINCT
        u.farcaster_id,
        u.username,
        sp.total_points as score
      FROM season_points sp
      JOIN users u ON u.id = sp.user_id
      WHERE sp.season_id = ${seasonId}
      ORDER BY sp.total_points DESC
      LIMIT ${limit}
    `;
    return result as LeaderboardEntry[];
  }

  static async getUserScore(userId: number, seasonId: number): Promise<number> {
    const result = await sql`
      SELECT COALESCE(total_points, 0) as total_score
      FROM season_points
      WHERE user_id = ${userId} AND season_id = ${seasonId}
    `;
    return parseInt((result[0] as any)?.total_score || 0);
  }
}

// User Seen Images Operations
export class UserSeenImageService {
  static async markAsSeen(userId: number, imageId: number, seasonId: number): Promise<void> {
    await sql`
      INSERT INTO user_seen_images (user_id, image_id, season_id)
      VALUES (${userId}, ${imageId}, ${seasonId})
      ON CONFLICT (user_id, image_id) DO NOTHING
    `;
  }

  static async getSeenCount(userId: number, seasonId: number): Promise<number> {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM user_seen_images
      WHERE user_id = ${userId} AND season_id = ${seasonId}
    `;
    return parseInt((result[0] as any).count);
  }
}

// Extra Life Operations
export class ExtraLifeService {
  static async create(userId: number, seasonId: number, transactionHash: string): Promise<ExtraLife> {
    const result = await sql`
      INSERT INTO extra_lives (user_id, season_id, transaction_hash)
      VALUES (${userId}, ${seasonId}, ${transactionHash})
      RETURNING *
    `;
    return result[0] as ExtraLife;
  }

  static async hasExtraLifeToday(userId: number): Promise<boolean> {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM extra_lives
      WHERE user_id = ${userId}
      AND DATE(created_at) = CURRENT_DATE
    `;
    return parseInt((result[0] as any).count) > 0;
  }

  static async useExtraLife(id: number): Promise<void> {
    await sql`
      UPDATE extra_lives 
      SET is_used = true 
      WHERE id = ${id}
    `;
  }
}

// Share Operations
export class ShareService {
  static async create(userId: number, seasonId: number): Promise<Share> {
    const result = await sql`
      INSERT INTO shares (user_id, season_id)
      VALUES (${userId}, ${seasonId})
      RETURNING *
    `;
    return result[0] as Share;
  }

  static async hasSharedToday(userId: number, seasonId: number): Promise<boolean> {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM shares
      WHERE user_id = ${userId} 
      AND season_id = ${seasonId}
      AND DATE(created_at) = CURRENT_DATE
    `;
    return parseInt((result[0] as any).count) > 0;
  }

  static async addShareBonus(userId: number, seasonId: number): Promise<void> {
    await SeasonPointsService.upsert(userId, seasonId, GameLimits.SHARE_BONUS_POINTS);
  }
}

// Game Logic Operations
export class GameService {
  static async canPlayGame(userId: number, hasExtraLife: boolean = false): Promise<{
    canPlay: boolean;
    reason?: string;
    dailyLimit?: boolean;
    extraLifeUsed?: boolean;
  }> {
    const dailyResponses = await UserResponseService.getDailyCount(userId);
    const maxGames = hasExtraLife ? GameLimits.MAX_DAILY_GAMES_WITH_EXTRA_LIFE : GameLimits.MAX_DAILY_GAMES;

    if (dailyResponses >= maxGames) {
      return {
        canPlay: false,
        reason: hasExtraLife 
          ? "You've used all your attempts today, including extra life. Come back tomorrow!"
          : "You've reached your daily limit. Purchase an extra life or come back tomorrow!",
        dailyLimit: true,
        extraLifeUsed: hasExtraLife
      };
    }

    return { canPlay: true };
  }

  static calculatePoints(timeLeft: number, isCorrect: boolean): number {
    if (!isCorrect) return 0;
    return timeLeft * GameLimits.POINTS_MULTIPLIER;
  }

  static async processAnswer(
    userId: number,
    imageId: number,
    answer: string,
    timeLeft: number,
    seasonId: number
  ): Promise<{
    isCorrect: boolean;
    correctAnswer: string;
    pointsEarned: number;
  }> {
    // Get correct answer
    const image = await ImageService.findById(imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    const isCorrect = answer === image.correct_answer;
    const responseTime = GameLimits.GAME_TIME_LIMIT - timeLeft;
    const pointsEarned = GameService.calculatePoints(timeLeft, isCorrect);

    // Mark image as seen
    await UserSeenImageService.markAsSeen(userId, imageId, seasonId);

    // Save response
    await UserResponseService.create({
      user_id: userId,
      image_id: imageId,
      selected_answer: answer,
      is_correct: isCorrect,
      response_time: responseTime,
      points_earned: pointsEarned
    });

    // Update points if correct
    if (isCorrect && pointsEarned > 0) {
      await SeasonPointsService.upsert(userId, seasonId, pointsEarned);
    }

    return {
      isCorrect,
      correctAnswer: image.correct_answer,
      pointsEarned
    };
  }
} 