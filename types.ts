export interface Suggestion {
  category: 'Soft-Maxxing' | 'Hard-Maxxing' | 'Lifestyle';
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface FeatureAnalysis {
  score: number;
  analysis: string;
  suggestions: Suggestion[];
}

export interface AnalysisResult {
  overallScore: number;
  faceShape: string;
  skinQuality: string;
  genderEstimate: string;
  aestheticArchetype: string;
  features: {
    jawline: FeatureAnalysis;
    eyes: FeatureAnalysis;
    nose: FeatureAnalysis;
    skin: FeatureAnalysis;
    lips: FeatureAnalysis;
    sideProfile: FeatureAnalysis;
  };
  symmetryAnalysis: string;
  harmonyScore: number;
  potentialSummary: string;
}

export interface AppState {
  step: 'consent' | 'upload' | 'analyzing' | 'results';
  frontImage: File | null;
  sideImage: File | null;
  frontPreviewUrl: string | null;
  sidePreviewUrl: string | null;
  activeView: 'front' | 'side';
  analysis: AnalysisResult | null;
  simulatedFrontUrl: string | null;
  simulatedSideUrl: string | null;
  isSimulating: boolean;
  error: string | null;
}