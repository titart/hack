import { useState } from "react";
import { View, Pressable, Linking, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import MapTournee from "@/components/map-tournee";
import { ADRESSES_TOURNEE } from "@/data/adresses-tournee";

type Step = "checklist" | "collecting" | "done";

function Checkbox({
  checked,
  onPress,
  label,
}: {
  checked: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-lg border border-border p-4"
    >
      <View
        className={`h-6 w-6 items-center justify-center rounded border-2 ${
          checked
            ? "border-primary bg-primary"
            : "border-muted-foreground bg-background"
        }`}
      >
        {checked && <Check size={16} color="#ffffff" />}
      </View>
      <Text className="text-base">{label}</Text>
    </Pressable>
  );
}

export default function TourneeScreen() {
  const [step, setStep] = useState<Step>("checklist");
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleCheck1 = () => {
    const next = !check1;
    setCheck1(next);
    if (next && check2) setStep("collecting");
  };

  const handleCheck2 = () => {
    const next = !check2;
    setCheck2(next);
    if (check1 && next) setStep("collecting");
  };

  const handleCollectDone = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= ADRESSES_TOURNEE.length) {
      setStep("done");
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  if (step === "checklist") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center p-6 gap-6">
          <Text variant="h2" className="text-center">
            Vérification avant départ
          </Text>
          <View className="gap-4">
            <Checkbox
              checked={check1}
              onPress={handleCheck1}
              label="Véhicule vérifié"
            />
            <Checkbox
              checked={check2}
              onPress={handleCheck2}
              label="Équipements prêts"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentAddress =
    step === "collecting" ? ADRESSES_TOURNEE[currentIndex] : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <View style={{ height: "50%" }}>
        <MapTournee
          adresses={ADRESSES_TOURNEE}
          activeNumero={currentAddress?.numero}
        />
      </View>

      <View className="flex-1 p-6 justify-center">
        {step === "collecting" && currentAddress && (
          <View className="gap-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  Adresse {currentAddress.numero} / {ADRESSES_TOURNEE.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Pressable
                  onPress={() => {
                    const { latitude, longitude, adresse } = currentAddress;
                    const url = Platform.select({
                      ios: `maps://app?daddr=${latitude},${longitude}&q=${encodeURIComponent(adresse)}`,
                      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodeURIComponent(adresse)}`,
                    });
                    Linking.openURL(url);
                  }}
                >
                  <Text className="text-lg text-primary underline">
                    {currentAddress.adresse}
                  </Text>
                </Pressable>
              </CardContent>
            </Card>
            <Button onPress={handleCollectDone} size="lg">
              <Text>Collecte terminée</Text>
            </Button>
          </View>
        )}

        {step === "done" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                Tournée terminée !
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-center text-lg" variant="muted">
                Toutes les collectes ont été effectuées.
              </Text>
            </CardContent>
          </Card>
        )}
      </View>
    </SafeAreaView>
  );
}
