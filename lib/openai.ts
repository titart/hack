import OpenAI from "openai";
import * as FileSystem from "expo-file-system";
import Constants from "expo-constants";

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

const OPENAI_API_KEY =
  Constants.expoConfig?.extra?.openaiApiKey ??
  process.env.EXPO_PUBLIC_OPENAI_API_KEY ??
  "";

let _client: OpenAI | null = null;

/**
 * Retourne le client OpenAI. Lève une erreur si la clé API n'est pas configurée.
 */
export function getClient(): OpenAI {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "Clé API OpenAI manquante. Définissez EXPO_PUBLIC_OPENAI_API_KEY dans votre fichier .env"
    );
  }
  if (!_client) {
    _client = new OpenAI({
      apiKey: OPENAI_API_KEY,
      // Nécessaire côté client React Native (pas de backend ici)
      dangerouslyAllowBrowser: true,
    });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Chat – envoi de message texte simple
// ---------------------------------------------------------------------------

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Envoie des messages à ChatGPT et retourne la réponse textuelle.
 *
 * @example
 * const reply = await chat([
 *   { role: "user", content: "Bonjour !" }
 * ]);
 */
export async function chat(
  messages: ChatMessage[],
  model: string = "gpt-4o-mini"
): Promise<string> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model,
    messages,
  });
  return response.choices[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------------
// Vision – analyse d'image(s)
// ---------------------------------------------------------------------------

/**
 * Convertit un URI local (file://) en data-URL base64 utilisable par l'API.
 */
async function imageUriToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  // Détecte le type MIME à partir de l'extension
  const ext = uri.split(".").pop()?.toLowerCase() ?? "jpeg";
  const mime =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${base64}`;
}

type ImageInput = {
  /** URI local (file://) ou URL distante (https://) */
  uri: string;
};

/**
 * Analyse une ou plusieurs images avec GPT-4o (vision).
 *
 * @param images  - Tableau d'images (URI locaux ou URLs distantes)
 * @param prompt  - Instruction / question à poser sur les images
 * @param model   - Modèle à utiliser (défaut: gpt-4o)
 *
 * @example
 * const analysis = await analyzeImages(
 *   [{ uri: "file:///path/to/photo.jpg" }],
 *   "Décris ce que tu vois sur cette photo."
 * );
 */
export async function analyzeImages(
  images: ImageInput[],
  prompt: string,
  model: string = "gpt-4o"
): Promise<string> {
  const client = getClient();

  // Construit le contenu multimodal
  const imageContents: OpenAI.Chat.Completions.ChatCompletionContentPart[] =
    await Promise.all(
      images.map(async (img) => {
        // Si c'est un fichier local, convertir en base64
        const url = img.uri.startsWith("file://")
          ? await imageUriToBase64(img.uri)
          : img.uri;

        return {
          type: "image_url" as const,
          image_url: { url, detail: "auto" as const },
        };
      })
    );

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: prompt }, ...imageContents],
      },
    ],
    max_tokens: 1024,
  });

  return response.choices[0]?.message?.content ?? "";
}

/**
 * Raccourci pour analyser une seule image.
 *
 * @example
 * const result = await analyzeImage(
 *   "file:///path/to/photo.jpg",
 *   "Qu'est-ce qu'on voit sur cette photo ?"
 * );
 */
export async function analyzeImage(
  uri: string,
  prompt: string,
  model?: string
): Promise<string> {
  return analyzeImages([{ uri }], prompt, model);
}
