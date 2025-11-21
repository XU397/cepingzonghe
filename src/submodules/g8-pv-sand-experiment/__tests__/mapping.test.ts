/**
 * @file mapping.test.ts
 * @description 光伏治沙模块页面映射纯函数测试
 * @author Claude (Test Infrastructure)
 * @created 2025-11-19
 * 
 * 测试覆盖:
 * - PAGE_MAPPING常量验证
 * - getPageInfo函数边界情况
 * - getInitialPageId页面恢复逻辑
 * - 导航相关函数(getNextPageId, getPreviousPageId)
 * - 格式化和工具函数
 */

import { describe, it, expect } from 'vitest';
import {
  PAGE_MAPPING,
  getPageInfo,
  getInitialPageId,
  getTotalSteps,
  getNavigationMode,
  formatPageDesc,
  getAllPageIds,
  getNextPageId,
  getPreviousPageId
} from '../mapping';

describe('光伏治沙模块 - 页面映射纯函数', () => {
  
  describe('PAGE_MAPPING 常量验证', () => {
    it('应该包含所有必需的页面定义', () => {
      const expectedPages = [
        'page01b-task-cover',
        'page03-background',
        'page04-experiment-design',
        'page05-tutorial',
        'page06-experiment1',
        'page07-experiment2',
        'page08-conclusion'
      ];
      
      expectedPages.forEach(pageId => {
        expect(PAGE_MAPPING).toHaveProperty(pageId);
      });
      
      expect(Object.keys(PAGE_MAPPING)).toHaveLength(7);
    });

    it('每个页面应该具有完整的配置结构', () => {
      Object.entries(PAGE_MAPPING).forEach(([pageId, config]) => {
        expect(config).toHaveProperty('pageNumber');
        expect(config).toHaveProperty('pageDesc');
        expect(config).toHaveProperty('mode');
        
        expect(typeof config.pageNumber).toBe('string');
        expect(typeof config.pageDesc).toBe('string');
        expect(['hidden', 'experiment']).toContain(config.mode);
        
        expect(config.pageNumber).not.toBe('');
        expect(config.pageDesc).not.toBe('');
      });
    });

    it('隐藏页面应该使用H.x编号格式', () => {
      const hiddenPages = Object.entries(PAGE_MAPPING)
        .filter(([_, config]) => config.mode === 'hidden');
      
      hiddenPages.forEach(([pageId, config]) => {
        expect(config.pageNumber).toMatch(/^H\.\d+$/);
      });
      
      expect(hiddenPages).toHaveLength(2); // page01b, page03
    });

    it('实验页面应该使用数字编号格式', () => {
      const experimentPages = Object.entries(PAGE_MAPPING)
        .filter(([_, config]) => config.mode === 'experiment');
      
      experimentPages.forEach(([pageId, config]) => {
        expect(config.pageNumber).toMatch(/^\d+\.\d+$/);
      });
      
      expect(experimentPages).toHaveLength(5); // page04-page08
    });
  });

  describe('getPageInfo 函数', () => {
    it('应该返回存在页面的正确配置', () => {
      const pageInfo = getPageInfo('page04-experiment-design');
      
      expect(pageInfo).toEqual({
        pageNumber: '1.4',
        pageDesc: '实验方案设计',
        mode: 'experiment'
      });
    });

    it('应该对不存在的页面返回null', () => {
      expect(getPageInfo('non-existent-page')).toBeNull();
      expect(getPageInfo('')).toBeNull();
      expect(getPageInfo(null as any)).toBeNull();
      expect(getPageInfo(undefined as any)).toBeNull();
    });

    it('应该处理特殊字符和大小写', () => {
      expect(getPageInfo('PAGE01-INSTRUCTIONS-COVER')).toBeNull();
      expect(getPageInfo('page01_instructions_cover')).toBeNull();
      expect(getPageInfo('page01 instructions cover')).toBeNull();
    });
  });

  describe('getInitialPageId 页面恢复逻辑', () => {
    it('无参数时应该返回第一页', () => {
      expect(getInitialPageId()).toBe('page01b-task-cover');
    });

    it('pageNum <= 1时应该返回第一页', () => {
      expect(getInitialPageId(0)).toBe('page01b-task-cover');
      expect(getInitialPageId(1)).toBe('page01b-task-cover');
      expect(getInitialPageId(-1)).toBe('page01b-task-cover');
    });

    it('应该正确恢复到指定页面索引', () => {
      expect(getInitialPageId(2)).toBe('page03-background');
      expect(getInitialPageId(3)).toBe('page04-experiment-design');
      expect(getInitialPageId(7)).toBe('page08-conclusion');
    });

    it('超出范围时应该返回最后一页', () => {
      expect(getInitialPageId(10)).toBe('page08-conclusion');
      expect(getInitialPageId(999)).toBe('page08-conclusion');
    });

    it('应该处理浮点数pageNum', () => {
      expect(getInitialPageId(2.0)).toBe('page03-background');
      expect(getInitialPageId(6.0)).toBe('page07-experiment2');
      // 浮点数应该向下取整
      expect(getInitialPageId(2.7)).toBe('page03-background');
      expect(getInitialPageId(6.9)).toBe('page07-experiment2');
    });
  });

  describe('getTotalSteps 实验步骤统计', () => {
    it('应该只统计experiment模式的页面', () => {
      const totalSteps = getTotalSteps();
      expect(totalSteps).toBe(5); // page04-page08
    });

    it('统计结果应该与实际experiment页面数量一致', () => {
      const experimentPages = Object.values(PAGE_MAPPING)
        .filter(config => config.mode === 'experiment');
      
      expect(getTotalSteps()).toBe(experimentPages.length);
    });
  });

  describe('getNavigationMode 导航模式', () => {
    it('应该正确返回隐藏页面的模式', () => {
      expect(getNavigationMode('page01b-task-cover')).toBe('hidden');
      expect(getNavigationMode('page03-background')).toBe('hidden');
    });

    it('应该正确返回实验页面的模式', () => {
      expect(getNavigationMode('page04-experiment-design')).toBe('experiment');
      expect(getNavigationMode('page05-tutorial')).toBe('experiment');
      expect(getNavigationMode('page06-experiment1')).toBe('experiment');
      expect(getNavigationMode('page07-experiment2')).toBe('experiment');
      expect(getNavigationMode('page08-conclusion')).toBe('experiment');
    });

    it('不存在的页面应该返回默认experiment模式', () => {
      expect(getNavigationMode('non-existent')).toBe('experiment');
      expect(getNavigationMode('')).toBe('experiment');
    });
  });

  describe('formatPageDesc 页面描述格式化', () => {
    it('无流程上下文时应该返回原始描述', () => {
      expect(formatPageDesc('page04-experiment-design')).toBe('实验方案设计');
      expect(formatPageDesc('page06-experiment1')).toBe('实验1：50cm高度对比');
    });

    it('有流程上下文时应该包含完整路径', () => {
      const flowContext = {
        flowId: 'science-experiment-flow',
        stepIndex: 2
      };
      
      const result = formatPageDesc('page04-experiment-design', flowContext);
      expect(result).toBe('[science-experiment-flow/g8-pv-sand-experiment/2] 实验方案设计');
    });

    it('不存在的页面应该返回pageId本身', () => {
      expect(formatPageDesc('non-existent')).toBe('non-existent');
    });

    it('应该处理空的flowContext', () => {
      const emptyFlowContext = { flowId: '', stepIndex: 0 };
      const result = formatPageDesc('page05-tutorial', emptyFlowContext);
      expect(result).toBe('[/g8-pv-sand-experiment/0] 操作指引试玩');
    });
  });

  describe('getAllPageIds 页面列表', () => {
    it('应该返回正确顺序的所有页面ID', () => {
      const pageIds = getAllPageIds();
      
      expect(pageIds).toEqual([
        'page01b-task-cover',
        'page03-background',
        'page04-experiment-design',
        'page05-tutorial',
        'page06-experiment1',
        'page07-experiment2',
        'page08-conclusion'
      ]);
    });

    it('返回的数组应该与PAGE_MAPPING键一致', () => {
      const pageIds = getAllPageIds();
      const mappingKeys = Object.keys(PAGE_MAPPING);
      
      expect(pageIds).toHaveLength(mappingKeys.length);
      pageIds.forEach(pageId => {
        expect(mappingKeys).toContain(pageId);
      });
    });
  });

  describe('getNextPageId 下一页导航', () => {
    it('应该正确返回下一页ID', () => {
      expect(getNextPageId('page01b-task-cover')).toBe('page03-background');
      expect(getNextPageId('page04-experiment-design')).toBe('page05-tutorial');
      expect(getNextPageId('page07-experiment2')).toBe('page08-conclusion');
    });

    it('最后一页应该返回null', () => {
      expect(getNextPageId('page08-conclusion')).toBeNull();
    });

    it('不存在的页面应该返回null', () => {
      expect(getNextPageId('non-existent')).toBeNull();
      expect(getNextPageId('')).toBeNull();
    });
  });

  describe('getPreviousPageId 上一页导航', () => {
    it('应该正确返回上一页ID', () => {
      expect(getPreviousPageId('page03-background')).toBe('page01b-task-cover');
      expect(getPreviousPageId('page05-tutorial')).toBe('page04-experiment-design');
      expect(getPreviousPageId('page08-conclusion')).toBe('page07-experiment2');
    });

    it('第一页应该返回null', () => {
      expect(getPreviousPageId('page01b-task-cover')).toBeNull();
    });

    it('不存在的页面应该返回null', () => {
      expect(getPreviousPageId('non-existent')).toBeNull();
      expect(getPreviousPageId('')).toBeNull();
    });
  });

  describe('边界情况和错误处理', () => {
    it('应该处理undefined和null输入', () => {
      expect(() => getPageInfo(undefined as any)).not.toThrow();
      expect(() => getPageInfo(null as any)).not.toThrow();
      expect(() => formatPageDesc(undefined as any)).not.toThrow();
      expect(() => getNavigationMode(null as any)).not.toThrow();
    });

    it('应该处理数字类型的pageId输入', () => {
      expect(getPageInfo(123 as any)).toBeNull();
      expect(formatPageDesc(456 as any)).toBe('456');
    });

    it('应该处理特殊字符输入', () => {
      const specialChars = ['@#$', '中文页面', '  ', '\n\t'];
      
      specialChars.forEach(char => {
        expect(getPageInfo(char)).toBeNull();
        expect(getNavigationMode(char)).toBe('experiment');
        expect(formatPageDesc(char)).toBe(char);
      });
    });
  });

  describe('数据完整性验证', () => {
    it('页面编号应该唯一', () => {
      const pageNumbers = Object.values(PAGE_MAPPING).map(config => config.pageNumber);
      const uniqueNumbers = new Set(pageNumbers);
      
      expect(pageNumbers).toHaveLength(uniqueNumbers.size);
    });

    it('页面描述应该唯一', () => {
      const descriptions = Object.values(PAGE_MAPPING).map(config => config.pageDesc);
      const uniqueDescriptions = new Set(descriptions);
      
      expect(descriptions).toHaveLength(uniqueDescriptions.size);
    });

    it('页面ID应该遵循命名约定', () => {
      const pageIds = getAllPageIds();
      
      pageIds.forEach(pageId => {
        expect(pageId).toMatch(/^page\d{2}-[\w-]+$/);
      });
    });

    it('实验页面编号应该递增', () => {
      const experimentPages = Object.entries(PAGE_MAPPING)
        .filter(([_, config]) => config.mode === 'experiment')
        .map(([_, config]) => config.pageNumber)
        .sort();
      
      // 检查编号递增（主编号部分）
      for (let i = 1; i < experimentPages.length; i++) {
        const prevMainNum = parseInt(experimentPages[i-1].split('.')[0]);
        const currMainNum = parseInt(experimentPages[i].split('.')[0]);
        
        expect(currMainNum).toBeGreaterThanOrEqual(prevMainNum);
      }
    });
  });
});

describe('集成场景测试', () => {
  it('完整页面导航流程', () => {
    let currentPage = getInitialPageId();
    const visitedPages = [currentPage];
    
    // 模拟完整导航
    while (true) {
      const nextPage = getNextPageId(currentPage);
      if (!nextPage) break;
      
      currentPage = nextPage;
      visitedPages.push(currentPage);
    }
    
    // 验证导航完整性
    expect(visitedPages).toHaveLength(7);
    expect(visitedPages[0]).toBe('page01b-task-cover');
    expect(visitedPages[visitedPages.length - 1]).toBe('page08-conclusion');
    
    // 验证每一步都有效
    visitedPages.forEach(pageId => {
      expect(getPageInfo(pageId)).not.toBeNull();
    });
  });

  it('页面恢复和模式切换场景', () => {
    // 模拟用户在第6页刷新
    const restoredPage = getInitialPageId(6);
    expect(restoredPage).toBe('page06-experiment1');
    
    // 验证导航模式正确
    expect(getNavigationMode(restoredPage)).toBe('experiment');
    
    // 验证可以继续导航
    const nextPage = getNextPageId(restoredPage);
    expect(nextPage).toBe('page07-experiment2');
    expect(getNavigationMode(nextPage)).toBe('experiment');
  });
});