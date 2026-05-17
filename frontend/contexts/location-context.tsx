import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import * as Location from 'expo-location';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';

type Coordinates = {
  latitude: number;
  longitude: number;
};

type LocationContextValue = {
  coordinates: Coordinates | null;
  errorMessage: string;
  isSyncingLocation: boolean;
  permissionStatus: Location.PermissionStatus | null;
  refreshLocation: () => Promise<void>;
};

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: PropsWithChildren) {
  const { isEmailVerified, user } = useAuth();
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSyncingLocation, setIsSyncingLocation] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  const refreshLocation = async () => {
    if (!user || !isEmailVerified) {
      return;
    }

    try {
      setIsSyncingLocation(true);
      setErrorMessage('');

      const existingPermission = await Location.getForegroundPermissionsAsync();
      let grantedPermission = existingPermission;

      if (!existingPermission.granted) {
        grantedPermission = await Location.requestForegroundPermissionsAsync();
      }

      setPermissionStatus(grantedPermission.status);

      if (!grantedPermission.granted) {
        setErrorMessage('Location permission is required to update nearby matching.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextCoordinates = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setCoordinates(nextCoordinates);

      await setDoc(
        doc(db, 'users', user.uid),
        {
          latitude: nextCoordinates.latitude,
          longitude: nextCoordinates.longitude,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Failed to sync user location.', error);
      setErrorMessage('Unable to fetch your current location. Please try again.');
    } finally {
      setIsSyncingLocation(false);
    }
  };

  useEffect(() => {
    if (!user || !isEmailVerified) {
      setCoordinates(null);
      setErrorMessage('');
      setIsSyncingLocation(false);
      setPermissionStatus(null);
      return;
    }

    void refreshLocation();
  }, [isEmailVerified, user]);

  const value = useMemo<LocationContextValue>(
    () => ({
      coordinates,
      errorMessage,
      isSyncingLocation,
      permissionStatus,
      refreshLocation,
    }),
    [coordinates, errorMessage, isSyncingLocation, permissionStatus]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationSync() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error('useLocationSync must be used within a LocationProvider.');
  }

  return context;
}
