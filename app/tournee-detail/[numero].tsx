import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronRight, MapPin, Package } from "lucide-react-native";
import { useRef, useMemo, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useTournee } from "@/contexts/tournee-context";
import { ADRESSES_TOURNEE } from "@/data/adresses-tournee";

/* ── Confetti constants ───────────────────────────────────── */
const CONFETTI_COLORS = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1",
  "#96CEB4", "#FFEAA7", "#DDA0DD", "#FF69B4",
  "#FF4500", "#7B68EE", "#00CED1", "#FFA07A",
];
const NUM_CONFETTI = 30;

interface PieceConfig {
  angle: number;
  distance: number;
  color: string;
  size: number;
  rotSpeed: number;
  isRound: boolean;
}

function ConfettiPiece({
  piece,
  progress,
}: {
  piece: PieceConfig;
  progress: SharedValue<number>;
}) {
  const tx = Math.cos(piece.angle) * piece.distance;
  const ty = Math.sin(piece.angle) * piece.distance;

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateX: tx * p },
        { translateY: ty * p + p * p * 40 },
        { rotate: `${piece.rotSpeed * p * 360}deg` },
        { scale: p < 0.15 ? p / 0.15 : Math.max(0, 1 - (p - 0.35) / 0.65) },
      ],
      opacity: p < 0.1 ? p / 0.1 : Math.max(0, 1 - (p - 0.25) / 0.75),
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: piece.size,
          height: piece.size,
          borderRadius: piece.isRound ? piece.size / 2 : 2,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}
/* ─────────────────────────────────────────────────────────── */

export default function TourneeDetailScreen() {
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const router = useRouter();
  const { colisPhotos, setResult } = useTournee();
  const confettiProgress = useSharedValue(0);
  const containerRef = useRef<View>(null);
  const validateBtnRef = useRef<View>(null);
  const [confettiOrigin, setConfettiOrigin] = useState({ x: 0, y: 0 });

  const confettiPieces = useMemo<PieceConfig[]>(
    () =>
      Array.from({ length: NUM_CONFETTI }, (_, i) => ({
        // Angles répartis dans le demi-cercle supérieur (-150° à -30°)
        // pour que les confettis partent vers le haut
        angle:
          -Math.PI * 0.85 +
          (i / NUM_CONFETTI) * Math.PI * 0.7 +
          (Math.random() - 0.5) * 0.4,
        distance: 60 + Math.random() * 160,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 5 + Math.random() * 8,
        rotSpeed: 1 + Math.random() * 4,
        isRound: Math.random() > 0.5,
      })),
    [],
  );

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
    (c) => colisPhotos[c.name] != null,
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

  function handleValidate() {
    // Mesurer la position du bouton par rapport au conteneur
    validateBtnRef.current?.measureInWindow((bx, by, bw, bh) => {
      containerRef.current?.measureInWindow((cx, cy) => {
        setConfettiOrigin({
          x: bx - cx + bw / 2,
          y: by - cy + bh / 2,
        });
        confettiProgress.value = 0;
        confettiProgress.value = withTiming(
          1,
          { duration: 900, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (finished) {
              runOnJS(handleResult)("success");
            }
          },
        );
      });
    });
  }

  return (
    <View ref={containerRef} className="flex-1 bg-background">
    <ScrollView
      className="flex-1"
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
                    `/colis-photo/${encodeURIComponent(colis.name)}?numero=${numInt}`,
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
        <View ref={validateBtnRef} className="flex-1">
          <Button
            size="lg"
            className={`${
              // allColisValidated
              // ?
              "bg-green-600 active:bg-green-700"
              // : "bg-green-600/50"
            }`}
            // disabled={!allColisValidated}
            onPress={handleValidate}
          >
            <Text className="text-white font-semibold">Valider</Text>
          </Button>
        </View>
      </View>
    </ScrollView>

    {/* Confetti overlay — positionné exactement sur le bouton Valider */}
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: confettiOrigin.y,
        left: confettiOrigin.x,
      }}
    >
      {confettiPieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} progress={confettiProgress} />
      ))}
    </View>
    </View>
  );
}
