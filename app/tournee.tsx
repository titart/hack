import { useRouter } from "expo-router";
import {
  AlertTriangle,
  ChevronRight,
  Navigation,
  Package,
  Truck,
  Warehouse,
  X,
  Zap,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MapTournee from "@/components/map-tournee";
import { Text } from "@/components/ui/text";
import { useTournee } from "@/contexts/tournee-context";
import {
  getAllCollectedColis,
  getDechargement,
  getDechargementScannedCount,
  getOrderedPoints,
  getResultsMap,
  isAllPointsDone,
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
  const scannedCount = useMemo(
    () => getDechargementScannedCount(state),
    [state],
  );

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
  const [showOptimizationBanner, setShowOptimizationBanner] = useState(false);
  const [showDecheterieSheet, setShowDecheterieSheet] = useState(false);

  // Afficher le banner de réorganisation quand le point 3 passe en "failed"
  const point3Status = state.points[3]?.status;
  useEffect(() => {
    if (point3Status === "failed") {
      setShowOptimizationBanner(true);
    }
  }, [point3Status]);

  // Afficher la bottom sheet déchèterie quand le déchargement est déverrouillé
  const dechargementStatus = dechargement.status;
  useEffect(() => {
    if (dechargementStatus === "pending") {
      setShowDecheterieSheet(true);
    }
  }, [dechargementStatus]);

  const handleAcceptOptimization = useCallback(() => {
    swapPoints(4, 5);
    setShowOptimizationBanner(false);
  }, [swapPoints]);

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
                ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700"
                : "bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700";
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
                <View
                  className={`h-10 w-10 items-center justify-center rounded-lg ${iconBg} mr-3`}
                >
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
              ? "bg-green-100 dark:bg-green-900/50"
              : item.status === "success"
                ? "bg-green-600"
                : item.status === "failed"
                  ? "bg-red-500"
                  : "bg-secondary";
          const lightText =
            item.status === "success" || item.status === "failed";

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
                  <Text
                    className={`font-bold text-base ${lightText ? "text-white" : ""}`}
                  >
                    P{item.numero} - {item.creneauHoraire}
                  </Text>
                  <Text
                    className={`text-sm ${lightText ? "text-white/70" : "text-muted-foreground"}`}
                  >
                    {item.ville}
                    {postalCode ? `, ${postalCode}` : ""}
                  </Text>
                </View>
                <Text
                  className={`text-sm mt-0.5 ${lightText ? "text-white/70" : "text-muted-foreground"}`}
                >
                  {item.missionType ?? "Collecte"} ({item.colis.length})
                </Text>
              </View>

              {/* Chevron */}
              <ChevronRight
                size={20}
                color={lightText ? "#ffffff" : "#9ca3af"}
              />
            </Pressable>
          );
        })}

        {/* ── Point de déchargement ──────────────────────────────── */}
        {dechargement.status !== "locked" && (
          <Pressable
            onPress={() => router.push("/dechargement")}
            className={`flex-row items-center rounded-xl px-4 py-4 ${
              dechargement.status === "completed"
                ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700"
                : "bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700"
            }`}
          >
            {/* Warehouse icon */}
            <View
              className={`h-10 w-10 items-center justify-center rounded-lg mr-3 ${
                dechargement.status === "completed"
                  ? "bg-green-500"
                  : "bg-orange-500"
              }`}
            >
              <Warehouse size={18} color="#ffffff" />
            </View>

            {/* Content */}
            <View className="flex-1">
              <View className="flex-row items-baseline gap-2">
                <Text className="font-bold text-base">Dechetterie</Text>
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

      {/* ── Top sheet ajout étape déchèterie ───────────────── */}
      <Modal
        visible={showDecheterieSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDecheterieSheet(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-start"
          onPress={() => setShowDecheterieSheet(false)}
        >
          <Pressable
            className="bg-card rounded-b-3xl px-5 pt-10 pb-5"
            onPress={() => {}}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-foreground">
                Étape supplémentaire
              </Text>
              <Pressable
                onPress={() => setShowDecheterieSheet(false)}
                className="p-1"
              >
                <X size={22} color="#6b7280" />
              </Pressable>
            </View>

            {/* Message */}
            <View className="gap-2">
              <View className="flex-row items-center gap-3 py-3.5 px-4 rounded-xl bg-secondary border border-border">
                <AlertTriangle size={16} color="#f59e0b" />
                <View className="flex-1">
                  <Text className="text-base text-foreground">
                    Des éléments ne peuvent être recyclés, ajout d&apos;une
                    étape déchèterie
                  </Text>
                  <Text className="text-sm text-muted-foreground mt-1">
                    93 rue des Caboeufs, Gennevilliers 92230
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setShowDecheterieSheet(false)}
                className="flex-row items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-indigo-500 active:bg-indigo-600 mt-2"
              >
                <Text className="text-base text-white font-bold">Accepter</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Top sheet réorganisation de tournée ──────────── */}
      <Modal
        visible={showOptimizationBanner}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptimizationBanner(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-start"
          onPress={() => setShowOptimizationBanner(false)}
        >
          <Pressable
            className="bg-card rounded-b-3xl px-5 pt-10 pb-5"
            onPress={() => {}}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-foreground">
                Amélioration de la tournée possible
              </Text>
              <Pressable
                onPress={() => setShowOptimizationBanner(false)}
                className="p-1"
              >
                <X size={22} color="#6b7280" />
              </Pressable>
            </View>

            {/* Proposition */}
            <View className="gap-2">
              <View className="flex-row items-center gap-3 py-3.5 px-4 rounded-xl bg-secondary border border-border">
                <Zap size={16} color="#6366f1" />
                <Text className="text-base text-foreground flex-1">
                  Inverser les points P4 et P5
                </Text>
              </View>

              <Pressable
                onPress={handleAcceptOptimization}
                className="flex-row items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-indigo-500 active:bg-indigo-600 mt-2"
              >
                <Text className="text-base text-white font-bold">Accepter</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
