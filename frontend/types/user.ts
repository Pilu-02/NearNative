export type UserRole = 'local' | 'visitor';

export type LocalVerificationStatus =
  | 'not_requested'
  | 'pending'
  | 'approved'
  | 'rejected';

export type UserProfile = {
  anonymousName?: string;
  createdAt?: unknown;
  email: string;
  emailVerifiedAt?: unknown;
  fullName?: string;
  isLocalVerified?: boolean;
  latitude?: number;
  localAddress?: string;
  localVerificationStatus?: LocalVerificationStatus;
  longitude?: number;
  requestedRole?: UserRole;
  role: UserRole;
  uid: string;
  updatedAt?: unknown;
};
