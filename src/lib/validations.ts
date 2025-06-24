import type { ValidationResult, ValidationError } from './types';
import { GameLimits, SeasonName } from './types';

// Helper function to create validation result
function createValidationResult(errors: ValidationError[]): ValidationResult {
  return {
    isValid: errors.length === 0,
    errors
  };
}

// User validation
export function validateFarcasterId(farcaster_id: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!farcaster_id) {
    errors.push({ field: 'farcaster_id', message: 'Farcaster ID is required' });
  }

  if (farcaster_id && typeof farcaster_id !== 'string') {
    errors.push({ field: 'farcaster_id', message: 'Farcaster ID must be a string' });
  }

  if (farcaster_id && farcaster_id.trim().length === 0) {
    errors.push({ field: 'farcaster_id', message: 'Farcaster ID cannot be empty' });
  }

  return createValidationResult(errors);
}

export function validateUsername(username?: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (username !== undefined) {
    if (typeof username !== 'string') {
      errors.push({ field: 'username', message: 'Username must be a string' });
    }

    if (username && username.length > 50) {
      errors.push({ field: 'username', message: 'Username cannot exceed 50 characters' });
    }

    if (username && username.trim().length === 0) {
      errors.push({ field: 'username', message: 'Username cannot be empty if provided' });
    }
  }

  return createValidationResult(errors);
}

// Season validation
export function validateSeasonName(name: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!name) {
    errors.push({ field: 'name', message: 'Season name is required' });
    return createValidationResult(errors);
  }

  // Check if it matches the Season XX pattern
  const seasonPattern = /^Season \d{2}$/;
  if (!seasonPattern.test(name)) {
    errors.push({ 
      field: 'name', 
      message: 'Season name must follow the format "Season XX" where XX is a two-digit number' 
    });
  }

  return createValidationResult(errors);
}

export function validateSeasonDates(startDate: Date, endDate: Date): ValidationResult {
  const errors: ValidationError[] = [];

  if (!startDate) {
    errors.push({ field: 'start_date', message: 'Start date is required' });
  }

  if (!endDate) {
    errors.push({ field: 'end_date', message: 'End date is required' });
  }

  if (startDate && endDate && startDate >= endDate) {
    errors.push({ 
      field: 'end_date', 
      message: 'End date must be after start date' 
    });
  }

  // Check if dates are not too far in the past or future
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());

  if (startDate && startDate < oneYearAgo) {
    errors.push({ 
      field: 'start_date', 
      message: 'Start date cannot be more than one year in the past' 
    });
  }

  if (endDate && endDate > twoYearsFromNow) {
    errors.push({ 
      field: 'end_date', 
      message: 'End date cannot be more than two years in the future' 
    });
  }

  return createValidationResult(errors);
}

// Game validation
export function validateAnswer(answer: string, validOptions: string[]): ValidationResult {
  const errors: ValidationError[] = [];

  if (!answer) {
    errors.push({ field: 'answer', message: 'Answer is required' });
    return createValidationResult(errors);
  }

  if (!validOptions.includes(answer)) {
    errors.push({ 
      field: 'answer', 
      message: 'Answer must be one of the valid options' 
    });
  }

  return createValidationResult(errors);
}

export function validateResponseTime(responseTime: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof responseTime !== 'number') {
    errors.push({ field: 'response_time', message: 'Response time must be a number' });
    return createValidationResult(errors);
  }

  if (responseTime < 0) {
    errors.push({ field: 'response_time', message: 'Response time cannot be negative' });
  }

  if (responseTime > GameLimits.GAME_TIME_LIMIT) {
    errors.push({ 
      field: 'response_time', 
      message: `Response time cannot exceed ${GameLimits.GAME_TIME_LIMIT} seconds` 
    });
  }

  return createValidationResult(errors);
}

export function validateTimeLeft(timeLeft: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof timeLeft !== 'number') {
    errors.push({ field: 'timeLeft', message: 'Time left must be a number' });
    return createValidationResult(errors);
  }

  if (timeLeft < 0) {
    errors.push({ field: 'timeLeft', message: 'Time left cannot be negative' });
  }

  if (timeLeft > GameLimits.GAME_TIME_LIMIT) {
    errors.push({ 
      field: 'timeLeft', 
      message: `Time left cannot exceed ${GameLimits.GAME_TIME_LIMIT} seconds` 
    });
  }

  return createValidationResult(errors);
}

export function validatePoints(points: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof points !== 'number') {
    errors.push({ field: 'points', message: 'Points must be a number' });
    return createValidationResult(errors);
  }

  if (points < 0) {
    errors.push({ field: 'points', message: 'Points cannot be negative' });
  }

  // Maximum possible points (full time * multiplier)
  const maxPoints = GameLimits.GAME_TIME_LIMIT * GameLimits.POINTS_MULTIPLIER;
  if (points > maxPoints) {
    errors.push({ 
      field: 'points', 
      message: `Points cannot exceed ${maxPoints}` 
    });
  }

  return createValidationResult(errors);
}

// Image validation
export function validateImageNumber(imageNumber: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof imageNumber !== 'number') {
    errors.push({ field: 'image_number', message: 'Image number must be a number' });
    return createValidationResult(errors);
  }

  if (!Number.isInteger(imageNumber)) {
    errors.push({ field: 'image_number', message: 'Image number must be an integer' });
  }

  if (imageNumber < 1) {
    errors.push({ field: 'image_number', message: 'Image number must be positive' });
  }

  if (imageNumber > 999) {
    errors.push({ field: 'image_number', message: 'Image number cannot exceed 999' });
  }

  return createValidationResult(errors);
}

export function validateImageOptions(option1: string, option2: string, option3: string, correctAnswer: string): ValidationResult {
  const errors: ValidationError[] = [];

  const options = [option1, option2, option3];

  // Check that all options are provided
  options.forEach((option, index) => {
    if (!option || option.trim().length === 0) {
      errors.push({ 
        field: `option_${index + 1}`, 
        message: `Option ${index + 1} is required` 
      });
    }
  });

  // Check that correct answer is one of the options
  if (correctAnswer && !options.includes(correctAnswer)) {
    errors.push({ 
      field: 'correct_answer', 
      message: 'Correct answer must be one of the provided options' 
    });
  }

  // Check for duplicate options
  const uniqueOptions = new Set(options.filter(opt => opt && opt.trim().length > 0));
  if (uniqueOptions.size !== options.filter(opt => opt && opt.trim().length > 0).length) {
    errors.push({ 
      field: 'options', 
      message: 'All options must be unique' 
    });
  }

  return createValidationResult(errors);
}

// Transaction validation
export function validateTransactionHash(hash: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!hash) {
    errors.push({ field: 'transaction_hash', message: 'Transaction hash is required' });
    return createValidationResult(errors);
  }

  if (typeof hash !== 'string') {
    errors.push({ field: 'transaction_hash', message: 'Transaction hash must be a string' });
    return createValidationResult(errors);
  }

  // Basic hex string validation (Ethereum transaction hashes are 66 characters, starting with 0x)
  const ethTxPattern = /^0x[a-fA-F0-9]{64}$/;
  if (!ethTxPattern.test(hash)) {
    errors.push({ 
      field: 'transaction_hash', 
      message: 'Transaction hash must be a valid Ethereum transaction hash' 
    });
  }

  return createValidationResult(errors);
}

// Pagination validation
export function validatePagination(limit?: number, offset?: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (limit !== undefined) {
    if (typeof limit !== 'number' || !Number.isInteger(limit)) {
      errors.push({ field: 'limit', message: 'Limit must be an integer' });
    } else if (limit < 1) {
      errors.push({ field: 'limit', message: 'Limit must be at least 1' });
    } else if (limit > 100) {
      errors.push({ field: 'limit', message: 'Limit cannot exceed 100' });
    }
  }

  if (offset !== undefined) {
    if (typeof offset !== 'number' || !Number.isInteger(offset)) {
      errors.push({ field: 'offset', message: 'Offset must be an integer' });
    } else if (offset < 0) {
      errors.push({ field: 'offset', message: 'Offset cannot be negative' });
    }
  }

  return createValidationResult(errors);
}

// Combined validation functions
export function validateGameRequest(userId: string, username?: string, seasonId?: string, extraLife?: boolean): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate user ID
  const userIdValidation = validateFarcasterId(userId);
  errors.push(...userIdValidation.errors);

  // Validate username if provided
  if (username !== undefined) {
    const usernameValidation = validateUsername(username);
    errors.push(...usernameValidation.errors);
  }

  // Validate season ID if provided
  if (seasonId !== undefined) {
    const seasonValidation = validateSeasonName(seasonId);
    errors.push(...seasonValidation.errors);
  }

  // Validate extra life flag
  if (extraLife !== undefined && typeof extraLife !== 'boolean') {
    errors.push({ field: 'extraLife', message: 'Extra life flag must be a boolean' });
  }

  return createValidationResult(errors);
}

export function validateAnswerRequest(
  userId: string, 
  imageId: number, 
  seasonId: string, 
  answer: string, 
  timeLeft: number
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate user ID
  const userIdValidation = validateFarcasterId(userId);
  errors.push(...userIdValidation.errors);

  // Validate image ID
  if (typeof imageId !== 'number' || !Number.isInteger(imageId) || imageId < 1) {
    errors.push({ field: 'imageId', message: 'Image ID must be a positive integer' });
  }

  // Validate season ID
  const seasonValidation = validateSeasonName(seasonId);
  errors.push(...seasonValidation.errors);

  // Validate answer
  if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
    errors.push({ field: 'answer', message: 'Answer is required and must be a non-empty string' });
  }

  // Validate time left
  const timeLeftValidation = validateTimeLeft(timeLeft);
  errors.push(...timeLeftValidation.errors);

  return createValidationResult(errors);
}

// Sanitization functions
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
}

export function sanitizeUsername(username?: string): string | undefined {
  if (!username) return undefined;
  const sanitized = sanitizeString(username);
  return sanitized.length > 0 ? sanitized : undefined;
}

export function sanitizeSeasonName(name: string): string {
  return sanitizeString(name);
} 