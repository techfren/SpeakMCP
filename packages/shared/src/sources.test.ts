/**
 * @speakmcp/shared
 *
 * Tests for source display utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getSourceIcon,
  getSourceLabel,
  getSourceConfig,
  isExternalSource,
  isExternal,
  getSourceCssClass,
  formatSourceForDisplay,
  SOURCE_CONFIGS,
  EXTERNAL_SOURCES,
  type SourceConfig,
} from './sources';
import { MessageSource } from './types';

describe('sources.ts', () => {
  describe('getSourceIcon', () => {
    it('returns correct icon for native source', () => {
      expect(getSourceIcon('native')).toBe('🏠');
    });

    it('returns correct icon for augment source', () => {
      expect(getSourceIcon('augment')).toBe('A');
    });

    it('returns correct icon for claude-code source', () => {
      expect(getSourceIcon('claude-code')).toBe('C');
    });

    it('returns correct icon for mobile source', () => {
      expect(getSourceIcon('mobile')).toBe('📱');
    });

    it('returns correct icon for api source', () => {
      expect(getSourceIcon('api')).toBe('🔌');
    });

    it('returns default icon for unknown source', () => {
      expect(getSourceIcon('unknown' as MessageSource)).toBe('❓');
    });
  });

  describe('getSourceLabel', () => {
    it('returns correct label for native source', () => {
      expect(getSourceLabel('native')).toBe('Native');
    });

    it('returns correct label for augment source', () => {
      expect(getSourceLabel('augment')).toBe('Augment');
    });

    it('returns correct label for claude-code source', () => {
      expect(getSourceLabel('claude-code')).toBe('Claude Code');
    });

    it('returns correct label for mobile source', () => {
      expect(getSourceLabel('mobile')).toBe('Mobile');
    });

    it('returns correct label for api source', () => {
      expect(getSourceLabel('api')).toBe('API');
    });

    it('returns Unknown for unknown source', () => {
      expect(getSourceLabel('unknown' as MessageSource)).toBe('Unknown');
    });
  });

  describe('getSourceConfig', () => {
    it('returns complete config for native source', () => {
      const config = getSourceConfig('native');
      expect(config).toEqual({
        icon: '🏠',
        label: 'Native',
        color: '#6366f1',
      });
    });

    it('returns complete config for augment source', () => {
      const config = getSourceConfig('augment');
      expect(config).toEqual({
        icon: 'A',
        label: 'Augment',
        color: '#8b5cf6',
      });
    });

    it('returns complete config for mobile source', () => {
      const config = getSourceConfig('mobile');
      expect(config).toEqual({
        icon: '📱',
        label: 'Mobile',
        color: '#10b981',
      });
    });

    it('returns default config for unknown source', () => {
      const config = getSourceConfig('unknown' as MessageSource);
      expect(config).toEqual({
        icon: '❓',
        label: 'Unknown',
        color: '#374151',
      });
    });
  });

  describe('isExternalSource', () => {
    it('returns false for native source', () => {
      expect(isExternalSource('native')).toBe(false);
    });

    it('returns true for augment source', () => {
      expect(isExternalSource('augment')).toBe(true);
    });

    it('returns true for claude-code source', () => {
      expect(isExternalSource('claude-code')).toBe(true);
    });

    it('returns true for mobile source', () => {
      expect(isExternalSource('mobile')).toBe(true);
    });

    it('returns true for api source', () => {
      expect(isExternalSource('api')).toBe(true);
    });
  });

  describe('isExternal', () => {
    it('returns false for native source', () => {
      expect(isExternal('native')).toBe(false);
    });

    it('returns true for augment source', () => {
      expect(isExternal('augment')).toBe(true);
    });

    it('returns true for all external sources', () => {
      EXTERNAL_SOURCES.forEach((source) => {
        expect(isExternal(source)).toBe(true);
      });
    });
  });

  describe('EXTERNAL_SOURCES', () => {
    it('contains augment', () => {
      expect(EXTERNAL_SOURCES).toContain('augment');
    });

    it('contains claude-code', () => {
      expect(EXTERNAL_SOURCES).toContain('claude-code');
    });

    it('contains mobile', () => {
      expect(EXTERNAL_SOURCES).toContain('mobile');
    });

    it('contains api', () => {
      expect(EXTERNAL_SOURCES).toContain('api');
    });

    it('does not contain native', () => {
      expect(EXTERNAL_SOURCES).not.toContain('native');
    });

    it('has exactly 4 external sources', () => {
      expect(EXTERNAL_SOURCES).toHaveLength(4);
    });
  });

  describe('SOURCE_CONFIGS', () => {
    it('has config for native', () => {
      expect(SOURCE_CONFIGS.native).toBeDefined();
      expect(SOURCE_CONFIGS.native.icon).toBe('🏠');
    });

    it('has config for augment', () => {
      expect(SOURCE_CONFIGS.augment).toBeDefined();
      expect(SOURCE_CONFIGS.augment.icon).toBe('A');
    });

    it('has config for claude-code', () => {
      expect(SOURCE_CONFIGS['claude-code']).toBeDefined();
      expect(SOURCE_CONFIGS['claude-code'].icon).toBe('C');
    });

    it('has config for mobile', () => {
      expect(SOURCE_CONFIGS.mobile).toBeDefined();
      expect(SOURCE_CONFIGS.mobile.icon).toBe('📱');
    });

    it('has config for api', () => {
      expect(SOURCE_CONFIGS.api).toBeDefined();
      expect(SOURCE_CONFIGS.api.icon).toBe('🔌');
    });

    it('all configs have required fields', () => {
      const configs: SourceConfig[] = [
        SOURCE_CONFIGS.native,
        SOURCE_CONFIGS.augment,
        SOURCE_CONFIGS['claude-code'],
        SOURCE_CONFIGS.mobile,
        SOURCE_CONFIGS.api,
      ];

      configs.forEach((config) => {
        expect(config).toHaveProperty('icon');
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('color');
        expect(typeof config.icon).toBe('string');
        expect(typeof config.label).toBe('string');
        expect(config.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('getSourceCssClass', () => {
    it('returns kebab-case for native', () => {
      expect(getSourceCssClass('native')).toBe('source-native');
    });

    it('returns kebab-case for claude-code', () => {
      expect(getSourceCssClass('claude-code')).toBe('source-claude-code');
    });

    it('handles camelCase conversion correctly', () => {
      expect(getSourceCssClass('claudeCode')).toBe('source-claude-code');
    });
  });

  describe('formatSourceForDisplay', () => {
    it('returns complete display object for native', () => {
      const display = formatSourceForDisplay('native');
      expect(display).toEqual({
        icon: '🏠',
        label: 'Native',
        cssClass: 'source-native',
        color: '#6366f1',
      });
    });

    it('returns complete display object for mobile', () => {
      const display = formatSourceForDisplay('mobile');
      expect(display).toEqual({
        icon: '📱',
        label: 'Mobile',
        cssClass: 'source-mobile',
        color: '#10b981',
      });
    });

    it('returns complete display object for augment', () => {
      const display = formatSourceForDisplay('augment');
      expect(display).toEqual({
        icon: 'A',
        label: 'Augment',
        cssClass: 'source-augment',
        color: '#8b5cf6',
      });
    });

    it('returns default values for unknown source', () => {
      const display = formatSourceForDisplay('unknown' as MessageSource);
      expect(display).toEqual({
        icon: '❓',
        label: 'Unknown',
        cssClass: 'source-unknown',
        color: '#374151',
      });
    });
  });
});
