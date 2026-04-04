export interface RawStatEntry {
  section: string;
  data:    Record<string, number> | { type?: string; offense?: string; count: number }[];
  total?:  number;
}

export interface NeighborhoodTiers {
  crime:          "High" | "Moderate" | "Low";
  complaints_311: "High" | "Moderate" | "Low";
}

export interface AnalysisData {
  requests_311:           string;
  crime_safety:           string;
  property_mix:           string;
  permit_activity:        string;
  entertainment_scene:    string;
  traffic_safety:         string;
  gun_violence:           string;
  green_space:            string;
  overall_verdict:        string;
  closing_recommendation: string;
  raw_stats:              RawStatEntry[];
  neighborhood_tiers:     NeighborhoodTiers | null;
}

export interface Search {
  id:           string;
  neighborhood: string;
  street:       string;
  zip_code:     string;
  created_at:   string;
  analysis:     AnalysisData | null;
}

export interface SelectedAnalysis {
  data:         AnalysisData;
  neighborhood: string;
  street:       string;
  zip_code:     string;
}
