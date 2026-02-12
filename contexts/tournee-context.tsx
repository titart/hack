import { createContext, useContext, useReducer, useCallback, type ReactNode, type Dispatch } from "react";
import type { ObjectAnalysis } from "@/lib/gemini";
import { ADRESSES_TOURNEE } from "@/data/adresses-tournee";
import {
  type TourneeState,
  type TourneeAction,
  type RefusalReason,
  type FailureReason,
  tourneeReducer,
  initTourneeState,
  REFUSAL_REASONS,
  FAILURE_REASONS,
} from "@/types/tournee-store";

// Re-export pour les consommateurs existants
export { REFUSAL_REASONS, FAILURE_REASONS };
export type { RefusalReason, FailureReason };

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface TourneeContextType {
  /** État complet de la tournée */
  state: TourneeState;
  /** Dispatch brut pour les actions */
  dispatch: Dispatch<TourneeAction>;

  // --- Helpers pratiques (wrappent dispatch) ---

  startTournee: () => void;
  startPoint: (numero: number) => void;
  completePoint: (numero: number, result: "success" | "failed", failureReason?: FailureReason) => void;
  setPointPhoto: (numero: number, uri: string) => void;
  collectColis: (numero: number, colisName: string, photo: string, analysis?: ObjectAnalysis) => void;
  refuseColis: (numero: number, colisName: string, reason: RefusalReason) => void;
  setColisAnalysis: (numero: number, colisName: string, analysis: ObjectAnalysis) => void;
  resetPoint: (numero: number) => void;
  swapPoints: (numeroA: number, numeroB: number) => void;
  completeTournee: () => void;
  reset: () => void;

  // --- Déchargement ---
  unlockDechargement: () => void;
  startDechargement: () => void;
  scanColisDechargement: (colisName: string, pointNumero: number) => void;
  completeDechargement: () => void;
}

const TourneeContext = createContext<TourneeContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function TourneeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    tourneeReducer,
    ADRESSES_TOURNEE,
    initTourneeState,
  );

  // --- Helpers stables wrappant dispatch ---

  const startTournee = useCallback(() => {
    dispatch({ type: "START_TOURNEE" });
  }, []);

  const startPoint = useCallback((numero: number) => {
    dispatch({ type: "START_POINT", numero });
  }, []);

  const completePoint = useCallback((numero: number, result: "success" | "failed", failureReason?: FailureReason) => {
    dispatch({ type: "COMPLETE_POINT", numero, result, failureReason });
  }, []);

  const setPointPhoto = useCallback((numero: number, uri: string) => {
    dispatch({ type: "SET_POINT_PHOTO", numero, uri });
  }, []);

  const collectColis = useCallback(
    (numero: number, colisName: string, photo: string, analysis?: ObjectAnalysis) => {
      dispatch({ type: "COLLECT_COLIS", numero, colisName, photo, analysis });
    },
    [],
  );

  const refuseColis = useCallback(
    (numero: number, colisName: string, reason: RefusalReason) => {
      dispatch({ type: "REFUSE_COLIS", numero, colisName, reason });
    },
    [],
  );

  const setColisAnalysis = useCallback(
    (numero: number, colisName: string, analysis: ObjectAnalysis) => {
      dispatch({ type: "SET_COLIS_ANALYSIS", numero, colisName, analysis });
    },
    [],
  );

  const resetPoint = useCallback((numero: number) => {
    dispatch({ type: "RESET_POINT", numero });
  }, []);

  const swapPoints = useCallback((numeroA: number, numeroB: number) => {
    dispatch({ type: "SWAP_POINTS", numeroA, numeroB });
  }, []);

  const completeTournee = useCallback(() => {
    dispatch({ type: "COMPLETE_TOURNEE" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET", adresses: ADRESSES_TOURNEE });
  }, []);

  // --- Déchargement ---

  const unlockDechargement = useCallback(() => {
    dispatch({ type: "UNLOCK_DECHARGEMENT" });
  }, []);

  const startDechargement = useCallback(() => {
    dispatch({ type: "START_DECHARGEMENT" });
  }, []);

  const scanColisDechargement = useCallback(
    (colisName: string, pointNumero: number) => {
      dispatch({ type: "SCAN_COLIS_DECHARGEMENT", colisName, pointNumero });
    },
    [],
  );

  const completeDechargement = useCallback(() => {
    dispatch({ type: "COMPLETE_DECHARGEMENT" });
  }, []);

  return (
    <TourneeContext.Provider
      value={{
        state,
        dispatch,
        startTournee,
        startPoint,
        completePoint,
        setPointPhoto,
        collectColis,
        refuseColis,
        setColisAnalysis,
        resetPoint,
        swapPoints,
        completeTournee,
        reset,
        unlockDechargement,
        startDechargement,
        scanColisDechargement,
        completeDechargement,
      }}
    >
      {children}
    </TourneeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTournee() {
  const context = useContext(TourneeContext);
  if (!context) {
    throw new Error("useTournee must be used within a TourneeProvider");
  }
  return context;
}
