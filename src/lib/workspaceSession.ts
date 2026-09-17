export interface WorkspaceSessionUser {
  uid: string;
  isAnonymous: boolean;
}

export const AUTH_PENDING_WORKSPACE_SESSION = 'auth-pending';

export function getWorkspaceSessionKey(user: WorkspaceSessionUser | null): string {
  if (!user) return 'signed-out';
  return `${user.isAnonymous ? 'guest' : 'user'}:${user.uid}`;
}

export function isWorkspaceSessionCurrent(
  sourceSessionKey: string,
  currentSessionKey: string,
): boolean {
  return sourceSessionKey === currentSessionKey;
}

export function canPersistAuthenticatedWorkspace(
  user: WorkspaceSessionUser | null,
  workspaceOwnerUid: string | null,
  sourceSessionKey: string,
  currentSessionKey: string,
): boolean {
  return Boolean(
    user &&
      !user.isAnonymous &&
      workspaceOwnerUid === user.uid &&
      sourceSessionKey === currentSessionKey &&
      currentSessionKey === getWorkspaceSessionKey(user),
  );
}

export function shouldApplyWorkspaceLoad(
  loadChangeId: number,
  currentChangeId: number,
  loadingUid: string,
  currentSessionKey: string,
): boolean {
  return (
    loadChangeId === currentChangeId &&
    currentSessionKey === `user:${loadingUid}`
  );
}
