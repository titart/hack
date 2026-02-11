import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, AnimatedRegion, Polyline } from "react-native-maps";
import { Text } from "@/components/ui/text";

export interface AdresseTournee {
  numero: number;
  adresse: string;
  latitude: number;
  longitude: number;
  colis: { name: string }[];
}

interface MapTourneeProps {
  adresses: AdresseTournee[];
  activeNumero?: number;
  results?: Record<number, "success" | "fail">;
  onMarkerPress?: (numero: number) => void;
}

interface LatLng {
  latitude: number;
  longitude: number;
}

interface SegmentRoute {
  fromNumero: number;
  toNumero: number;
  coords: LatLng[];
}

const MARKER_COLORS: Record<string, string> = {
  success: "#22c55e",
  fail: "#ef4444",
  active: "#ec4899",
  default: "#3b82f6",
};

const SEGMENT_COLORS = {
  done: "#22c55e",    // vert
  active: "#ec4899",  // rose
  upcoming: "#3b82f6", // bleu
};

const TOTAL_ANIMATION_DURATION = 3000;
const MIN_STEP_DURATION = 16;

/** Fetch road route between two points from OSRM */
async function fetchSegmentRoute(from: LatLng, to: LatLng): Promise<LatLng[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?geometries=geojson&overview=full`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== "Ok" || !data.routes?.[0]) return [from, to];

    const coords: [number, number][] = data.routes[0].geometry.coordinates;
    return coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
  } catch {
    return [from, to];
  }
}

/** Fetch all segments in parallel */
async function fetchAllSegments(adresses: AdresseTournee[]): Promise<SegmentRoute[]> {
  if (adresses.length < 2) return [];

  const promises = adresses.slice(0, -1).map((from, i) => {
    const to = adresses[i + 1];
    const fromCoord: LatLng = { latitude: from.latitude, longitude: from.longitude };
    const toCoord: LatLng = { latitude: to.latitude, longitude: to.longitude };

    return fetchSegmentRoute(fromCoord, toCoord).then((coords) => ({
      fromNumero: from.numero,
      toNumero: to.numero,
      coords,
    }));
  });

  return Promise.all(promises);
}

/** Calculate distance between two points (for proportional timing) */
function distanceBetween(a: LatLng, b: LatLng): number {
  const dlat = b.latitude - a.latitude;
  const dlng = b.longitude - a.longitude;
  return Math.sqrt(dlat * dlat + dlng * dlng);
}

export default function MapTournee({ adresses, activeNumero, results, onMarkerPress }: MapTourneeProps) {
  const firstAdresse = adresses[0];
  const mapRef = useRef<MapView>(null);
  const prevNumeroRef = useRef<number | undefined>(activeNumero);
  const animationRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const [segments, setSegments] = useState<SegmentRoute[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const truckCoord = useRef(
    new AnimatedRegion({
      latitude: firstAdresse?.latitude ?? 48.9122,
      longitude: firstAdresse?.longitude ?? 2.3342,
      latitudeDelta: 0,
      longitudeDelta: 0,
    })
  ).current;

  const coordinates = useMemo(
    () => adresses.map((a) => ({ latitude: a.latitude, longitude: a.longitude })),
    [adresses]
  );

  const handleMapReady = useCallback(() => {
    if (coordinates.length > 0) {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: false,
      });
    }
  }, [coordinates]);

  // Fetch all segments once on mount
  useEffect(() => {
    fetchAllSegments(adresses).then(setSegments);
  }, [adresses]);

  const animateAlongRoute = useCallback(
    async (waypoints: LatLng[]) => {
      if (waypoints.length < 2) return;

      let totalDist = 0;
      for (let i = 1; i < waypoints.length; i++) {
        totalDist += distanceBetween(waypoints[i - 1], waypoints[i]);
      }
      if (totalDist === 0) return;

      const token = { cancelled: false };
      animationRef.current.cancelled = true;
      animationRef.current = token;

      setIsAnimating(true);

      for (let i = 1; i < waypoints.length; i++) {
        if (token.cancelled) {
          setIsAnimating(false);
          return;
        }

        const segDist = distanceBetween(waypoints[i - 1], waypoints[i]);
        const segDuration = Math.max(
          MIN_STEP_DURATION,
          Math.round((segDist / totalDist) * TOTAL_ANIMATION_DURATION)
        );

        await new Promise<void>((resolve) => {
          truckCoord
            .timing({
              latitude: waypoints[i].latitude,
              longitude: waypoints[i].longitude,
              latitudeDelta: 0,
              longitudeDelta: 0,
              duration: segDuration,
              useNativeDriver: false,
              toValue: 0,
            })
            .start(() => resolve());
        });
      }

      if (!token.cancelled) {
        setIsAnimating(false);
      }
    },
    [truckCoord]
  );

  // Animate truck when activeNumero changes
  useEffect(() => {
    if (activeNumero == null) return;

    const prevNumero = prevNumeroRef.current;
    prevNumeroRef.current = activeNumero;

    const from = adresses.find((a) => a.numero === prevNumero);
    const to = adresses.find((a) => a.numero === activeNumero);
    if (!to) return;

    // First load — just place the truck, no animation
    if (!from || from.numero === to.numero) {
      truckCoord.setValue({
        latitude: to.latitude,
        longitude: to.longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      });
      return;
    }

    // Use cached segment if available, otherwise fetch
    const cached = segments.find((s) => s.fromNumero === from.numero && s.toNumero === to.numero);
    if (cached) {
      animateAlongRoute(cached.coords);
    } else {
      const fromCoord: LatLng = { latitude: from.latitude, longitude: from.longitude };
      const toCoord: LatLng = { latitude: to.latitude, longitude: to.longitude };
      fetchSegmentRoute(fromCoord, toCoord).then((waypoints) => {
        animateAlongRoute(waypoints);
      });
    }
  }, [activeNumero, adresses, truckCoord, animateAlongRoute, segments]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      onMapReady={handleMapReady}
    >
      {/* Colored segments */}
      {segments.map((seg) => {
        let color = SEGMENT_COLORS.upcoming;
        if (activeNumero != null) {
          if (seg.toNumero < activeNumero) {
            color = SEGMENT_COLORS.done;
          } else if (seg.toNumero === activeNumero) {
            color = isAnimating ? SEGMENT_COLORS.active : SEGMENT_COLORS.done;
          }
        }

        return (
          <Polyline
            key={`${seg.fromNumero}-${seg.toNumero}`}
            coordinates={seg.coords}
            strokeColor={color}
            strokeWidth={4}
            lineDashPattern={[6, 4]}
          />
        );
      })}

      {adresses.map((item) => {
        const isActive = activeNumero != null && item.numero === activeNumero;
        const result = results?.[item.numero];
        const bgColor = isActive
          ? MARKER_COLORS.active
          : result
            ? MARKER_COLORS[result]
            : MARKER_COLORS.default;

        return (
          <Marker
            key={item.numero}
            coordinate={{
              latitude: item.latitude,
              longitude: item.longitude,
            }}
            title={`${item.numero}. ${item.adresse}`}
            onPress={() => onMarkerPress?.(item.numero)}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.marker, { backgroundColor: bgColor }]}>
                <Text style={styles.markerText}>{item.numero}</Text>
              </View>
            </View>
          </Marker>
        );
      })}

      <Marker.Animated
        coordinate={truckCoord}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ zIndex: 999 }}
      >
        <View style={styles.truckContainer}>
          <Text style={styles.truckEmoji}>🚛</Text>
        </View>
      </Marker.Animated>
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: "center",
  },
  marker: {
    backgroundColor: "#3b82f6",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  markerText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  truckContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  truckEmoji: {
    fontSize: 28,
  },
});
