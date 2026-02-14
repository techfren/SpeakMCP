/**
 * External Session Service
 *
 * Aggregates sessions from multiple external providers (Augment, Claude Code)
 * and provides unified access for session continuation.
 */

import type {
  MessageSource,
  SessionMetadata,
  ExternalSession,
  ExternalSessionMessage,
  UnifiedConversationHistoryItem,
  ContinueSessionOptions,
  ContinueSessionResult,
} from './types';
import type { SessionData } from './session-store';
import {
  isAugmentAvailable,
  listAugmentSessions,
  loadAugmentSession,
} from './augment-provider';
import {
  isClaudeCodeAvailable,
  listClaudeCodeSessions,
  loadClaudeCodeSession,
} from './claude-code-provider';

export interface ExternalSessionProviderInfo {
  source: MessageSource;
  displayName: string;
  available: boolean;
}

export interface ExternalSessionMetadata extends SessionMetadata {
  filePath: string;
}

/**
 * Get information about available external session providers
 */
export async function getExternalProviders(): Promise<ExternalSessionProviderInfo[]> {
  const [augmentAvailable, claudeCodeAvailable] = await Promise.all([
    isAugmentAvailable(),
    isClaudeCodeAvailable(),
  ]);

  return [
    {
      source: 'augment',
      displayName: 'Augment',
      available: augmentAvailable,
    },
    {
      source: 'claude-code',
      displayName: 'Claude Code',
      available: claudeCodeAvailable,
    },
  ];
}

/**
 * List external sessions from all available providers
 */
export async function listExternalSessions(
  limit: number = 100
): Promise<ExternalSessionMetadata[]> {
  const [augmentSessions, claudeCodeSessions] = await Promise.all([
    listAugmentSessions(limit),
    listClaudeCodeSessions(limit),
  ]);

  // Merge and sort by updatedAt
  const allSessions: ExternalSessionMetadata[] = [
    ...augmentSessions,
    ...claudeCodeSessions,
  ];

  return allSessions.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
}

/**
 * Load full external session data
 */
export async function loadExternalSession(
  sessionId: string,
  source: MessageSource
): Promise<(ExternalSession & { source: MessageSource }) | null> {
  switch (source) {
    case 'augment':
      return loadAugmentSession(sessionId);
    case 'claude-code':
      // Claude Code requires file path - for now, return null
      // In a full implementation, we'd cache file paths from listExternalSessions
      console.warn('[ExternalSessionService] Claude Code session loading requires file path');
      return null;
    default:
      console.warn(`[ExternalSessionService] Unknown source: ${source}`);
      return null;
  }
}

/**
 * Get sessions grouped by source
 */
export async function getSessionsBySource(): Promise<Record<MessageSource, ExternalSessionMetadata[]>> {
  const [augmentSessions, claudeCodeSessions] = await Promise.all([
    listAugmentSessions(1000),
    listClaudeCodeSessions(1000),
  ]);

  return {
    augment: augmentSessions,
    'claude-code': claudeCodeSessions,
    native: [],
    mobile: [],
    api: [],
  };
}

/**
 * Get unified conversation history including external sessions
 * Merges native sessions with external sessions for unified display
 */
export async function getUnifiedConversationHistory(
  nativeConversations: Array<{
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messageCount?: number;
    preview?: string;
  }>,
  limit: number = 100
): Promise<UnifiedConversationHistoryItem[]> {
  // Get external sessions
  const externalSessions = await listExternalSessions(limit);

  // Convert native conversations to unified format
  const unifiedNative: UnifiedConversationHistoryItem[] = nativeConversations.map((conv) => ({
    id: conv.id,
    title: conv.title,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    source: 'native' as const,
    messageCount: conv.messageCount,
    preview: conv.preview,
  }));

  // Convert external sessions to unified format
  const unifiedExternal: UnifiedConversationHistoryItem[] = externalSessions.map((session) => ({
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    source: session.source,
    workspacePath: session.workspacePath,
    messageCount: session.messageCount,
    preview: session.preview,
    filePath: session.filePath,
  }));

  // Merge and sort by updatedAt
  const allSessions: UnifiedConversationHistoryItem[] = [
    ...unifiedNative,
    ...unifiedExternal,
  ];

  return allSessions
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
}

/**
 * Continue an external session
 */
export async function continueExternalSession(
  options: ContinueSessionOptions
): Promise<ContinueSessionResult> {
  const { session, workspacePath, initialMessage } = options;

  console.log(`[ExternalSessionService] Continuing session ${session.id} from ${session.source}`);

  // This is a placeholder - actual continuation would integrate with the agent
  return {
    success: true,
    sessionId: `continued-${session.id}`,
    conversationId: session.id,
    sessionTitle: session.title,
  };
}

/**
 * Convert external session messages to conversation history format
 */
export function externalMessagesToConversationHistory(
  messages: ExternalSessionMessage[]
): Array<{ role: string; content: string; timestamp?: number }> {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
  }));
}
