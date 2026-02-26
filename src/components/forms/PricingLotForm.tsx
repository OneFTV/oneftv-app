'use client';

import { Plus, Trash2 } from 'lucide-react';

export interface PricingLotData {
  name: string;
  price: number;
  maxEntries?: number;
  startDate: string;
  endDate: string;
}

interface PricingLotFormProps {
  lots: PricingLotData[];
  categoryName: string;
  onChange: (lots: PricingLotData[]) => void;
}

export default function PricingLotForm({ lots, categoryName, onChange }: PricingLotFormProps) {
  const addLot = () => {
    const newLot: PricingLotData = {
      name: `${lots.length + 1}º Lote`,
      price: 0,
      startDate: '',
      endDate: '',
    };
    onChange([...lots, newLot]);
  };

  const removeLot = (index: number) => {
    onChange(lots.filter((_, i) => i !== index));
  };

  const updateLot = (index: number, field: keyof PricingLotData, value: string | number) => {
    const updated = lots.map((lot, i) =>
      i === index ? { ...lot, [field]: value } : lot
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-300">{categoryName}</h4>
        <button
          type="button"
          onClick={addLot}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus size={14} />
          Adicionar lote
        </button>
      </div>

      {lots.length === 0 && (
        <p className="text-xs text-gray-400 italic">Nenhum lote configurado (inscrição gratuita)</p>
      )}

      {lots.map((lot, index) => (
        <div key={index} className="border border-slate-600/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <input
              type="text"
              value={lot.name}
              onChange={(e) => updateLot(index, 'name', e.target.value)}
              className="text-sm font-medium text-white border-none bg-transparent focus:outline-none focus:ring-0 p-0"
              placeholder="Nome do lote"
            />
            <button
              type="button"
              onClick={() => removeLot(index)}
              className="p-1 text-gray-400 hover:text-red-500 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Preço (R$)</label>
              <input
                type="number"
                value={lot.price}
                onChange={(e) => updateLot(index, 'price', parseFloat(e.target.value) || 0)}
                min={0}
                step={10}
                className="w-full text-sm px-2 py-1.5 border border-slate-600/50 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Vagas</label>
              <input
                type="number"
                value={lot.maxEntries ?? ''}
                onChange={(e) => updateLot(index, 'maxEntries', parseInt(e.target.value) || 0)}
                min={0}
                placeholder="Ilimitado"
                className="w-full text-sm px-2 py-1.5 border border-slate-600/50 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Início</label>
              <input
                type="date"
                value={lot.startDate}
                onChange={(e) => updateLot(index, 'startDate', e.target.value)}
                className="w-full text-sm px-2 py-1.5 border border-slate-600/50 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Fim</label>
              <input
                type="date"
                value={lot.endDate}
                onChange={(e) => updateLot(index, 'endDate', e.target.value)}
                className="w-full text-sm px-2 py-1.5 border border-slate-600/50 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
