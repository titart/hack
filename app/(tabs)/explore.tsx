import { View, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const ITEMS = [
  {
    id: "1",
    title: "Architecture",
    description: "Structure du projet et organisation des fichiers",
    color: "bg-blue-500/10",
  },
  {
    id: "2",
    title: "Navigation",
    description: "Routing basé sur les fichiers avec Expo Router",
    color: "bg-green-500/10",
  },
  {
    id: "3",
    title: "Composants",
    description: "Bibliothèque de composants réutilisables",
    color: "bg-purple-500/10",
  },
  {
    id: "4",
    title: "Thème",
    description: "Support du mode sombre et personnalisation des couleurs",
    color: "bg-orange-500/10",
  },
  {
    id: "5",
    title: "Performance",
    description: "Optimisations et bonnes pratiques React Native",
    color: "bg-red-500/10",
  },
];

export default function ExploreScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-6 gap-4">
        <View className="gap-2 mb-2">
          <Text variant="h3" className="text-left">
            Explorer
          </Text>
          <Text variant="muted">
            Appuyez sur un élément pour voir les détails.
          </Text>
        </View>

        {ITEMS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => router.push(`/details/${item.id}`)}
          >
            <Card className="active:opacity-80">
              <CardHeader className="flex-row items-center justify-between">
                <View className="flex-1 gap-1.5">
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </View>
                <ChevronRight size={20} className="text-muted-foreground ml-2" />
              </CardHeader>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
