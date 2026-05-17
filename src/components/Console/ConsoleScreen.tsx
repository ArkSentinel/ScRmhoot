import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';
import { SequenceList } from '../Sidebar/SequenceList';
import { ControlButtons } from '../Sidebar/ControlButtons';
import { ViewerGrid } from '../Viewer/ViewerGrid';
import { ParamTabs } from '../ParameterPanel/ParamTabs';
import { ParamForm } from '../ParameterPanel/ParamForm';
import { paramTabs, parameterGroups, defaultParams, type ParameterGroup, type MRISequenceParams } from '../../data/mockData';
import type { Box } from '../Viewer/Viewer';

interface SequenceData {
  id: number;
  name: string;
  status: 'idle' | 'ready' | 'running' | 'completed';
  [key: string]: unknown;
}

const defaultBox: Box = {
  x: 64,
  y: 64,
  w: 128,
  h: 128,
};

export function ConsoleScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const patientData = location.state as { patient?: Record<string, string>; protocol?: string } | undefined;

  const [sequences, setSequences] = useState<SequenceData[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('routine');
  const [params, setParams] = useState<MRISequenceParams>(defaultParams);
  const [box, setBox] = useState<Box>(defaultBox);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/protocols')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0 && data[0].secuencias) {
          const loadedSequences: SequenceData[] = data[0].secuencias.map((seq: any, idx: number) => ({
            ...seq,
            id: seq.id,
            name: seq.nombre_secuencia,
            status: idx === 0 ? 'running' : idx === 1 ? 'ready' : 'idle'
          }));
          setSequences(loadedSequences);
          if (loadedSequences.length > 0) {
            setSelectedId(loadedSequences[0].id);
            loadSequenceParams(loadedSequences[0]);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadSequenceParams = (seq: any) => {
    const s = seq;
    const newParams: MRISequenceParams = {
      sliceGroup: 1,
      slices: 24,
      sliceThickness: s.slice_thickness_default || 3.0,
      distanceFactor: 10,
      orientation: (s.orientation_default as 'Axial' | 'Sagittal' | 'Coronal') || 'Axial',
      fovRead: s.fov_default || 220,
      fovPhase: 81,
      tr: s.tr_default || 4000,
      te: s.te_default || 100,
      flipAngle: s.flip_default || 150,
      averages: s.averages_default || 2,
      fatSuppression: (s.fat_suppression_default as 'None' | 'FatSat' | 'STIR') || 'None',
      baseResolution: s.base_resolution_default || 320,
      phaseResolution: s.phase_resolution_default || 100,
      phasePartialFourier: (s.phase_partial_fourier_default || 'Off') as 'Off' | '7/8' | '6/8',
      phaseEncodingDir: (s.phase_encoding_default as 'R >> L' | 'A >> P' | 'L >> R' | 'P >> A') || 'R >> L',
      phaseOversampling: s.phase_oversampling_default || 0,
      concatenations: s.concatenations_default || 1,
      coilElements: 'HEA; HEP',
      gradientMode: (s.gradient_mode_default as 'Normal' | 'Whisper' | 'Performance') || 'Normal',
      multibandFactor: s.multiband_factor_default || 1,
      sequenceName: s.nombre_secuencia
    };
    setParams(newParams);
  };

  const selectedSequence = sequences.find(s => s.id === selectedId);

  const handleSequenceSelect = (seq: SequenceData) => {
    loadSequenceParams(seq);
  };

  const handleParamChange = (paramId: string, value: string) => {
    setParams(prev => {
      const newParams = { ...prev };
      switch (paramId) {
        case 'tr': newParams.tr = parseInt(value) || 4000; break;
        case 'te': newParams.te = parseInt(value) || 100; break;
        case 'fovRead': newParams.fovRead = parseInt(value) || 220; break;
        case 'flipAngle': newParams.flipAngle = parseInt(value) || 150; break;
        case 'averages': newParams.averages = Math.max(1, Math.min(6, parseInt(value) || 2)); break;
        case 'fatSuppression': newParams.fatSuppression = value as 'None' | 'FatSat' | 'STIR'; break;
        case 'baseResolution': newParams.baseResolution = parseInt(value) || 320; break;
        case 'phaseResolution': newParams.phaseResolution = parseFloat(value) || 100; break;
        case 'phasePartialFourier': newParams.phasePartialFourier = value as 'Off' | '7/8' | '6/8'; break;
        case 'phaseEncodingDir': newParams.phaseEncodingDir = value as 'R >> L' | 'A >> P'; break;
        case 'phaseOversampling': newParams.phaseOversampling = parseFloat(value) || 0; break;
        case 'concatenations': newParams.concatenations = Math.max(1, Math.min(3, parseInt(value) || 1)); break;
        case 'gradientMode': newParams.gradientMode = value as 'Normal' | 'Whisper' | 'Performance'; break;
        case 'multibandFactor': newParams.multibandFactor = parseInt(value) || 1; break;
        case 'sliceThickness': newParams.sliceThickness = parseFloat(value) || 3.0; break;
        case 'slices': newParams.slices = parseInt(value) || 24; break;
        case 'sliceGroup': newParams.sliceGroup = parseInt(value) || 1; break;
        case 'distanceFactor': newParams.distanceFactor = parseFloat(value) || 10; break;
        case 'orientation': newParams.orientation = value as 'Axial' | 'Sagittal' | 'Coronal'; break;
        case 'fovPhase': newParams.fovPhase = parseFloat(value) || 81; break;
      }
      return newParams;
    });
  };

  const getCurrentParamGroups = (): ParameterGroup[] => {
    const groups = parameterGroups[activeTab] || [];
    return groups.map(group => ({
      ...group,
      parameters: group.parameters.map(p => {
        let value = '';
        switch (p.id) {
          case 'tr': value = String(params.tr); break;
          case 'te': value = String(params.te); break;
          case 'fovRead': value = String(params.fovRead); break;
          case 'flipAngle': value = String(params.flipAngle); break;
          case 'averages': value = String(params.averages); break;
          case 'fatSuppression': value = params.fatSuppression; break;
          case 'baseResolution': value = String(params.baseResolution); break;
          case 'phaseResolution': value = String(params.phaseResolution); break;
          case 'phasePartialFourier': value = params.phasePartialFourier; break;
          case 'phaseEncodingDir': value = params.phaseEncodingDir; break;
          case 'phaseOversampling': value = String(params.phaseOversampling); break;
          case 'concatenations': value = String(params.concatenations); break;
          case 'gradientMode': value = params.gradientMode; break;
          case 'multibandFactor': value = String(params.multibandFactor); break;
          case 'sliceThickness': value = String(params.sliceThickness); break;
          case 'slices': value = String(params.slices); break;
          case 'sliceGroup': value = String(params.sliceGroup); break;
          case 'distanceFactor': value = String(params.distanceFactor); break;
          case 'orientation': value = params.orientation; break;
          case 'fovPhase': value = String(params.fovPhase); break;
          case 'sequenceName': value = params.sequenceName; break;
          default: value = p.value;
        }
        return { ...p, value };
      }),
    }));
  };

  const handleBoxChange = (newBox: Box) => setBox(newBox);

  const handleSaveExam = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const payload = {
        paciente_id: 1,
        protocolo_id: 1,
        secuencia_id: selectedSequence?.id,
        tipo_estudio: patientData?.protocol || 'Cerebro',
        nombre_secuencia: params.sequenceName,
        tr: params.tr,
        te: params.te,
        fov: params.fovRead,
        slice_thickness: params.sliceThickness,
        flip_angle: params.flipAngle,
        phase_direction: params.phaseEncodingDir,
        matrix_size: `${params.baseResolution}x${Math.round(params.baseResolution * params.phaseResolution / 100)}`,
        gap_percentage: params.distanceFactor,
        nex: params.averages,
        box_x: box.x,
        box_y: box.y,
        box_w: box.w,
        box_h: box.h,
      };
      const response = await fetch('http://localhost:3001/api/exams/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setSaveMessage('✓ Exam saved!');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch {
      setSaveMessage('Server not running');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-black text-gray-300 items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-gray-300">
      <aside className="w-1/4 flex flex-col border-r border-slate-700">
        <div className="p-3 bg-[#1a1a1a] border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 uppercase">Sequence List</div>
            <button
              onClick={() => navigate('/admin')}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              ⚙
            </button>
          </div>
          <SequenceList
            sequences={sequences}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onSequenceSelect={handleSequenceSelect}
          />
        </div>

        {patientData?.patient && (
          <div className="p-2 border-b border-slate-700 bg-[#1a1a1a] text-xs">
            <div className="text-gray-400">Patient: {patientData.patient.lastName}</div>
            <div className="text-gray-500">ID: {patientData.patient.patientId}</div>
            <div className="text-gray-500">Protocol: {patientData.protocol}</div>
          </div>
        )}

        <div className="p-3 border-b border-slate-700">
          <button
            onClick={handleSaveExam}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm font-medium rounded"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Exam</span>
          </button>
          {saveMessage && <div className={`mt-2 text-xs ${saveMessage.includes('success') ? 'text-green-400' : 'text-yellow-400'}`}>{saveMessage}</div>}
        </div>

        <div className="mt-auto p-3 border-t border-slate-700">
          <ControlButtons
            onDelete={() => {}}
            onSkip={() => {}}
            onStop={() => {}}
            onPause={() => {}}
            onContinue={() => {}}
            onCopyGo={() => {}}
          />
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-1">
          <ViewerGrid params={params} box={box} onBoxChange={handleBoxChange} />
        </div>

        <div className="h-64 border-t border-slate-700 bg-[#1a1a1a]">
          <ParamTabs tabs={paramTabs} activeTab={activeTab} onTabChange={setActiveTab} />
          <ParamForm groups={getCurrentParamGroups()} onParamChange={handleParamChange} activeTab={activeTab} />
        </div>
      </main>
    </div>
  );
}