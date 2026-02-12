import { useState } from "react";
import { Link } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Truck } from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Logo } from "@/components/logo";

const CHECKLIST_ITEMS = [
  { id: "etiquettes", label: "J'ai récupéré mes étiquettes" },
  { id: "bons", label: "J'ai les bons de livraison" },
  { id: "epi", label: "J'ai mes EPI" },
] as const;

export default function HomeScreen() {
  const [checked, setChecked] = useState<Record<string, boolean>>({
    etiquettes: false,
    bons: false,
    epi: false,
  });

  const toggle = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const allChecked = CHECKLIST_ITEMS.every((item) => checked[item.id]);

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
                {checked[item.id] && <Check size={16} color="white" strokeWidth={3} />}
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

        {/* Start button */}
        <Link href="/tournee" asChild>
          <Button
            variant="default"
            size="lg"
            className="w-full"
            disabled={!allChecked}
          >
            <Truck size={20} color="white" />
            <Text>Démarre ma tournée</Text>
          </Button>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}
