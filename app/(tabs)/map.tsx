import { SafeAreaView } from "react-native-safe-area-context";
import MapTournee from "@/components/map-tournee";
import { ADRESSES_TOURNEE } from "@/data/adresses-tournee";

export default function MapScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <MapTournee adresses={ADRESSES_TOURNEE} />
    </SafeAreaView>
  );
}
