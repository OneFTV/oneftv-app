'use client';

import { useState } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

const FORMATS = [
  { value: 'bracket', label: 'Single Elimination' },
  { value: 'double_elimination', label: 'Double Elimination' },
  { value: 'group_knockout', label: 'Group + Knockout' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'king_of_the_beach', label: 'King of the Beach' },
];

const GENDERS = [
  { value: '', label: 'Any' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'mixed', label: 'Mixed / Coed' },
];

const SKILL_LEVELS = [
  { value: '', label: 'Any' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'pro', label: 'Pro' },
];

const SUGGESTIONS = [
  { name: 'Open', format: 'bracket', gender: '', skillLevel: '', maxTeams: 16 },
  { name: 'Beginners', format: 'bracket', gender: '', skillLevel: 'beginner', maxTeams: 16 },
  { name: 'Coed', format: 'bracket', gender: 'mixed', skillLevel: '', maxTeams: 16 },
  { name: 'Feminino', format: 'bracket', gender: 'female', skillLevel: '', maxTeams: 16 },
];

const NFA_PRESETS: CategoryData[] = [
  { name: 'Open', format: 'double_elimination', gender: '', skillLevel: '', maxTeams: 32 },
  { name: 'Beginner', format: 'bracket', gender: '', skillLevel: 'beginner', maxTeams: 16 },
  { name: 'Coed', format: 'bracket', gender: 'mixed', skillLevel: '', maxTeams: 20 },
  { name: 'Women', format: 'bracket', gender: 'female', skillLevel: '', maxTeams: 20 },
];

export interface CategoryData {
  name: string;
  format: string;
  gender: string;
  skillLevel: string;
  maxTeams: number;
}

interface CategoryManagerProps {
  categories: CategoryData[];
  onChange: (categories: CategoryData[]) => void;
  maxCapacity: number;
  template?: string;
}

const selectClass = "w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const inputClass = "w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function CategoryManager({ categories, onChange, maxCapacity, template }: CategoryManagerProps) {
  const [showSuggestions, setShowSuggestions] = useState(categories.length === 0);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const presets = template === 'nfa' ? NFA_PRESETS : SUGGESTIONS;
  const usedNames = new Set(categories.map(c => c.name.toLowerCase()));

  const totalAllocated = categories.reduce((sum, c) => sum + c.maxTeams, 0);
  const isOverCapacity = totalAllocated > maxCapacity;

  const addCategory = (preset?: Partial<CategoryData>) => {
    onChange([
      ...categories,
      {
        name: preset?.name || '',
        format: preset?.format || 'bracket',
        gender: preset?.gender || '',
        skillLevel: preset?.skillLevel || '',
        maxTeams: preset?.maxTeams || 16,
      },
    ]);
    setShowSuggestions(false);
  };

  const updateCategory = (index: number, field: keyof CategoryData, value: string | number) => {
    const updated = categories.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    );
    onChange(updated);
  };

  const removeCategory = (index: number) => {
    onChange(categories.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Allocation bar */}
      <div className="bg-slate-800/60 border border-slate-600/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Team Slots Allocated</span>
          <span className={`text-sm font-bold ${isOverCapacity ? 'text-red-400' : 'text-cyan-400'}`}>
            {totalAllocated} of {maxCapacity}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${
              isOverCapacity ? 'bg-red-500' : totalAllocated === maxCapacity ? 'bg-green-500' : 'bg-cyan-500'
            }`}
            style={{ width: `${Math.min((totalAllocated / Math.max(maxCapacity, 1)) * 100, 100)}%` }}
          />
        </div>
        {isOverCapacity && (
          <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
            <AlertTriangle size={14} />
            <span>Total teams exceed capacity! Reduce teams or go back and add more infrastructure.</span>
          </div>
        )}
      </div>

      {/* Quick suggestions */}
      {showSuggestions && (
        <div className="bg-slate-800/40 border border-slate-600/30 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-3">Quick add a category:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => addCategory(s)}
                className="px-3 py-1.5 text-sm bg-blue-600/20 border border-blue-400/30 text-blue-300 rounded-lg hover:bg-blue-600/30 transition"
              >
                + {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category rows */}
      {categories.map((cat, index) => (
        <div
          key={index}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-600/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase">Category {index + 1}</span>
            <button
              type="button"
              onClick={() => removeCategory(index)}
              className="p-1 text-slate-500 hover:text-red-400 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={cat.name}
                onChange={(e) => updateCategory(index, 'name', e.target.value)}
                className={inputClass}
                placeholder="e.g. Open"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Format</label>
              <select
                value={cat.format}
                onChange={(e) => updateCategory(index, 'format', e.target.value)}
                className={selectClass}
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Gender</label>
              <select
                value={cat.gender}
                onChange={(e) => updateCategory(index, 'gender', e.target.value)}
                className={selectClass}
              >
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Skill Level</label>
              <select
                value={cat.skillLevel}
                onChange={(e) => updateCategory(index, 'skillLevel', e.target.value)}
                className={selectClass}
              >
                {SKILL_LEVELS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Max Teams</label>
              <input
                type="number"
                value={cat.maxTeams}
                onChange={(e) => updateCategory(index, 'maxTeams', parseInt(e.target.value) || 0)}
                min={2}
                max={256}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add button with preset menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-600/50 rounded-xl text-slate-400 hover:border-blue-400/50 hover:text-blue-400 transition"
        >
          <Plus size={16} />
          <span className="text-sm font-medium">Add Category</span>
        </button>
        {showAddMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-600/50 rounded-xl shadow-xl z-10 overflow-hidden">
            {presets.filter(p => !usedNames.has(p.name.toLowerCase())).map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => { addCategory(preset); setShowAddMenu(false); }}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-200 hover:bg-blue-600/20 transition border-b border-slate-700/50 last:border-b-0"
              >
                <span className="font-medium">{preset.name}</span>
                <span className="text-xs text-slate-500">
                  {FORMATS.find(f => f.value === preset.format)?.label} · {preset.maxTeams} teams
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => { addCategory(); setShowAddMenu(false); }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-cyan-400 hover:bg-cyan-600/10 transition"
            >
              <Plus size={14} />
              <span>Custom Category</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
