import { describe, it, expect } from 'vitest';
import { calculateGSD, isValidGsdInput } from './gsdLookup';

describe('gsdLookup', () => {
  it('accepts positive finite inputs and rejects invalid values', () => {
    expect(
      isValidGsdInput({
        altitudeMeters: 120,
        focalLengthMm: 24,
        sensorWidthMm: 13.2,
        imageWidthPx: 4000,
      }),
    ).toBe(true);

    expect(
      isValidGsdInput({
        altitudeMeters: -1,
        focalLengthMm: 24,
        sensorWidthMm: 13.2,
        imageWidthPx: 4000,
      }),
    ).toBe(false);

    expect(
      isValidGsdInput({
        altitudeMeters: 120,
        focalLengthMm: 0,
        sensorWidthMm: 13.2,
        imageWidthPx: 4000,
      }),
    ).toBe(false);
  });

  it('computes GSD (cm/pixel) using the photogrammetry formula', () => {
    const result = calculateGSD({
      altitudeMeters: 100,
      focalLengthMm: 24,
      sensorWidthMm: 13.2,
      imageWidthPx: 4000,
    });
    // (100m -> 10,000cm) * 13.2 / (24 * 4000) ≈ 1.375
    expect(result).toBeCloseTo(1.375, 3);

    const tighterShot = calculateGSD({
      altitudeMeters: 10,
      focalLengthMm: 35,
      sensorWidthMm: 13.2,
      imageWidthPx: 5472,
    });
    expect(tighterShot).toBeCloseTo(0.0689, 3);
  });

  it('returns null for non-numeric, zero, or boundary-breaking inputs', () => {
    expect(
      calculateGSD({
        altitudeMeters: 0,
        focalLengthMm: 24,
        sensorWidthMm: 13.2,
        imageWidthPx: 4000,
      }),
    ).toBeNull();

    expect(
      calculateGSD({
        altitudeMeters: Number.NaN,
        focalLengthMm: 24,
        sensorWidthMm: 13.2,
        imageWidthPx: 4000,
      }),
    ).toBeNull();

    expect(
      calculateGSD({
        altitudeMeters: 50,
        focalLengthMm: 24,
        sensorWidthMm: 13.2,
        imageWidthPx: -1,
      }),
    ).toBeNull();
  });
});
