import { describe, it, expect } from 'vitest';
import {
  createAuthHeaders,
  createHeaders,
  buildUrl,
  handleApiError,
  buildQueryString,
} from './shapeshyft-helpers';

describe('shapeshyft-helpers', () => {
  describe('createAuthHeaders', () => {
    it('should create headers with bearer token', () => {
      const token = 'test-firebase-token';
      const headers = createAuthHeaders(token);

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer test-firebase-token',
      });
    });

    it('should handle empty token', () => {
      const headers = createAuthHeaders('');

      expect(headers.Authorization).toBe('Bearer ');
    });
  });

  describe('createHeaders', () => {
    it('should create standard headers without auth', () => {
      const headers = createHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      });
    });

    it('should not include Authorization header', () => {
      const headers = createHeaders();

      expect(headers).not.toHaveProperty('Authorization');
    });
  });

  describe('buildUrl', () => {
    it('should combine base URL and path', () => {
      const url = buildUrl('https://api.example.com', '/api/v1/users');

      expect(url).toBe('https://api.example.com/api/v1/users');
    });

    it('should remove trailing slash from base URL', () => {
      const url = buildUrl('https://api.example.com/', '/api/v1/users');

      expect(url).toBe('https://api.example.com/api/v1/users');
    });

    it('should handle base URL without trailing slash', () => {
      const url = buildUrl('https://api.example.com', '/api/v1/users');

      expect(url).toBe('https://api.example.com/api/v1/users');
    });

    it('should handle empty path', () => {
      const url = buildUrl('https://api.example.com', '');

      expect(url).toBe('https://api.example.com');
    });
  });

  describe('handleApiError', () => {
    it('should extract error message from response.data.error', () => {
      const response = { data: { error: 'Not found' } };
      const error = handleApiError(response, 'get user');

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Failed to get user: Not found');
    });

    it('should extract error message from response.data.message', () => {
      const response = { data: { message: 'Invalid token' } };
      const error = handleApiError(response, 'authenticate');

      expect(error.message).toBe('Failed to authenticate: Invalid token');
    });

    it('should prefer error over message', () => {
      const response = { data: { error: 'Primary error', message: 'Secondary' } };
      const error = handleApiError(response, 'test');

      expect(error.message).toBe('Failed to test: Primary error');
    });

    it('should handle missing error data', () => {
      const response = { data: {} };
      const error = handleApiError(response, 'fetch');

      expect(error.message).toBe('Failed to fetch: Unknown error');
    });

    it('should handle null response', () => {
      const error = handleApiError(null, 'process');

      expect(error.message).toBe('Failed to process: Unknown error');
    });

    it('should handle undefined response', () => {
      const error = handleApiError(undefined, 'load');

      expect(error.message).toBe('Failed to load: Unknown error');
    });
  });

  describe('buildQueryString', () => {
    it('should build query string from object', () => {
      const params = { foo: 'bar', baz: 'qux' };
      const queryString = buildQueryString(params);

      expect(queryString).toBe('?foo=bar&baz=qux');
    });

    it('should handle single parameter', () => {
      const params = { is_active: 'true' };
      const queryString = buildQueryString(params);

      expect(queryString).toBe('?is_active=true');
    });

    it('should filter out null values', () => {
      const params = { foo: 'bar', baz: null };
      const queryString = buildQueryString(params);

      expect(queryString).toBe('?foo=bar');
    });

    it('should filter out undefined values', () => {
      const params = { foo: 'bar', baz: undefined };
      const queryString = buildQueryString(params);

      expect(queryString).toBe('?foo=bar');
    });

    it('should return empty string for empty object', () => {
      const queryString = buildQueryString({});

      expect(queryString).toBe('');
    });

    it('should return empty string when all values are null/undefined', () => {
      const params = { foo: null, bar: undefined };
      const queryString = buildQueryString(params);

      expect(queryString).toBe('');
    });

    it('should convert numbers to strings', () => {
      const params = { page: 1, limit: 10 };
      const queryString = buildQueryString(params);

      expect(queryString).toBe('?page=1&limit=10');
    });

    it('should convert booleans to strings', () => {
      const params = { active: true, deleted: false };
      const queryString = buildQueryString(params);

      expect(queryString).toBe('?active=true&deleted=false');
    });
  });
});
