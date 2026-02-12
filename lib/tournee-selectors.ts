import type {
  TourneeState,
  PointLivraisonState,
  ColisState,
} from "@/types/tournee-store";

// ---------------------------------------------------------------------------
// Sélecteurs unitaires
// ---------------------------------------------------------------------------

/** Retourne un point de livraison par son numéro */
export function getPoint(state: TourneeState, numero: number): PointLivraisonState | undefined {
  return state.points[numero];
}

/** Retourne un colis par numéro de point + nom du colis */
export function getColis(
  state: TourneeState,
  numero: number,
  colisName: string,
): ColisState | undefined {
  return state.points[numero]?.colis[colisName];
}

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

/** Pourcentage de points terminés (success ou failed) */
export function getTourneeProgress(state: TourneeState): number {
  const numeros = state.pointsOrder;
  if (numeros.length === 0) return 0;
  const done = numeros.filter((n) => {
    const s = state.points[n]?.status;
    return s === "success" || s === "failed";
  }).length;
  return Math.round((done / numeros.length) * 100);
}

/** Pourcentage de colis traités (collected ou refused) pour un point */
export function getPointProgress(state: TourneeState, numero: number): number {
  const point = state.points[numero];
  if (!point) return 0;
  const names = point.colisOrder;
  if (names.length === 0) return 0;
  const done = names.filter((n) => {
    const s = point.colis[n]?.status;
    return s === "collected" || s === "refused";
  }).length;
  return Math.round((done / names.length) * 100);
}

// ---------------------------------------------------------------------------
// Points ordonnés (pour l'affichage)
// ---------------------------------------------------------------------------

/** Retourne les points dans l'ordre courant (prend en compte les swaps) */
export function getOrderedPoints(state: TourneeState): PointLivraisonState[] {
  return state.pointsOrder
    .map((n) => state.points[n])
    .filter((p): p is PointLivraisonState => p != null);
}

// ---------------------------------------------------------------------------
// Résumé de la tournée (legacy compat + objet final)
// ---------------------------------------------------------------------------

/**
 * Construit un Record<number, "success" | "fail"> compatible avec MapTournee.
 * Traduit le PointStatus interne vers le format attendu par la carte.
 */
export function getResultsMap(state: TourneeState): Record<number, "success" | "fail"> {
  const results: Record<number, "success" | "fail"> = {};
  for (const [key, point] of Object.entries(state.points)) {
    if (point.status === "success") {
      results[Number(key)] = "success";
    } else if (point.status === "failed") {
      results[Number(key)] = "fail";
    }
  }
  return results;
}

/** Vérifie si tous les points sont terminés */
export function isAllPointsDone(state: TourneeState): boolean {
  return state.pointsOrder.every((n) => {
    const s = state.points[n]?.status;
    return s === "success" || s === "failed";
  });
}

/**
 * Objet de synthèse complet de la tournée.
 * Retourne l'intégralité du TourneeState tel quel — il contient déjà
 * toutes les données (photos, analyses, refus, timestamps) de chaque
 * point et de chaque colis.
 *
 * À utiliser en fin de tournée pour sérialiser en JSON, envoyer à une API, etc.
 */
export function getTourneeSummary(state: TourneeState): TourneeState {
  return state;
}
