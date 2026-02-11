import { View, Pressable, ScrollView, Linking, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronRight, MapPin, Package } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { ADRESSES_TOURNEE } from "@/data/adresses-tournee";
import { useTournee } from "@/contexts/tournee-context";

export default function TourneeDetailScreen() {
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const router = useRouter();
  const { colisPhotos, setResult } = useTournee();

  const numInt = Number(numero);
  const adresse = ADRESSES_TOURNEE.find((a) => a.numero === numInt);

  if (!adresse) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Adresse introuvable</Text>
      </View>
    );
  }

  const allColisValidated = adresse.colis.every(
    (c) => colisPhotos[c.name] != null
  );

  function openMaps() {
    const { latitude, longitude, adresse: addr } = adresse!;
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&q=${encodeURIComponent(addr)}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodeURIComponent(addr)}`,
    });
    Linking.openURL(url);
  }

  function handleResult(result: "success" | "fail") {
    setResult(numInt, result);
    router.back();
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6 gap-6"
    >
      {/* Bloc adresse */}
      <Card>
        <CardHeader>
          <CardTitle>Adresse {adresse.numero}</CardTitle>
        </CardHeader>
        <CardContent>
          <Pressable onPress={openMaps} className="flex-row items-center gap-2">
            <MapPin size={18} color="#3b82f6" />
            <Text className="text-lg text-primary underline flex-1">
              {adresse.adresse}
            </Text>
          </Pressable>
        </CardContent>
      </Card>

      {/* Liste des colis */}
      <Card>
        <CardHeader>
          <CardTitle>Colis ({adresse.colis.length})</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          {adresse.colis.map((colis) => {
            const hasPhoto = colisPhotos[colis.name] != null;
            return (
              <Pressable
                key={colis.name}
                onPress={() =>
                  router.push(
                    `/colis-photo/${encodeURIComponent(colis.name)}?numero=${numInt}`
                  )
                }
                className={`flex-row items-center justify-between rounded-lg border p-4 ${
                  hasPhoto
                    ? "bg-green-50 border-green-500"
                    : "bg-card border-border"
                }`}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    className={`h-8 w-8 items-center justify-center rounded-full ${
                      hasPhoto ? "bg-green-500" : "bg-muted"
                    }`}
                  >
                    {hasPhoto ? (
                      <Check size={18} color="#ffffff" />
                    ) : (
                      <Package size={16} color="#6b7280" />
                    )}
                  </View>
                  <Text className="font-medium flex-1">{colis.name}</Text>
                </View>
                <ChevronRight size={20} className="text-muted-foreground" />
              </Pressable>
            );
          })}
        </CardContent>
      </Card>

      {/* Bloc actions */}
      <View className="flex-row gap-4">
        <Button
          variant="destructive"
          size="lg"
          className="flex-1"
          onPress={() => handleResult("fail")}
        >
          <Text className="text-destructive-foreground font-semibold">
            Échec
          </Text>
        </Button>
        <Button
          size="lg"
          className={`flex-1 ${
            allColisValidated
              ? "bg-green-600 active:bg-green-700"
              : "bg-green-600/50"
          }`}
          disabled={!allColisValidated}
          onPress={() => handleResult("success")}
        >
          <Text className="text-white font-semibold">Valider</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
