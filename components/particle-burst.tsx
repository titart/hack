import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// ── Configuration ──────────────────────────────────────────────
const PARTICLE_COUNT = 30;
const DURATION_MS = 1200;
const GRAVITY = 900; // px/s² – simule la gravité terrestre
const COLORS = [
  "#00d2ff", // cyan
  "#FFD700", // or
  "#ffffff", // blanc
  "#7DF9FF", // electric blue
  "#00BFFF", // deep sky blue
  "#FFE66D", // jaune doux
  "#E0E0FF", // lavande
  "#00ffcc", // turquoise
];

// ── Types ──────────────────────────────────────────────────────
interface ParticleConfig {
  vx: number; // vitesse initiale X (px/s)
  vy: number; // vitesse initiale Y (px/s, négatif = vers le haut)
  color: string;
  size: number;
  rotationSpeed: number; // degrés/s
}

// ── Génération aléatoire des particules ────────────────────────
function generateParticles(): ParticleConfig[] {
  return Array.from({ length: PARTICLE_COUNT }, (): ParticleConfig => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 120 + Math.random() * 380;
    return {
      vx: Math.cos(angle) * speed,
      vy: -Math.abs(Math.sin(angle)) * speed - 80, // toujours vers le haut au début
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 3 + Math.random() * 8,
      rotationSpeed: (Math.random() - 0.5) * 720, // rotation aléatoire
    };
  });
}

// ── Composant d'une seule particule ────────────────────────────
function SingleParticle({
  config,
  progress,
}: {
  config: ParticleConfig;
  progress: Animated.SharedValue<number>;
}) {
  const { vx, vy, size, color, rotationSpeed } = config;
  const durationSec = DURATION_MS / 1000;

  const animStyle = useAnimatedStyle(() => {
    const t = progress.value * durationSec; // temps écoulé en secondes

    // Physique : position = v0*t + ½*g*t²
    const x = vx * t;
    const y = vy * t + 0.5 * GRAVITY * t * t;

    // Fade out progressif
    const opacity = Math.max(0, 1 - progress.value * 1.3);

    // Rétrécissement
    const scale = Math.max(0, 1 - progress.value * 0.6);

    // Rotation continue
    const rotate = rotationSpeed * t;

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale },
        { rotate: `${rotate}deg` },
      ],
      opacity,
    };
  });

  // Forme aléatoire : cercle ou carré (via borderRadius)
  const isCircle = size > 5;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: isCircle ? size / 2 : 2,
          // Petit effet de lueur sur les grosses particules
          ...(size > 6 && {
            shadowColor: color,
            shadowOpacity: 0.8,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 0 },
          }),
        },
        animStyle,
      ]}
    />
  );
}

// ── Composant principal : burst de particules ──────────────────
interface ParticleBurstProps {
  /** Incrémenter pour déclencher un nouveau burst */
  trigger: number;
  /** Position X du centre de l'explosion (dans le parent absolu) */
  originX: number;
  /** Position Y du centre de l'explosion (dans le parent absolu) */
  originY: number;
}

export function ParticleBurst({
  trigger,
  originX,
  originY,
}: ParticleBurstProps) {
  const progress = useSharedValue(0);

  // Régénérer les particules à chaque trigger
  const particles = useMemo(
    () => generateParticles(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trigger],
  );

  useEffect(() => {
    if (trigger > 0) {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: DURATION_MS,
        easing: Easing.linear,
      });
    }
  }, [trigger, progress]);

  if (trigger === 0) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: originX,
        top: originY,
        width: 0,
        height: 0,
        overflow: "visible",
        zIndex: 9999,
      }}
    >
      {particles.map((p, i) => (
        <SingleParticle
          key={`${trigger}-${i}`}
          config={p}
          progress={progress}
        />
      ))}
    </View>
  );
}
