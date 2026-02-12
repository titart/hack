import { MessageSquare, Phone, Send } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { sendSms } from "@/tools/esendex";

type StatusType = "idle" | "loading" | "success" | "error";

export default function SmsScreen() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  /** Validate inputs and send the SMS */
  const handleSend = async () => {
    // Basic validation
    if (!phone.trim()) {
      setStatus("error");
      setStatusMessage("Veuillez saisir un numéro de téléphone.");
      return;
    }
    if (!message.trim()) {
      setStatus("error");
      setStatusMessage("Veuillez saisir un message.");
      return;
    }

    setStatus("loading");
    setStatusMessage("");

    try {
      await sendSms(phone.trim(), message.trim());
      setStatus("success");
      setStatusMessage("SMS envoyé avec succès !");
      setPhone("");
      setMessage("");
    } catch (error: any) {
      setStatus("error");
      console.error(error);
      const detail =
        error?.response?.data?.message ??
        error?.message ??
        "Erreur inconnue";
      setStatusMessage(`Échec de l'envoi du SMS : ${detail}`);
    }
  };

  const isLoading = status === "loading";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-6 gap-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2">
            <Text variant="h1">Envoyer un SMS</Text>
            <Text variant="muted" className="text-center">
              Envoyez un message via le service Esendex.
            </Text>
          </View>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Nouveau message</CardTitle>
              <CardDescription>
                Remplissez les champs puis appuyez sur envoyer.
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              {/* Phone number input */}
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Phone size={16} className="text-muted-foreground" />
                  <Text className="font-medium text-sm">
                    Numéro de téléphone
                  </Text>
                </View>
                <TextInput
                  className="rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground"
                  placeholder="+33 6 12 34 56 78"
                  placeholderTextColor="hsl(240 5% 46%)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  editable={!isLoading}
                />
              </View>

              {/* Message input */}
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <MessageSquare
                    size={16}
                    className="text-muted-foreground"
                  />
                  <Text className="font-medium text-sm">Message</Text>
                </View>
                <TextInput
                  className="rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground"
                  placeholder="Votre message ici..."
                  placeholderTextColor="hsl(240 5% 46%)"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  style={{ minHeight: 100, textAlignVertical: "top" }}
                  editable={!isLoading}
                />
              </View>

              {/* Send button */}
              <Button
                variant="default"
                size="lg"
                className="mt-2"
                onPress={handleSend}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Send size={18} color="white" />
                )}
                <Text className="text-white font-semibold">
                  {isLoading ? "Envoi en cours..." : "Envoyer le SMS"}
                </Text>
              </Button>

              {/* Status / error feedback zone */}
              {status !== "idle" && status !== "loading" && (
                <View
                  className="mt-2 rounded-lg p-4"
                  style={{
                    backgroundColor:
                      status === "success"
                        ? "rgba(34,197,94,0.1)"
                        : "rgba(239,68,68,0.1)",
                  }}
                >
                  <Text
                    className="text-center font-medium"
                    style={{
                      color:
                        status === "success"
                          ? "hsl(142 71% 45%)"
                          : "hsl(0 84% 60%)",
                    }}
                  >
                    {statusMessage}
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
