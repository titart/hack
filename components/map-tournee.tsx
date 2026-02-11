import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
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
}

const MARKER_COLORS: Record<string, string> = {
  success: "#22c55e",
  fail: "#ef4444",
  active: "#ec4899",
  default: "#3b82f6",
};

export default function MapTournee({ adresses, activeNumero, results }: MapTourneeProps) {
  const initialRegion = useMemo(() => {
    if (adresses.length === 0) {
      return { latitude: 48.9122, longitude: 2.3342, latitudeDelta: 0.025, longitudeDelta: 0.025 };
    }
    const lats = adresses.map((a) => a.latitude);
    const lngs = adresses.map((a) => a.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const PADDING = 1.4;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * PADDING, 0.005),
      longitudeDelta: Math.max((maxLng - minLng) * PADDING, 0.005),
    };
  }, [adresses]);

  return (
    <MapView
      style={styles.map}
      initialRegion={initialRegion}
    >
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
          >
            <View style={styles.markerContainer}>
              <View style={[styles.marker, { backgroundColor: bgColor }]}>
                <Text style={styles.markerText}>{item.numero}</Text>
              </View>
            </View>
          </Marker>
        );
      })}
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
});
