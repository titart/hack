import { Stack, useRouter } from "expo-router";
import {
  Camera,
  CheckCircle2,
  HelpCircle,
  MapPin,
  Phone,
  Recycle,
  Trash2,
  X as XIcon,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  View,
  Vibration,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Speech from "expo-speech";

import { Text } from "@/components/ui/text";
import { useTournee } from "@/contexts/tournee-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { THEME } from "@/lib/theme";
import {
  getAllCollectedColis,
  getDechargement,
  getDechargementScannedCount,
  findColisFromQR,
  isColisScanned,
} from "@/lib/tournee-selectors";
import type {
  DechargementColisState,
  DechargementDestination,
} from "@/types/tournee-store";

// ---------------------------------------------------------------------------
// Composant résultat du scan
// ---------------------------------------------------------------------------

function ScanResultModal({
  visible,
  result,
  onClose,
}: {
  visible: boolean;
  result: {
    colisName: string;
    destination: DechargementDestination;
  } | null;
  onClose: () => void;
}) {
  if (!result) return null;

  const isBenne = result.destination === "benne";
  const bgColor = isBenne ? "#EF4444" : "#22C55E";
  const icon = isBenne ? (
    <Trash2 size={64} color="white" />
  ) : (
    <Recycle size={64} color="white" />
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/60 items-center justify-center px-8"
        onPress={onClose}
      >
        <Pressable
          className="bg-card rounded-3xl w-full overflow-hidden"
          onPress={() => {}}
        >
          {/* Header coloré */}
          <View
            className="items-center justify-center py-8 gap-3"
            style={{ backgroundColor: bgColor }}
          >
            {icon}
            <Text className="text-white text-3xl font-black tracking-wide uppercase">
              {isBenne ? "Benne" : "Recyclage"}
            </Text>
          </View>

          {/* Détails */}
          <View className="p-6 gap-4">
            <Text className="text-lg font-bold text-foreground text-center">
              {result.colisName}
            </Text>

            <Text className="text-xs text-center text-muted-foreground">
              {isBenne
                ? "Direction la benne"
                : "Direction le recyclage"}
            </Text>

            {/* Bouton fermer */}
            <Pressable
              onPress={onClose}
              className="bg-primary rounded-full py-3.5 items-center mt-2"
            >
              <Text className="text-white font-semibold text-base">Compris</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Écran principal
// ---------------------------------------------------------------------------

export default function DechargementScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
  const {
    state,
    startDechargement,
    scanColisDechargement,
    completeDechargement,
  } = useTournee();

  const dechargement = useMemo(() => getDechargement(state), [state]);
  const collectedColis = useMemo(() => getAllCollectedColis(state), [state]);
  const scannedCount = useMemo(() => getDechargementScannedCount(state), [state]);
  const totalCollected = collectedColis.length;

  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanResult, setScanResult] = useState<{
    colisName: string;
    destination: DechargementDestination;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string | null>(null);

  const headerTitle = `P6 : ${dechargement.creneauHoraire} - ${dechargement.ville}`;

  // Démarrer le déchargement
  const handleStart = useCallback(() => {
    if (dechargement.status === "pending") {
      startDechargement();
    }
  }, [dechargement.status, startDechargement]);

  // Ouvrir le scanner
  const handleOpenScanner = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Permission requise",
          "L'accès à la caméra est nécessaire pour scanner les QR codes."
        );
        return;
      }
    }
    setLastScannedData(null);
    setShowCamera(true);
  }, [permission, requestPermission]);

  // Callback QR code scanné
  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      // Éviter les scans multiples du même QR
      if (data === lastScannedData) return;
      setLastScannedData(data);

      const found = findColisFromQR(state, data);
      if (!found) {
        Vibration.vibrate(300);
        Alert.alert(
          "Colis non trouvé",
          `Aucun colis collecté correspondant au QR code "${data}".\n\nFormat attendu : "numPoint:nomColis"\nExemple : "1:Machine à laver 1"`,
          [{ text: "OK", onPress: () => setLastScannedData(null) }]
        );
        return;
      }

      // Vérifier s'il est déjà scanné
      if (isColisScanned(state, found.pointNumero, found.colisName)) {
        Vibration.vibrate(200);
        Alert.alert(
          "Déjà scanné",
          `Le colis "${found.colisName}" a déjà été scanné.`,
          [{ text: "OK", onPress: () => setLastScannedData(null) }]
        );
        return;
      }

      // Scanner le colis
      scanColisDechargement(found.colisName, found.pointNumero);
      Vibration.vibrate(100);

      // Déterminer la destination depuis la propriété target du colis
      const destination: DechargementDestination =
        found.colis.target ?? "benne";

      // Fermer la caméra et afficher le résultat
      setShowCamera(false);
      setScanResult({
        colisName: found.colisName,
        destination,
      });
      setShowResult(true);

      // Annoncer vocalement la destination
      Speech.speak(destination === "benne" ? "À la benne" : "Recyclage", {
        language: "fr-FR",
      });
    },
    [state, lastScannedData, scanColisDechargement]
  );

  // Valider le déchargement
  const handleValidate = useCallback(() => {
    completeDechargement();
    router.back();
  }, [completeDechargement, router]);

  // Échec du déchargement
  const handleFail = useCallback(() => {
    router.back();
  }, [router]);

  // Progression
  const progressRatio =
    totalCollected > 0 ? scannedCount / totalCollected : 0;
  const progressPercent = Math.round(progressRatio * 100);
  const allScanned = scannedCount === totalCollected && totalCollected > 0;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: headerTitle,
          headerStyle: { backgroundColor: theme.header },
          headerTintColor: theme.headerForeground,
          headerTitleStyle: { fontSize: 16, fontWeight: "600" },
          headerBackTitle: "",
          headerRight: () => (
            <Pressable className="p-1">
              <HelpCircle size={24} color={theme.headerForeground} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        contentContainerClassName="px-5 pt-5 gap-5"
      >
        {/* ── Info du point de déchargement ──────────────────────── */}
        <View
          className="bg-card rounded-xl p-4 gap-2"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <View className="flex-row items-start gap-3">
            <MapPin size={18} color="#6b7280" />
            <Text className="text-base text-foreground underline flex-1">
              {dechargement.adresse}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Phone size={18} color="#6b7280" />
            <Text className="text-base text-foreground">06 07 08 09 10</Text>
          </View>
          {dechargement.notes && (
            <View className="flex-row items-center gap-3">
              <Text className="text-sm text-muted-foreground">📋</Text>
              <Text className="text-sm text-muted-foreground flex-1">
                {dechargement.notes}
              </Text>
            </View>
          )}
        </View>

        {/* ── Section Déchargement ──────────────────────────────── */}
        <View className="gap-3">
          <View className="flex-row items-baseline gap-2">
            <Text className="text-lg font-bold text-foreground">
              Déchargement
            </Text>
            <Text className="text-sm text-muted-foreground">
              {totalCollected} Colis/Equip. attendus
            </Text>
          </View>

          {/* Bouton Scan Colis */}
          <Pressable
            onPress={handleOpenScanner}
            className="border border-border rounded-xl py-3.5 items-center bg-card active:bg-accent"
            disabled={dechargement.status !== "started"}
            style={{
              opacity: dechargement.status === "started" ? 1 : 0.5,
            }}
          >
            <Text className="text-base font-medium text-foreground">
              Scan Colis
            </Text>
          </Pressable>

          {/* Liste des colis collectés */}
          <View className="gap-2 mt-2">
            {collectedColis.map(({ colisName, pointNumero, colis }) => {
              const key = `${pointNumero}-${colisName}`;
              const scanned = dechargement.scannedColis[key];
              const isBenne = scanned?.destination === "benne";
              const isRecyclage = scanned?.destination === "recyclage";

              return (
                <View
                  key={key}
                  className={`rounded-xl border px-4 py-3 flex-row items-center ${
                    scanned
                      ? isRecyclage
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                      : "bg-card border-border"
                  }`}
                >
                  {/* Icône statut */}
                  <View className="mr-3">
                    {scanned ? (
                      isRecyclage ? (
                        <Recycle size={22} color="#22C55E" />
                      ) : (
                        <Trash2 size={22} color="#EF4444" />
                      )
                    ) : (
                      <View className="h-5 w-5 rounded-full border-2 border-border" />
                    )}
                  </View>

                  {/* Infos colis */}
                  <View className="flex-1">
                    <Text className="text-base font-medium text-foreground">
                      {colis.type ?? colisName}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {[colis.marque, colis.modele].filter(Boolean).join(" ")}
                      {colis.poids ? ` · ${colis.poids}` : ""}
                    </Text>
                  </View>

                  {/* Badge destination */}
                  {scanned && (
                    <View
                      className={`px-3 py-1 rounded-full ${
                        isRecyclage ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      <Text className="text-xs font-bold text-white uppercase">
                        {scanned.destination}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Barre de progression ────────────────────────────────── */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-foreground">
              Colis détectés
            </Text>
            <View
              className="flex-1 ml-4 h-7 rounded-full overflow-hidden"
              style={{
                backgroundColor:
                  allScanned ? "#22C55E" : progressRatio > 0 ? "#f5b342" : "#e5e7eb",
              }}
            >
              <View className="flex-1 items-center justify-center">
                <Text
                  className={`text-sm font-bold ${
                    progressRatio > 0 ? "text-white" : "text-muted-foreground"
                  }`}
                >
                  {scannedCount}/{totalCollected}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Boutons du bas ──────────────────────────────────────── */}
      <View
        className="bg-card border-t border-border px-5 pb-8 pt-4"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: -2 },
          elevation: 4,
        }}
      >
        {dechargement.status === "pending" ? (
          <Pressable
            onPress={handleStart}
            className="bg-primary rounded-full py-3.5 items-center"
          >
            <Text className="text-base font-medium text-white">Démarrer</Text>
          </Pressable>
        ) : dechargement.status === "started" ? (
          <View className="flex-row gap-4">
            <Pressable
              onPress={handleFail}
              className="flex-1 py-3.5 items-center rounded-full border border-border bg-card active:bg-accent"
            >
              <Text className="text-sm font-semibold text-foreground">
                Echec
              </Text>
            </Pressable>
            <Pressable
              onPress={handleValidate}
              className={`flex-1 py-3.5 items-center rounded-full ${
                allScanned ? "bg-primary" : "border border-border bg-card"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  allScanned ? "text-white" : "text-foreground"
                }`}
              >
                Valider
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="rounded-full py-3.5 items-center border border-green-300 bg-green-50">
            <View className="flex-row items-center gap-2">
              <CheckCircle2 size={20} color="#22C55E" />
              <Text className="text-base font-medium text-green-700">
                Déchargement terminé
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Modal Scanner QR Code ──────────────────────────────── */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View className="flex-1 bg-black">
          {/* Header */}
          <View className="bg-black/80 pt-14 pb-4 px-5 flex-row items-center justify-between">
            <Text className="text-white text-lg font-bold">
              Scanner un QR code
            </Text>
            <Pressable onPress={() => setShowCamera(false)} className="p-2">
              <XIcon size={24} color="white" />
            </Pressable>
          </View>

          {/* Caméra */}
          <View className="flex-1">
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={handleBarCodeScanned}
            />
            {/* Overlay guide */}
            <View className="absolute inset-0 items-center justify-center">
              <View
                className="border-2 border-white/60 rounded-2xl"
                style={{ width: 250, height: 250 }}
              />
            </View>
          </View>

          {/* Instructions */}
          <View className="bg-black/80 py-6 px-5 items-center">
            <Text className="text-white text-center text-sm">
              Placez le QR code du colis dans le cadre
            </Text>
            <Text className="text-white/60 text-center text-xs mt-1">
              Format : numPoint:nomColis (ex: 1:Machine à laver 1)
            </Text>
          </View>
        </View>
      </Modal>

      {/* ── Modal résultat du scan ─────────────────────────────── */}
      <ScanResultModal
        visible={showResult}
        result={scanResult}
        onClose={() => {
          setShowResult(false);
          setScanResult(null);
          setLastScannedData(null);
        }}
      />
    </View>
  );
}
