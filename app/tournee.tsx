import { useRouter } from "expo-router";
import { ChevronRight, Navigation, Package, Truck } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MapTournee from "@/components/map-tournee";
import { Text } from "@/components/ui/text";
import { useTournee } from "@/contexts/tournee-context";
import { getOrderedPoints, getResultsMap } from "@/lib/tournee-selectors";

const TOURNEE_INFO = {
  name: "T01",
  date: "12 Février",
  heureDebut: "14h",
  heureFin: "17h",
  totalPoids: "916kg",
  chauffeur: "Phany Jackmain",
  truskers: 2,
  distance: "90km",
  immatriculation: "FY-JHT-88",
  volume: "20m3",
};

function extractPostalCode(adresse: string): string {
  const match = adresse.match(/\d{5}/);
  return match ? match[0] : "";
}

export default function TourneeScreen() {
  const router = useRouter();
  const { state, swapPoints } = useTournee();

  const orderedPoints = useMemo(() => getOrderedPoints(state), [state]);
  const results = useMemo(() => getResultsMap(state), [state]);

  // Convertir PointLivraisonState[] vers le format attendu par MapTournee
  const orderedAdresses = useMemo(
    () =>
      orderedPoints.map((p) => ({
        ...p,
        colis: p.colisOrder.map((name) => p.colis[name]),
      })),
    [orderedPoints],
  );

  const [activeNumero, setActiveNumero] = useState(state.pointsOrder[0]);

  const handleSwap8and9 = useCallback(() => {
    swapPoints(8, 9);
  }, [swapPoints]);

  const totalColis = orderedPoints.reduce(
    (sum, p) => sum + p.colisOrder.length,
    0,
  );
  const nbPoints = orderedPoints.length;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      {/* Header */}
      <View className="bg-header px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-xl font-bold">
            {TOURNEE_INFO.name} - {nbPoints} Points
          </Text>
          <Text className="text-white text-sm italic">
            {TOURNEE_INFO.date} : {TOURNEE_INFO.heureDebut} -{" "}
            {TOURNEE_INFO.heureFin}
          </Text>
        </View>
        <View className="h-px bg-header-foreground/20 my-2" />
        <View className="flex-row items-center justify-between">
          <Text className="text-white font-bold text-sm">
            {totalColis} Colis - {TOURNEE_INFO.totalPoids}
          </Text>
          <View className="flex-row items-center gap-3">
            <Text className="text-white font-bold text-sm">
              {TOURNEE_INFO.chauffeur}
            </Text>
            <Text className="text-white/60 text-xs">
              {TOURNEE_INFO.truskers} Truskers
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between mt-1">
          <View className="flex-row items-center gap-1">
            <Package size={14} color="white" />
            <Text className="text-white text-sm">{TOURNEE_INFO.distance}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Truck size={14} color="white" />
            <Text className="text-white text-sm">
              {TOURNEE_INFO.immatriculation}
            </Text>
          </View>
          <Text className="text-white text-sm">{TOURNEE_INFO.volume}</Text>
        </View>
      </View>

      {/* Map */}
      <View style={{ height: "35%" }}>
        <MapTournee
          adresses={orderedAdresses}
          activeNumero={activeNumero}
          results={results}
          onMarkerPress={setActiveNumero}
          onSwapPress={handleSwap8and9}
        />
      </View>

      {/* Points list */}
      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-3">
        {orderedAdresses.map((item) => {
          const postalCode = extractPostalCode(item.adresse);
          const statusBg =
            item.status === "started"
              ? "bg-green-100"
              : item.status === "success"
                ? "bg-green-600"
                : item.status === "failed"
                  ? "bg-red-500"
                  : "bg-secondary";
          const lightText = item.status === "success" || item.status === "failed";

          return (
            <Pressable
              key={item.numero}
              onPress={() => {
                router.push(`/tournee-detail/${item.numero}`);
                setActiveNumero(item.numero);
              }}
              className={`flex-row items-center rounded-xl px-4 py-4 ${statusBg}`}
            >
              {/* Direction icon */}
              <View
                className="h-10 w-10 items-center justify-center rounded-lg bg-primary mr-3"
                style={{ transform: [{ rotate: "45deg" }] }}
              >
                <Navigation
                  size={18}
                  color="#ffffff"
                  style={{ transform: [{ rotate: "-45deg" }] }}
                />
              </View>

              {/* Content */}
              <View className="flex-1">
                <View className="flex-row items-baseline gap-2">
                  <Text className={`font-bold text-base ${lightText ? "text-white" : ""}`}>
                    P{item.numero} - {item.creneauHoraire}
                  </Text>
                  <Text className={`text-sm ${lightText ? "text-white/70" : "text-muted-foreground"}`}>
                    {item.ville}
                    {postalCode ? `, ${postalCode}` : ""}
                  </Text>
                </View>
                <Text className={`text-sm mt-0.5 ${lightText ? "text-white/70" : "text-muted-foreground"}`}>
                  {item.missionType ?? "Collecte"} ({item.colis.length})
                </Text>
              </View>

              {/* Chevron */}
              <ChevronRight size={20} color={lightText ? "#ffffff" : "#9ca3af"} />
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
