import { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckSquare, Square, Tag, FileText } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/** Checklist item definition */
interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "etiquettes",
    label: "Étiquettes récupérées",
    description: "J'ai récupéré les étiquettes",
    icon: Tag,
  },
  {
    id: "bordereaux",
    label: "Bordereaux de collecte récupérés",
    description: "J'ai récupéré les bordereaux de collecte",
    icon: FileText,
  },
];

export default function ChecklistScreen() {
  const [checked, setChecked] = useState<Record<string, boolean>>({
    etiquettes: false,
    bordereaux: false,
  });

  /** Toggle a checkbox by its id */
  const toggleItem = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-6 gap-6">
        <View className="gap-2">
          <Text variant="h1">Vérifications</Text>
          <Text variant="muted" className="text-center">
            Confirmez les éléments récupérés avant de continuer.
          </Text>
        </View>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Checklist de collecte</CardTitle>
            <CardDescription>
              Cochez les éléments que vous avez récupérés.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            {CHECKLIST_ITEMS.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => toggleItem(item.id)}
                className="flex-row items-center gap-4 rounded-lg border border-border p-4 active:opacity-70"
                style={
                  checked[item.id]
                    ? { backgroundColor: "rgba(34,197,94,0.08)" }
                    : undefined
                }
              >
                {checked[item.id] ? (
                  <CheckSquare size={28} color="hsl(142 71% 45%)" />
                ) : (
                  <Square size={28} className="text-muted-foreground" />
                )}

                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2">
                    <item.icon size={18} className="text-foreground" />
                    <Text className="font-semibold text-base">
                      {item.label}
                    </Text>
                  </View>
                  <Text variant="muted">{item.description}</Text>
                </View>
              </Pressable>
            ))}
          </CardContent>
        </Card>

        {checked.etiquettes && checked.bordereaux && (
          <Card>
            <CardContent className="items-center py-6">
              <CheckSquare size={32} color="hsl(142 71% 45%)" />
              <Text className="mt-2 font-semibold text-lg text-center">
                Tout est prêt !
              </Text>
              <Text variant="muted" className="text-center">
                Vous avez récupéré tous les éléments nécessaires.
              </Text>
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
