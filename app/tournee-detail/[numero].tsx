import { View, Pressable, ScrollView, Linking, Platform, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera, MapPin } from "lucide-react-native";

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
  const { photos, setPhoto, setResult } = useTournee();

  const numInt = Number(numero);
  const adresse = ADRESSES_TOURNEE.find((a) => a.numero === numInt);
  const photoUri = photos[numInt];

  if (!adresse) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Adresse introuvable</Text>
      </View>
    );
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "L'accès à la caméra est nécessaire pour prendre des photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhoto(numInt, result.assets[0].uri);
    }
  }

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

      {/* Bloc photo */}
      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
        </CardHeader>
        <CardContent className="items-center gap-4">
          {photoUri && (
            <Image
              source={{ uri: photoUri }}
              style={{ width: "100%", height: 200, borderRadius: 12 }}
              contentFit="cover"
            />
          )}
          <Pressable
            onPress={takePhoto}
            className="h-16 w-16 items-center justify-center rounded-full bg-primary active:opacity-70"
          >
            <Camera size={28} color="#ffffff" />
          </Pressable>
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
            Fail
          </Text>
        </Button>
        <Button
          size="lg"
          className="flex-1 bg-green-600 active:bg-green-700"
          onPress={() => handleResult("success")}
        >
          <Text className="text-white font-semibold">Success</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
