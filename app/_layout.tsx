import "@/global.css";

import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PortalHost } from "@rn-primitives/portal";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { NAV_THEME } from "@/lib/theme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme === "dark" ? "dark" : "light"]}>
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
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
      <PortalHost />
    </ThemeProvider>
  );
}
