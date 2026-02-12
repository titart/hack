import { useRouter } from "expo-router";
import { Check, Truck, Zap } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Logo } from "@/components/logo";
import { ParticleBurst } from "@/components/particle-burst";
import { Text } from "@/components/ui/text";
import { useTournee } from "@/contexts/tournee-context";

const CHECKLIST_ITEMS = [
  { id: "etiquettes", label: "J'ai récupéré mes étiquettes" },
  { id: "bons", label: "J'ai les bons de livraison" },
  { id: "epi", label: "J'ai mes EPI" },
  { id: "gourde", label: "J'ai pris une gourde" },
] as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const router = useRouter();
  const { startTournee } = useTournee();
  const [checked, setChecked] = useState<Record<string, boolean>>({
    etiquettes: false,
    bons: false,
    epi: false,
  });

  const toggle = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const allChecked = CHECKLIST_ITEMS.every((item) => checked[item.id]);

  // --- Animations éclair ---
  const glowAnim = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const iconRotate = useSharedValue(0);

  useEffect(() => {
    if (allChecked) {
      // Pulsation du glow
      glowAnim.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
      // Rotation de l'icône éclair
      iconRotate.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      glowAnim.value = withTiming(0, { duration: 300 });
      iconRotate.value = withTiming(0, { duration: 300 });
    }
  }, [allChecked, glowAnim, iconRotate]);

  // Style du conteneur avec glow
  const glowContainerStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(glowAnim.value, [0, 1], [0, 0.9]);
    const shadowRadius = interpolate(glowAnim.value, [0, 1], [4, 30]);
    return {
      shadowColor: "#00d2ff",
      shadowOpacity,
      shadowRadius,
      shadowOffset: { width: 0, height: 0 },
      elevation: interpolate(glowAnim.value, [0, 1], [2, 20]),
    };
  });

  // Style du bouton (scale au press + léger pulse)
  const buttonAnimStyle = useAnimatedStyle(() => {
    const pulseScale = interpolate(glowAnim.value, [0, 0.5, 1], [1, 1.02, 1]);
    return {
      transform: [{ scale: pressScale.value * pulseScale }],
    };
  });

  // Bordure lumineuse animée
  const borderGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowAnim.value, [0, 0.5, 1], [0.3, 1, 0.3]);
    const borderWidth = interpolate(glowAnim.value, [0, 1], [1, 2.5]);
    const bgColor = interpolateColor(
      glowAnim.value,
      [0, 0.5, 1],
      [
        "rgba(0, 210, 255, 0)",
        "rgba(0, 210, 255, 0.15)",
        "rgba(0, 210, 255, 0)",
      ],
    );
    return {
      opacity,
      borderWidth,
      borderColor: "#00d2ff",
      backgroundColor: bgColor,
    };
  });

  // Animation de l'icône éclair
  const iconAnimStyle = useAnimatedStyle(() => {
    const rotate = interpolate(iconRotate.value, [0, 0.5, 1], [-10, 10, -10]);
    const scale = interpolate(iconRotate.value, [0, 0.5, 1], [1, 1.2, 1]);
    return {
      transform: [{ rotate: `${rotate}deg` }, { scale }],
    };
  });

  const handlePressIn = () => {
    pressScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  // --- Particules au clic ---
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [buttonCenter, setButtonCenter] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<View>(null);

  const measureButton = useCallback(() => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setButtonCenter({ x: x + width / 2, y: y + height / 2 });
    });
  }, []);

  const handleStartTournee = () => {
    if (!allChecked) return;
    // Déclencher les particules
    setParticleTrigger((prev) => prev + 1);
    measureButton();
    startTournee();
    // Petit délai pour laisser les particules jaillir avant navigation
    setTimeout(() => {
      router.push("/tournee");
    }, 500);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-6 gap-8">
        {/* Logo hero section */}
        <View className="items-center gap-4 pt-4 pb-2">
          <View className="rounded-2xl bg-card border border-border p-6 shadow-sm items-center">
            <Logo width={220} height={66} />
          </View>
          <View className="items-center gap-1">
            <Text variant="h3" className="text-center">
              Prêt pour la tournée ?
            </Text>
            <Text variant="muted" className="text-center">
              Vérifie que tu as tout avant de partir
            </Text>
          </View>
        </View>

        {/* Checklist */}
        <View className="gap-3">
          {CHECKLIST_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => toggle(item.id)}
              className={`flex-row items-center gap-3 rounded-xl border p-4 active:opacity-80 ${
                checked[item.id]
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <View
                className={`h-7 w-7 items-center justify-center rounded-lg border-2 ${
                  checked[item.id]
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40 bg-background"
                }`}
              >
                {checked[item.id] && (
                  <Check size={16} color="white" strokeWidth={3} />
                )}
              </View>
              <Text
                className={`flex-1 text-base ${
                  checked[item.id] ? "font-semibold" : ""
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Start button - Effet éclair */}
        <Animated.View
          ref={buttonRef}
          onLayout={measureButton}
          style={[
            glowContainerStyle,
            { borderRadius: 12, overflow: "visible" },
          ]}
        >
          <Animated.View style={[buttonAnimStyle]}>
            <AnimatedPressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleStartTournee}
              disabled={!allChecked}
              style={[
                {
                  position: "relative",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  height: 52,
                  borderRadius: 12,
                  paddingHorizontal: 24,
                  overflow: "hidden",
                },
                !allChecked && { opacity: 0.5 },
                allChecked
                  ? { backgroundColor: "#1a1a3e" }
                  : { backgroundColor: "#6366f1" },
              ]}
            >
              {/* Bordure lumineuse animée */}
              {allChecked && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    borderGlowStyle,
                    {
                      position: "absolute",
                      top: -1,
                      left: -1,
                      right: -1,
                      bottom: -1,
                      borderRadius: 13,
                    },
                  ]}
                />
              )}

              <Truck size={20} color="white" />
              <Text
                style={{
                  color: "white",
                  fontWeight: "700",
                  fontSize: 16,
                  textShadowColor: allChecked
                    ? "rgba(0, 210, 255, 0.8)"
                    : "transparent",
                  textShadowRadius: allChecked ? 10 : 0,
                  textShadowOffset: { width: 0, height: 0 },
                }}
              >
                Démarre ma tournée
              </Text>
              {allChecked && (
                <Animated.View style={iconAnimStyle}>
                  <Zap
                    size={22}
                    color="#FFD700"
                    fill="#FFD700"
                    strokeWidth={1.5}
                  />
                </Animated.View>
              )}
            </AnimatedPressable>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* Overlay plein écran pour les particules (au-dessus de tout) */}
      <ParticleBurst
        trigger={particleTrigger}
        originX={buttonCenter.x}
        originY={buttonCenter.y}
      />
    </SafeAreaView>
  );
}
