/**
 * G4 子模块事件类型常量
 * 统一管理所有 logOperation 的 eventType 值
 */
export const EventTypes = {
  // 页面事件
  PAGE_ENTER: 'page_enter',
  PAGE_EXIT: 'page_exit',
  
  // 交互事件
  CLICK: 'click',
  CHECKBOX_CHECK: 'checkbox_check',
  CHECKBOX_UNCHECK: 'checkbox_uncheck',
  RADIO_SELECT: 'radio_select',
  INPUT_CHANGE: 'input_change',
  
  // 拖拽事件
  DRAG_START: 'drag_start',
  DRAG_END: 'drag_end',
  TASK_DROP: 'task_drop',
  TASK_REMOVE: 'task_remove',
  
  // 对话事件
  DIALOGUE_PLAY: 'dialogue_play',
  DIALOGUE_REPLAY: 'dialogue_replay',
  
  // 演示事件
  DEMO_PLAY: 'demo_play',
  DEMO_COMPLETE: 'demo_complete',
  
  // 虚拟键盘事件
  KEY_PRESS: 'key_press',
  
  // 阻止事件
  CLICK_BLOCKED: 'click_blocked',
};

export default EventTypes;
