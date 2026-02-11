import "dotenv/config";
import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "hackathon",
  slug: "hackathon",
  extra: {
    esendexBaseUrl: process.env.ESENDEX_BASE_URL ?? "https://api.esendex.com",
    esendexBearerToken: process.env.ESENDEX_BEARER_TOKEN ?? "",
    esendexAccountReference: process.env.ESENDEX_ACCOUNT_REFERENCE ?? "",
  },
});
