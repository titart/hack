import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  Info,
  MapPin,
  Phone,
  PlusCircle,
  RotateCcw,
  User,
  X as XIcon,
} from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";

import { Text } from "@/components/ui/text";
import {
  FAILURE_REASONS,
  useTournee,
  type FailureReason,
} from "@/contexts/tournee-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { THEME } from "@/lib/theme";
import { getPoint } from "@/lib/tournee-selectors";
import { sendSms } from "@/tools/esendex";
import axios from "axios";

export default function TourneeDetailScreen() {
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
  const { state, startPoint, completePoint, resetPoint } = useTournee();

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showFailReasons, setShowFailReasons] = useState(false);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const digitRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const numInt = Number(numero);
  const point = useMemo(() => getPoint(state, numInt), [state, numInt]);
  const prevPoint = useMemo(() => {
    const idx = state.pointsOrder.indexOf(numInt);
    if (idx > 0) {
      return state.points[state.pointsOrder[idx - 1]];
    }
    return null;
  }, [state, numInt]);

  if (!point) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Adresse introuvable</Text>
      </View>
    );
  }

  const headerTitle = `Point ${point.numero} : ${point.creneauHoraire ?? ""} - ${point.ville ?? ""}`;

  const openMaps = () => {
    const { latitude, longitude, adresse: addr } = point;
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&q=${encodeURIComponent(addr)}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });
    Linking.openURL(url);
  };

  const callPhone = () => {
    if (point.phone) {
      Linking.openURL(`tel:${point.phone.replace(/\s/g, "")}`);
    }
  };

  const handleStart = () => {
    if (point.status === "pending") {
      startPoint(numInt);
      if (point.phone) {
        sendSms(
          point.phone.replace(/\s/g, ""),
          "Votre camion de collecte est en route, vous pouvez le suivre via: https://6960d7xx-3000.uks1.devtunnels.ms",
        ).catch((err) => console.warn("SMS error:", err));
      }
      axios
        .patch("https://6960d7xx-3000.uks1.devtunnels.ms/delivery", {
          confirmationCode: "",
          latitude: prevPoint?.latitude ?? point.latitude,
          longitude: prevPoint?.longitude ?? point.longitude,
          steps: [
            {
              id: "collect_validated",
              label: "Collecte validée",
              validated: true,
              timestamp: "10/02",
            },
            {
              id: "slot_validated",
              label: "Créneau validé",
              validated: true,
              timestamp: "11/02",
            },
            {
              id: "truck_en_route",
              label: "Le camion est en route",
              timestamp: "16h45",
              validated: true,
            },
            {
              id: "truck_is_here",
              label: "Le camion est là",
              validated: false,
            },
          ],
        })
        .catch((err) => console.warn("Delivery API error:", err));

      setTimeout(() => {
        axios
          .patch("https://6960d7xx-3000.uks1.devtunnels.ms/delivery", {
            estimatedArrivalMinutes: 0,
            confirmationCode: point.confirmationCode ?? "",
            latitude: point.latitude,
            longitude: point.longitude,
            steps: [
              {
                id: "collect_validated",
                label: "Collecte validée",
                validated: true,
                timestamp: "10/02",
              },
              {
                id: "slot_validated",
                label: "Créneau validé",
                validated: true,
                timestamp: "11/02",
              },
              {
                id: "truck_en_route",
                label: "Le camion est en route",
                validated: true,
              },
              {
                id: "truck_is_here",
                label: "Le camion est là",
                validated: true,
              },
            ],
          })
          .catch((err) => console.warn("Delivery API error (2nd call):", err));
      }, 5000);
    }
  };

  const handleSelectFailureReason = (reason: FailureReason) => {
    completePoint(numInt, "failed", reason);
    setShowFailReasons(false);
    router.back();
  };

  const handleDigitChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 3) {
      digitRefs[index + 1].current?.focus();
    }
    // Auto-confirm when all 4 digits are filled
    if (digit && next.every((d) => d !== "")) {
      Keyboard.dismiss();
      setShowCodeModal(false);
      setDigits(["", "", "", ""]);
      completePoint(numInt, "success");
      router.back();
    }
  };

  const handleDigitKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number,
  ) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      digitRefs[index - 1].current?.focus();
    }
  };

  // Colis ordonnés
  const colisList = point.colisOrder.map((name) => point.colis[name]);

  // Le point doit être démarré pour pouvoir interagir avec les colis
  const isStarted = point.status === "started";

  // Tous les colis sont traités (collecté ou refusé) ?
  const allColisDone = colisList.every(
    (c) => c.status === "collected" || c.status === "refused",
  );

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
        contentContainerStyle={{ paddingBottom: 100 }}
        contentContainerClassName="px-5 pt-5 gap-6"
      >
        {/* ── Info client ─────────────────────────────────────── */}
        <View
          className="bg-card rounded-xl p-5 gap-4"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <Text className="text-lg font-bold text-foreground">Info client</Text>

          {/* Nom client */}
          <View className="flex-row items-center gap-3">
            <User size={18} color="#6b7280" />
            <Text className="text-base text-foreground">
              {point.clientName ?? "Client"}
            </Text>
          </View>

          {/* Adresse */}
          <Pressable onPress={openMaps} className="flex-row items-start gap-3">
            <MapPin size={18} color="#6b7280" />
            <Text className="text-base text-foreground underline flex-1">
              {point.adresse}
            </Text>
          </Pressable>

          {/* Téléphone */}
          {point.phone && (
            <Pressable
              onPress={callPhone}
              className="flex-row items-center gap-3"
            >
              <Phone size={18} color="#6b7280" />
              <Text className="text-base text-foreground">{point.phone}</Text>
            </Pressable>
          )}

          {/* Notes */}
          {point.notes && (
            <View className="flex-row items-start gap-3">
              <View className="pt-0.5">
                <Info size={18} color="#6b7280" />
              </View>
              <Text className="text-sm text-muted-foreground flex-1 leading-5">
                {point.notes}
              </Text>
            </View>
          )}
        </View>

        {/* ── Mission : Collecte ──────────────────────────────── */}
        <View className="gap-4">
          {/* Titre mission */}
          <View className="flex-row items-baseline gap-2 flex-wrap">
            <Text className="text-lg font-bold text-foreground">
              Mission : {point.missionType ?? "Collecte"}
            </Text>
            {(point.missionRef || point.missionPartenaire) && (
              <Text className="text-sm text-muted-foreground">
                ({point.missionRef}
                {point.missionPartenaire ? ` - ${point.missionPartenaire}` : ""}
                )
              </Text>
            )}
          </View>

          {/* Liste des appareils */}
          <View className="gap-3">
            {colisList.map((colis) => {
              const isCollected = colis.status === "collected";
              const refusalReason =
                colis.status === "refused"
                  ? (colis.refusalReason ?? null)
                  : null;
              const subtitle = [colis.marque, colis.modele, colis.poids]
                .filter(Boolean)
                .join(", ");

              // Déterminer le statut visuel
              const statusLabel = isCollected
                ? "Collecté"
                : refusalReason
                  ? "Non collecté"
                  : "Non collecté";
              const statusBg = isCollected
                ? "bg-green-100"
                : refusalReason
                  ? "bg-red-100"
                  : "bg-red-100";
              const statusText = isCollected
                ? "text-green-800"
                : refusalReason
                  ? "text-red-900"
                  : "text-red-900";

              return (
                <Pressable
                  key={colis.name}
                  onPress={() => {
                    if (!isStarted) return;
                    router.push(
                      `/colis-photo/${encodeURIComponent(colis.name)}?numero=${numInt}`,
                    );
                  }}
                  disabled={!isStarted}
                  className="bg-card rounded-xl border border-border px-4 py-3"
                  style={{
                    shadowColor: "#000",
                    shadowOpacity: 0.03,
                    shadowRadius: 2,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                    opacity: isStarted ? 1 : 0.5,
                  }}
                >
                  <View className="flex-row items-center">
                    {/* Gauche : nom appareil + infos */}
                    <View className="flex-1 gap-0.5">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-base font-medium text-foreground">
                          {colis.type ?? colis.name}
                        </Text>
                        <FileText size={14} color="#9ca3af" />
                      </View>
                      {subtitle ? (
                        <Text className="text-sm text-muted-foreground">
                          {subtitle}
                        </Text>
                      ) : null}
                    </View>

                    {/* Droite : statut + catégorie + chevron */}
                    <View className="flex-row items-center gap-2">
                      <View className="items-end gap-0.5">
                        <View className={`px-3 py-1 rounded ${statusBg}`}>
                          <Text className={`text-sm font-bold ${statusText}`}>
                            {statusLabel}
                          </Text>
                        </View>
                        {colis.categorie && (
                          <Text className="text-xs text-red-400">
                            {colis.categorie}
                          </Text>
                        )}
                      </View>
                      <ChevronRight size={20} color="#d1d5db" />
                    </View>
                  </View>

                  {/* Raison de refus */}
                  {refusalReason && (
                    <View className="mt-2 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                      <Text className="text-xs text-red-600">
                        Raison : {refusalReason}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Ajouter un appareil */}
          <Pressable className="flex-row items-center justify-center gap-2 py-2">
            <PlusCircle size={20} color="#6b7280" />
            <Text className="text-base text-muted-foreground underline">
              Ajouter un appareil
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Bouton Démarrer (fixé en bas) ─────────────────────── */}
      <View
        className="bg-card border-t border-border px-6 pb-8 pt-4"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: -2 },
          elevation: 4,
        }}
      >
        {point.status === "started" ? (
          <View className="gap-3">
            {/* Message si colis pas tous traités */}
            {!allColisDone && (
              <Text className="text-xs text-center text-muted-foreground">
                Tous les colis doivent être collectés ou refusés avant de
                terminer
              </Text>
            )}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowFailReasons(true)}
                className="flex-1 rounded-full py-3.5 items-center bg-red-500"
              >
                <Text className="text-base font-medium text-white">Échoué</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowCodeModal(true)}
                disabled={!allColisDone}
                className={`flex-1 rounded-full py-3.5 items-center ${
                  allColisDone ? "bg-green-500" : "bg-green-500/40"
                }`}
              >
                <Text className="text-base font-medium text-white">Succès</Text>
              </Pressable>
            </View>
          </View>
        ) : point.status === "success" || point.status === "failed" ? (
          <View className="flex-row gap-3 items-center">
            <Pressable
              className={`flex-1 rounded-full py-3.5 items-center ${
                point.status === "success" ? "bg-green-600" : "bg-red-500"
              }`}
              disabled
            >
              <Text className="text-base font-medium text-white">
                {point.status === "success" ? "Terminé" : "Échoué"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => resetPoint(numInt)}
              className="h-12 w-12 items-center justify-center rounded-full border border-border"
            >
              <RotateCcw size={20} color="#6b7280" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleStart}
            className="rounded-full py-3.5 items-center bg-primary"
          >
            <Text className="text-base font-medium text-white">Démarrer</Text>
          </Pressable>
        )}
      </View>

      {/* ── Bottom sheet code à 4 chiffres ─────────────────── */}
      <Modal
        visible={showCodeModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCodeModal(false);
          setDigits(["", "", "", ""]);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/50"
            onPress={() => {
              setShowCodeModal(false);
              setDigits(["", "", "", ""]);
            }}
          />
          <View className="bg-card rounded-t-3xl px-6 pt-6 pb-10 gap-6">
            <Text className="text-lg font-bold text-foreground">Valider</Text>

            <View className="flex-row justify-center gap-4">
              {digits.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={digitRefs[i]}
                  value={digit}
                  onChangeText={(t) => handleDigitChange(t, i)}
                  onKeyPress={(e) => handleDigitKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  autoFocus={i === 0}
                  className="w-16 h-20 border-2 border-border rounded-xl bg-muted/30 text-center text-3xl font-bold text-foreground"
                  selectTextOnFocus
                />
              ))}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Bottom sheet raisons d'échec ──────────────────── */}
      <Modal
        visible={showFailReasons}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFailReasons(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowFailReasons(false)}
        >
          <Pressable
            className="bg-card rounded-t-3xl px-5 pb-10 pt-5"
            onPress={() => {}}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-foreground">
                Spécifier la raison
              </Text>
              <Pressable
                onPress={() => setShowFailReasons(false)}
                className="p-1"
              >
                <XIcon size={22} color="#6b7280" />
              </Pressable>
            </View>

            {/* Options */}
            <View className="gap-2">
              {FAILURE_REASONS.map((reason) => (
                <Pressable
                  key={reason}
                  onPress={() => handleSelectFailureReason(reason)}
                  className="flex-row items-center gap-3 py-3.5 px-4 rounded-xl bg-secondary active:bg-accent border border-border"
                >
                  <ChevronDown
                    size={16}
                    color="#9ca3af"
                    style={{ transform: [{ rotate: "-90deg" }] }}
                  />
                  <Text className="text-base text-foreground flex-1">
                    {reason}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
