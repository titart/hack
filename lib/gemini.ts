import { GoogleGenAI } from "@google/genai";
import { File } from "expo-file-system";

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

let _client: GoogleGenAI | null = null;

/**
 * Retourne le client Google GenAI. Lève une erreur si la clé API n'est pas configurée.
 */
export function getClient(): GoogleGenAI {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Clé API Gemini manquante. Définissez EXPO_PUBLIC_GEMINI_API_KEY dans votre fichier .env"
    );
  }
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Helpers – lecture d'image locale en base64
// ---------------------------------------------------------------------------

/**
 * Lit un fichier local et retourne son contenu en base64 (sans préfixe data-url).
 */
async function readImageAsBase64(uri: string): Promise<string> {
  const file = new File(uri);
  const base64 = await file.base64();
  return base64;
}

/**
 * Détecte le type MIME à partir de l'extension d'un URI.
 */
function getMimeType(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase() ?? "jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

// ---------------------------------------------------------------------------
// Chat – envoi de message texte simple
// ---------------------------------------------------------------------------

export type ChatMessage = {
  role: "user" | "model";
  content: string;
};

/**
 * Envoie un prompt texte à Gemini et retourne la réponse.
 *
 * @example
 * const reply = await chat("Bonjour !");
 */
export async function chat(
  prompt: string,
  model: string = "gemini-2.5-flash"
): Promise<string> {
  const client = getClient();
  const response = await client.models.generateContent({
    model,
    contents: prompt,
  });
  return response.text ?? "";
}

// ---------------------------------------------------------------------------
// Vision – analyse d'image(s)
// ---------------------------------------------------------------------------

type ImageInput = {
  /** URI local (file://) ou URL distante (https://) */
  uri: string;
};

/**
 * Analyse une ou plusieurs images avec Gemini (vision).
 *
 * @param images  - Tableau d'images (URI locaux ou URLs distantes)
 * @param prompt  - Instruction / question à poser sur les images
 * @param model   - Modèle à utiliser (défaut: gemini-2.5-flash)
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
  model: string = "gemini-2.5-flash"
): Promise<string> {
  const client = getClient();

  // Construit les parts multimodales
  const parts: any[] = [{ text: prompt }];

  for (const img of images) {
    if (img.uri.startsWith("file://") || img.uri.startsWith("/")) {
      // Fichier local : lire en base64
      const base64 = await readImageAsBase64(img.uri);
      const mimeType = getMimeType(img.uri);
      parts.push({
        inlineData: {
          data: base64,
          mimeType,
        },
      });
    } else {
      // URL distante
      parts.push({
        inlineData: {
          data: img.uri,
          mimeType: getMimeType(img.uri),
        },
      });
    }
  }

  const response = await client.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
  });

  return response.text ?? "";
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

// ---------------------------------------------------------------------------
// Analyse d'objet – identification + notes recyclage & état
// ---------------------------------------------------------------------------

export type ObjectAnalysis = {
  /** Nom de l'objet identifié (ex: "Micro-ondes", "Réfrigérateur") */
  name: string;
  /** Marque et/ou modèle détecté par l'IA (ex: "Samsung MW3500K") */
  brand: string;
  /** Description courte de l'objet */
  description: string;
  /** Note de recyclabilité sur 10 */
  recyclingScore: number;
  /** Justification de la note de recyclage */
  recyclingComment: string;
  /** Note de l'état apparent sur 10 */
  conditionScore: number;
  /** Justification de la note d'état */
  conditionComment: string;
  /** Conseils pour le recyclage / la valorisation */
  tips: string;
};

const OBJECT_ANALYSIS_PROMPT = `Tu es un expert en recyclage et en évaluation d'objets.

Analyse la photo fournie et réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks, juste le JSON brut) avec cette structure exacte :

{
  "name": "Nom générique de l'objet (ex: Micro-ondes, Réfrigérateur, Lave-linge)",
  "brand": "Marque et/ou modèle détecté (ex: Samsung MW3500K, Whirlpool, LG F4V5VYP0W)",
  "description": "Description courte de l'objet visible sur la photo (1-2 phrases)",
  "recyclingScore": 7,
  "recyclingComment": "Explication de la note de recyclage (matériaux, facilité de démontage, filières existantes...)",
  "conditionScore": 5,
  "conditionComment": "Explication de la note d'état (usure visible, fonctionnement probable, dommages...)",
  "tips": "Conseils pratiques pour recycler ou valoriser cet objet (déchèterie, don, revente, réparation...)"
}

Règles :
- recyclingScore : note de 1 à 10 sur la facilité et le potentiel de recyclage de cet objet (10 = très facilement recyclable)
- conditionScore : note de 1 à 10 sur l'état apparent de l'objet (10 = comme neuf)
- brand : identifie la marque et le modèle de l'objet si visible sur la photo (logo, étiquette, design reconnaissable). Mets la marque ET le modèle si tu peux les détecter. Si tu ne peux identifier ni la marque ni le modèle, mets "Marque inconnue"
- Si tu ne peux pas identifier l'objet, mets "name": "Objet non identifié" et adapte les autres champs
- Sois précis et utile dans tes commentaires
- Réponds en français`;

/**
 * Analyse un objet à partir d'une photo pour identifier le modèle,
 * noter sa recyclabilité et son état apparent.
 *
 * @example
 * const analysis = await analyzeObject("file:///path/to/photo.jpg");
 * console.log(analysis.name); // "Micro-ondes Samsung"
 * console.log(analysis.recyclingScore); // 7
 */
export async function analyzeObject(uri: string): Promise<ObjectAnalysis> {
  const raw = await analyzeImage(uri, OBJECT_ANALYSIS_PROMPT);

  try {
    // Nettoyer la réponse au cas où le modèle ajoute des backticks
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(cleaned) as ObjectAnalysis;

    // Valider et borner les scores
    parsed.recyclingScore = Math.max(
      1,
      Math.min(10, Math.round(parsed.recyclingScore))
    );
    parsed.conditionScore = Math.max(
      1,
      Math.min(10, Math.round(parsed.conditionScore))
    );

    return parsed;
  } catch {
    // Fallback si le parsing échoue
    return {
      name: "Objet non identifié",
      brand: "Marque inconnue",
      description: raw.slice(0, 200),
      recyclingScore: 5,
      recyclingComment: "Impossible d'évaluer le recyclage automatiquement.",
      conditionScore: 5,
      conditionComment: "Impossible d'évaluer l'état automatiquement.",
      tips: raw,
    };
  }
}
