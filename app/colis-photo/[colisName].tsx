import { View, Pressable, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera, Check, Trash2 } from "lucide-react-native";
import { useState } from "react";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useTournee } from "@/contexts/tournee-context";

export default function ColisPhotoScreen() {
  const { colisName } = useLocalSearchParams<{ colisName: string }>();
  const router = useRouter();
  const { colisPhotos, setColisPhoto } = useTournee();

  const decodedName = decodeURIComponent(colisName ?? "");
  const existingPhoto = colisPhotos[decodedName];
  const [photoUri, setPhotoUri] = useState<string | undefined>(existingPhoto);

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
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function pickPhoto() {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "L'accès à la galerie est nécessaire."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  function handleConfirm() {
    if (photoUri) {
      setColisPhoto(decodedName, photoUri);
    }
    router.back();
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6 gap-6"
    >
      {/* Titre du colis */}
      <Card>
        <CardHeader>
          <CardTitle>{decodedName}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text variant="muted">
            Prenez une photo de ce colis pour confirmer sa livraison.
          </Text>
        </CardContent>
      </Card>

      {/* Zone photo */}
      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
        </CardHeader>
        <CardContent className="items-center gap-4">
          {photoUri ? (
            <View className="w-full gap-3">
              <Image
                source={{ uri: photoUri }}
                style={{ width: "100%", height: 250, borderRadius: 12 }}
                contentFit="cover"
              />
              <Pressable
                onPress={() => setPhotoUri(undefined)}
                className="flex-row items-center justify-center gap-2 rounded-lg border border-destructive p-3"
              >
                <Trash2 size={18} color="#ef4444" />
                <Text className="text-destructive font-medium">
                  Supprimer la photo
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="w-full items-center gap-4 py-8 rounded-lg border-2 border-dashed border-muted-foreground/30">
              <Camera size={48} color="#9ca3af" />
              <Text variant="muted">Aucune photo</Text>
            </View>
          )}

          <View className="flex-row gap-4 w-full">
            <Pressable
              onPress={takePhoto}
              className="flex-1 h-14 items-center justify-center rounded-xl bg-primary active:opacity-70"
            >
              <Text className="text-white font-semibold">Prendre une photo</Text>
            </Pressable>
          </View>
        </CardContent>
      </Card>

      {/* Bouton confirmer */}
      <Button
        size="lg"
        className={`w-full ${
          photoUri
            ? "bg-green-600 active:bg-green-700"
            : "bg-muted"
        }`}
        disabled={!photoUri}
        onPress={handleConfirm}
      >
        <View className="flex-row items-center gap-2">
          <Check size={20} color="#ffffff" />
          <Text className="text-white font-semibold text-lg">Confirmer</Text>
        </View>
      </Button>
    </ScrollView>
  );
}
