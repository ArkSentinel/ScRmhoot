import { ChevronUp, ChevronDown } from 'lucide-react';
import type { ParameterGroup } from '../../data/mockData';

interface ParamFormProps {
  groups: ParameterGroup[];
  onParamChange?: (paramId: string, value: string) => void;
  activeTab: string;
}

const getStep = (paramId: string): number => {
  const steps: Record<string, number> = {
    tr: 50,
    te: 5,
    fovRead: 10,
    fovPhase: 1,
    sliceThickness: 0.5,
    distanceFactor: 1,
    slices: 1,
    sliceGroup: 1,
    flipAngle: 10,
    averages: 1,
    phaseResolution: 5,
    phaseOversampling: 5,
    concatenations: 1,
    multibandFactor: 1,
  };
  return steps[paramId] || 10;
};

export function ParamForm({ groups, onParamChange, activeTab }: ParamFormProps) {
  const handleNumericChange = (paramId: string, delta: number) => {
    if (!onParamChange) return;
    
    const currentValue = parseFloat(
      groups.flatMap(g => g.parameters).find(p => p.id === paramId)?.value || '0'
    );
    const step = getStep(paramId);
    const newValue = currentValue + (delta * step);
    onParamChange(paramId, String(newValue));
  };

  const handleSelectChange = (paramId: string, value: string) => {
    if (!onParamChange) return;
    onParamChange(paramId, value);
  };

  const isSelectParam = (param: { type?: string; options?: string[] }) => {
    return param.type === 'select' && param.options && param.options.length > 0;
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-4 overflow-y-auto max-h-48">
      {groups.map((group) => (
        <div key={group.id} className="space-y-2">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-slate-700 pb-1">
            {group.label}
          </div>
          {group.parameters.map((param) => {
            const isSelect = isSelectParam(param);
            
            return (
              <div key={param.id} className="flex items-center gap-2">
                <label className="w-20 text-xs text-gray-400">{param.label}</label>
                <div className="flex items-center gap-1 flex-1">
                  {isSelect ? (
                    <select
                      value={param.value}
                      onChange={(e) => handleSelectChange(param.id, e.target.value)}
                      className="w-20 h-6 text-xs font-mono bg-[#232323] text-gray-300 border border-slate-700 rounded focus:outline-none"
                    >
                      {param.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : activeTab === 'sequence' ? (
                    <input
                      type="text"
                      value={param.value}
                      readOnly
                      className="w-24 h-6 text-xs font-mono bg-[#1a1a1a] text-gray-400 border border-slate-700 rounded px-2"
                    />
                  ) : (
                    <>
                      <button 
                        className="flex items-center justify-center w-5 h-6 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-l border border-slate-700"
                        onClick={() => handleNumericChange(param.id, -1)}
                      >
                        <ChevronUp className="w-3 h-3 text-gray-400" />
                      </button>
                      <input
                        type="text"
                        value={param.value}
                        readOnly
                        className="w-16 h-6 text-center text-xs font-mono bg-[#232323] text-gray-300 border-y border-slate-700 focus:outline-none"
                      />
                      <button 
                        className="flex items-center justify-center w-5 h-6 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-r border border-slate-700"
                        onClick={() => handleNumericChange(param.id, 1)}
                      >
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </button>
                    </>
                  )}
                  {param.unit && (
                    <span className="text-xs text-gray-500 ml-1">{param.unit}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}