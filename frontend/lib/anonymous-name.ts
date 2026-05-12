import type { UserRole } from '@/types/user';

const rolePrefixes: Record<UserRole, string> = {
  local: 'Local',
  visitor: 'Traveler',
};

export function generateAnonymousName(role: UserRole) {
  const suffix = Math.floor(100 + Math.random() * 900);

  return `${rolePrefixes[role]}_${suffix}`;
}

export function getFallbackAnonymousName(role: UserRole, seed?: string | null) {
  const safeSeed = typeof seed === 'string' ? seed : '';
  const numericPart = safeSeed.replace(/\D/g, '').slice(-3).padStart(3, '0') || '000';

  return `${rolePrefixes[role]}_${numericPart}`;
}
