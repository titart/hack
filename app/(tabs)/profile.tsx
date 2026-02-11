import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, Settings, Bell, Shield, LogOut } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const MENU_ITEMS = [
  { icon: Settings, label: "Paramètres", description: "Préférences de l'app" },
  {
    icon: Bell,
    label: "Notifications",
    description: "Gérer les notifications",
  },
  {
    icon: Shield,
    label: "Confidentialité",
    description: "Données et sécurité",
  },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-6 gap-6">
        <View className="items-center gap-4">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary">
            <User size={40} color="hsl(0 0% 98%)" />
          </View>
          <View className="items-center gap-1">
            <Text variant="h3">Utilisateur</Text>
            <Text variant="muted">utilisateur@email.com</Text>
          </View>
        </View>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Réglages</CardTitle>
          </CardHeader>
          <CardContent className="gap-1">
            {MENU_ITEMS.map((item, index) => (
              <View key={item.label}>
                <Button
                  variant="ghost"
                  className="h-auto flex-row items-center justify-start gap-4 px-2 py-3"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <item.icon size={20} className="text-foreground" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium">{item.label}</Text>
                    <Text variant="muted">{item.description}</Text>
                  </View>
                </Button>
                {index < MENU_ITEMS.length - 1 && <Separator />}
              </View>
            ))}
          </CardContent>
        </Card>

        <Button variant="destructive" className="mt-4">
          <LogOut size={18} color="white" />
          <Text className="text-white font-medium">Se déconnecter</Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
