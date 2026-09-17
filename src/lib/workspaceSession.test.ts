import { describe, expect, it } from 'vitest';
import {
  AUTH_PENDING_WORKSPACE_SESSION,
  canPersistAuthenticatedWorkspace,
  getWorkspaceSessionKey,
  isWorkspaceSessionCurrent,
  shouldApplyWorkspaceLoad,
} from './workspaceSession';

const userA = { uid: 'user-a', isAnonymous: false };
const userB = { uid: 'user-b', isAnonymous: false };
const guest = { uid: 'guest-1', isAnonymous: true };

describe('workspace session identity', () => {
  it('creates distinct boundaries for authenticated, guest, signed-out, and pending sessions', () => {
    expect(getWorkspaceSessionKey(userA)).toBe('user:user-a');
    expect(getWorkspaceSessionKey(userB)).toBe('user:user-b');
    expect(getWorkspaceSessionKey(guest)).toBe('guest:guest-1');
    expect(getWorkspaceSessionKey(null)).toBe('signed-out');
    expect(AUTH_PENDING_WORKSPACE_SESSION).not.toBe(getWorkspaceSessionKey(userA));
  });

  it('invalidates a stale User A action as soon as User B becomes current', () => {
    const sourceSession = getWorkspaceSessionKey(userA);
    const currentSession = getWorkspaceSessionKey(userB);

    expect(isWorkspaceSessionCurrent(sourceSession, currentSession)).toBe(false);
    expect(
      canPersistAuthenticatedWorkspace(
        userB,
        userB.uid,
        sourceSession,
        currentSession,
      ),
    ).toBe(false);
  });

  it('blocks the exact stale Vault save contamination path', () => {
    const staleVaultSourceSession = getWorkspaceSessionKey(userA);
    const currentSession = getWorkspaceSessionKey(userB);

    // User B is fully loaded, but the attempted save originated from the stale User A Vault.
    expect(
      canPersistAuthenticatedWorkspace(
        userB,
        userB.uid,
        staleVaultSourceSession,
        currentSession,
      ),
    ).toBe(false);

    // Only a callback originating from B's current workspace may persist to B.
    expect(
      canPersistAuthenticatedWorkspace(
        userB,
        userB.uid,
        currentSession,
        currentSession,
      ),
    ).toBe(true);
  });

  it('never persists preview or anonymous workspace state', () => {
    expect(
      canPersistAuthenticatedWorkspace(
        null,
        null,
        'signed-out',
        'signed-out',
      ),
    ).toBe(false);

    const guestSession = getWorkspaceSessionKey(guest);
    expect(
      canPersistAuthenticatedWorkspace(
        guest,
        null,
        guestSession,
        guestSession,
      ),
    ).toBe(false);
  });

  it('requires the loaded workspace owner to match the authenticated UID', () => {
    const session = getWorkspaceSessionKey(userB);

    expect(
      canPersistAuthenticatedWorkspace(userB, userA.uid, session, session),
    ).toBe(false);
    expect(
      canPersistAuthenticatedWorkspace(userB, userB.uid, session, session),
    ).toBe(true);
  });
});

describe('async workspace load acceptance', () => {
  it('rejects a stale User A load after a rapid A -> sign out -> B transition', () => {
    const currentChangeId = 3;
    const currentSession = getWorkspaceSessionKey(userB);

    expect(
      shouldApplyWorkspaceLoad(1, currentChangeId, userA.uid, currentSession),
    ).toBe(false);
    expect(
      shouldApplyWorkspaceLoad(3, currentChangeId, userB.uid, currentSession),
    ).toBe(true);
  });

  it('rejects a load whose UID does not match the current session even when the change id matches', () => {
    const currentSession = getWorkspaceSessionKey(userB);
    expect(shouldApplyWorkspaceLoad(4, 4, userA.uid, currentSession)).toBe(false);
  });
});
