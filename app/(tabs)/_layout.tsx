import { Tabs } from "expo-router";
import { Camera, ClipboardCheck, Compass, Home, MessageSquare, User } from "lucide-react-native";

import { Camera, Compass, Home, MapPin, User } from "lucide-react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { THEME } from "@/lib/theme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          backgroundColor:
            colorScheme === "dark"
              ? THEME.dark.background
              : THEME.light.background,
          borderTopColor:
            colorScheme === "dark" ? THEME.dark.border : THEME.light.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explorer",
          tabBarIcon: ({ color, size }) => (
            <Compass size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Photos",
          tabBarIcon: ({ color, size }) => <Camera size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
