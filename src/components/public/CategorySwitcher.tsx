'use client';

import { useRouter } from 'next/navigation';

interface CategoryOption {
  id: string;
  name: string;
  format: string;
}

interface CategorySwitcherProps {
  tournamentId: string;
  categories: CategoryOption[];
  currentCategoryId: string;
}

const formatLabels: Record<string, string> = {
  king_of_the_beach: 'KotB',
  bracket: 'Bracket',
  group_knockout: 'G+KO',
  round_robin: 'RR',
};

export default function CategorySwitcher({
  tournamentId,
  categories,
  currentCategoryId,
}: CategorySwitcherProps) {
  const router = useRouter();

  return (
    <>
      {/* Desktop: dropdown */}
      <div className="hidden sm:block">
        <select
          value={currentCategoryId}
          onChange={(e) => router.push(`/e/${tournamentId}/${e.target.value}`)}
          className="bg-dark-elevated border border-dark-border text-gray-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-footvolley-primary/50"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({formatLabels[cat.format] || cat.format})
            </option>
          ))}
        </select>
      </div>

      {/* Mobile: horizontally scrollable pills */}
      <div className="sm:hidden overflow-x-auto flex gap-2 pb-1 -mx-1 px-1">
        {categories.map((cat) => {
          const isActive = cat.id === currentCategoryId;
          return (
            <button
              key={cat.id}
              onClick={() => router.push(`/e/${tournamentId}/${cat.id}`)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors
                ${isActive
                  ? 'bg-footvolley-primary text-white'
                  : 'bg-dark-elevated text-gray-400 hover:bg-dark-divider'
                }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </>
  );
}
