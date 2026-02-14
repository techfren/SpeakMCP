/**
 * Chat History Merger
 *
 * Provides utilities for merging conversation histories from multiple agents
 * and sources into a unified format for external session continuation.
 */

import type { MessageSource, ExternalSessionMessage, SessionMessage } from './types';
import { createSessionMessage, type SessionData } from './session-store';

/**
 * Merge strategy for handling duplicate messages
 */
export type MergeStrategy = 'keep-first' | 'keep-last' | 'combine' | 'skip';

/**
 * Options for merging conversation histories
 */
export interface MergeHistoryOptions {
  strategy?: MergeStrategy;
  dedupeByContent?: boolean;
  preserveOrder?: boolean;
  maxMessages?: number;
}

/**
 * Result of a history merge operation
 */
export interface MergedHistoryResult {
  messages: SessionMessage[];
  sourceCounts: Record<MessageSource, number>;
  totalMessages: number;
  duplicatesRemoved: number;
}

/**
 * Content similarity threshold for duplicate detection (0-1)
 */
const SIMILARITY_THRESHOLD = 0.85;

/**
 * Simple content similarity check
 */
function contentSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  
  const aWords = a.toLowerCase().split(/\s+/);
  const bWords = b.toLowerCase().split(/\s+/);
  
  const aSet = new Set(aWords);
  const bSet = new Set(bWords);
  
  const intersection = [...aSet].filter(w => bSet.has(w)).length;
  const union = new Set([...aWords, ...bWords]).size;
  
  return union > 0 ? intersection / union : 0;
}

/**
 * Check if two messages are duplicates
 */
function isDuplicate(msg1: SessionMessage, msg2: SessionMessage): boolean {
  if (msg1.role !== msg2.role) return false;
  return contentSimilarity(msg1.content, msg2.content) >= SIMILARITY_THRESHOLD;
}

/**
 * Merge multiple conversation histories into a unified format
 */
export function mergeConversationHistories(
  histories: Array<{
    messages: SessionMessage[];
    source?: MessageSource;
  }>,
  options: MergeHistoryOptions = {}
): MergedHistoryResult {
  const { strategy = 'keep-first', dedupeByContent = true, preserveOrder = false, maxMessages } = options;
  
  // Collect all messages with their sources
  const allMessages: Array<{ msg: SessionMessage; source: MessageSource }> = [];
  const sourceCounts: Record<MessageSource, number> = {
    native: 0,
    augment: 0,
    'claude-code': 0,
    mobile: 0,
    api: 0,
  };

  for (const history of histories) {
    for (const msg of history.messages) {
      const source = msg.source || history.source || 'native';
      allMessages.push({ msg, source });
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    }
  }

  let merged: SessionMessage[] = [];

  if (preserveOrder) {
    // Keep chronological order - messages in order they appear in histories
    for (const { msg } of allMessages) {
      merged.push({ ...msg, updatedAt: Date.now() });
    }
  } else {
    // Sort by timestamp
    merged = allMessages
      .map(({ msg }) => msg)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  // Deduplicate if enabled
  let duplicatesRemoved = 0;
  if (dedupeByContent) {
    const seen = new Set<string>();
    const deduped: SessionMessage[] = [];

    for (const msg of merged) {
      const contentKey = msg.content.toLowerCase().slice(0, 100);
      
      if (seen.has(contentKey)) {
        duplicatesRemoved++;
        if (strategy === 'combine') {
          // Append to previous message if combining
          const last = deduped[deduped.length - 1];
          if (last) {
            last.content += '\n\n---\n\n' + msg.content;
          }
        }
        continue;
      }
      
      seen.add(contentKey);
      deduped.push({ ...msg, updatedAt: Date.now() });
    }

    merged = deduped;
  }

  // Apply max messages limit
  if (maxMessages && merged.length > maxMessages) {
    const removed = merged.length - maxMessages;
    merged = merged.slice(-maxMessages);
    duplicatesRemoved += removed;
  }

  return {
    messages: merged,
    sourceCounts,
    totalMessages: merged.length,
    duplicatesRemoved,
  };
}

/**
 * Merge native and external session histories
 */
export function mergeNativeAndExternal(
  nativeMessages: SessionMessage[],
  externalMessages: ExternalSessionMessage[],
  externalSource: MessageSource = 'augment',
  options: MergeHistoryOptions = {}
): SessionMessage[] {
  // Convert external messages to internal format
  const convertedExternal = externalMessages.map((msg, index) =>
    createSessionMessage(
      msg.role as 'user' | 'assistant' | 'tool',
      msg.content,
      externalSource,
      msg.toolName ? [{ name: msg.toolName, arguments: (msg.toolInput as Record<string, unknown>) || {} }] : undefined,
      msg.toolOutput ? [{ success: true, content: String(msg.toolOutput) }] : undefined
    )
  );

  // Merge both histories
  const result = mergeConversationHistories(
    [
      { messages: nativeMessages, source: 'native' },
      { messages: convertedExternal, source: externalSource },
    ],
    options
  );

  return result.messages;
}

/**
 * Combine multiple session data objects into one
 */
export function mergeSessions(
  sessions: SessionData[],
  targetConversationId: string,
  options: MergeHistoryOptions = {}
): SessionData {
  if (sessions.length === 0) {
    throw new Error('Cannot merge empty session list');
  }

  if (sessions.length === 1) {
    return sessions[0];
  }

  const mergedResult = mergeConversationHistories(
    sessions.map((s) => ({ messages: s.messages, source: s.metadata.lastSource })),
    options
  );

  // Get the most recent metadata from all sessions
  const latestSession = sessions.reduce((prev, curr) => 
    curr.updatedAt > prev.updatedAt ? curr : prev
  );

  return {
    id: `merged-${targetConversationId}-${Date.now()}`,
    conversationId: targetConversationId,
    messages: mergedResult.messages,
    metadata: {
      ...latestSession.metadata,
      lastSource: undefined, // Clear source since we have multiple
    },
    createdAt: Math.min(...sessions.map((s) => s.createdAt)),
    updatedAt: Date.now(),
  };
}

/**
 * Split a conversation history by source
 */
export function splitHistoryBySource(
  messages: SessionMessage[]
): Record<MessageSource, SessionMessage[]> {
  const result: Record<MessageSource, SessionMessage[]> = {
    native: [],
    augment: [],
    'claude-code': [],
    mobile: [],
    api: [],
  };

  for (const msg of messages) {
    const source = msg.source || 'native';
    result[source].push(msg);
  }

  return result;
}

/**
 * Get source distribution statistics for a history
 */
export function getSourceDistribution(
  messages: SessionMessage[]
): Record<MessageSource, { count: number; percentage: number }> {
  const total = messages.length;
  const distribution: Record<MessageSource, { count: number; percentage: number }> = {
    native: { count: 0, percentage: 0 },
    augment: { count: 0, percentage: 0 },
    'claude-code': { count: 0, percentage: 0 },
    mobile: { count: 0, percentage: 0 },
    api: { count: 0, percentage: 0 },
  };

  for (const msg of messages) {
    const source = msg.source || 'native';
    distribution[source].count++;
  }

  for (const source of Object.keys(distribution) as MessageSource[]) {
    distribution[source].percentage = total > 0 
      ? (distribution[source].count / total) * 100 
      : 0;
  }

  return distribution;
}
