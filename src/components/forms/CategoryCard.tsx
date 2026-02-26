'use client';

import { Edit2, Trash2, Users, Trophy } from 'lucide-react';

const FORMAT_LABELS: Record<string, string> = {
  king_of_the_beach: 'King of the Beach',
  bracket: 'Bracket',
  group_knockout: 'Group+Knockout',
  round_robin: 'Round Robin',
};

const GENDER_LABELS: Record<string, string> = {
  male: 'Masculino',
  female: 'Feminino',
  mixed: 'Misto',
};

const SKILL_LABELS: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
  pro: 'Profissional',
};

export interface CategoryCardData {
  id?: string;
  name: string;
  format: string;
  gender?: string;
  skillLevel?: string;
  maxTeams: number;
  pointsPerSet: number;
  numSets: number;
  groupSize: number;
  proLeague: boolean;
  sortOrder?: number;
}

interface CategoryCardProps {
  category: CategoryCardData;
  index: number;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

export default function CategoryCard({ category, index, onEdit, onRemove }: CategoryCardProps) {
  return (
    <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg p-4 hover:border-blue-300 transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} className="text-blue-600" />
            <h3 className="font-semibold text-white">{category.name}</h3>
            {category.proLeague && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                Pro League
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
              {FORMAT_LABELS[category.format] || category.format}
            </span>
            {category.gender && (
              <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded">
                {GENDER_LABELS[category.gender] || category.gender}
              </span>
            )}
            {category.skillLevel && (
              <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">
                {SKILL_LABELS[category.skillLevel] || category.skillLevel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {category.maxTeams} duplas
            </span>
            <span>{category.pointsPerSet} pts/set</span>
            {category.numSets > 1 && <span>Best of {category.numSets}</span>}
            {category.format === 'king_of_the_beach' && (
              <span>Grupos de {category.groupSize}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            type="button"
            onClick={() => onEdit(index)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
            title="Editar categoria"
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
            title="Remover categoria"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
