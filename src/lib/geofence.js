export const BALME_GEOFENCE = {
  name: "Balme Library",
  latitude: 5.6511292,
  longitude: -0.1870251,
  radiusMeters: 30,
};

export const OUTSIDE_GEOFENCE_GRACE_MS = 10 * 60 * 1000;
export const LOCATION_MAX_AGE_MS = 60 * 1000;

export function getDistanceFromBalmeMeters(latitude, longitude) {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const latitudeDifference = toRadians(latitude - BALME_GEOFENCE.latitude);
  const longitudeDifference = toRadians(longitude - BALME_GEOFENCE.longitude);
  const startLatitude = toRadians(BALME_GEOFENCE.latitude);
  const endLatitude = toRadians(latitude);
  const haversine = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(startLatitude) * Math.cos(endLatitude)
    * Math.sin(longitudeDifference / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
}

export function classifyBalmeGeofencePosition(latitude, longitude, accuracyMeters = 0) {
  const distance = getDistanceFromBalmeMeters(latitude, longitude);
  const accuracy = Math.max(0, accuracyMeters);
  if (distance + accuracy <= BALME_GEOFENCE.radiusMeters) return "inside";
  if (distance - accuracy > BALME_GEOFENCE.radiusMeters) return "outside";
  return "uncertain";
}
