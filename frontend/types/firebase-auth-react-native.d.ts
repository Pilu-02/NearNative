import 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<unknown>;
    setItem(key: string, value: string): Promise<unknown>;
  }): Persistence;
}
