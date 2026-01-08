import { useCallback, useMemo, useState } from 'react';
import type {
  BaseResponse,
  CreateEntityRequest,
  Entity,
  EntityInvitation,
  EntityMember,
  EntityRole,
  EntityWithRole,
  InviteMemberRequest,
  NetworkClient,
  Optional,
  UpdateEntityRequest,
} from '@sudobility/types';
import type { FirebaseIdToken } from '../types';
import { ShapeshyftClient } from '../network/ShapeshyftClient';

/**
 * Return type for useEntities hook
 */
export interface UseEntitiesReturn {
  entities: EntityWithRole[];
  currentEntity: Optional<EntityWithRole>;
  members: EntityMember[];
  invitations: EntityInvitation[];
  myInvitations: EntityInvitation[];
  isLoading: boolean;
  error: Optional<string>;

  // Entity operations
  refreshEntities: (token: FirebaseIdToken) => Promise<void>;
  getEntity: (
    entitySlug: string,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<EntityWithRole>>;
  createEntity: (
    data: CreateEntityRequest,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<Entity>>;
  updateEntity: (
    entitySlug: string,
    data: UpdateEntityRequest,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<Entity>>;
  deleteEntity: (
    entitySlug: string,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<void>>;

  // Member operations
  refreshMembers: (entitySlug: string, token: FirebaseIdToken) => Promise<void>;
  updateMemberRole: (
    entitySlug: string,
    memberId: string,
    role: EntityRole,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<EntityMember>>;
  removeMember: (
    entitySlug: string,
    memberId: string,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<void>>;

  // Invitation operations
  refreshInvitations: (
    entitySlug: string,
    token: FirebaseIdToken
  ) => Promise<void>;
  createInvitation: (
    entitySlug: string,
    data: InviteMemberRequest,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<EntityInvitation>>;
  cancelInvitation: (
    entitySlug: string,
    invitationId: string,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<void>>;

  // My invitations operations
  refreshMyInvitations: (token: FirebaseIdToken) => Promise<void>;
  acceptInvitation: (
    invitationToken: string,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<void>>;
  declineInvitation: (
    invitationToken: string,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<void>>;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing entities, members, and invitations
 * Provides CRUD operations with automatic refresh after mutations
 */
export const useEntities = (
  networkClient: NetworkClient,
  baseUrl: string,
  testMode: boolean = false
): UseEntitiesReturn => {
  const client = useMemo(
    () => new ShapeshyftClient({ baseUrl, networkClient, testMode }),
    [baseUrl, networkClient, testMode]
  );

  const [entities, setEntities] = useState<EntityWithRole[]>([]);
  const [currentEntity, setCurrentEntity] =
    useState<Optional<EntityWithRole>>(null);
  const [members, setMembers] = useState<EntityMember[]>([]);
  const [invitations, setInvitations] = useState<EntityInvitation[]>([]);
  const [myInvitations, setMyInvitations] = useState<EntityInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  // =============================================================================
  // Entity Operations
  // =============================================================================

  const refreshEntities = useCallback(
    async (token: FirebaseIdToken): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getEntities(token);
        if (response.success && response.data) {
          setEntities(response.data);
        } else {
          setError(response.error || 'Failed to fetch entities');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch entities';
        setError(errorMessage);
        console.error(
          '[useEntities] refreshEntities error:',
          errorMessage,
          err
        );
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const getEntity = useCallback(
    async (
      entitySlug: string,
      token: FirebaseIdToken
    ): Promise<BaseResponse<EntityWithRole>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getEntity(entitySlug, token);
        if (response.success && response.data) {
          setCurrentEntity(response.data);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get entity';
        setError(errorMessage);
        console.error('[useEntities] getEntity error:', errorMessage, err);
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const createEntity = useCallback(
    async (
      data: CreateEntityRequest,
      token: FirebaseIdToken
    ): Promise<BaseResponse<Entity>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.createEntity(data, token);
        if (response.success) {
          await refreshEntities(token);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create entity';
        setError(errorMessage);
        console.error('[useEntities] createEntity error:', errorMessage, err);
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [client, refreshEntities]
  );

  const updateEntity = useCallback(
    async (
      entitySlug: string,
      data: UpdateEntityRequest,
      token: FirebaseIdToken
    ): Promise<BaseResponse<Entity>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.updateEntity(entitySlug, data, token);
        if (response.success) {
          await refreshEntities(token);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update entity';
        setError(errorMessage);
        console.error('[useEntities] updateEntity error:', errorMessage, err);
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [client, refreshEntities]
  );

  const deleteEntity = useCallback(
    async (
      entitySlug: string,
      token: FirebaseIdToken
    ): Promise<BaseResponse<void>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.deleteEntity(entitySlug, token);
        if (response.success) {
          await refreshEntities(token);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete entity';
        setError(errorMessage);
        console.error('[useEntities] deleteEntity error:', errorMessage, err);
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [client, refreshEntities]
  );

  // =============================================================================
  // Member Operations
  // =============================================================================

  const refreshMembers = useCallback(
    async (entitySlug: string, token: FirebaseIdToken): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getEntityMembers(entitySlug, token);
        if (response.success && response.data) {
          setMembers(response.data);
        } else {
          setError(response.error || 'Failed to fetch members');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch members';
        setError(errorMessage);
        console.error('[useEntities] refreshMembers error:', errorMessage, err);
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const updateMemberRole = useCallback(
    async (
      entitySlug: string,
      memberId: string,
      role: EntityRole,
      token: FirebaseIdToken
    ): Promise<BaseResponse<EntityMember>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.updateEntityMemberRole(
          entitySlug,
          memberId,
          role,
          token
        );
        if (response.success) {
          await refreshMembers(entitySlug, token);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update member role';
        setError(errorMessage);
        console.error(
          '[useEntities] updateMemberRole error:',
          errorMessage,
          err
        );
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [client, refreshMembers]
  );

  const removeMember = useCallback(
    async (
      entitySlug: string,
      memberId: string,
      token: FirebaseIdToken
    ): Promise<BaseResponse<void>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.removeEntityMember(
          entitySlug,
          memberId,
          token
        );
        if (response.success) {
          await refreshMembers(entitySlug, token);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to remove member';
        setError(errorMessage);
        console.error('[useEntities] removeMember error:', errorMessage, err);
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [client, refreshMembers]
  );

  // =============================================================================
  // Invitation Operations
  // =============================================================================

  const refreshInvitations = useCallback(
    async (entitySlug: string, token: FirebaseIdToken): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getEntityInvitations(entitySlug, token);
        if (response.success && response.data) {
          setInvitations(response.data);
        } else {
          setError(response.error || 'Failed to fetch invitations');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch invitations';
        setError(errorMessage);
        console.error(
          '[useEntities] refreshInvitations error:',
          errorMessage,
          err
        );
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const createInvitation = useCallback(
    async (
      entitySlug: string,
      data: InviteMemberRequest,
      token: FirebaseIdToken
    ): Promise<BaseResponse<EntityInvitation>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.createEntityInvitation(
          entitySlug,
          data,
          token
        );
        if (response.success) {
          await refreshInvitations(entitySlug, token);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create invitation';
        setError(errorMessage);
        console.error(
          '[useEntities] createInvitation error:',
          errorMessage,
          err
        );
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [client, refreshInvitations]
  );

  const cancelInvitation = useCallback(
    async (
      entitySlug: string,
      invitationId: string,
      token: FirebaseIdToken
    ): Promise<BaseResponse<void>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.cancelEntityInvitation(
          entitySlug,
          invitationId,
          token
        );
        if (response.success) {
          await refreshInvitations(entitySlug, token);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to cancel invitation';
        setError(errorMessage);
        console.error(
          '[useEntities] cancelInvitation error:',
          errorMessage,
          err
        );
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [client, refreshInvitations]
  );

  // =============================================================================
  // My Invitations Operations
  // =============================================================================

  const refreshMyInvitations = useCallback(
    async (token: FirebaseIdToken): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getMyInvitations(token);
        if (response.success && response.data) {
          setMyInvitations(response.data);
        } else {
          setError(response.error || 'Failed to fetch my invitations');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch my invitations';
        setError(errorMessage);
        console.error(
          '[useEntities] refreshMyInvitations error:',
          errorMessage,
          err
        );
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const acceptInvitation = useCallback(
    async (
      invitationToken: string,
      token: FirebaseIdToken
    ): Promise<BaseResponse<void>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.acceptInvitation(invitationToken, token);
        if (response.success) {
          await refreshMyInvitations(token);
          await refreshEntities(token);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to accept invitation';
        setError(errorMessage);
        console.error(
          '[useEntities] acceptInvitation error:',
          errorMessage,
          err
        );
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [client, refreshMyInvitations, refreshEntities]
  );

  const declineInvitation = useCallback(
    async (
      invitationToken: string,
      token: FirebaseIdToken
    ): Promise<BaseResponse<void>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.declineInvitation(invitationToken, token);
        if (response.success) {
          await refreshMyInvitations(token);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to decline invitation';
        setError(errorMessage);
        console.error(
          '[useEntities] declineInvitation error:',
          errorMessage,
          err
        );
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [client, refreshMyInvitations]
  );

  // =============================================================================
  // Utility Operations
  // =============================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setEntities([]);
    setCurrentEntity(null);
    setMembers([]);
    setInvitations([]);
    setMyInvitations([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return useMemo(
    () => ({
      entities,
      currentEntity,
      members,
      invitations,
      myInvitations,
      isLoading,
      error,
      refreshEntities,
      getEntity,
      createEntity,
      updateEntity,
      deleteEntity,
      refreshMembers,
      updateMemberRole,
      removeMember,
      refreshInvitations,
      createInvitation,
      cancelInvitation,
      refreshMyInvitations,
      acceptInvitation,
      declineInvitation,
      clearError,
      reset,
    }),
    [
      entities,
      currentEntity,
      members,
      invitations,
      myInvitations,
      isLoading,
      error,
      refreshEntities,
      getEntity,
      createEntity,
      updateEntity,
      deleteEntity,
      refreshMembers,
      updateMemberRole,
      removeMember,
      refreshInvitations,
      createInvitation,
      cancelInvitation,
      refreshMyInvitations,
      acceptInvitation,
      declineInvitation,
      clearError,
      reset,
    ]
  );
};
