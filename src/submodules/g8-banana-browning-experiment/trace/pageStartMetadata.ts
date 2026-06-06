export interface ViewportState {
  width: number;
  height: number;
  scroll_y: number;
}

export const getViewportState = (): ViewportState => ({
  width: typeof window === 'undefined' ? 0 : window.innerWidth,
  height: typeof window === 'undefined' ? 0 : window.innerHeight,
  scroll_y: typeof window === 'undefined' ? 0 : window.scrollY,
});

export const buildPage02StartMetadata = () => ({
  initial_visible_content_ids: ['instruction_text_02_01', 'chat_bubble_02_01'],
  main_instruction_visible: true,
  viewport_state: getViewportState(),
});
