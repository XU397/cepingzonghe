export type GsdInput = {
  altitudeMeters: number;
  focalLengthMm: number;
  sensorWidthMm: number;
  imageWidthPx: number;
};

const isPositiveNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

export function isValidGsdInput(input: Partial<GsdInput>): input is GsdInput {
  if (!input) return false;
  const {
    altitudeMeters,
    focalLengthMm,
    sensorWidthMm,
    imageWidthPx
  } = input;
  return (
    isPositiveNumber(altitudeMeters) &&
    isPositiveNumber(focalLengthMm) &&
    isPositiveNumber(sensorWidthMm) &&
    isPositiveNumber(imageWidthPx)
  );
}

/**
 * Ground Sampling Distance calculator (cm/pixel)
 *
 * Uses the common photogrammetry formula:
 *   GSD = (H * sensorWidth) / (focalLength * imageWidth)
 * Where:
 * - H is altitude in meters (converted to centimeters)
 * - sensorWidth and focalLength are in millimeters
 * - imageWidth is in pixels
 *
 * Returns null when inputs are invalid.
 */
export function calculateGSD(input: Partial<GsdInput>): number | null {
  if (!isValidGsdInput(input)) {
    return null;
  }

  const {
    altitudeMeters,
    focalLengthMm,
    sensorWidthMm,
    imageWidthPx
  } = input;

  const altitudeCentimeters = altitudeMeters * 100;
  const gsd = (altitudeCentimeters * sensorWidthMm) / (focalLengthMm * imageWidthPx);
  return Number(gsd.toFixed(4));
}
