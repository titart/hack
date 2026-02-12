import { useRouter } from "expo-router";
import { ChevronRight, Navigation, Package, Truck, Warehouse } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MapTournee from "@/components/map-tournee";
import { Text } from "@/components/ui/text";
import { useTournee } from "@/contexts/tournee-context";
import {
  getOrderedPoints,
  getResultsMap,
  isAllPointsDone,
  getDechargement,
  getAllCollectedColis,
  getDechargementScannedCount,
} from "@/lib/tournee-selectors";

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
  const { state, swapPoints, unlockDechargement } = useTournee();

  const orderedPoints = useMemo(() => getOrderedPoints(state), [state]);
  const results = useMemo(() => getResultsMap(state), [state]);
  const allDone = useMemo(() => isAllPointsDone(state), [state]);
  const dechargement = useMemo(() => getDechargement(state), [state]);
  const collectedColis = useMemo(() => getAllCollectedColis(state), [state]);
  const scannedCount = useMemo(() => getDechargementScannedCount(state), [state]);

  // Déverrouiller le déchargement automatiquement quand tous les points sont terminés
  useEffect(() => {
    if (allDone && dechargement.status === "locked") {
      unlockDechargement();
    }
  }, [allDone, dechargement.status, unlockDechargement]);

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

          // Point flagué déchargement : apparence et navigation spéciales
          if (item.isDechargement) {
            const isLocked = dechargement.status === "locked";
            const isCompleted = dechargement.status === "completed";
            const dechBg = isLocked
              ? "bg-secondary opacity-50"
              : isCompleted
                ? "bg-green-50 border border-green-200"
                : "bg-orange-50 border border-orange-200";
            const iconBg = isLocked
              ? "bg-muted-foreground"
              : isCompleted
                ? "bg-green-500"
                : "bg-orange-500";

            return (
              <Pressable
                key={item.numero}
                disabled={isLocked}
                onPress={() => {
                  router.push("/dechargement");
                  setActiveNumero(item.numero);
                }}
                className={`flex-row items-center rounded-xl px-4 py-4 ${dechBg}`}
              >
                {/* Warehouse icon */}
                <View className={`h-10 w-10 items-center justify-center rounded-lg ${iconBg} mr-3`}>
                  <Warehouse size={18} color="#ffffff" />
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row items-baseline gap-2">
                    <Text className="font-bold text-base">
                      P{item.numero} - {item.creneauHoraire}
                    </Text>
                    <Text className="text-muted-foreground text-sm">
                      {item.ville}
                      {postalCode ? `, ${postalCode}` : ""}
                    </Text>
                  </View>
                  <Text className="text-muted-foreground text-sm mt-0.5">
                    Déchargement
                    {!isLocked && collectedColis.length > 0
                      ? ` · ${collectedColis.length} colis collectés`
                      : ""}
                    {scannedCount > 0
                      ? ` · ${scannedCount}/${collectedColis.length} scannés`
                      : ""}
                  </Text>
                </View>

                {/* Chevron */}
                <ChevronRight size={20} color="#9ca3af" />
              </Pressable>
            );
          }

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

        {/* ── Point de déchargement ──────────────────────────────── */}
        {dechargement.status !== "locked" && (
          <Pressable
            onPress={() => router.push("/dechargement")}
            className={`flex-row items-center rounded-xl px-4 py-4 ${
              dechargement.status === "completed"
                ? "bg-green-50 border border-green-200"
                : "bg-orange-50 border border-orange-200"
            }`}
          >
            {/* Warehouse icon */}
            <View
              className={`h-10 w-10 items-center justify-center rounded-lg mr-3 ${
                dechargement.status === "completed" ? "bg-green-500" : "bg-orange-500"
              }`}
            >
              <Warehouse size={18} color="#ffffff" />
            </View>

            {/* Content */}
            <View className="flex-1">
              <View className="flex-row items-baseline gap-2">
                <Text className="font-bold text-base">
                  Déchargement - {dechargement.creneauHoraire}
                </Text>
                <Text className="text-muted-foreground text-sm">
                  {dechargement.ville}
                </Text>
              </View>
              <Text className="text-muted-foreground text-sm mt-0.5">
                {collectedColis.length} colis collectés
                {scannedCount > 0
                  ? ` · ${scannedCount}/${collectedColis.length} scannés`
                  : ""}
              </Text>
            </View>

            {/* Chevron */}
            <ChevronRight size={20} color="#9ca3af" />
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
