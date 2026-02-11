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
import { Linking, Platform, Pressable, ScrollView, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useTournee } from "@/contexts/tournee-context";
import { ADRESSES_TOURNEE } from "@/data/adresses-tournee";

export default function TourneeDetailScreen() {
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const router = useRouter();
  const { colisPhotos } = useTournee();

  const numInt = Number(numero);
  const adresse = ADRESSES_TOURNEE.find((a) => a.numero === numInt);

  if (!adresse) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Adresse introuvable</Text>
      </View>
    );
  }

  const headerTitle = `Point ${adresse.numero} : ${adresse.creneauHoraire ?? ""} - ${adresse.ville ?? ""}`;

  function openMaps() {
    const { latitude, longitude, adresse: addr } = adresse!;
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&q=${encodeURIComponent(addr)}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });
    Linking.openURL(url);
  }

  function callPhone() {
    if (adresse?.phone) {
      Linking.openURL(`tel:${adresse.phone.replace(/\s/g, "")}`);
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: headerTitle,
          headerStyle: { backgroundColor: "#3a3a3a" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontSize: 16, fontWeight: "600" },
          headerBackTitle: "",
          headerRight: () => (
            <Pressable className="p-1">
              <HelpCircle size={24} color="#ffffff" />
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
          className="bg-white rounded-xl p-5 gap-4"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <Text className="text-lg font-bold text-gray-900">Info client</Text>

          {/* Nom client */}
          <View className="flex-row items-center gap-3">
            <User size={18} color="#6b7280" />
            <Text className="text-base text-gray-900">
              {adresse.clientName ?? "Client"}
            </Text>
          </View>

          {/* Adresse */}
          <Pressable onPress={openMaps} className="flex-row items-start gap-3">
            <MapPin size={18} color="#6b7280" />
            <Text className="text-base text-gray-900 underline flex-1">
              {adresse.adresse}
            </Text>
          </Pressable>

          {/* Téléphone */}
          {adresse.phone && (
            <Pressable
              onPress={callPhone}
              className="flex-row items-center gap-3"
            >
              <Phone size={18} color="#6b7280" />
              <Text className="text-base text-gray-900">{adresse.phone}</Text>
            </Pressable>
          )}

          {/* Notes */}
          {adresse.notes && (
            <View className="flex-row items-start gap-3">
              <View className="pt-0.5">
                <Info size={18} color="#6b7280" />
              </View>
              <Text className="text-sm text-gray-500 flex-1 leading-5">
                {adresse.notes}
              </Text>
            </View>
          )}
        </View>

        {/* ── Mission : Collecte ──────────────────────────────── */}
        <View className="gap-4">
          {/* Titre mission */}
          <View className="flex-row items-baseline gap-2 flex-wrap">
            <Text className="text-lg font-bold text-gray-900">
              Mission : {adresse.missionType ?? "Collecte"}
            </Text>
            {(adresse.missionRef || adresse.missionPartenaire) && (
              <Text className="text-sm text-gray-400">
                ({adresse.missionRef}
                {adresse.missionPartenaire
                  ? ` - ${adresse.missionPartenaire}`
                  : ""}
                )
              </Text>
            )}
          </View>

          {/* Liste des appareils */}
          <View className="gap-3">
            {adresse.colis.map((colis) => {
              const isCollected = colisPhotos[colis.name] != null;
              const subtitle = [colis.marque, colis.modele, colis.poids]
                .filter(Boolean)
                .join(", ");

              return (
                <Pressable
                  key={colis.name}
                  onPress={() =>
                    router.push(
                      `/colis-photo/${encodeURIComponent(colis.name)}?numero=${numInt}`,
                    )
                  }
                  className="flex-row items-center bg-white rounded-xl border border-gray-200 px-4 py-3"
                  style={{
                    shadowColor: "#000",
                    shadowOpacity: 0.03,
                    shadowRadius: 2,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                  }}
                >
                  {/* Gauche : nom appareil + infos */}
                  <View className="flex-1 gap-0.5">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-medium text-gray-900">
                        {colis.type ?? colis.name}
                      </Text>
                      <FileText size={14} color="#9ca3af" />
                    </View>
                    {subtitle ? (
                      <Text className="text-sm text-gray-400">{subtitle}</Text>
                    ) : null}
                  </View>

                  {/* Droite : statut + catégorie + chevron */}
                  <View className="flex-row items-center gap-2">
                    <View className="items-end gap-0.5">
                      <View
                        className={`px-3 py-1 rounded ${
                          isCollected ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        <Text
                          className={`text-sm font-bold ${
                            isCollected ? "text-green-800" : "text-red-900"
                          }`}
                        >
                          {isCollected ? "Collecté" : "Non collecté"}
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
                </Pressable>
              );
            })}
          </View>

          {/* Ajouter un appareil */}
          <Pressable className="flex-row items-center justify-center gap-2 py-2">
            <PlusCircle size={20} color="#6b7280" />
            <Text className="text-base text-gray-600 underline">
              Ajouter un appareil
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Bouton Démarrer (fixé en bas) ─────────────────────── */}
      <View
        className="bg-white border-t border-gray-200 px-6 pb-8 pt-4"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: -2 },
          elevation: 4,
        }}
      >
        <Pressable className="border border-gray-300 rounded-full py-3.5 items-center">
          <Text className="text-base font-medium text-gray-700">Démarrer</Text>
        </Pressable>
      </View>
    </View>
  );
}
