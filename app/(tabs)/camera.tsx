import { useState } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Camera, X, Plus, ImageIcon } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function CameraScreen() {
  const [photos, setPhotos] = useState<string[]>([]);

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
      setPhotos((prev) => [result.assets[0].uri, ...prev]);
    }
  }

  function removePhoto(index: number) {
    Alert.alert("Supprimer", "Voulez-vous supprimer cette photo ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          setPhotos((prev) => prev.filter((_, i) => i !== index));
        },
      },
    ]);
  }

  function clearAll() {
    Alert.alert(
      "Tout supprimer",
      "Voulez-vous supprimer toutes les photos ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer tout",
          style: "destructive",
          onPress: () => setPhotos([]),
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-6 gap-6">
        {/* Header */}
        <View className="gap-2">
          <Text variant="h3" className="text-left">
            Photos
          </Text>
          <Text variant="muted">
            Prenez des photos avec votre appareil et retrouvez-les ici.
          </Text>
        </View>

        {/* Bouton principal */}
        <Button onPress={takePhoto} size="lg" className="gap-3">
          <Camera size={22} color="white" />
          <Text className="text-primary-foreground font-semibold text-base">
            Prendre une photo
          </Text>
        </Button>

        {/* Compteur + bouton supprimer tout */}
        {photos.length > 0 && (
          <>
            <Separator />
            <View className="flex-row items-center justify-between">
              <Text variant="muted">
                {photos.length} photo{photos.length > 1 ? "s" : ""} prise
                {photos.length > 1 ? "s" : ""}
              </Text>
              <Button variant="ghost" size="sm" onPress={clearAll}>
                <Text className="text-destructive text-sm">Tout supprimer</Text>
              </Button>
            </View>
          </>
        )}

        {/* Grille de photos */}
        {photos.length > 0 ? (
          <View className="flex-row flex-wrap gap-3">
            {/* Bouton ajouter en premier */}
            <Pressable
              onPress={takePhoto}
              className="h-40 w-[31%] items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted active:opacity-70"
            >
              <Plus size={28} className="text-muted-foreground" />
              <Text variant="muted" className="text-xs mt-1">
                Ajouter
              </Text>
            </Pressable>

            {/* Photos */}
            {photos.map((uri, index) => (
              <View key={`${uri}-${index}`} className="relative h-40 w-[31%]">
                <Image
                  source={{ uri }}
                  style={{ width: "100%", height: "100%", borderRadius: 12 }}
                  contentFit="cover"
                />
                <Pressable
                  onPress={() => removePhoto(index)}
                  className="absolute -right-1.5 -top-1.5 h-7 w-7 items-center justify-center rounded-full bg-destructive shadow-sm active:opacity-70"
                >
                  <X size={14} color="white" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          /* Etat vide */
          <Card>
            <CardHeader className="items-center">
              <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ImageIcon size={28} className="text-muted-foreground" />
              </View>
              <CardTitle className="text-center">Aucune photo</CardTitle>
              <CardDescription className="text-center">
                Appuyez sur le bouton ci-dessus pour prendre votre premiere
                photo.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
