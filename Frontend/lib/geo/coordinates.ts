export function isPlaceholderCoordinate(
  lat: number | null | undefined,
  lng: number | null | undefined,
): boolean {
  if (lat == null || lng == null) return true;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return true;
  return lat === 0 && lng === 0;
}

export function isValidCoordinate(
  lat: number | null | undefined,
  lng: number | null | undefined,
): boolean {
  if (isPlaceholderCoordinate(lat, lng)) return false;
  if (lat! < -90 || lat! > 90) return false;
  if (lng! < -180 || lng! > 180) return false;
  return true;
}

/** Haversine distance in kilometers. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Rough walking estimate: 5 km/h. */
export function estimateWalkingMinutes(distanceKm: number): number {
  return Math.round((distanceKm / 5) * 60);
}
