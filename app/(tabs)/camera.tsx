import { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  X,
  Recycle,
  Wrench,
  Lightbulb,
  ScanSearch,
  RotateCcw,
  ImageIcon,
} from "lucide-react-native";

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
import { analyzeObject, type ObjectAnalysis } from "@/lib/gemini";

// ---------------------------------------------------------------------------
// Score badge component
// ---------------------------------------------------------------------------

function ScoreBadge({
  score,
  label,
  icon: Icon,
}: {
  score: number;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}) {
  const color =
    score >= 7 ? "#22c55e" : score >= 4 ? "#f59e0b" : "#ef4444";
  const bgColor =
    score >= 7
      ? "bg-green-500/10"
      : score >= 4
        ? "bg-amber-500/10"
        : "bg-red-500/10";

  return (
    <View className={`flex-1 items-center rounded-2xl p-4 ${bgColor}`}>
      <Icon size={24} color={color} />
      <Text
        className="mt-2 text-3xl font-bold"
        style={{ color }}
      >
        {score}
        <Text className="text-lg font-normal text-muted-foreground">/10</Text>
      </Text>
      <Text className="mt-1 text-xs text-center text-muted-foreground font-medium">
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function CameraScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ObjectAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = useCallback(async () => {
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
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      setAnalysis(null);
      setError(null);
      setLoading(true);

      try {
        const data = await analyzeObject(uri);
        setAnalysis(data);
      } catch (err: any) {
        console.error("Erreur analyse IA:", err);
        setError(
          err?.message ?? "Une erreur est survenue lors de l'analyse."
        );
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
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
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      setAnalysis(null);
      setError(null);
      setLoading(true);

      try {
        const data = await analyzeObject(uri);
        setAnalysis(data);
      } catch (err: any) {
        console.error("Erreur analyse IA:", err);
        setError(
          err?.message ?? "Une erreur est survenue lors de l'analyse."
        );
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    setPhotoUri(null);
    setAnalysis(null);
    setError(null);
    setLoading(false);
  }, []);

  // -------------------------------------------------------------------------
  // Results view
  // -------------------------------------------------------------------------

  if (photoUri) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-6 gap-5 pb-12"
        >
          {/* Header with back */}
          <View className="flex-row items-center justify-between">
            <Text variant="h3">Analyse</Text>
            <Button variant="ghost" size="sm" onPress={reset}>
              <RotateCcw size={18} className="text-muted-foreground" />
              <Text className="text-muted-foreground text-sm ml-1">
                Nouvelle photo
              </Text>
            </Button>
          </View>

          {/* Photo */}
          <View className="relative overflow-hidden rounded-2xl">
            <Image
              source={{ uri: photoUri }}
              style={{ width: "100%", height: 260, borderRadius: 16 }}
              contentFit="cover"
            />
            {loading && (
              <View className="absolute inset-0 items-center justify-center bg-black/40 rounded-2xl">
                <ActivityIndicator size="large" color="white" />
                <Text className="text-white mt-3 font-medium text-base">
                  Analyse en cours...
                </Text>
              </View>
            )}
          </View>

          {/* Error */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <Text className="text-destructive">{error}</Text>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onPress={async () => {
                    setError(null);
                    setLoading(true);
                    try {
                      const data = await analyzeObject(photoUri);
                      setAnalysis(data);
                    } catch (err: any) {
                      setError(
                        err?.message ??
                          "Une erreur est survenue lors de l'analyse."
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <Text className="text-sm">Réessayer</Text>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {analysis && (
            <>
              {/* Object name */}
              <Card>
                <CardHeader className="pb-2">
                  <View className="flex-row items-center gap-2">
                    <ScanSearch size={20} className="text-primary" />
                    <CardTitle>{analysis.name}</CardTitle>
                  </View>
                  {analysis.brand && analysis.brand !== "Marque inconnue" && (
                    <Text className="text-sm font-semibold text-primary mt-1">
                      {analysis.brand}
                    </Text>
                  )}
                  <CardDescription>{analysis.description}</CardDescription>
                </CardHeader>
              </Card>

              {/* Scores */}
              <View className="flex-row gap-4">
                <ScoreBadge
                  score={analysis.recyclingScore}
                  label="Recyclabilité"
                  icon={Recycle}
                />
                <ScoreBadge
                  score={analysis.conditionScore}
                  label="État"
                  icon={Wrench}
                />
              </View>

              {/* Recycling comment */}
              <Card>
                <CardHeader className="pb-2">
                  <View className="flex-row items-center gap-2">
                    <Recycle size={18} className="text-green-600" />
                    <CardTitle className="text-base">Recyclabilité</CardTitle>
                  </View>
                </CardHeader>
                <CardContent className="pt-0">
                  <Text className="text-muted-foreground leading-relaxed">
                    {analysis.recyclingComment}
                  </Text>
                </CardContent>
              </Card>

              {/* Condition comment */}
              <Card>
                <CardHeader className="pb-2">
                  <View className="flex-row items-center gap-2">
                    <Wrench size={18} className="text-amber-600" />
                    <CardTitle className="text-base">État de l'objet</CardTitle>
                  </View>
                </CardHeader>
                <CardContent className="pt-0">
                  <Text className="text-muted-foreground leading-relaxed">
                    {analysis.conditionComment}
                  </Text>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <View className="flex-row items-center gap-2">
                    <Lightbulb size={18} className="text-primary" />
                    <CardTitle className="text-base">Conseils</CardTitle>
                  </View>
                </CardHeader>
                <CardContent className="pt-0">
                  <Text className="text-foreground leading-relaxed">
                    {analysis.tips}
                  </Text>
                </CardContent>
              </Card>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------------------
  // Empty / initial state
  // -------------------------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-6 gap-6">
        {/* Header */}
        <View className="gap-2">
          <Text variant="h3" className="text-left">
            Scanner un objet
          </Text>
          <Text variant="muted">
            Prenez en photo un objet pour identifier son modèle et obtenir une
            note de recyclabilité et d'état.
          </Text>
        </View>

        {/* Bouton prendre photo */}
        <Button onPress={takePhoto} size="lg" className="gap-3">
          <Camera size={22} color="white" />
          <Text className="text-primary-foreground font-semibold text-base">
            Prendre une photo
          </Text>
        </Button>

        {/* Bouton galerie */}
        <Button onPress={pickFromGallery} variant="outline" size="lg" className="gap-3">
          <ImageIcon size={22} className="text-foreground" />
          <Text className="font-semibold text-base">
            Choisir depuis la galerie
          </Text>
        </Button>

        <Separator />

        {/* Empty state */}
        <Card>
          <CardHeader className="items-center">
            <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ScanSearch size={28} className="text-muted-foreground" />
            </View>
            <CardTitle className="text-center">
              Analysez vos objets
            </CardTitle>
            <CardDescription className="text-center">
              Prenez une photo d'un appareil ou objet. L'IA identifiera le
              modèle et vous donnera une note de recyclabilité et d'état sur 10.
            </CardDescription>
          </CardHeader>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
