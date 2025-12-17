import type {
  AiExecutionResponse,
  AiPayloadResponse,
  BaseResponse,
  Endpoint,
  EndpointCreateRequest,
  EndpointQueryParams,
  EndpointUpdateRequest,
  LlmApiKeyCreateRequest,
  LlmApiKeySafe,
  LlmApiKeyUpdateRequest,
  NetworkClient,
  Project,
  ProjectCreateRequest,
  ProjectQueryParams,
  ProjectUpdateRequest,
  UsageAggregate,
  UsageAnalyticsQueryParams,
  UsageByDate,
  UsageByEndpoint,
} from '@sudobility/shapeshyft_types';
import type { FirebaseIdToken } from '../types';
import {
  buildQueryString,
  buildUrl,
  createAuthHeaders,
  createHeaders,
  handleApiError,
} from '../utils/shapeshyft-helpers';

/**
 * Analytics data response type
 */
export interface AnalyticsData {
  aggregate: UsageAggregate;
  by_endpoint: UsageByEndpoint[];
  by_date: UsageByDate[];
}

/**
 * ShapeShyft API client
 * Provides typed methods for all ShapeShyft API endpoints
 */
export class ShapeshyftClient {
  private readonly baseUrl: string;
  private readonly networkClient: NetworkClient;

  constructor(config: { baseUrl: string; networkClient: NetworkClient }) {
    this.baseUrl = config.baseUrl;
    this.networkClient = config.networkClient;
  }

  // =============================================================================
  // LLM API KEYS (Firebase auth required)
  // =============================================================================

  /**
   * Get all LLM API keys for a user
   * GET /api/v1/users/:userId/keys
   */
  async getKeys(
    userId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<LlmApiKeySafe[]>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<
      BaseResponse<LlmApiKeySafe[]>
    >(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/keys`
      ),
      {
        headers,
      }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get keys');
    }

    return response.data;
  }

  /**
   * Get a single LLM API key
   * GET /api/v1/users/:userId/keys/:keyId
   */
  async getKey(
    userId: string,
    keyId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<LlmApiKeySafe>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<BaseResponse<LlmApiKeySafe>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/keys/${encodeURIComponent(keyId)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get key');
    }

    return response.data;
  }

  /**
   * Create a new LLM API key
   * POST /api/v1/users/:userId/keys
   */
  async createKey(
    userId: string,
    data: LlmApiKeyCreateRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<LlmApiKeySafe>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.post<BaseResponse<LlmApiKeySafe>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/keys`
      ),
      data,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'create key');
    }

    return response.data;
  }

  /**
   * Update an LLM API key
   * PUT /api/v1/users/:userId/keys/:keyId
   */
  async updateKey(
    userId: string,
    keyId: string,
    data: LlmApiKeyUpdateRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<LlmApiKeySafe>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.put<BaseResponse<LlmApiKeySafe>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/keys/${encodeURIComponent(keyId)}`
      ),
      data,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'update key');
    }

    return response.data;
  }

  /**
   * Delete an LLM API key
   * DELETE /api/v1/users/:userId/keys/:keyId
   */
  async deleteKey(
    userId: string,
    keyId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<LlmApiKeySafe>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.delete<
      BaseResponse<LlmApiKeySafe>
    >(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/keys/${encodeURIComponent(keyId)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'delete key');
    }

    return response.data;
  }

  // =============================================================================
  // PROJECTS (Firebase auth required)
  // =============================================================================

  /**
   * Get all projects for a user
   * GET /api/v1/users/:userId/projects
   */
  async getProjects(
    userId: string,
    token: FirebaseIdToken,
    params?: ProjectQueryParams
  ): Promise<BaseResponse<Project[]>> {
    const headers = createAuthHeaders(token);
    const queryString = params ? buildQueryString(params) : '';

    const response = await this.networkClient.get<BaseResponse<Project[]>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/projects${queryString}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get projects');
    }

    return response.data;
  }

  /**
   * Get a single project
   * GET /api/v1/users/:userId/projects/:projectId
   */
  async getProject(
    userId: string,
    projectId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Project>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<BaseResponse<Project>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/projects/${encodeURIComponent(projectId)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get project');
    }

    return response.data;
  }

  /**
   * Create a new project
   * POST /api/v1/users/:userId/projects
   */
  async createProject(
    userId: string,
    data: ProjectCreateRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Project>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.post<BaseResponse<Project>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/projects`
      ),
      data,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'create project');
    }

    return response.data;
  }

  /**
   * Update a project
   * PUT /api/v1/users/:userId/projects/:projectId
   */
  async updateProject(
    userId: string,
    projectId: string,
    data: ProjectUpdateRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Project>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.put<BaseResponse<Project>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/projects/${encodeURIComponent(projectId)}`
      ),
      data,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'update project');
    }

    return response.data;
  }

  /**
   * Delete a project
   * DELETE /api/v1/users/:userId/projects/:projectId
   */
  async deleteProject(
    userId: string,
    projectId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Project>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.delete<BaseResponse<Project>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/projects/${encodeURIComponent(projectId)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'delete project');
    }

    return response.data;
  }

  // =============================================================================
  // ENDPOINTS (Firebase auth required)
  // =============================================================================

  /**
   * Get all endpoints for a project
   * GET /api/v1/users/:userId/projects/:projectId/endpoints
   */
  async getEndpoints(
    userId: string,
    projectId: string,
    token: FirebaseIdToken,
    params?: EndpointQueryParams
  ): Promise<BaseResponse<Endpoint[]>> {
    const headers = createAuthHeaders(token);
    const queryString = params ? buildQueryString(params) : '';

    const response = await this.networkClient.get<BaseResponse<Endpoint[]>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/projects/${encodeURIComponent(projectId)}/endpoints${queryString}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get endpoints');
    }

    return response.data;
  }

  /**
   * Get a single endpoint
   * GET /api/v1/users/:userId/projects/:projectId/endpoints/:endpointId
   */
  async getEndpoint(
    userId: string,
    projectId: string,
    endpointId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Endpoint>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<BaseResponse<Endpoint>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/projects/${encodeURIComponent(projectId)}/endpoints/${encodeURIComponent(endpointId)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get endpoint');
    }

    return response.data;
  }

  /**
   * Create a new endpoint
   * POST /api/v1/users/:userId/projects/:projectId/endpoints
   */
  async createEndpoint(
    userId: string,
    projectId: string,
    data: EndpointCreateRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Endpoint>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.post<BaseResponse<Endpoint>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/projects/${encodeURIComponent(projectId)}/endpoints`
      ),
      data,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'create endpoint');
    }

    return response.data;
  }

  /**
   * Update an endpoint
   * PUT /api/v1/users/:userId/projects/:projectId/endpoints/:endpointId
   */
  async updateEndpoint(
    userId: string,
    projectId: string,
    endpointId: string,
    data: EndpointUpdateRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Endpoint>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.put<BaseResponse<Endpoint>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/projects/${encodeURIComponent(projectId)}/endpoints/${encodeURIComponent(endpointId)}`
      ),
      data,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'update endpoint');
    }

    return response.data;
  }

  /**
   * Delete an endpoint
   * DELETE /api/v1/users/:userId/projects/:projectId/endpoints/:endpointId
   */
  async deleteEndpoint(
    userId: string,
    projectId: string,
    endpointId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Endpoint>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.delete<BaseResponse<Endpoint>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/projects/${encodeURIComponent(projectId)}/endpoints/${encodeURIComponent(endpointId)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'delete endpoint');
    }

    return response.data;
  }

  // =============================================================================
  // ANALYTICS (Firebase auth required)
  // =============================================================================

  /**
   * Get usage analytics for a user
   * GET /api/v1/users/:userId/analytics
   */
  async getAnalytics(
    userId: string,
    token: FirebaseIdToken,
    params?: UsageAnalyticsQueryParams
  ): Promise<BaseResponse<AnalyticsData>> {
    const headers = createAuthHeaders(token);
    const queryString = params ? buildQueryString(params) : '';

    const response = await this.networkClient.get<BaseResponse<AnalyticsData>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/analytics${queryString}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get analytics');
    }

    return response.data;
  }

  // =============================================================================
  // AI EXECUTION (Public, no auth)
  // =============================================================================

  /**
   * Execute AI endpoint via GET (for simple inputs)
   * GET /api/v1/ai/:projectName/:endpointName
   */
  async executeAiGet(
    projectName: string,
    endpointName: string,
    input: unknown
  ): Promise<BaseResponse<AiExecutionResponse | AiPayloadResponse>> {
    const headers = createHeaders();
    const queryString = input
      ? buildQueryString({ input: JSON.stringify(input) })
      : '';

    const response = await this.networkClient.get<
      BaseResponse<AiExecutionResponse | AiPayloadResponse>
    >(
      buildUrl(
        this.baseUrl,
        `/api/v1/ai/${encodeURIComponent(projectName)}/${encodeURIComponent(endpointName)}${queryString}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'execute AI (GET)');
    }

    return response.data;
  }

  /**
   * Execute AI endpoint via POST (for complex inputs)
   * POST /api/v1/ai/:projectName/:endpointName
   */
  async executeAiPost(
    projectName: string,
    endpointName: string,
    input: unknown
  ): Promise<BaseResponse<AiExecutionResponse | AiPayloadResponse>> {
    const headers = createHeaders();

    const response = await this.networkClient.post<
      BaseResponse<AiExecutionResponse | AiPayloadResponse>
    >(
      buildUrl(
        this.baseUrl,
        `/api/v1/ai/${encodeURIComponent(projectName)}/${encodeURIComponent(endpointName)}`
      ),
      { input },
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'execute AI (POST)');
    }

    return response.data;
  }

  /**
   * Execute AI endpoint (auto-selects GET or POST based on method parameter)
   */
  async executeAi(
    projectName: string,
    endpointName: string,
    input: unknown,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<BaseResponse<AiExecutionResponse | AiPayloadResponse>> {
    if (method === 'GET') {
      return this.executeAiGet(projectName, endpointName, input);
    }
    return this.executeAiPost(projectName, endpointName, input);
  }
}
