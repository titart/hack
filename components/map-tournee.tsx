import { StyleSheet, View } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { Text } from "@/components/ui/text";

export interface AdresseTournee {
  numero: number;
  adresse: string;
  latitude: number;
  longitude: number;
}

interface MapTourneeProps {
  adresses: AdresseTournee[];
}

export default function MapTournee({ adresses }: MapTourneeProps) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 48.9122,
        longitude: 2.3342,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      }}
    >
      {adresses.map((item) => (
        <Marker
          key={item.numero}
          coordinate={{
            latitude: item.latitude,
            longitude: item.longitude,
          }}
          title={`${item.numero}. ${item.adresse}`}
        >
          <View style={styles.markerContainer}>
            <View style={styles.marker}>
              <Text style={styles.markerText}>{item.numero}</Text>
            </View>
          </View>
        </Marker>
      ))}
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
