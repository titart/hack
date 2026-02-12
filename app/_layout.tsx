import "@/global.css";

import { ThemeProvider } from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { TourneeProvider } from "@/contexts/tournee-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { NAV_THEME } from "@/lib/theme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <TourneeProvider>
      <ThemeProvider
        value={NAV_THEME[colorScheme === "dark" ? "dark" : "light"]}
      >
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="details/[id]"
            options={{
              title: "Détails",
              headerBackTitle: "Retour",
            }}
          />
          <Stack.Screen
            name="tournee"
            options={{
              title: "Ma tournée",
              headerBackTitle: "Retour",
            }}
          />
          <Stack.Screen
            name="tournee-detail/[numero]"
            options={{
              title: "Détail collecte",
              headerBackTitle: "Retour",
            }}
          />
          <Stack.Screen
            name="colis-photo/[colisName]"
            options={{
              title: "Photo colis",
              headerBackTitle: "Retour",
            }}
          />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="auto" />
        <PortalHost />
      </ThemeProvider>
    </TourneeProvider>
  );
}
