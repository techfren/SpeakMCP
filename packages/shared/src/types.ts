/**
 * Message source - identifies where a message/conversation originated
 */
export type MessageSource = 'native' | 'augment' | 'claude-code' | 'mobile' | 'api';

/**
 * Session metadata - for tracking session origins and lazy-loaded sessions
 */
export interface SessionMetadata {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  source: MessageSource;
  workspacePath?: string;
  messageCount?: number;
  preview?: string;
  filePath?: string;
}

/**
 * External session message from Augment, Claude Code, etc.
 */
export interface ExternalSessionMessage {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  timestamp?: number;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
}

/**
 * Full external session data (loaded on demand)
 */
export interface ExternalSession extends SessionMetadata {
  messages: ExternalSessionMessage[];
  agentMetadata?: Record<string, unknown>;
}

/**
 * Unified conversation history item - combines native and external sessions
 */
export interface UnifiedConversationHistoryItem {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  source: MessageSource;
  workspacePath?: string;
  messageCount?: number;
  preview?: string;
  filePath?: string;
}

/**
 * Options for continuing an external session
 */
export interface ContinueSessionOptions {
  session: SessionMetadata;
  workspacePath?: string;
  initialMessage?: string;
}

/**
 * Result of continuing a session
 */
export interface ContinueSessionResult {
  success: boolean;
  sessionId?: string;
  conversationId?: string;
  sessionTitle?: string;
  error?: string;
}

