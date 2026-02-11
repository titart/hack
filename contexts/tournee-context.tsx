import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { ObjectAnalysis } from "@/lib/gemini";

type CourseResult = "success" | "fail";

interface TourneeContextType {
  results: Record<number, CourseResult>;
  photos: Record<number, string>;
  /** Photos par colis, clé = nom du colis (ex. "Colis A-001") */
  colisPhotos: Record<string, string>;
  /** Résultats d'analyse IA par colis */
  colisAnalysis: Record<string, ObjectAnalysis>;
  setResult: (numero: number, result: CourseResult) => void;
  setPhoto: (numero: number, uri: string) => void;
  setColisPhoto: (colisName: string, uri: string) => void;
  setColisAnalysis: (colisName: string, analysis: ObjectAnalysis) => void;
  reset: () => void;
}

const TourneeContext = createContext<TourneeContextType | null>(null);

export function TourneeProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<Record<number, CourseResult>>({});
  const [photos, setPhotos] = useState<Record<number, string>>({});
  const [colisPhotos, setColisPhotosState] = useState<Record<string, string>>({});
  const [colisAnalysis, setColisAnalysisState] = useState<Record<string, ObjectAnalysis>>({});

  const setResult = useCallback((numero: number, result: CourseResult) => {
    setResults((prev) => ({ ...prev, [numero]: result }));
  }, []);

  const setPhoto = useCallback((numero: number, uri: string) => {
    setPhotos((prev) => ({ ...prev, [numero]: uri }));
  }, []);

  const setColisPhoto = useCallback((colisName: string, uri: string) => {
    setColisPhotosState((prev) => ({ ...prev, [colisName]: uri }));
  }, []);

  const setColisAnalysis = useCallback((colisName: string, analysis: ObjectAnalysis) => {
    setColisAnalysisState((prev) => ({ ...prev, [colisName]: analysis }));
  }, []);

  const reset = useCallback(() => {
    setResults({});
    setPhotos({});
    setColisPhotosState({});
    setColisAnalysisState({});
  }, []);

  return (
    <TourneeContext.Provider value={{ results, photos, colisPhotos, colisAnalysis, setResult, setPhoto, setColisPhoto, setColisAnalysis, reset }}>
      {children}
    </TourneeContext.Provider>
  );
}

export function useTournee() {
  const context = useContext(TourneeContext);
  if (!context) {
    throw new Error("useTournee must be used within a TourneeProvider");
  }
  return context;
}
