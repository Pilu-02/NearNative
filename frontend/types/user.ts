export type UserRole = 'local' | 'visitor';

export type UserProfile = {
  anonymousName?: string;
  createdAt?: unknown;
  email: string;
  latitude?: number;
  longitude?: number;
  role: UserRole;
  uid: string;
  updatedAt?: unknown;
};
