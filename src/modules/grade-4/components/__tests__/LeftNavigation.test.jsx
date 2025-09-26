/**
 * LeftNavigation 组件测试
 * 验证左侧导航栏的显示和高亮逻辑
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LeftNavigation from '../LeftNavigation';
import { Grade4Provider } from '../../context/Grade4Context';

// Mock the Grade4Context
const mockGrade4Context = {
  setNavigationStep: vi.fn(),
};

// Mock useGrade4Context hook
vi.mock('../../context/Grade4Context', async () => {
  const actual = await vi.importActual('../../context/Grade4Context');
  return {
    ...actual,
    useGrade4Context: () => mockGrade4Context,
  };
});

describe('LeftNavigation', () => {
  it('应该渲染所有导航项', () => {
    render(
      <Grade4Provider>
        <LeftNavigation currentStep="1" />
      </Grade4Provider>
    );
    
    // 验证所有11个导航项
    for (let i = 1; i <= 11; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
    
    // 验证一些标签文本
    expect(screen.getAllByText('出行方案')).toHaveLength(2); // 项目1和2
    expect(screen.getAllByText('火车购票')).toHaveLength(2); // 项目3和11
    expect(screen.getByText('火车购票: 出发站')).toBeInTheDocument();
    expect(screen.getByText('火车购票: 出发时间')).toBeInTheDocument();
    expect(screen.getByText('火车购票: 车票选择')).toBeInTheDocument();
  });

  it('应该正确高亮第1步', () => {
    render(
      <Grade4Provider>
        <LeftNavigation currentStep="1" />
      </Grade4Provider>
    );
    
    // 验证第1项高亮
    const firstItem = screen.getByText('1').closest('.nav-item');
    expect(firstItem).toHaveClass('highlighted');
    
    // 验证其他项不高亮
    const secondItem = screen.getByText('2').closest('.nav-item');
    expect(secondItem).not.toHaveClass('highlighted');
    
    const thirdItem = screen.getByText('3').closest('.nav-item');
    expect(thirdItem).not.toHaveClass('highlighted');
  });

  it('应该正确高亮第2步', () => {
    render(
      <Grade4Provider>
        <LeftNavigation currentStep="2" />
      </Grade4Provider>
    );
    
    // 验证第2项高亮
    const secondItem = screen.getByText('2').closest('.nav-item');
    expect(secondItem).toHaveClass('highlighted');
    
    // 验证其他项不高亮
    const firstItem = screen.getByText('1').closest('.nav-item');
    expect(firstItem).not.toHaveClass('highlighted');
    
    const thirdItem = screen.getByText('3').closest('.nav-item');
    expect(thirdItem).not.toHaveClass('highlighted');
  });

  it('应该正确高亮第3步', () => {
    render(
      <Grade4Provider>
        <LeftNavigation currentStep="3" />
      </Grade4Provider>
    );
    
    // 验证第3项高亮
    const thirdItem = screen.getByText('3').closest('.nav-item');
    expect(thirdItem).toHaveClass('highlighted');
    
    // 验证其他项不高亮
    const firstItem = screen.getByText('1').closest('.nav-item');
    expect(firstItem).not.toHaveClass('highlighted');
    
    const secondItem = screen.getByText('2').closest('.nav-item');
    expect(secondItem).not.toHaveClass('highlighted');
  });

  it('应该在没有匹配步骤时不高亮任何项', () => {
    render(
      <Grade4Provider>
        <LeftNavigation currentStep="99" />
      </Grade4Provider>
    );
    
    // 验证没有项被高亮
    for (let i = 1; i <= 11; i++) {
      const item = screen.getByText(i.toString()).closest('.nav-item');
      expect(item).not.toHaveClass('highlighted');
    }
  });

  it('应该正确显示导航项的结构', () => {
    render(
      <Grade4Provider>
        <LeftNavigation currentStep="1" />
      </Grade4Provider>
    );
    
    // 验证导航容器
    expect(screen.getByRole('generic')).toHaveClass('left-navigation');
    
    // 验证每个导航项的结构
    const firstItem = screen.getByText('1').closest('.nav-item');
    expect(firstItem.querySelector('.nav-number')).toBeInTheDocument();
    expect(firstItem.querySelector('.nav-label')).toBeInTheDocument();
  });

  it('应该支持所有预定义的导航步骤', () => {
    const expectedLabels = [
      '出行方案',      // 1
      '出行方案',      // 2
      '火车购票',      // 3
      '火车购票: 出发站', // 4
      '火车购票: 出发站', // 5
      '火车购票: 出发时间', // 6
      '火车购票: 出发时间', // 7
      '火车购票: 出发时间', // 8
      '火车购票: 车票选择', // 9
      '火车购票: 车票选择', // 10
      '火车购票'       // 11
    ];
    
    render(
      <Grade4Provider>
        <LeftNavigation currentStep="5" />
      </Grade4Provider>
    );
    
    expectedLabels.forEach((label, index) => {
      const number = (index + 1).toString();
      const item = screen.getByText(number).closest('.nav-item');
      expect(item.querySelector('.nav-label')).toHaveTextContent(label);
    });
  });
});