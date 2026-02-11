import { View, ScrollView } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-6 gap-6">
        <View className="gap-2">
          <Text variant="h1">Bienvenue</Text>
          <Text variant="muted" className="text-center">
            Votre application est prête à être développée.
          </Text>
        </View>

        <Link href="/tournee" asChild>
          <Button variant="default" size="lg" className="w-full">
            <Text>Démarre ma tournée</Text>
          </Button>
        </Link>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Commencer</CardTitle>
            <CardDescription>
              Explorez les différentes sections de l'application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Text>
              Naviguez entre les onglets pour découvrir les fonctionnalités.
              L'onglet Explorer contient une liste d'éléments avec navigation
              vers des pages de détail.
            </Text>
          </CardContent>
          <CardFooter className="gap-3">
            <Link href="/explore" asChild>
              <Button variant="default" className="flex-1">
                <Text>Explorer</Text>
              </Button>
            </Link>
            <Link href="/modal" asChild>
              <Button variant="outline" className="flex-1">
                <Text>Ouvrir Modal</Text>
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stack technique</CardTitle>
            <CardDescription>
              Les technologies utilisées dans ce projet.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            {[
              { name: "Expo Router", desc: "Routing basé sur les fichiers" },
              { name: "NativeWind", desc: "Tailwind CSS pour React Native" },
              {
                name: "React Native Reusables",
                desc: "Composants shadcn/ui",
              },
              { name: "Lucide Icons", desc: "Icônes modernes et légères" },
            ].map((item) => (
              <View
                key={item.name}
                className="flex-row items-center justify-between rounded-lg border border-border p-3"
              >
                <Text className="font-medium">{item.name}</Text>
                <Text variant="muted">{item.desc}</Text>
              </View>
            ))}
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
