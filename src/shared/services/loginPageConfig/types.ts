export type LogoDisplayType = 'none' | 'image' | 'text' | 'image_text';
export type LogoPosition = 'top_left' | 'top_center' | 'top_right';

export interface LoginPageConfig {
  id?: number | string;
  version?: number;
  cacheVersion?: string;
  logo: {
    displayType: LogoDisplayType;
    position: LogoPosition;
    imageUrl?: string;
    text?: string;
    imageAlt?: string;
  };
  title: {
    highlightText: string;
    mainText: string;
    subtitleText?: string;
  };
  loginBoxTitle: string;
  password: {
    hidden: boolean;
    defaultPasswordPolicy: 'fixed_1234';
  };
}
