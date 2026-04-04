import { Button } from "@headlessui/react";
import CardStatPropertyMix from "@/components/stat-cards-02";
import CardStat311 from "@/components/stat-cards-03";
import Stats03 from "@/components/stats-03";
import { SERIOUS_CRIME_TYPES, SERIOUS_311_TYPES } from "@/lib/constants";
import type { SelectedAnalysis } from "../types";
import { AnalysisCard, formatFlagSentence } from "./analysis-card";

export function AnalysisReport({
  analysis,
  onOpenMap,
}: {
  analysis: SelectedAnalysis;
  onOpenMap: () => void;
}) {
  const crimeStat = analysis.data.raw_stats?.find(
    (s) => s.section === "crime_safety"
  );

  const statsProp = analysis.data.raw_stats?.find(
    (s) => s.section === "property_mix"
  );

  const stats311 = analysis.data.raw_stats?.find(
    (s) => s.section === "requests_311"
  );

  const crimeFlagItems = (() => {
    if (!crimeStat || !Array.isArray(crimeStat.data)) return [];
    const rows = crimeStat.data as { offense: string; count: number }[];
    return [...SERIOUS_CRIME_TYPES].map(type => ({
      label: type
        .replace("ASSAULT - AGGRAVATED", "Aggravated Assault")
        .replace("THREATS TO DO BODILY HARM", "Threats to Do Bodily Harm")
        .replace("ROBBERY", "Robbery")
        .replace("DRUGS - POSSESSION/ SALE/ MANUFACTURING/ USE", "Drug Offenses")
        .replace("BURGLARY - RESIDENTIAL", "Residential Burglary"),
      count: rows.find(r => r.offense === type)?.count ?? 0,
    })).filter(i => i.count > 0);
  })();

  const flag311Items = (() => {
    if (!stats311 || !Array.isArray(stats311.data)) return [];
    const rows = stats311.data as { type: string; count: number }[];
    return [...SERIOUS_311_TYPES].map(type => ({
      label: type,
      count: rows.find(r => r.type === type)?.count ?? 0,
    })).filter(i => i.count > 0);
  })();

  return (
    <section>
      <div className="w-full rounded-xl bg-white/10 border border-[#649E97]/20 backdrop-blur-2xl p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Analysis Report</h2>
            <p className="text-sm text-gray-500 mt-1">
              {analysis.neighborhood} · {analysis.street} · {analysis.zip_code}
            </p>
          </div>

          <AnalysisCard label="Overall Verdict" content={analysis.data.overall_verdict} variant="verdict" />

          {crimeStat && Array.isArray(crimeStat.data) && (
            <Stats03
              data={crimeStat.data as { offense: string; count: number }[]}
              seriousTypes={SERIOUS_CRIME_TYPES}
            />
          )}

          <Button
            type="button"
            onClick={onOpenMap}
            className="inline-flex items-center gap-2 rounded-lg border border-[#649E97]/35 bg-[#F8FBFA] px-4 py-1.5 text-sm/6 font-semibold text-gray-900 shadow-sm focus:not-data-focus:outline-none data-focus:outline-2 data-focus:outline-[#006B4E]/40 data-hover:bg-[#649E97]/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
            </svg>
            View Crime Map
          </Button>

          <div className="flex flex-col md:flex-row gap-4">
            {statsProp && !Array.isArray(statsProp.data) && (
              <CardStatPropertyMix
                data={statsProp.data as Record<string, number>}
                total={statsProp.total ?? 0}
              />
            )}
            {stats311 && Array.isArray(stats311.data) && (
              <CardStat311
                data={stats311.data as { type: string; count: number }[]}
                total={stats311.total ?? 0}
                seriousTypes={SERIOUS_311_TYPES}
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <AnalysisCard label="Crime & Safety"       content={analysis.data.crime_safety}  flagItems={crimeFlagItems} flagKind="crime" />
            <AnalysisCard label="311 Service Requests" content={analysis.data.requests_311}  flagItems={flag311Items}  flagKind="311" />
            <AnalysisCard label="Gun Violence"         content={analysis.data.gun_violence} />
            <AnalysisCard label="Property Mix"         content={analysis.data.property_mix} />
            <AnalysisCard label="Traffic Safety"       content={analysis.data.traffic_safety} />
            <AnalysisCard label="Building Permits"     content={analysis.data.permit_activity} />
            <AnalysisCard label="Entertainment Scene"  content={analysis.data.entertainment_scene} />
            <AnalysisCard label="Green Space"          content={analysis.data.green_space} />
          </div>
        </div>
      </div>
    </section>
  );
}
