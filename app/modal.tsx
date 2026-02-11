import { View } from "react-native";
import { Link } from "expo-router";

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

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center">
          <CardTitle>Modal</CardTitle>
          <CardDescription>
            Ceci est un exemple de page modale.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-center">
            Les modales s'affichent par-dessus le contenu principal et peuvent
            être fermées en glissant vers le bas.
          </Text>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/" dismissTo asChild>
            <Button variant="outline">
              <Text>Retour à l'accueil</Text>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </View>
  );
}
