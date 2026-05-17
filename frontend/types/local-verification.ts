import type { LocalVerificationStatus } from '@/types/user';

export type LocalVerificationRequestDocument = {
  address: string;
  createdAt?: unknown;
  documentMimeType?: string;
  documentName: string;
  documentPath: string;
  documentUrl: string;
  email: string;
  fullName: string;
  status: LocalVerificationStatus;
  uid: string;
  updatedAt?: unknown;
};
