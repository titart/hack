import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
    ChevronRight,
    FileText,
    HelpCircle,
    Info,
    MapPin,
    Phone,
    PlusCircle,
    User,
} from "lucide-react-native";
import { useMemo } from "react";
import { Linking, Platform, Pressable, ScrollView, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useTournee } from "@/contexts/tournee-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { THEME } from "@/lib/theme";
import { getPoint } from "@/lib/tournee-selectors";

export default function TourneeDetailScreen() {
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
  const { state, startPoint } = useTournee();

  const numInt = Number(numero);
  const point = useMemo(() => getPoint(state, numInt), [state, numInt]);

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
    }
  };

  // Colis ordonnés
  const colisList = point.colisOrder.map((name) => point.colis[name]);

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
                  onPress={() =>
                    router.push(
                      `/colis-photo/${encodeURIComponent(colis.name)}?numero=${numInt}`,
                    )
                  }
                  className="bg-card rounded-xl border border-border px-4 py-3"
                  style={{
                    shadowColor: "#000",
                    shadowOpacity: 0.03,
                    shadowRadius: 2,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
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
        <Pressable
          onPress={handleStart}
          className={`rounded-full py-3.5 items-center ${
            point.status === "pending" ? "bg-primary" : "border border-border"
          }`}
        >
          <Text
            className={`text-base font-medium ${
              point.status === "pending" ? "text-white" : "text-foreground"
            }`}
          >
            {point.status === "pending"
              ? "Démarrer"
              : point.status === "started"
                ? "En cours..."
                : point.status === "success"
                  ? "Terminé"
                  : "Échoué"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
