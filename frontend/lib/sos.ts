import { Timestamp } from 'firebase/firestore';

const SOS_TTL_MINUTES = 15;

export const RADIUS_OPTIONS_METERS = [250, 500, 1000, 2000] as const;

export function getSosExpiryTimestamp() {
  return Timestamp.fromDate(new Date(Date.now() + SOS_TTL_MINUTES * 60 * 1000));
}

export function formatRadiusLabel(radiusInMeters: number) {
  if (radiusInMeters < 1000) {
    return `${radiusInMeters} m`;
  }

  return `${(radiusInMeters / 1000).toFixed(radiusInMeters % 1000 === 0 ? 0 : 1)} km`;
}
