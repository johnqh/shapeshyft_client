import type {
  AiExecutionResponse,
  AiPromptResponse,
  AnalyticsResponse,
  BaseResponse,
  Endpoint,
  EndpointCreateRequest,
  EndpointQueryParams,
  EndpointUpdateRequest,
  GetApiKeyResponse,
  LlmApiKeyCreateRequest,
  LlmApiKeySafe,
  LlmApiKeyUpdateRequest,
  NetworkClient,
  Project,
  ProjectCreateRequest,
  ProjectQueryParams,
  ProjectUpdateRequest,
  RefreshApiKeyResponse,
  UsageAnalyticsQueryParams,
  UserSettings,
  UserSettingsUpdateRequest,
} from '@sudobility/shapeshyft_types';
import type {
  CreateEntityRequest,
  Entity,
  EntityInvitation,
  EntityMember,
  EntityRole,
  EntityWithRole,
  InviteMemberRequest,
  UpdateEntityRequest,
  RateLimitsConfigData,
  RateLimitHistoryData,
  RateLimitPeriodType,
} from '@sudobility/types';
import type { FirebaseIdToken } from '../types';
import {
  buildQueryString,
  buildUrl,
  createApiKeyHeaders,
  createAuthHeaders,
  createHeaders,
  handleApiError,
} from '../utils/shapeshyft-helpers';

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
  // LLM API KEYS (Firebase auth required, entity-scoped)
  // =============================================================================

  /**
   * Get all LLM API keys for an entity
   * GET /api/v1/entities/:entitySlug/keys
   */
  async getKeys(
    entitySlug: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<LlmApiKeySafe[]>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<
      BaseResponse<LlmApiKeySafe[]>
    >(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/keys`
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
   * GET /api/v1/entities/:entitySlug/keys/:keyId
   */
  async getKey(
    entitySlug: string,
    keyId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<LlmApiKeySafe>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<BaseResponse<LlmApiKeySafe>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/keys/${encodeURIComponent(keyId)}`
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
   * POST /api/v1/entities/:entitySlug/keys
   */
  async createKey(
    entitySlug: string,
    data: LlmApiKeyCreateRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<LlmApiKeySafe>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.post<BaseResponse<LlmApiKeySafe>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/keys`
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
   * PUT /api/v1/entities/:entitySlug/keys/:keyId
   */
  async updateKey(
    entitySlug: string,
    keyId: string,
    data: LlmApiKeyUpdateRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<LlmApiKeySafe>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.put<BaseResponse<LlmApiKeySafe>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/keys/${encodeURIComponent(keyId)}`
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
   * DELETE /api/v1/entities/:entitySlug/keys/:keyId
   */
  async deleteKey(
    entitySlug: string,
    keyId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<LlmApiKeySafe>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.delete<
      BaseResponse<LlmApiKeySafe>
    >(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/keys/${encodeURIComponent(keyId)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'delete key');
    }

    return response.data;
  }

  // =============================================================================
  // PROJECTS (Firebase auth required, entity-scoped)
  // =============================================================================

  /**
   * Get all projects for an entity
   * GET /api/v1/entities/:entitySlug/projects
   */
  async getProjects(
    entitySlug: string,
    token: FirebaseIdToken,
    params?: ProjectQueryParams
  ): Promise<BaseResponse<Project[]>> {
    const headers = createAuthHeaders(token);
    const queryString = params ? buildQueryString(params) : '';

    const response = await this.networkClient.get<BaseResponse<Project[]>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/projects${queryString}`
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
   * GET /api/v1/entities/:entitySlug/projects/:projectId
   */
  async getProject(
    entitySlug: string,
    projectId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Project>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<BaseResponse<Project>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/projects/${encodeURIComponent(projectId)}`
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
   * POST /api/v1/entities/:entitySlug/projects
   */
  async createProject(
    entitySlug: string,
    data: ProjectCreateRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Project>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.post<BaseResponse<Project>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/projects`
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
   * PUT /api/v1/entities/:entitySlug/projects/:projectId
   */
  async updateProject(
    entitySlug: string,
    projectId: string,
    data: ProjectUpdateRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Project>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.put<BaseResponse<Project>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/projects/${encodeURIComponent(projectId)}`
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
   * DELETE /api/v1/entities/:entitySlug/projects/:projectId
   */
  async deleteProject(
    entitySlug: string,
    projectId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Project>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.delete<BaseResponse<Project>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/projects/${encodeURIComponent(projectId)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'delete project');
    }

    return response.data;
  }

  /**
   * Get project API key (full key)
   * GET /api/v1/entities/:entitySlug/projects/:projectId/api-key
   */
  async getProjectApiKey(
    entitySlug: string,
    projectId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<GetApiKeyResponse>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<
      BaseResponse<GetApiKeyResponse>
    >(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/projects/${encodeURIComponent(projectId)}/api-key`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get project API key');
    }

    return response.data;
  }

  /**
   * Refresh project API key (generates new key)
   * POST /api/v1/entities/:entitySlug/projects/:projectId/api-key/refresh
   */
  async refreshProjectApiKey(
    entitySlug: string,
    projectId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<RefreshApiKeyResponse>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.post<
      BaseResponse<RefreshApiKeyResponse>
    >(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/projects/${encodeURIComponent(projectId)}/api-key/refresh`
      ),
      {},
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'refresh project API key');
    }

    return response.data;
  }

  // =============================================================================
  // ENDPOINTS (Firebase auth required, entity-scoped)
  // =============================================================================

  /**
   * Get all endpoints for a project
   * GET /api/v1/entities/:entitySlug/projects/:projectId/endpoints
   */
  async getEndpoints(
    entitySlug: string,
    projectId: string,
    token: FirebaseIdToken,
    params?: EndpointQueryParams
  ): Promise<BaseResponse<Endpoint[]>> {
    const headers = createAuthHeaders(token);
    const queryString = params ? buildQueryString(params) : '';

    const response = await this.networkClient.get<BaseResponse<Endpoint[]>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/projects/${encodeURIComponent(projectId)}/endpoints${queryString}`
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
   * GET /api/v1/entities/:entitySlug/projects/:projectId/endpoints/:endpointId
   */
  async getEndpoint(
    entitySlug: string,
    projectId: string,
    endpointId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Endpoint>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<BaseResponse<Endpoint>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/projects/${encodeURIComponent(projectId)}/endpoints/${encodeURIComponent(endpointId)}`
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
   * POST /api/v1/entities/:entitySlug/projects/:projectId/endpoints
   */
  async createEndpoint(
    entitySlug: string,
    projectId: string,
    data: EndpointCreateRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Endpoint>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.post<BaseResponse<Endpoint>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/projects/${encodeURIComponent(projectId)}/endpoints`
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
   * PUT /api/v1/entities/:entitySlug/projects/:projectId/endpoints/:endpointId
   */
  async updateEndpoint(
    entitySlug: string,
    projectId: string,
    endpointId: string,
    data: EndpointUpdateRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Endpoint>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.put<BaseResponse<Endpoint>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/projects/${encodeURIComponent(projectId)}/endpoints/${encodeURIComponent(endpointId)}`
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
   * DELETE /api/v1/entities/:entitySlug/projects/:projectId/endpoints/:endpointId
   */
  async deleteEndpoint(
    entitySlug: string,
    projectId: string,
    endpointId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Endpoint>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.delete<BaseResponse<Endpoint>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/projects/${encodeURIComponent(projectId)}/endpoints/${encodeURIComponent(endpointId)}`
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
  ): Promise<BaseResponse<AnalyticsResponse>> {
    const headers = createAuthHeaders(token);
    const queryString = params ? buildQueryString(params) : '';

    const response = await this.networkClient.get<
      BaseResponse<AnalyticsResponse>
    >(
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
  // USER SETTINGS (Firebase auth required)
  // =============================================================================

  /**
   * Get user settings
   * GET /api/v1/users/:userId/settings
   */
  async getSettings(
    userId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<UserSettings>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<BaseResponse<UserSettings>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/settings`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get settings');
    }

    return response.data;
  }

  /**
   * Update user settings (upsert)
   * PUT /api/v1/users/:userId/settings
   */
  async updateSettings(
    userId: string,
    data: UserSettingsUpdateRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<UserSettings>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.put<BaseResponse<UserSettings>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/users/${encodeURIComponent(userId)}/settings`
      ),
      data,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'update settings');
    }

    return response.data;
  }

  // =============================================================================
  // AI EXECUTION (Requires project API key)
  // =============================================================================

  /**
   * Execute AI endpoint via GET (for simple inputs)
   * GET /api/v1/ai/:organizationPath/:projectName/:endpointName
   */
  async executeAiGet(
    organizationPath: string,
    projectName: string,
    endpointName: string,
    input: unknown,
    apiKey?: string
  ): Promise<BaseResponse<AiExecutionResponse | AiPromptResponse>> {
    const headers = apiKey ? createApiKeyHeaders(apiKey) : createHeaders();
    const queryString = input
      ? buildQueryString({ input: JSON.stringify(input) })
      : '';

    const response = await this.networkClient.get<
      BaseResponse<AiExecutionResponse | AiPromptResponse>
    >(
      buildUrl(
        this.baseUrl,
        `/api/v1/ai/${encodeURIComponent(organizationPath)}/${encodeURIComponent(projectName)}/${encodeURIComponent(endpointName)}${queryString}`
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
   * POST /api/v1/ai/:organizationPath/:projectName/:endpointName
   */
  async executeAiPost(
    organizationPath: string,
    projectName: string,
    endpointName: string,
    input: unknown,
    apiKey?: string
  ): Promise<BaseResponse<AiExecutionResponse | AiPromptResponse>> {
    const headers = apiKey ? createApiKeyHeaders(apiKey) : createHeaders();

    const response = await this.networkClient.post<
      BaseResponse<AiExecutionResponse | AiPromptResponse>
    >(
      buildUrl(
        this.baseUrl,
        `/api/v1/ai/${encodeURIComponent(organizationPath)}/${encodeURIComponent(projectName)}/${encodeURIComponent(endpointName)}`
      ),
      input,
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
    organizationPath: string,
    projectName: string,
    endpointName: string,
    input: unknown,
    method: 'GET' | 'POST' = 'POST',
    apiKey?: string
  ): Promise<BaseResponse<AiExecutionResponse | AiPromptResponse>> {
    if (method === 'GET') {
      return this.executeAiGet(
        organizationPath,
        projectName,
        endpointName,
        input,
        apiKey
      );
    }
    return this.executeAiPost(
      organizationPath,
      projectName,
      endpointName,
      input,
      apiKey
    );
  }

  /**
   * Get AI prompt without executing (for debugging/preview)
   * POST /api/v1/ai/:organizationPath/:projectName/:endpointName/prompt
   */
  async getAiPrompt(
    organizationPath: string,
    projectName: string,
    endpointName: string,
    input: unknown,
    apiKey?: string
  ): Promise<BaseResponse<AiPromptResponse>> {
    const headers = apiKey ? createApiKeyHeaders(apiKey) : createHeaders();

    const response = await this.networkClient.post<
      BaseResponse<AiPromptResponse>
    >(
      buildUrl(
        this.baseUrl,
        `/api/v1/ai/${encodeURIComponent(organizationPath)}/${encodeURIComponent(projectName)}/${encodeURIComponent(endpointName)}/prompt`
      ),
      input,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get AI prompt');
    }

    return response.data;
  }

  // =============================================================================
  // ENTITIES (Firebase auth required)
  // =============================================================================

  /**
   * Get all entities for the current user
   * GET /api/v1/entities
   */
  async getEntities(
    token: FirebaseIdToken
  ): Promise<BaseResponse<EntityWithRole[]>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<
      BaseResponse<EntityWithRole[]>
    >(buildUrl(this.baseUrl, '/api/v1/entities'), { headers });

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get entities');
    }

    return response.data;
  }

  /**
   * Get a single entity by slug
   * GET /api/v1/entities/:entitySlug
   */
  async getEntity(
    entitySlug: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<EntityWithRole>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<BaseResponse<EntityWithRole>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get entity');
    }

    return response.data;
  }

  /**
   * Create a new organization entity
   * POST /api/v1/entities
   */
  async createEntity(
    data: CreateEntityRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Entity>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.post<BaseResponse<Entity>>(
      buildUrl(this.baseUrl, '/api/v1/entities'),
      data,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'create entity');
    }

    return response.data;
  }

  /**
   * Update an entity
   * PUT /api/v1/entities/:entitySlug
   */
  async updateEntity(
    entitySlug: string,
    data: UpdateEntityRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<Entity>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.put<BaseResponse<Entity>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}`
      ),
      data,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'update entity');
    }

    return response.data;
  }

  /**
   * Delete an entity
   * DELETE /api/v1/entities/:entitySlug
   */
  async deleteEntity(
    entitySlug: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<void>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.delete<BaseResponse<void>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'delete entity');
    }

    return response.data;
  }

  // =============================================================================
  // ENTITY MEMBERS (Firebase auth required)
  // =============================================================================

  /**
   * Get all members of an entity
   * GET /api/v1/entities/:entitySlug/members
   */
  async getEntityMembers(
    entitySlug: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<EntityMember[]>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<
      BaseResponse<EntityMember[]>
    >(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/members`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get entity members');
    }

    return response.data;
  }

  /**
   * Update a member's role
   * PUT /api/v1/entities/:entitySlug/members/:memberId
   */
  async updateEntityMemberRole(
    entitySlug: string,
    memberId: string,
    role: EntityRole,
    token: FirebaseIdToken
  ): Promise<BaseResponse<EntityMember>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.put<BaseResponse<EntityMember>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/members/${encodeURIComponent(memberId)}`
      ),
      { role },
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'update entity member role');
    }

    return response.data;
  }

  /**
   * Remove a member from an entity
   * DELETE /api/v1/entities/:entitySlug/members/:memberId
   */
  async removeEntityMember(
    entitySlug: string,
    memberId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<void>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.delete<BaseResponse<void>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/members/${encodeURIComponent(memberId)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'remove entity member');
    }

    return response.data;
  }

  // =============================================================================
  // ENTITY INVITATIONS (Firebase auth required)
  // =============================================================================

  /**
   * Get all invitations for an entity
   * GET /api/v1/entities/:entitySlug/invitations
   */
  async getEntityInvitations(
    entitySlug: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<EntityInvitation[]>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<
      BaseResponse<EntityInvitation[]>
    >(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/invitations`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get entity invitations');
    }

    return response.data;
  }

  /**
   * Create an invitation to join an entity
   * POST /api/v1/entities/:entitySlug/invitations
   */
  async createEntityInvitation(
    entitySlug: string,
    data: InviteMemberRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<EntityInvitation>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.post<
      BaseResponse<EntityInvitation>
    >(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/invitations`
      ),
      data,
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'create entity invitation');
    }

    return response.data;
  }

  /**
   * Cancel an invitation
   * DELETE /api/v1/entities/:entitySlug/invitations/:invitationId
   */
  async cancelEntityInvitation(
    entitySlug: string,
    invitationId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<void>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.delete<BaseResponse<void>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/entities/${encodeURIComponent(entitySlug)}/invitations/${encodeURIComponent(invitationId)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'cancel entity invitation');
    }

    return response.data;
  }

  /**
   * Get pending invitations for the current user
   * GET /api/v1/invitations
   */
  async getMyInvitations(
    token: FirebaseIdToken
  ): Promise<BaseResponse<EntityInvitation[]>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<
      BaseResponse<EntityInvitation[]>
    >(buildUrl(this.baseUrl, '/api/v1/invitations'), { headers });

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get my invitations');
    }

    return response.data;
  }

  /**
   * Accept an invitation
   * POST /api/v1/invitations/:token/accept
   */
  async acceptInvitation(
    invitationToken: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<void>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.post<BaseResponse<void>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/invitations/${encodeURIComponent(invitationToken)}/accept`
      ),
      {},
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'accept invitation');
    }

    return response.data;
  }

  /**
   * Decline an invitation
   * POST /api/v1/invitations/:token/decline
   */
  async declineInvitation(
    invitationToken: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<void>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.post<BaseResponse<void>>(
      buildUrl(
        this.baseUrl,
        `/api/v1/invitations/${encodeURIComponent(invitationToken)}/decline`
      ),
      {},
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'decline invitation');
    }

    return response.data;
  }

  // =============================================================================
  // RATE LIMITS (Firebase auth required)
  // =============================================================================

  /**
   * Get rate limit configuration and current usage
   * GET /api/v1/ratelimits
   */
  async getRateLimitsConfig(
    token: FirebaseIdToken
  ): Promise<BaseResponse<RateLimitsConfigData>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<
      BaseResponse<RateLimitsConfigData>
    >(buildUrl(this.baseUrl, '/api/v1/ratelimits'), { headers });

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get rate limits config');
    }

    return response.data;
  }

  /**
   * Get rate limit usage history for a specific period type
   * GET /api/v1/ratelimits/history/:periodType
   */
  async getRateLimitHistory(
    periodType: RateLimitPeriodType | 'hour' | 'day' | 'month',
    token: FirebaseIdToken
  ): Promise<BaseResponse<RateLimitHistoryData>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<
      BaseResponse<RateLimitHistoryData>
    >(
      buildUrl(
        this.baseUrl,
        `/api/v1/ratelimits/history/${encodeURIComponent(periodType)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get rate limit history');
    }

    return response.data;
  }
}
