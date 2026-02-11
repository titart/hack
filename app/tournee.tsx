import { useRouter } from "expo-router";
import { ChevronRight, Navigation, Package, Truck } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MapTournee from "@/components/map-tournee";
import { Text } from "@/components/ui/text";
import { useTournee } from "@/contexts/tournee-context";
import { ADRESSES_TOURNEE } from "@/data/adresses-tournee";

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
  const { results } = useTournee();
  const [activeNumero, setActiveNumero] = useState(ADRESSES_TOURNEE[0]?.numero);

  const totalColis = ADRESSES_TOURNEE.reduce(
    (sum, a) => sum + a.colis.length,
    0,
  );
  const nbPoints = ADRESSES_TOURNEE.length;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      {/* Header */}
      <View className="bg-neutral-600 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-xl font-bold">
            {TOURNEE_INFO.name} - {nbPoints} Points
          </Text>
          <Text className="text-white text-sm italic">
            {TOURNEE_INFO.date} : {TOURNEE_INFO.heureDebut} -{" "}
            {TOURNEE_INFO.heureFin}
          </Text>
        </View>
        <View className="h-px bg-white/20 my-2" />
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
          adresses={ADRESSES_TOURNEE}
          activeNumero={activeNumero}
          results={results}
          onMarkerPress={setActiveNumero}
        />
      </View>

      {/* Points list */}
      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-3">
        {ADRESSES_TOURNEE.map((item) => {
          const postalCode = extractPostalCode(item.adresse);

          return (
            <Pressable
              key={item.numero}
              onPress={() => {
                setActiveNumero(item.numero);
              }}
              onLongPress={() => {
                router.push(`/tournee-detail/${item.numero}`);
              }}
              className="flex-row items-center bg-neutral-200 rounded-xl px-4 py-4"
            >
              {/* Direction icon */}
              <View
                className="h-10 w-10 items-center justify-center rounded-lg bg-neutral-500 mr-3"
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
                  <Text className="font-bold text-base">
                    P{item.numero} - {item.creneauHoraire}
                  </Text>
                  <Text className="text-neutral-500 text-sm">
                    {item.ville}
                    {postalCode ? `, ${postalCode}` : ""}
                  </Text>
                </View>
                <Text className="text-neutral-600 text-sm mt-0.5">
                  {item.missionType ?? "Collecte"} ({item.colis.length})
                </Text>
              </View>

              {/* Chevron */}
              <ChevronRight size={20} color="#9ca3af" />
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
