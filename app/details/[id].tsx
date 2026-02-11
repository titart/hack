import { View, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { Text } from "@/components/ui/text";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const DETAILS: Record<
  string,
  { title: string; description: string; content: string }
> = {
  "1": {
    title: "Architecture",
    description: "Structure du projet et organisation des fichiers",
    content:
      "Le projet utilise Expo Router avec un système de fichiers pour le routing. Les composants réutilisables se trouvent dans le dossier components/ui, les utilitaires dans lib/, et les hooks personnalisés dans hooks/. Le dossier app/ contient toutes les routes organisées par groupes (tabs) et pages stack.",
  },
  "2": {
    title: "Navigation",
    description: "Routing basé sur les fichiers avec Expo Router",
    content:
      "Expo Router utilise un système de routing basé sur les fichiers, similaire à Next.js. Les dossiers entre parenthèses comme (tabs) sont des groupes de routes qui n'affectent pas l'URL. Les fichiers _layout.tsx définissent la structure de navigation (Stack, Tabs, etc.).",
  },
  "3": {
    title: "Composants",
    description: "Bibliothèque de composants réutilisables",
    content:
      "Les composants UI sont générés via react-native-reusables, l'équivalent de shadcn/ui pour React Native. Ils utilisent NativeWind (Tailwind CSS) pour le styling et sont entièrement personnalisables. Chaque composant est copiable et modifiable dans votre projet.",
  },
  "4": {
    title: "Thème",
    description: "Support du mode sombre et personnalisation des couleurs",
    content:
      "Le système de thème utilise des variables CSS définies dans global.css avec des valeurs pour les modes clair et sombre. Les couleurs sont accessibles via les classes Tailwind (bg-background, text-foreground, etc.) et s'adaptent automatiquement au thème système.",
  },
  "5": {
    title: "Performance",
    description: "Optimisations et bonnes pratiques React Native",
    content:
      "Le projet utilise la New Architecture de React Native pour de meilleures performances. React Native Reanimated fournit des animations fluides exécutées sur le thread UI natif. Le React Compiler est activé expérimentalement pour optimiser les re-renders.",
  },
};

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = DETAILS[id] ?? {
    title: "Non trouvé",
    description: "Cet élément n'existe pas.",
    content: "Retournez à la page Explorer pour choisir un élément valide.",
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 gap-6">
      <View className="gap-2">
        <Text variant="h2" className="border-0">
          {detail.title}
        </Text>
        <Text variant="lead">{detail.description}</Text>
      </View>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>À propos</CardTitle>
          <CardDescription>Détail de la section</CardDescription>
        </CardHeader>
        <CardContent>
          <Text variant="p" className="mt-0 leading-7">
            {detail.content}
          </Text>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          <View className="flex-row justify-between">
            <Text variant="muted">Identifiant</Text>
            <Text className="font-medium">#{id}</Text>
          </View>
          <Separator />
          <View className="flex-row justify-between">
            <Text variant="muted">Statut</Text>
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-green-500" />
              <Text className="font-medium">Actif</Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
