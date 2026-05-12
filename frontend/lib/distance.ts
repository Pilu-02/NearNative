const EARTH_RADIUS_METERS = 6371000;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceInMeters(
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number
) {
  const latitudeDelta = toRadians(endLatitude - startLatitude);
  const longitudeDelta = toRadians(endLongitude - startLongitude);
  const startLatitudeRadians = toRadians(startLatitude);
  const endLatitudeRadians = toRadians(endLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(startLatitudeRadians) *
      Math.cos(endLatitudeRadians) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_METERS * angularDistance;
}

export function formatApproximateDistance(distanceInMeters: number) {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters / 10) * 10} m away`;
  }

  return `${(distanceInMeters / 1000).toFixed(1)} km away`;
}
