import { View, Pressable, ScrollView, Alert, ActivityIndicator, Modal } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera, Plus, ChevronDown, X as XIcon } from "lucide-react-native";
import { useState, useCallback } from "react";

import { Text } from "@/components/ui/text";
import { useTournee, REFUSAL_REASONS, type RefusalReason } from "@/contexts/tournee-context";
import { ADRESSES_TOURNEE } from "@/data/adresses-tournee";
import { analyzeObject, type ObjectAnalysis } from "@/lib/gemini";

// ---------------------------------------------------------------------------
// Progress bar component
// ---------------------------------------------------------------------------

function ProgressBar({
  label,
  score,
  max,
}: {
  label: string;
  score: number | null;
  max: number;
}) {
  const ratio = score != null ? score / max : 0;
  const color =
    score == null
      ? "#d1d5db"
      : ratio >= 0.7
        ? "#6cc070"
        : ratio >= 0.4
          ? "#f5b342"
          : "#e05252";

  return (
    <View className="flex-row items-center gap-3">
      <Text className="text-sm text-gray-500 w-24">{label}</Text>
      <Text className="text-sm font-medium text-gray-400 mr-1">:</Text>
      <View className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden flex-row items-center">
        {score != null && (
          <View
            className="h-full rounded-full items-center justify-center"
            style={{
              width: `${Math.max(ratio * 100, 15)}%`,
              backgroundColor: color,
            }}
          >
            <Text className="text-xs font-bold text-white">
              {score}/{max}
            </Text>
          </View>
        )}
        {score == null && (
          <View className="flex-1 items-center justify-center">
            <Text className="text-xs text-gray-400">—</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ColisPhotoScreen() {
  const { colisName, numero } = useLocalSearchParams<{
    colisName: string;
    numero: string;
  }>();
  const router = useRouter();
  const { colisPhotos, colisAnalysis, colisRefusals, setColisPhoto, setColisAnalysis, setColisRefusal } = useTournee();

  const decodedName = decodeURIComponent(colisName ?? "");

  // Trouver le colis dans les données
  const numInt = Number(numero);
  const adresse = ADRESSES_TOURNEE.find((a) => a.numero === numInt);
  const colis = adresse?.colis.find((c) => c.name === decodedName);

  const existingPhoto = colisPhotos[decodedName];
  const existingAnalysis = colisAnalysis[decodedName] ?? null;
  const existingRefusal = colisRefusals[decodedName] ?? null;
  const [photos, setPhotos] = useState<string[]>(
    existingPhoto ? [existingPhoto] : []
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [analysis, setAnalysis] = useState<ObjectAnalysis | null>(existingAnalysis);
  const [loading, setLoading] = useState(false);
  const [fonctionnel, setFonctionnel] = useState<boolean | null>(null);
  const [showReasons, setShowReasons] = useState(false);
  const [refusalReason, setRefusalReason] = useState<RefusalReason | null>(existingRefusal);

  const selectedPhoto = photos[selectedIndex] ?? null;

  // Analyse IA après prise de photo
  const runAnalysis = useCallback(async (uri: string) => {
    setLoading(true);
    try {
      const data = await analyzeObject(uri);
      setAnalysis(data);
      setColisAnalysis(decodedName, data);
    } catch (err: any) {
      console.error("Erreur analyse IA:", err);
    } finally {
      setLoading(false);
    }
  }, [decodedName, setColisAnalysis]);

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
      const uri = result.assets[0].uri;
      setPhotos((prev) => [...prev, uri]);
      setSelectedIndex(photos.length);
      // Lancer l'analyse IA uniquement si aucune analyse n'existe déjà
      if (photos.length === 0 && !analysis) {
        runAnalysis(uri);
      }
    }
  }

  function handleCollect() {
    if (selectedPhoto) {
      setColisPhoto(decodedName, selectedPhoto);
    }
    router.back();
  }

  function handleNotCollect() {
    setShowReasons(true);
  }

  function handleSelectReason(reason: RefusalReason) {
    setRefusalReason(reason);
    setColisRefusal(decodedName, reason);
    setShowReasons(false);
  }

  // Titre du header
  const headerTitle = colis?.type ?? decodedName;

  return (
    <View className="flex-1 bg-gray-100">
      <Stack.Screen
        options={{
          title: headerTitle,
          headerStyle: { backgroundColor: "#6b6b6b" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontSize: 17, fontWeight: "600" },
          headerBackTitle: "",
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Zone photo principale ──────────────────────────────── */}
        <Pressable onPress={takePhoto} className="mx-5 mt-5">
          {selectedPhoto ? (
            <View className="relative rounded-2xl overflow-hidden bg-white">
              <Image
                source={{ uri: selectedPhoto }}
                style={{ width: "100%", height: 220, borderRadius: 16 }}
                contentFit="cover"
              />
              {loading && (
                <View className="absolute inset-0 items-center justify-center bg-black/30 rounded-2xl">
                  <ActivityIndicator size="large" color="white" />
                  <Text className="text-white mt-2 font-medium text-sm">
                    Analyse IA...
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View className="h-52 bg-gray-200 rounded-2xl items-center justify-center">
              <View className="items-center gap-1">
                <View className="relative">
                  <Camera size={48} color="#666" />
                  <View className="absolute -bottom-1 -right-2 bg-gray-200 rounded-full">
                    <Plus size={18} color="#666" />
                  </View>
                </View>
              </View>
            </View>
          )}
        </Pressable>

        {/* ── Miniatures ─────────────────────────────────────────── */}
        <View className="flex-row gap-2 mx-5 mt-3">
          {/* Bouton ajouter */}
          <Pressable
            onPress={takePhoto}
            className="h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white"
          >
            <Plus size={20} color="#9ca3af" />
          </Pressable>

          {/* Thumbnails */}
          {photos.map((uri, index) => (
            <Pressable
              key={`${uri}-${index}`}
              onPress={() => setSelectedIndex(index)}
              className={`h-16 w-16 rounded-lg overflow-hidden border-2 ${
                index === selectedIndex ? "border-green-500" : "border-transparent"
              }`}
            >
              <Image
                source={{ uri }}
                style={{ width: "100%", height: "100%", borderRadius: 6 }}
                contentFit="cover"
              />
            </Pressable>
          ))}
        </View>

        {/* ── Séparateur ─────────────────────────────────────────── */}
        <View className="h-px bg-gray-300 mx-5 my-4" />

        {/* ── Infos de l'objet ───────────────────────────────────── */}
        <View
          className="mx-5 bg-white rounded-2xl p-5 gap-4"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          {/* Catégorie */}
          <View className="flex-row items-center gap-3">
            <Text className="text-sm text-gray-500 w-24">Catégorie</Text>
            <Text className="text-sm font-medium text-gray-400 mr-1">:</Text>
            <Text className="text-sm font-bold text-gray-900 flex-1">
              {colis?.type ?? decodedName}
            </Text>
          </View>

          {/* Marque */}
          <View className="flex-row items-center gap-3">
            <Text className="text-sm text-gray-500 w-24">Marque</Text>
            <Text className="text-sm font-medium text-gray-400 mr-1">:</Text>
            <Text className="text-sm font-bold text-gray-900 flex-1">
              {colis?.marque
                ? `${colis.marque}${colis.modele ? ` ${colis.modele}` : ""}`
                : "—"}
            </Text>
          </View>

          {/* Barre recyclage */}
          <ProgressBar
            label="Recyclage"
            score={analysis?.recyclingScore ?? null}
            max={10}
          />

          {/* Barre état */}
          <ProgressBar
            label="Etat"
            score={analysis?.conditionScore ?? null}
            max={10}
          />

          {/* Séparateur */}
          <View className="h-px bg-gray-200" />

          {/* Fonctionnel */}
          <View className="flex-row items-center gap-3">
            <Text className="text-sm text-gray-500 w-24">Fonctionnel</Text>
            <Text className="text-sm font-medium text-gray-400 mr-1">:</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setFonctionnel(true)}
                className={`px-5 py-1.5 rounded-full border ${
                  fonctionnel === true
                    ? "bg-green-500 border-green-500"
                    : "bg-white border-gray-300"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    fonctionnel === true ? "text-white" : "text-gray-700"
                  }`}
                >
                  Oui
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setFonctionnel(false)}
                className={`px-5 py-1.5 rounded-full border ${
                  fonctionnel === false
                    ? "bg-red-500 border-red-500"
                    : "bg-white border-gray-300"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    fonctionnel === false ? "text-white" : "text-gray-700"
                  }`}
                >
                  Non
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Bandeau du bas (fixé) ─────────────────────────────────── */}
      {refusalReason ? (
        /* Bandeau rouge avec raison de refus */
        <View
          className="bg-red-500 px-5 pb-8 pt-4"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: -3 },
            elevation: 4,
          }}
        >
          <View className="bg-white rounded-xl px-4 py-3 items-center">
            <Text className="text-sm font-bold text-red-600">Non collecté</Text>
            <Text className="text-xs text-gray-500 mt-0.5">{refusalReason}</Text>
          </View>
        </View>
      ) : (
        /* Boutons normaux */
        <View
          className="flex-row gap-4 bg-white border-t border-gray-200 px-5 pb-8 pt-4"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: -3 },
            elevation: 4,
          }}
        >
          <Pressable
            onPress={handleNotCollect}
            className="flex-1 py-3.5 items-center rounded-full border border-gray-300 bg-white active:bg-gray-100"
          >
            <Text className="text-sm font-semibold text-gray-700">
              Non collecter
            </Text>
          </Pressable>
          <Pressable
            onPress={handleCollect}
            className={`flex-1 py-3.5 items-center rounded-full active:opacity-80 ${
              photos.length > 0
                ? "bg-gray-700"
                : "bg-gray-300"
            }`}
            disabled={photos.length === 0}
          >
            <Text className="text-sm font-semibold text-white">Collecter</Text>
          </Pressable>
        </View>
      )}

      {/* ── Modal dropdown raisons de non-collecte ────────────────── */}
      <Modal
        visible={showReasons}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReasons(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowReasons(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl px-5 pb-10 pt-5"
            onPress={() => {}}
          >
            {/* Header du dropdown */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-gray-900">
                Spécifier la raison
              </Text>
              <Pressable
                onPress={() => setShowReasons(false)}
                className="p-1"
              >
                <XIcon size={22} color="#6b7280" />
              </Pressable>
            </View>

            {/* Options */}
            <View className="gap-2">
              {REFUSAL_REASONS.map((reason) => (
                <Pressable
                  key={reason}
                  onPress={() => handleSelectReason(reason)}
                  className="flex-row items-center gap-3 py-3.5 px-4 rounded-xl bg-gray-50 active:bg-gray-100 border border-gray-200"
                >
                  <ChevronDown size={16} color="#9ca3af" style={{ transform: [{ rotate: "-90deg" }] }} />
                  <Text className="text-base text-gray-800 flex-1">
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
