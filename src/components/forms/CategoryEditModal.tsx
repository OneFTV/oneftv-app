'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { CategoryCardData } from './CategoryCard';

const FORMATS = [
  { value: 'king_of_the_beach', label: 'King of the Beach' },
  { value: 'bracket', label: 'Bracket' },
  { value: 'group_knockout', label: 'Group+Knockout' },
  { value: 'round_robin', label: 'Round Robin' },
] as const;

const GENDERS = [
  { value: '', label: 'Qualquer' },
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
  { value: 'mixed', label: 'Misto' },
] as const;

const SKILL_LEVELS = [
  { value: '', label: 'Qualquer' },
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
  { value: 'pro', label: 'Profissional' },
] as const;

interface CategoryEditModalProps {
  isOpen: boolean;
  category: CategoryCardData | null;
  onSave: (category: CategoryCardData) => void;
  onClose: () => void;
}

export default function CategoryEditModal({
  isOpen,
  category,
  onSave,
  onClose,
}: CategoryEditModalProps) {
  const [form, setForm] = useState<CategoryCardData>({
    name: '',
    format: 'bracket',
    maxTeams: 16,
    pointsPerSet: 18,
    numSets: 1,
    groupSize: 4,
    proLeague: false,
  });

  useEffect(() => {
    if (category) {
      setForm(category);
    } else {
      setForm({
        name: '',
        format: 'bracket',
        maxTeams: 16,
        pointsPerSet: 18,
        numSets: 1,
        groupSize: 4,
        proLeague: false,
      });
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-white">
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nome da Categoria *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Pro Masculino"
            />
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Formato</label>
            <select
              value={form.format}
              onChange={(e) => setForm((prev) => ({ ...prev, format: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Gender + Skill Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Gênero</label>
              <select
                value={form.gender || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nível</label>
              <select
                value={form.skillLevel || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, skillLevel: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SKILL_LEVELS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Max Teams + Points */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Máx. Duplas</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.maxTeams === 0 ? '' : form.maxTeams}
                onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); setForm((prev) => ({ ...prev, maxTeams: raw === '' ? 0 : parseInt(raw) })); }}
                onBlur={(e) => { const raw = e.target.value.replace(/\D/g, ''); const num = raw === '' ? 16 : Math.max(2, Math.min(256, parseInt(raw))); setForm((prev) => ({ ...prev, maxTeams: num })); }}
                className="w-full px-3 py-2 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Pontos por Set</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.pointsPerSet === 0 ? '' : form.pointsPerSet}
                onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); setForm((prev) => ({ ...prev, pointsPerSet: raw === '' ? 0 : parseInt(raw) })); }}
                onBlur={(e) => { const raw = e.target.value.replace(/\D/g, ''); const num = raw === '' ? 18 : Math.max(1, Math.min(50, parseInt(raw))); setForm((prev) => ({ ...prev, pointsPerSet: num })); }}
                className="w-full px-3 py-2 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Group Size (for KotB/Group formats) */}
          {(form.format === 'king_of_the_beach' || form.format === 'group_knockout') && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tamanho do Grupo</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.groupSize === 0 ? '' : form.groupSize}
                onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); setForm((prev) => ({ ...prev, groupSize: raw === '' ? 0 : parseInt(raw) })); }}
                onBlur={(e) => { const raw = e.target.value.replace(/\D/g, ''); const num = raw === '' ? 4 : Math.max(2, Math.min(16, parseInt(raw))); setForm((prev) => ({ ...prev, groupSize: num })); }}
                className="w-full px-3 py-2 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Pro League Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div>
              <span className="text-sm font-medium text-slate-300">Professional League</span>
              <p className="text-xs text-gray-500 mt-0.5">Semifinais e finais em melhor de 3 sets</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, proLeague: !prev.proLeague }))}
              className={`relative w-11 h-6 rounded-full transition ${
                form.proLeague ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-slate-700 rounded-full shadow transition-transform ${
                  form.proLeague ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-700/30 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {category ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}
