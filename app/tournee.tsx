import { useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Check, ChevronRight } from "lucide-react-native";

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
import { useTournee } from "@/contexts/tournee-context";

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
  const router = useRouter();
  const { results } = useTournee();
  const [step, setStep] = useState<Step>("checklist");
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);

  const allDone =
    Object.keys(results).length === ADRESSES_TOURNEE.length;
  const currentStep = allDone ? "done" : step;

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

  if (currentStep === "checklist") {
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <View style={{ height: "50%" }}>
        <MapTournee adresses={ADRESSES_TOURNEE} results={results} />
      </View>

      {currentStep === "done" ? (
        <View className="flex-1 p-6 justify-center">
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
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="p-4 gap-2">
          {ADRESSES_TOURNEE.map((item) => {
            const result = results[item.numero];
            const bgClass = result === "success"
              ? "bg-green-50 border-green-500"
              : result === "fail"
                ? "bg-red-50 border-red-500"
                : "bg-card border-border";

            return (
              <Pressable
                key={item.numero}
                onPress={() =>
                  router.push(`/tournee-detail/${item.numero}`)
                }
                className={`flex-row items-center justify-between rounded-lg border p-4 ${bgClass}`}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    className={`h-8 w-8 items-center justify-center rounded-full ${
                      result === "success"
                        ? "bg-green-500"
                        : result === "fail"
                          ? "bg-red-500"
                          : "bg-primary"
                    }`}
                  >
                    <Text className="text-white font-bold text-sm">
                      {item.numero}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium">{item.adresse}</Text>
                    <Text variant="muted" className="text-sm">
                      {item.colis.length} colis
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} className="text-muted-foreground" />
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
