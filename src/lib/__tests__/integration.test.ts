import { jest } from '@jest/globals';
import {
  validateGameRequest,
  validateAnswerRequest,
  sanitizeString
} from '../validations';

describe('Integration Tests', () => {
  describe('Game Flow Integration', () => {
    it('should validate and sanitize game request data', () => {
      const farcasterID = '12345';
      const username = '  testuser  ';
      const seasonName = 'Season 07';
      
      // Test sanitization
      const sanitizedUsername = sanitizeString(username);
      expect(sanitizedUsername).toBe('testuser');
      
      // Test validation
      const validation = validateGameRequest(farcasterID, sanitizedUsername, seasonName, false);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate answer request with proper data flow', () => {
      const farcasterID = '12345';
      const imageId = 1;
      const seasonName = 'Season 07';
      const answer = 'Option A';
      const timeLeft = 60;
      
      const validation = validateAnswerRequest(farcasterID, imageId, seasonName, answer, timeLeft);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject invalid game flow data', () => {
      const invalidFarcasterID = '';
      const invalidSeasonName = 'Season 7'; // Wrong format
      const invalidAnswer = 'Option Z';
      const invalidTimeLeft = -10;
      
      // Test validation failures
      const gameValidation = validateGameRequest(invalidFarcasterID, undefined, invalidSeasonName, false);
      expect(gameValidation.isValid).toBe(false);
      expect(gameValidation.errors.length).toBeGreaterThan(0);
      
      const answerValidation = validateAnswerRequest(invalidFarcasterID, 1, invalidSeasonName, invalidAnswer, invalidTimeLeft);
      expect(answerValidation.isValid).toBe(false);
      expect(answerValidation.errors.length).toBeGreaterThan(0);
    });

    it('should handle edge cases in data processing', () => {
      // Test boundary conditions
      const maxResponseTime = 90;
      const minResponseTime = 0;
      const maxImageId = 999;
      const minImageId = 1;
      
      // Valid boundary values
      const validMax = validateAnswerRequest('12345', maxImageId, 'Season 07', 'Option A', maxResponseTime);
      expect(validMax.isValid).toBe(true);
      
      const validMin = validateAnswerRequest('12345', minImageId, 'Season 07', 'Option B', minResponseTime);
      expect(validMin.isValid).toBe(true);
      
      // Invalid boundary values
      const invalidMax = validateAnswerRequest('12345', 1000, 'Season 07', 'Option A', 91);
      expect(invalidMax.isValid).toBe(false);
      
      const invalidMin = validateAnswerRequest('12345', 0, 'Season 07', 'Option A', -1);
      expect(invalidMin.isValid).toBe(false);
    });
  });

  describe('Data Type Consistency', () => {
    it('should maintain type consistency across validation and database layers', () => {
      // Test that our types are consistent
      const userData = {
        farcaster_id: '12345',
        username: 'testuser',
        early_access_requested: false,
        is_whitelisted: false
      };
      
      // Validate individual fields
      expect(typeof userData.farcaster_id).toBe('string');
      expect(typeof userData.username).toBe('string');
      expect(typeof userData.early_access_requested).toBe('boolean');
      expect(typeof userData.is_whitelisted).toBe('boolean');
      
      // Test validation accepts proper types
      const validation = validateGameRequest(userData.farcaster_id, userData.username, 'Season 07', userData.early_access_requested);
      expect(validation.isValid).toBe(true);
    });

    it('should handle all season name formats correctly', () => {
      const validSeasons = ['Season 00', 'Season 01', 'Season 07', 'Season 99'];
      const invalidSeasons = ['Season 0', 'Season 1', 'Season 100', 'season 07', 'SEASON 07'];
      
      validSeasons.forEach(season => {
        const validation = validateGameRequest('12345', 'testuser', season, false);
        expect(validation.isValid).toBe(true);
      });
      
      invalidSeasons.forEach(season => {
        const validation = validateGameRequest('12345', 'testuser', season, false);
        expect(validation.isValid).toBe(false);
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should provide meaningful error messages across the system', () => {
      const validation = validateAnswerRequest('', -1, 'Invalid Season', '', -10);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(3);
      
      // Check that error messages are descriptive
      const errorMessages = validation.errors.map(e => e.message);
      expect(errorMessages.some(msg => msg.includes('Farcaster ID'))).toBe(true);
      expect(errorMessages.some(msg => msg.includes('Image'))).toBe(true);
      expect(errorMessages.some(msg => msg.includes('Season'))).toBe(true);
      expect(errorMessages.some(msg => msg.includes('Answer'))).toBe(true);
      expect(errorMessages.some(msg => msg.includes('Time'))).toBe(true);
    });
  });
}); 