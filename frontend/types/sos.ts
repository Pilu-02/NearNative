import type { UserRole } from '@/types/user';

export type SosAlertDocument = {
  anonymousName: string;
  createdAt?: unknown;
  creatorId: string;
  expiresAt?: unknown;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  role: UserRole;
  updatedAt?: unknown;
};
