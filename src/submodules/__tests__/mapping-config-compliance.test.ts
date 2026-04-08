import { describe, expect, it } from 'vitest';
import { validateMappingConfig } from '@shared/services/submission/submoduleAdapter';

import { SUBMODULE_MAPPING_CONFIG as g4Config } from '../g4-experiment/mapping';
import { SUBMODULE_MAPPING_CONFIG as g8DroneConfig } from '../g8-drone-imaging/mapping';
import { SUBMODULE_MAPPING_CONFIG as g8MikaniaConfig } from '../g8-mikania-experiment/mapping';
import { SUBMODULE_MAPPING_CONFIG as g8BananaBrowningConfig } from '../g8-banana-browning-experiment/mapping';
import { SUBMODULE_MAPPING_CONFIG as g8PvSandConfig } from '../g8-pv-sand-experiment/mapping';

const CONFIG_CASES = [
  ['g4-experiment', g4Config],
  ['g8-drone-imaging', g8DroneConfig],
  ['g8-mikania-experiment', g8MikaniaConfig],
  ['g8-banana-browning-experiment', g8BananaBrowningConfig],
  ['g8-pv-sand-experiment', g8PvSandConfig],
] as const;

describe('submodule mapping config compliance', () => {
  it.each(CONFIG_CASES)('%s should pass validateMappingConfig', (_name, config) => {
    const result = validateMappingConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it.each(CONFIG_CASES)('%s should expose non-empty page configs', (_name, config) => {
    expect(config.PAGE_CONFIGS.length).toBeGreaterThan(0);
    config.PAGE_CONFIGS.forEach(page => {
      expect(typeof page.pageId).toBe('string');
      expect(typeof page.subPageNum).toBe('number');
      if ('title' in page && page.title !== undefined) {
        expect(typeof page.title).toBe('string');
      }
      if ('questionKeys' in page && page.questionKeys !== undefined) {
        expect(Array.isArray(page.questionKeys)).toBe(true);
      }
    });
  });

  it('single-choice questions should support option formatting when QUESTION_OPTIONS_MAP exists', () => {
    expect(g8DroneConfig.formatAnswer?.('priorityFactor', 'A')).toBe('A. 降低飞行高度');
    expect(g8PvSandConfig.formatAnswer?.('Q2', 'A')).toBe('A. 有板区');
    expect(g8MikaniaConfig.formatAnswer?.('Q2', 'A')).toBe('A. 0mg/ml');
  });
});
