import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NetworkClient } from '@sudobility/shapeshyft_types';
import { ShapeshyftClient } from './ShapeshyftClient';

// Mock NetworkClient
function createMockNetworkClient(): NetworkClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
}

describe('ShapeshyftClient', () => {
  const baseUrl = 'https://api.example.com';
  let mockNetworkClient: NetworkClient;
  let client: ShapeshyftClient;

  beforeEach(() => {
    mockNetworkClient = createMockNetworkClient();
    client = new ShapeshyftClient({
      baseUrl,
      networkClient: mockNetworkClient,
    });
  });

  describe('constructor', () => {
    it('should create client with config', () => {
      expect(client).toBeInstanceOf(ShapeshyftClient);
    });
  });

  // =============================================================================
  // LLM API KEYS
  // =============================================================================

  describe('LLM API Keys', () => {
    const userId = 'user-123';
    const token = 'firebase-token';
    const keyId = 'key-uuid-123';

    describe('getKeys', () => {
      it('should fetch all keys for a user', async () => {
        const mockKeys = [
          { uuid: 'key-1', key_name: 'OpenAI Key', provider: 'openai' },
        ];
        vi.mocked(mockNetworkClient.get).mockResolvedValue({
          ok: true,
          data: { success: true, data: mockKeys },
        });

        const result = await client.getKeys(userId, token);

        expect(mockNetworkClient.get).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/entities/${userId}/keys`,
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: `Bearer ${token}`,
            }),
          })
        );
        expect(result.data).toEqual(mockKeys);
      });

      it('should throw error on failed request', async () => {
        vi.mocked(mockNetworkClient.get).mockResolvedValue({
          ok: false,
          data: { success: false, error: 'Unauthorized' },
        });

        await expect(client.getKeys(userId, token)).rejects.toThrow(
          'Failed to get keys'
        );
      });
    });

    describe('getKey', () => {
      it('should fetch a single key', async () => {
        const mockKey = {
          uuid: keyId,
          key_name: 'Test Key',
          provider: 'openai',
        };
        vi.mocked(mockNetworkClient.get).mockResolvedValue({
          ok: true,
          data: { success: true, data: mockKey },
        });

        const result = await client.getKey(userId, keyId, token);

        expect(mockNetworkClient.get).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/entities/${userId}/keys/${keyId}`,
          expect.any(Object)
        );
        expect(result.data).toEqual(mockKey);
      });
    });

    describe('createKey', () => {
      it('should create a new key', async () => {
        const createData = {
          key_name: 'New Key',
          provider: 'openai' as const,
          api_key: 'sk-test',
        };
        const mockKey = { uuid: 'new-key-id', ...createData };
        vi.mocked(mockNetworkClient.post).mockResolvedValue({
          ok: true,
          data: { success: true, data: mockKey },
        });

        const result = await client.createKey(userId, createData, token);

        expect(mockNetworkClient.post).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/entities/${userId}/keys`,
          createData,
          expect.any(Object)
        );
        expect(result.data).toEqual(mockKey);
      });
    });

    describe('updateKey', () => {
      it('should update an existing key', async () => {
        const updateData = { key_name: 'Updated Key' };
        const mockKey = { uuid: keyId, key_name: 'Updated Key' };
        vi.mocked(mockNetworkClient.put).mockResolvedValue({
          ok: true,
          data: { success: true, data: mockKey },
        });

        const result = await client.updateKey(userId, keyId, updateData, token);

        expect(mockNetworkClient.put).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/entities/${userId}/keys/${keyId}`,
          updateData,
          expect.any(Object)
        );
        expect(result.data).toEqual(mockKey);
      });
    });

    describe('deleteKey', () => {
      it('should delete a key', async () => {
        const mockKey = { uuid: keyId };
        vi.mocked(mockNetworkClient.delete).mockResolvedValue({
          ok: true,
          data: { success: true, data: mockKey },
        });

        const result = await client.deleteKey(userId, keyId, token);

        expect(mockNetworkClient.delete).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/entities/${userId}/keys/${keyId}`,
          expect.any(Object)
        );
        expect(result.data).toEqual(mockKey);
      });
    });
  });

  // =============================================================================
  // PROJECTS
  // =============================================================================

  describe('Projects', () => {
    const userId = 'user-123';
    const token = 'firebase-token';
    const projectId = 'project-uuid-123';

    describe('getProjects', () => {
      it('should fetch all projects for a user', async () => {
        const mockProjects = [
          {
            uuid: 'proj-1',
            project_name: 'my-project',
            display_name: 'My Project',
          },
        ];
        vi.mocked(mockNetworkClient.get).mockResolvedValue({
          ok: true,
          data: { success: true, data: mockProjects },
        });

        const result = await client.getProjects(userId, token);

        expect(mockNetworkClient.get).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/entities/${userId}/projects`,
          expect.any(Object)
        );
        expect(result.data).toEqual(mockProjects);
      });

      it('should include query params when provided', async () => {
        vi.mocked(mockNetworkClient.get).mockResolvedValue({
          ok: true,
          data: { success: true, data: [] },
        });

        await client.getProjects(userId, token, { is_active: 'true' });

        expect(mockNetworkClient.get).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/entities/${userId}/projects?is_active=true`,
          expect.any(Object)
        );
      });
    });

    describe('getProject', () => {
      it('should fetch a single project', async () => {
        const mockProject = { uuid: projectId, project_name: 'test' };
        vi.mocked(mockNetworkClient.get).mockResolvedValue({
          ok: true,
          data: { success: true, data: mockProject },
        });

        const result = await client.getProject(userId, projectId, token);

        expect(result.data).toEqual(mockProject);
      });
    });

    describe('createProject', () => {
      it('should create a new project', async () => {
        const createData = {
          project_name: 'new-project',
          display_name: 'New Project',
        };
        vi.mocked(mockNetworkClient.post).mockResolvedValue({
          ok: true,
          data: { success: true, data: { uuid: 'new-id', ...createData } },
        });

        const result = await client.createProject(userId, createData, token);

        expect(mockNetworkClient.post).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/entities/${userId}/projects`,
          createData,
          expect.any(Object)
        );
        expect(result.success).toBe(true);
      });
    });

    describe('updateProject', () => {
      it('should update a project', async () => {
        const updateData = { display_name: 'Updated Name' };
        vi.mocked(mockNetworkClient.put).mockResolvedValue({
          ok: true,
          data: { success: true, data: { uuid: projectId, ...updateData } },
        });

        await client.updateProject(userId, projectId, updateData, token);

        expect(mockNetworkClient.put).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/entities/${userId}/projects/${projectId}`,
          updateData,
          expect.any(Object)
        );
      });
    });

    describe('deleteProject', () => {
      it('should delete a project', async () => {
        vi.mocked(mockNetworkClient.delete).mockResolvedValue({
          ok: true,
          data: { success: true, data: { uuid: projectId } },
        });

        await client.deleteProject(userId, projectId, token);

        expect(mockNetworkClient.delete).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/entities/${userId}/projects/${projectId}`,
          expect.any(Object)
        );
      });
    });
  });

  // =============================================================================
  // ENDPOINTS
  // =============================================================================

  describe('Endpoints', () => {
    const userId = 'user-123';
    const projectId = 'project-123';
    const endpointId = 'endpoint-123';
    const token = 'firebase-token';

    describe('getEndpoints', () => {
      it('should fetch all endpoints for a project', async () => {
        const mockEndpoints = [
          {
            uuid: 'ep-1',
            endpoint_name: 'summarize',
            display_name: 'Summarize',
          },
        ];
        vi.mocked(mockNetworkClient.get).mockResolvedValue({
          ok: true,
          data: { success: true, data: mockEndpoints },
        });

        const result = await client.getEndpoints(userId, projectId, token);

        expect(mockNetworkClient.get).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/entities/${userId}/projects/${projectId}/endpoints`,
          expect.any(Object)
        );
        expect(result.data).toEqual(mockEndpoints);
      });
    });

    describe('getEndpoint', () => {
      it('should fetch a single endpoint', async () => {
        const mockEndpoint = { uuid: endpointId, endpoint_name: 'test' };
        vi.mocked(mockNetworkClient.get).mockResolvedValue({
          ok: true,
          data: { success: true, data: mockEndpoint },
        });

        const result = await client.getEndpoint(
          userId,
          projectId,
          endpointId,
          token
        );

        expect(result.data).toEqual(mockEndpoint);
      });
    });

    describe('createEndpoint', () => {
      it('should create a new endpoint', async () => {
        const createData = {
          endpoint_name: 'new-endpoint',
          display_name: 'New Endpoint',
          llm_key_id: 'key-123',
        };
        vi.mocked(mockNetworkClient.post).mockResolvedValue({
          ok: true,
          data: { success: true, data: { uuid: 'new-ep-id', ...createData } },
        });

        await client.createEndpoint(userId, projectId, createData, token);

        expect(mockNetworkClient.post).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/entities/${userId}/projects/${projectId}/endpoints`,
          createData,
          expect.any(Object)
        );
      });
    });

    describe('updateEndpoint', () => {
      it('should update an endpoint', async () => {
        const updateData = { display_name: 'Updated Endpoint' };
        vi.mocked(mockNetworkClient.put).mockResolvedValue({
          ok: true,
          data: { success: true, data: { uuid: endpointId } },
        });

        await client.updateEndpoint(
          userId,
          projectId,
          endpointId,
          updateData,
          token
        );

        expect(mockNetworkClient.put).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/entities/${userId}/projects/${projectId}/endpoints/${endpointId}`,
          updateData,
          expect.any(Object)
        );
      });
    });

    describe('deleteEndpoint', () => {
      it('should delete an endpoint', async () => {
        vi.mocked(mockNetworkClient.delete).mockResolvedValue({
          ok: true,
          data: { success: true, data: { uuid: endpointId } },
        });

        await client.deleteEndpoint(userId, projectId, endpointId, token);

        expect(mockNetworkClient.delete).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/entities/${userId}/projects/${projectId}/endpoints/${endpointId}`,
          expect.any(Object)
        );
      });
    });
  });

  // =============================================================================
  // ANALYTICS
  // =============================================================================

  describe('Analytics', () => {
    const userId = 'user-123';
    const token = 'firebase-token';

    describe('getAnalytics', () => {
      it('should fetch analytics data', async () => {
        const mockAnalytics = {
          aggregate: {
            total_requests: 100,
            successful_requests: 95,
            failed_requests: 5,
            total_tokens_input: 10000,
            total_tokens_output: 5000,
            total_estimated_cost_cents: 50,
            average_latency_ms: 250,
          },
          by_endpoint: [],
        };
        vi.mocked(mockNetworkClient.get).mockResolvedValue({
          ok: true,
          data: { success: true, data: mockAnalytics },
        });

        const result = await client.getAnalytics(userId, token);

        expect(mockNetworkClient.get).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/users/${userId}/analytics`,
          expect.any(Object)
        );
        expect(result.data).toEqual(mockAnalytics);
      });

      it('should include query params when provided', async () => {
        vi.mocked(mockNetworkClient.get).mockResolvedValue({
          ok: true,
          data: { success: true, data: { aggregate: {}, by_endpoint: [] } },
        });

        await client.getAnalytics(userId, token, {
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        });

        expect(mockNetworkClient.get).toHaveBeenCalledWith(
          expect.stringContaining('start_date=2024-01-01'),
          expect.any(Object)
        );
      });
    });
  });

  // =============================================================================
  // USER SETTINGS
  // =============================================================================

  describe('User Settings', () => {
    const userId = 'user-123';
    const token = 'firebase-token';

    describe('getSettings', () => {
      it('should fetch user settings', async () => {
        const mockSettings = {
          uuid: 'settings-123',
          user_id: userId,
          organization_name: 'My Org',
          organization_path: 'my-org',
          is_default: true,
        };
        vi.mocked(mockNetworkClient.get).mockResolvedValue({
          ok: true,
          data: { success: true, data: mockSettings },
        });

        const result = await client.getSettings(userId, token);

        expect(mockNetworkClient.get).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/users/${userId}/settings`,
          expect.any(Object)
        );
        expect(result.data).toEqual(mockSettings);
      });
    });

    describe('updateSettings', () => {
      it('should update user settings', async () => {
        const updateData = { organization_name: 'New Org Name' };
        vi.mocked(mockNetworkClient.put).mockResolvedValue({
          ok: true,
          data: {
            success: true,
            data: { ...updateData, uuid: 'settings-123' },
          },
        });

        await client.updateSettings(userId, updateData, token);

        expect(mockNetworkClient.put).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/users/${userId}/settings`,
          updateData,
          expect.any(Object)
        );
      });
    });
  });

  // =============================================================================
  // AI EXECUTION
  // =============================================================================

  describe('AI Execution', () => {
    const organizationPath = 'my-org';
    const projectName = 'my-project';
    const endpointName = 'summarize';

    describe('executeAiGet', () => {
      it('should execute AI endpoint via GET', async () => {
        const mockResponse = {
          output: { summary: 'Test summary' },
          usage: {
            tokens_input: 100,
            tokens_output: 50,
            latency_ms: 200,
            estimated_cost_cents: 1,
          },
        };
        vi.mocked(mockNetworkClient.get).mockResolvedValue({
          ok: true,
          data: { success: true, data: mockResponse },
        });

        const result = await client.executeAiGet(
          organizationPath,
          projectName,
          endpointName,
          { text: 'test input' }
        );

        expect(mockNetworkClient.get).toHaveBeenCalledWith(
          expect.stringContaining(
            `/api/v1/ai/${organizationPath}/${projectName}/${endpointName}`
          ),
          expect.any(Object)
        );
        expect(result.data).toEqual(mockResponse);
      });

      it('should not include auth headers', async () => {
        vi.mocked(mockNetworkClient.get).mockResolvedValue({
          ok: true,
          data: { success: true, data: {} },
        });

        await client.executeAiGet(
          organizationPath,
          projectName,
          endpointName,
          {}
        );

        expect(mockNetworkClient.get).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.not.objectContaining({
              Authorization: expect.any(String),
            }),
          })
        );
      });
    });

    describe('executeAiPost', () => {
      it('should execute AI endpoint via POST', async () => {
        const input = { text: 'Summarize this text' };
        const mockResponse = { output: { summary: 'Summary' } };
        vi.mocked(mockNetworkClient.post).mockResolvedValue({
          ok: true,
          data: { success: true, data: mockResponse },
        });

        const result = await client.executeAiPost(
          organizationPath,
          projectName,
          endpointName,
          input
        );

        expect(mockNetworkClient.post).toHaveBeenCalledWith(
          `${baseUrl}/api/v1/ai/${organizationPath}/${projectName}/${endpointName}`,
          input,
          expect.any(Object)
        );
        expect(result.data).toEqual(mockResponse);
      });
    });

    describe('executeAi', () => {
      it('should default to POST method', async () => {
        vi.mocked(mockNetworkClient.post).mockResolvedValue({
          ok: true,
          data: { success: true, data: {} },
        });

        await client.executeAi(organizationPath, projectName, endpointName, {});

        expect(mockNetworkClient.post).toHaveBeenCalled();
        expect(mockNetworkClient.get).not.toHaveBeenCalled();
      });

      it('should use GET when specified', async () => {
        vi.mocked(mockNetworkClient.get).mockResolvedValue({
          ok: true,
          data: { success: true, data: {} },
        });

        await client.executeAi(
          organizationPath,
          projectName,
          endpointName,
          {},
          'GET'
        );

        expect(mockNetworkClient.get).toHaveBeenCalled();
        expect(mockNetworkClient.post).not.toHaveBeenCalled();
      });
    });
  });

  // =============================================================================
  // ERROR HANDLING
  // =============================================================================

  describe('Error Handling', () => {
    it('should throw error when response is not ok', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: false,
        data: { success: false, error: 'Server error' },
      });

      await expect(client.getKeys('user', 'token')).rejects.toThrow(
        'Failed to get keys: Server error'
      );
    });

    it('should throw error when data is missing', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: true,
        data: null,
      });

      await expect(client.getKeys('user', 'token')).rejects.toThrow();
    });
  });
});
