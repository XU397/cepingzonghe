import type { LoginPageConfig } from './types';

export const DEFAULT_LOGIN_PAGE_CONFIG: LoginPageConfig = {
  logo: {
    displayType: 'image',
    position: 'top_left',
    imageUrl: undefined,
    text: undefined,
    imageAlt: 'Logo',
  },
  title: {
    highlightText: '学生问题解决能力',
    mainText: '监测平台',
    subtitleText: '数据驱动的监测与分析平台',
  },
  loginBoxTitle: '请登录，开启你的科学探究之旅',
  password: {
    hidden: false,
    defaultPasswordPolicy: 'fixed_1234',
  },
};
