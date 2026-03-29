import type { Search } from "../types";

export function SavedSearchesList({
  searches,
  loading,
  selectedSearchId,
  onCardClick,
  onDelete,
}: {
  searches: Search[];
  loading: boolean;
  selectedSearchId: string | null;
  onCardClick: (s: Search) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Saved Searches</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading searches…</p>
      ) : searches.length === 0 ? (
        <p className="text-sm text-gray-500">No saved searches yet. Add one above.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {searches.map((s) => (
            <div
              key={s.id}
              onClick={() => onCardClick(s)}
              className={`rounded-lg border p-4 flex items-start justify-between cursor-pointer transition-colors backdrop-blur-md ${
                selectedSearchId === s.id
                  ? "bg-[#3A5AA5]/10 border-[#3A5AA5]/80"
                  : "bg-white/60 border-white/40 hover:bg-white/80"
              }`}
            >
              <div>
                <p className="font-medium text-gray-900">{s.neighborhood}</p>
                <p className="text-sm text-gray-600">{s.street}</p>
                <p className="text-sm text-gray-600">{s.zip_code}</p>
                {!s.analysis && (
                  <p className="text-xs text-gray-400 mt-1">No analysis available</p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                className="text-sm font-medium text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
