import {
  validateFarcasterId,
  validateUsername,
  validateSeasonName,
  validateSeasonDates,
  validateAnswer,
  validateResponseTime,
  validateTimeLeft,
  validatePoints,
  validateImageNumber,
  validateImageOptions,
  validateTransactionHash,
  validatePagination,
  validateGameRequest,
  validateAnswerRequest,
  sanitizeString,
  sanitizeUsername,
  sanitizeSeasonName
} from '../validations';

describe('User Validations', () => {
  describe('validateFarcasterId', () => {
    it('should validate valid Farcaster ID', () => {
      const result = validateFarcasterId('12345');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty Farcaster ID', () => {
      const result = validateFarcasterId('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('farcaster_id');
      expect(result.errors[0].message).toBe('Farcaster ID is required');
    });

    it('should reject whitespace-only Farcaster ID', () => {
      const result = validateFarcasterId('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Farcaster ID cannot be empty');
    });
  });

  describe('validateUsername', () => {
    it('should validate valid username', () => {
      const result = validateUsername('testuser');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept undefined username', () => {
      const result = validateUsername(undefined);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject username that is too long', () => {
      const longUsername = 'a'.repeat(51);
      const result = validateUsername(longUsername);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Username cannot exceed 50 characters');
    });

    it('should reject empty username when provided', () => {
      const result = validateUsername('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Username cannot be empty if provided');
    });
  });
});

describe('Season Validations', () => {
  describe('validateSeasonName', () => {
    it('should validate correct season name format', () => {
      const result = validateSeasonName('Season 07');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid season name format', () => {
      const result = validateSeasonName('Season 7');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Season XX');
    });

    it('should reject empty season name', () => {
      const result = validateSeasonName('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Season name is required');
    });
  });

  describe('validateSeasonDates', () => {
    it('should validate correct date range', () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear() + 1, now.getMonth(), 1);
      const result = validateSeasonDates(startDate, endDate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject end date before start date', () => {
      const startDate = new Date('2024-12-31');
      const endDate = new Date('2024-01-01');
      const result = validateSeasonDates(startDate, endDate);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('End date must be after start date');
    });

    it('should reject dates too far in the past', () => {
      const startDate = new Date('2020-01-01');
      const endDate = new Date('2020-12-31');
      const result = validateSeasonDates(startDate, endDate);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('past'))).toBe(true);
    });
  });
});

describe('Game Validations', () => {
  describe('validateAnswer', () => {
    const validOptions = ['Option A', 'Option B', 'Option C'];

    it('should validate correct answer', () => {
      const result = validateAnswer('Option A', validOptions);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid answer', () => {
      const result = validateAnswer('Option D', validOptions);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Answer must be one of the valid options');
    });

    it('should reject empty answer', () => {
      const result = validateAnswer('', validOptions);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Answer is required');
    });
  });

  describe('validateResponseTime', () => {
    it('should validate correct response time', () => {
      const result = validateResponseTime(30);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative response time', () => {
      const result = validateResponseTime(-5);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Response time cannot be negative');
    });

    it('should reject response time exceeding limit', () => {
      const result = validateResponseTime(95);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('cannot exceed 90 seconds');
    });
  });

  describe('validateTimeLeft', () => {
    it('should validate correct time left', () => {
      const result = validateTimeLeft(60);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative time left', () => {
      const result = validateTimeLeft(-10);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Time left cannot be negative');
    });
  });

  describe('validatePoints', () => {
    it('should validate correct points', () => {
      const result = validatePoints(3000);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative points', () => {
      const result = validatePoints(-100);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Points cannot be negative');
    });

    it('should reject points exceeding maximum', () => {
      const result = validatePoints(10000); // Max is 90 * 50 = 4500
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('cannot exceed');
    });
  });
});

describe('Image Validations', () => {
  describe('validateImageNumber', () => {
    it('should validate correct image number', () => {
      const result = validateImageNumber(123);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject zero or negative image number', () => {
      const result = validateImageNumber(0);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Image number must be positive');
    });

    it('should reject image number exceeding limit', () => {
      const result = validateImageNumber(1000);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Image number cannot exceed 999');
    });
  });

  describe('validateImageOptions', () => {
    it('should validate correct image options', () => {
      const result = validateImageOptions('Option A', 'Option B', 'Option C', 'Option A');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject duplicate options', () => {
      const result = validateImageOptions('Option A', 'Option A', 'Option C', 'Option A');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('unique'))).toBe(true);
    });

    it('should reject correct answer not in options', () => {
      const result = validateImageOptions('Option A', 'Option B', 'Option C', 'Option D');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Correct answer must be one of the provided options');
    });
  });
});

describe('Transaction Validations', () => {
  describe('validateTransactionHash', () => {
    it('should validate correct Ethereum transaction hash', () => {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = validateTransactionHash(hash);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid transaction hash format', () => {
      const result = validateTransactionHash('invalid-hash');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('valid Ethereum transaction hash');
    });

    it('should reject empty transaction hash', () => {
      const result = validateTransactionHash('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Transaction hash is required');
    });
  });
});

describe('Pagination Validations', () => {
  describe('validatePagination', () => {
    it('should validate correct pagination parameters', () => {
      const result = validatePagination(10, 0);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject limit exceeding maximum', () => {
      const result = validatePagination(101, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Limit cannot exceed 100');
    });

    it('should reject negative offset', () => {
      const result = validatePagination(10, -5);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Offset cannot be negative');
    });
  });
});

describe('Combined Validations', () => {
  describe('validateGameRequest', () => {
    it('should validate correct game request', () => {
      const result = validateGameRequest('12345', 'testuser', 'Season 07', false);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle optional parameters', () => {
      const result = validateGameRequest('12345');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateAnswerRequest', () => {
    it('should validate correct answer request', () => {
      const result = validateAnswerRequest('12345', 1, 'Season 07', 'Option A', 60);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid answer request', () => {
      const result = validateAnswerRequest('', -1, 'Invalid', '', -10);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Sanitization Functions', () => {
  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      const result = sanitizeString('  test  ');
      expect(result).toBe('test');
    });

    it('should remove dangerous characters', () => {
      const result = sanitizeString('<script>alert("xss")</script>');
      expect(result).toBe('scriptalert("xss")/script');
    });
  });

  describe('sanitizeUsername', () => {
    it('should sanitize valid username', () => {
      const result = sanitizeUsername('  testuser  ');
      expect(result).toBe('testuser');
    });

    it('should return undefined for empty username', () => {
      const result = sanitizeUsername('   ');
      expect(result).toBeUndefined();
    });
  });

  describe('sanitizeSeasonName', () => {
    it('should sanitize season name', () => {
      const result = sanitizeSeasonName('  Season 07  ');
      expect(result).toBe('Season 07');
    });
  });
}); 