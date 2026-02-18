import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { QUERY_KEYS } from '../types';

// Stable empty arrays to prevent unnecessary re-renders
const EMPTY_ENTITIES: EntityWithRole[] = [];
const EMPTY_MEMBERS: EntityMember[] = [];
const EMPTY_INVITATIONS: EntityInvitation[] = [];

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
  refetchEntities: () => void;
  getEntity: (entitySlug: string) => Promise<BaseResponse<EntityWithRole>>;
  createEntity: (data: CreateEntityRequest) => Promise<BaseResponse<Entity>>;
  updateEntity: (
    entitySlug: string,
    data: UpdateEntityRequest
  ) => Promise<BaseResponse<Entity>>;
  deleteEntity: (entitySlug: string) => Promise<BaseResponse<void>>;

  // Member operations
  refetchMembers: () => void;
  updateMemberRole: (
    memberId: string,
    role: EntityRole
  ) => Promise<BaseResponse<EntityMember>>;
  removeMember: (memberId: string) => Promise<BaseResponse<void>>;

  // Invitation operations
  refetchInvitations: () => void;
  createInvitation: (
    data: InviteMemberRequest
  ) => Promise<BaseResponse<EntityInvitation>>;
  cancelInvitation: (invitationId: string) => Promise<BaseResponse<void>>;

  // My invitations operations
  refetchMyInvitations: () => void;
  acceptInvitation: (invitationToken: string) => Promise<BaseResponse<void>>;
  declineInvitation: (invitationToken: string) => Promise<BaseResponse<void>>;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing entities, members, and invitations
 * Uses TanStack Query for caching with automatic refresh after mutations
 */
export const useEntities = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: FirebaseIdToken | null,
  entitySlug: string | null,
  options?: {
    testMode?: boolean;
    enabled?: boolean;
  }
): UseEntitiesReturn => {
  const testMode = options?.testMode ?? false;
  const enabled = (options?.enabled ?? true) && !!token;
  const entityEnabled = enabled && !!entitySlug;

  const client = useMemo(
    () => new ShapeshyftClient({ baseUrl, networkClient, testMode }),
    [baseUrl, networkClient, testMode]
  );

  const queryClient = useQueryClient();

  // =============================================================================
  // Queries
  // =============================================================================

  const {
    data: entitiesData,
    isLoading: entitiesLoading,
    error: entitiesError,
    refetch: refetchEntities,
  } = useQuery({
    queryKey: QUERY_KEYS.entities(),
    queryFn: async () => {
      const response = await client.getEntities(token!);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch entities');
      }
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const {
    data: membersData,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: QUERY_KEYS.entityMembers(entitySlug ?? ''),
    queryFn: async () => {
      const response = await client.getEntityMembers(entitySlug!, token!);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch members');
      }
      return response.data;
    },
    enabled: entityEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const {
    data: invitationsData,
    isLoading: invitationsLoading,
    refetch: refetchInvitations,
  } = useQuery({
    queryKey: QUERY_KEYS.entityInvitations(entitySlug ?? ''),
    queryFn: async () => {
      const response = await client.getEntityInvitations(entitySlug!, token!);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch invitations');
      }
      return response.data;
    },
    enabled: entityEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const {
    data: myInvitationsData,
    isLoading: myInvitationsLoading,
    refetch: refetchMyInvitations,
  } = useQuery({
    queryKey: QUERY_KEYS.myInvitations(),
    queryFn: async () => {
      const response = await client.getMyInvitations(token!);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch my invitations');
      }
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // =============================================================================
  // Entity Mutations
  // =============================================================================

  const createEntityMutation = useMutation({
    mutationFn: async (data: CreateEntityRequest) => {
      return client.createEntity(data, token!);
    },
    onSuccess: response => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entities() });
      }
    },
  });

  const updateEntityMutation = useMutation({
    mutationFn: async ({
      slug,
      data,
    }: {
      slug: string;
      data: UpdateEntityRequest;
    }) => {
      return client.updateEntity(slug, data, token!);
    },
    onSuccess: response => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entities() });
      }
    },
  });

  const deleteEntityMutation = useMutation({
    mutationFn: async (slug: string) => {
      return client.deleteEntity(slug, token!);
    },
    onSuccess: response => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entities() });
      }
    },
  });

  // =============================================================================
  // Member Mutations
  // =============================================================================

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: EntityRole;
    }) => {
      return client.updateEntityMemberRole(entitySlug!, memberId, role, token!);
    },
    onSuccess: response => {
      if (response.success && entitySlug) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.entityMembers(entitySlug),
        });
      }
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return client.removeEntityMember(entitySlug!, memberId, token!);
    },
    onSuccess: response => {
      if (response.success && entitySlug) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.entityMembers(entitySlug),
        });
      }
    },
  });

  // =============================================================================
  // Invitation Mutations
  // =============================================================================

  const createInvitationMutation = useMutation({
    mutationFn: async (data: InviteMemberRequest) => {
      return client.createEntityInvitation(entitySlug!, data, token!);
    },
    onSuccess: response => {
      if (response.success && entitySlug) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.entityInvitations(entitySlug),
        });
      }
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return client.cancelEntityInvitation(entitySlug!, invitationId, token!);
    },
    onSuccess: response => {
      if (response.success && entitySlug) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.entityInvitations(entitySlug),
        });
      }
    },
  });

  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationToken: string) => {
      return client.acceptInvitation(invitationToken, token!);
    },
    onSuccess: response => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myInvitations() });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entities() });
      }
    },
  });

  const declineInvitationMutation = useMutation({
    mutationFn: async (invitationToken: string) => {
      return client.declineInvitation(invitationToken, token!);
    },
    onSuccess: response => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myInvitations() });
      }
    },
  });

  // =============================================================================
  // Wrapped Mutation Functions
  // =============================================================================

  const getEntity = useCallback(
    async (slug: string): Promise<BaseResponse<EntityWithRole>> => {
      try {
        return await client.getEntity(slug, token!);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get entity';
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      }
    },
    [client, token]
  );

  const createEntity = useCallback(
    (data: CreateEntityRequest) => createEntityMutation.mutateAsync(data),
    [createEntityMutation]
  );

  const updateEntity = useCallback(
    (slug: string, data: UpdateEntityRequest) =>
      updateEntityMutation.mutateAsync({ slug, data }),
    [updateEntityMutation]
  );

  const deleteEntity = useCallback(
    (slug: string) => deleteEntityMutation.mutateAsync(slug),
    [deleteEntityMutation]
  );

  const updateMemberRole = useCallback(
    (memberId: string, role: EntityRole) =>
      updateMemberRoleMutation.mutateAsync({ memberId, role }),
    [updateMemberRoleMutation]
  );

  const removeMember = useCallback(
    (memberId: string) => removeMemberMutation.mutateAsync(memberId),
    [removeMemberMutation]
  );

  const createInvitation = useCallback(
    (data: InviteMemberRequest) => createInvitationMutation.mutateAsync(data),
    [createInvitationMutation]
  );

  const cancelInvitation = useCallback(
    (invitationId: string) =>
      cancelInvitationMutation.mutateAsync(invitationId),
    [cancelInvitationMutation]
  );

  const acceptInvitation = useCallback(
    (invitationToken: string) =>
      acceptInvitationMutation.mutateAsync(invitationToken),
    [acceptInvitationMutation]
  );

  const declineInvitation = useCallback(
    (invitationToken: string) =>
      declineInvitationMutation.mutateAsync(invitationToken),
    [declineInvitationMutation]
  );

  // =============================================================================
  // Error and Loading State
  // =============================================================================

  const isLoading =
    entitiesLoading ||
    membersLoading ||
    invitationsLoading ||
    myInvitationsLoading ||
    createEntityMutation.isPending ||
    updateEntityMutation.isPending ||
    deleteEntityMutation.isPending ||
    updateMemberRoleMutation.isPending ||
    removeMemberMutation.isPending ||
    createInvitationMutation.isPending ||
    cancelInvitationMutation.isPending ||
    acceptInvitationMutation.isPending ||
    declineInvitationMutation.isPending;

  const queryError = entitiesError;
  const mutationError =
    createEntityMutation.error ??
    updateEntityMutation.error ??
    deleteEntityMutation.error ??
    updateMemberRoleMutation.error ??
    removeMemberMutation.error ??
    createInvitationMutation.error ??
    cancelInvitationMutation.error ??
    acceptInvitationMutation.error ??
    declineInvitationMutation.error;

  const error =
    queryError instanceof Error
      ? queryError.message
      : mutationError instanceof Error
        ? mutationError.message
        : null;

  const clearError = useCallback(() => {
    createEntityMutation.reset();
    updateEntityMutation.reset();
    deleteEntityMutation.reset();
    updateMemberRoleMutation.reset();
    removeMemberMutation.reset();
    createInvitationMutation.reset();
    cancelInvitationMutation.reset();
    acceptInvitationMutation.reset();
    declineInvitationMutation.reset();
  }, [
    createEntityMutation,
    updateEntityMutation,
    deleteEntityMutation,
    updateMemberRoleMutation,
    removeMemberMutation,
    createInvitationMutation,
    cancelInvitationMutation,
    acceptInvitationMutation,
    declineInvitationMutation,
  ]);

  const reset = useCallback(() => {
    queryClient.removeQueries({ queryKey: QUERY_KEYS.entities() });
    queryClient.removeQueries({ queryKey: QUERY_KEYS.myInvitations() });
    if (entitySlug) {
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.entityMembers(entitySlug),
      });
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.entityInvitations(entitySlug),
      });
    }
    clearError();
  }, [queryClient, entitySlug, clearError]);

  // currentEntity is derived from the entities list -- not a separate query
  const currentEntity = useMemo(
    () =>
      entitySlug
        ? ((entitiesData ?? []).find(e => e.entitySlug === entitySlug) ?? null)
        : null,
    [entitiesData, entitySlug]
  );

  return useMemo(
    () => ({
      entities: entitiesData ?? EMPTY_ENTITIES,
      currentEntity,
      members: membersData ?? EMPTY_MEMBERS,
      invitations: invitationsData ?? EMPTY_INVITATIONS,
      myInvitations: myInvitationsData ?? EMPTY_INVITATIONS,
      isLoading,
      error,
      refetchEntities,
      getEntity,
      createEntity,
      updateEntity,
      deleteEntity,
      refetchMembers,
      updateMemberRole,
      removeMember,
      refetchInvitations,
      createInvitation,
      cancelInvitation,
      refetchMyInvitations,
      acceptInvitation,
      declineInvitation,
      clearError,
      reset,
    }),
    [
      entitiesData,
      currentEntity,
      membersData,
      invitationsData,
      myInvitationsData,
      isLoading,
      error,
      refetchEntities,
      getEntity,
      createEntity,
      updateEntity,
      deleteEntity,
      refetchMembers,
      updateMemberRole,
      removeMember,
      refetchInvitations,
      createInvitation,
      cancelInvitation,
      refetchMyInvitations,
      acceptInvitation,
      declineInvitation,
      clearError,
      reset,
    ]
  );
};
