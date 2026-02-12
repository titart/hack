import type { ObjectAnalysis } from "@/lib/gemini";
import type { AdresseTournee, ColisItem } from "@/components/map-tournee";

// ---------------------------------------------------------------------------
// Statuts
// ---------------------------------------------------------------------------

export type TourneeStatus = "pending" | "in_progress" | "completed";
export type PointStatus = "pending" | "started" | "failed" | "success";
export type ColisStatus = "pending" | "collected" | "refused";

// ---------------------------------------------------------------------------
// Raisons de refus (source unique)
// ---------------------------------------------------------------------------

export const REFUSAL_REASONS = [
  "Appareil non au domicile",
  "Appareil non DEEE",
  "Appareil non intègre",
  "Collecte >5e étage sans ascenseur",
  "Client non présent / ne répond pas",
] as const;

export type RefusalReason = (typeof REFUSAL_REASONS)[number];

export const FAILURE_REASONS = [
  "Personne absente",
  "Accès impossible",
  "La réponse D",
] as const;

export type FailureReason = (typeof FAILURE_REASONS)[number];

// ---------------------------------------------------------------------------
// State d'un colis
// ---------------------------------------------------------------------------

export interface ColisState {
  /** Données statiques (copiées depuis ColisItem) */
  name: string;
  type?: string;
  marque?: string;
  modele?: string;
  poids?: string;
  statut?: "collecte" | "non_collecte";
  categorie?: string;

  /** État dynamique */
  status: ColisStatus;
  photo?: string;
  analysis?: ObjectAnalysis;
  refusalReason?: RefusalReason;
}

// ---------------------------------------------------------------------------
// State d'un point de livraison
// ---------------------------------------------------------------------------

export interface PointLivraisonState {
  /** Données statiques (copiées depuis AdresseTournee) */
  numero: number;
  adresse: string;
  latitude: number;
  longitude: number;
  clientName?: string;
  phone?: string;
  notes?: string;
  creneauHoraire?: string;
  ville?: string;
  missionType?: string;
  missionRef?: string;
  missionPartenaire?: string;

  /** État dynamique */
  status: PointStatus;
  startedAt?: string;
  completedAt?: string;
  photo?: string;
  failureReason?: FailureReason;

  /** Colis indexés par nom */
  colis: Record<string, ColisState>;
  /** Ordre original des colis (pour l'affichage) */
  colisOrder: string[];
}

// ---------------------------------------------------------------------------
// State racine de la tournée
// ---------------------------------------------------------------------------

export interface TourneeState {
  id: string;
  status: TourneeStatus;
  startedAt?: string;
  completedAt?: string;
  points: Record<number, PointLivraisonState>;
  /** Ordre des points (pour l'affichage / swap) */
  pointsOrder: number[];
}

// ---------------------------------------------------------------------------
// Actions du reducer
// ---------------------------------------------------------------------------

export type TourneeAction =
  | { type: "START_TOURNEE" }
  | { type: "START_POINT"; numero: number }
  | { type: "COMPLETE_POINT"; numero: number; result: "success" | "failed"; failureReason?: FailureReason }
  | { type: "SET_POINT_PHOTO"; numero: number; uri: string }
  | {
      type: "COLLECT_COLIS";
      numero: number;
      colisName: string;
      photo: string;
      analysis?: ObjectAnalysis;
    }
  | {
      type: "REFUSE_COLIS";
      numero: number;
      colisName: string;
      reason: RefusalReason;
    }
  | { type: "SET_COLIS_ANALYSIS"; numero: number; colisName: string; analysis: ObjectAnalysis }
  | { type: "RESET_POINT"; numero: number }
  | { type: "SWAP_POINTS"; numeroA: number; numeroB: number }
  | { type: "COMPLETE_TOURNEE" }
  | { type: "RESET"; adresses: AdresseTournee[] };

// ---------------------------------------------------------------------------
// Initialisation depuis les données statiques
// ---------------------------------------------------------------------------

function buildColisState(colis: ColisItem): ColisState {
  return {
    name: colis.name,
    type: colis.type,
    marque: colis.marque,
    modele: colis.modele,
    poids: colis.poids,
    statut: colis.statut,
    categorie: colis.categorie,
    status: "pending",
  };
}

function buildPointState(adresse: AdresseTournee): PointLivraisonState {
  const colisRecord: Record<string, ColisState> = {};
  const colisOrder: string[] = [];

  for (const c of adresse.colis) {
    colisRecord[c.name] = buildColisState(c);
    colisOrder.push(c.name);
  }

  return {
    numero: adresse.numero,
    adresse: adresse.adresse,
    latitude: adresse.latitude,
    longitude: adresse.longitude,
    clientName: adresse.clientName,
    phone: adresse.phone,
    notes: adresse.notes,
    creneauHoraire: adresse.creneauHoraire,
    ville: adresse.ville,
    missionType: adresse.missionType,
    missionRef: adresse.missionRef,
    missionPartenaire: adresse.missionPartenaire,
    status: "pending",
    colis: colisRecord,
    colisOrder,
  };
}

export function initTourneeState(adresses: AdresseTournee[]): TourneeState {
  const points: Record<number, PointLivraisonState> = {};
  const pointsOrder: number[] = [];

  for (const a of adresses) {
    points[a.numero] = buildPointState(a);
    pointsOrder.push(a.numero);
  }

  return {
    id: "T01",
    status: "pending",
    points,
    pointsOrder,
  };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function tourneeReducer(state: TourneeState, action: TourneeAction): TourneeState {
  switch (action.type) {
    case "START_TOURNEE":
      return {
        ...state,
        status: "in_progress",
        startedAt: new Date().toISOString(),
      };

    case "START_POINT": {
      const point = state.points[action.numero];
      if (!point) return state;
      return {
        ...state,
        points: {
          ...state.points,
          [action.numero]: {
            ...point,
            status: "started",
            startedAt: new Date().toISOString(),
          },
        },
      };
    }

    case "COMPLETE_POINT": {
      const point = state.points[action.numero];
      if (!point) return state;
      const newStatus = action.result === "success" ? "success" : "failed";
      return {
        ...state,
        points: {
          ...state.points,
          [action.numero]: {
            ...point,
            status: newStatus as PointStatus,
            completedAt: new Date().toISOString(),
            failureReason: action.failureReason,
          },
        },
      };
    }

    case "SET_POINT_PHOTO": {
      const point = state.points[action.numero];
      if (!point) return state;
      return {
        ...state,
        points: {
          ...state.points,
          [action.numero]: {
            ...point,
            photo: action.uri,
          },
        },
      };
    }

    case "COLLECT_COLIS": {
      const point = state.points[action.numero];
      if (!point) return state;
      const colis = point.colis[action.colisName];
      if (!colis) return state;
      return {
        ...state,
        points: {
          ...state.points,
          [action.numero]: {
            ...point,
            colis: {
              ...point.colis,
              [action.colisName]: {
                ...colis,
                status: "collected",
                photo: action.photo,
                analysis: action.analysis ?? colis.analysis,
              },
            },
          },
        },
      };
    }

    case "REFUSE_COLIS": {
      const point = state.points[action.numero];
      if (!point) return state;
      const colis = point.colis[action.colisName];
      if (!colis) return state;
      return {
        ...state,
        points: {
          ...state.points,
          [action.numero]: {
            ...point,
            colis: {
              ...point.colis,
              [action.colisName]: {
                ...colis,
                status: "refused",
                refusalReason: action.reason,
              },
            },
          },
        },
      };
    }

    case "SET_COLIS_ANALYSIS": {
      const point = state.points[action.numero];
      if (!point) return state;
      const colis = point.colis[action.colisName];
      if (!colis) return state;
      return {
        ...state,
        points: {
          ...state.points,
          [action.numero]: {
            ...point,
            colis: {
              ...point.colis,
              [action.colisName]: {
                ...colis,
                analysis: action.analysis,
              },
            },
          },
        },
      };
    }

    case "RESET_POINT": {
      const point = state.points[action.numero];
      if (!point) return state;
      return {
        ...state,
        points: {
          ...state.points,
          [action.numero]: {
            ...point,
            status: "started",
            completedAt: undefined,
          },
        },
      };
    }

    case "SWAP_POINTS": {
      const orderCopy = [...state.pointsOrder];
      const idxA = orderCopy.indexOf(action.numeroA);
      const idxB = orderCopy.indexOf(action.numeroB);
      if (idxA === -1 || idxB === -1) return state;
      [orderCopy[idxA], orderCopy[idxB]] = [orderCopy[idxB], orderCopy[idxA]];
      return {
        ...state,
        pointsOrder: orderCopy,
      };
    }

    case "COMPLETE_TOURNEE":
      return {
        ...state,
        status: "completed",
        completedAt: new Date().toISOString(),
      };

    case "RESET":
      return initTourneeState(action.adresses);

    default:
      return state;
  }
}
