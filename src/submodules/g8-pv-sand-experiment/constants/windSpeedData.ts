import { WindSpeedData, HeightLevel } from '../types';

export const WIND_SPEED_DATA: WindSpeedData = {
  20: { withPanel: 2.09, noPanel: 2.37 },
  50: { withPanel: 2.25, noPanel: 2.62 },
  100: { withPanel: 1.66, noPanel: 2.77 }
};

export const HEIGHT_LEVELS: HeightLevel[] = [20, 50, 100];

export const DEFAULT_HEIGHT: HeightLevel = 50;

export const ANIMATION_DURATION = 2000;

export const validateHeightLevel = (height: number): height is HeightLevel => {
  return HEIGHT_LEVELS.includes(height as HeightLevel);
};

export const getWindSpeedData = (height: HeightLevel) => {
  return WIND_SPEED_DATA[height];
};