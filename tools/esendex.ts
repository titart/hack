import axios from "axios";
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

/**
 * Send a single SMS message via the Esendex API.
 * @param to - Recipient phone number (E.164 format recommended)
 * @param body - Message content
 */
export async function sendSms(to: string, body: string): Promise<void> {
  console.log("sendSms called", { to, body, extra });

  const response = await axios.post(
    `${extra.esendexBaseUrl}/v1.0/messagedispatcher`,
    {
      accountReference: extra.esendexAccountReference,
      messages: [{ to, body }],
    },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${extra.esendexBearerToken}`,
      },
      timeout: 10_000,
    }
  );

  console.log("SMS sent successfully", response.data);
}
