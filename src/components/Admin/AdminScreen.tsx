import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Protocol {
  id: number;
  nombre: string;
  descripcion: string;
  secuencias: Sequence[];
}

interface Sequence {
  id: number;
  nombre_secuencia: string;
  tr_default: number;
  te_default: number;
  fov_default: number;
  slice_thickness_default: number;
  matrix_default: string;
  flip_default: number;
}

export function AdminScreen() {
  const navigate = useNavigate();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [showAddProtocol, setShowAddProtocol] = useState(false);
  const [newProtocolName, setNewProtocolName] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/api/protocols')
      .then(res => res.json())
      .then(data => {
        setProtocols(data);
        if (data.length > 0) setSelectedProtocol(data[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSaveSequence = () => {
    if (!editingSequence) return;
    // Here you would call the API to update
    setEditingSequence(null);
  };

  const handleAddProtocol = () => {
    if (!newProtocolName.trim()) return;
    // Call API to create new protocol
    setShowAddProtocol(false);
    setNewProtocolName('');
  };

  const handleAddSequence = () => {
    if (!selectedProtocol) return;
    // Call API to add new sequence
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-black text-gray-300 items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-gray-300">
      {/* Left - Protocol List */}
      <div className="w-1/4 border-r border-slate-700 flex flex-col">
        <div className="p-3 bg-[#1a1a1a] border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-500 uppercase">Protocols</h2>
          <button
            onClick={() => setShowAddProtocol(true)}
            className="text-xs text-orange-500 hover:text-orange-400"
          >
            + Add
          </button>
        </div>

        {showAddProtocol && (
          <div className="p-2 border-b border-slate-700 bg-[#252525]">
            <input
              type="text"
              placeholder="Protocol name"
              value={newProtocolName}
              onChange={(e) => setNewProtocolName(e.target.value)}
              className="w-full h-6 bg-[#1a1a1a] border border-slate-700 px-2 text-xs mb-2"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddProtocol}
                className="flex-1 h-6 bg-emerald-600 text-xs rounded"
              >
                Save
              </button>
              <button
                onClick={() => setShowAddProtocol(false)}
                className="flex-1 h-6 bg-gray-700 text-xs rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {protocols.map((protocol) => (
            <button
              key={protocol.id}
              onClick={() => setSelectedProtocol(protocol)}
              className={`w-full p-3 text-left border-b border-slate-800 transition-colors ${
                selectedProtocol?.id === protocol.id
                  ? 'bg-emerald-900/30 border-l-2 border-l-emerald-500'
                  : 'hover:bg-[#252525]'
              }`}
            >
              <div className="text-xs font-medium text-white">{protocol.nombre}</div>
              <div className="text-[10px] text-gray-500 mt-1">{protocol.secuencias?.length || 0} sequences</div>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-slate-700">
          <button
            onClick={() => navigate('/')}
            className="w-full py-2 bg-gray-700 text-xs rounded hover:bg-gray-600"
          >
            ← Back to Welcome
          </button>
        </div>
      </div>

      {/* Center - Sequence List */}
      <div className="w-1/4 border-r border-slate-700 flex flex-col">
        <div className="p-3 bg-[#1a1a1a] border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-500 uppercase">Sequences</h2>
          {selectedProtocol && (
            <button
              onClick={handleAddSequence}
              className="text-xs text-orange-500 hover:text-orange-400"
            >
              + Add
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {selectedProtocol?.secuencias?.map((seq) => (
            <button
              key={seq.id}
              onClick={() => setEditingSequence(seq)}
              className="w-full p-3 text-left border-b border-slate-800 hover:bg-[#252525]"
            >
              <div className="text-xs font-medium text-white">{seq.nombre_secuencia}</div>
              <div className="text-[10px] text-gray-500 mt-1">
                TR: {seq.tr_default} | TE: {seq.te_default} | FoV: {seq.fov_default}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right - Edit Sequence */}
      <div className="flex-1 flex flex-col">
        <div className="p-3 bg-[#1a1a1a] border-b border-slate-700">
          <h2 className="text-xs font-bold text-gray-500 uppercase">Edit Sequence</h2>
        </div>

        {editingSequence ? (
          <div className="flex-1 p-4 overflow-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <h3 className="text-[10px] text-orange-500 uppercase mb-2">Sequence Name</h3>
                <input
                  type="text"
                  value={editingSequence.nombre_secuencia}
                  onChange={(e) => setEditingSequence({ ...editingSequence, nombre_secuencia: e.target.value })}
                  className="w-full h-8 bg-[#232323] border border-slate-700 px-3 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">TR (ms)</label>
                <input
                  type="number"
                  value={editingSequence.tr_default}
                  onChange={(e) => setEditingSequence({ ...editingSequence, tr_default: parseInt(e.target.value) })}
                  className="w-full h-8 bg-[#232323] border border-slate-700 px-2 text-xs text-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">TE (ms)</label>
                <input
                  type="number"
                  value={editingSequence.te_default}
                  onChange={(e) => setEditingSequence({ ...editingSequence, te_default: parseInt(e.target.value) })}
                  className="w-full h-8 bg-[#232323] border border-slate-700 px-2 text-xs text-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">FoV (mm)</label>
                <input
                  type="number"
                  value={editingSequence.fov_default}
                  onChange={(e) => setEditingSequence({ ...editingSequence, fov_default: parseInt(e.target.value) })}
                  className="w-full h-8 bg-[#232323] border border-slate-700 px-2 text-xs text-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">Slice (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingSequence.slice_thickness_default}
                  onChange={(e) => setEditingSequence({ ...editingSequence, slice_thickness_default: parseFloat(e.target.value) })}
                  className="w-full h-8 bg-[#232323] border border-slate-700 px-2 text-xs text-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">Matrix</label>
                <select
                  value={editingSequence.matrix_default}
                  onChange={(e) => setEditingSequence({ ...editingSequence, matrix_default: e.target.value })}
                  className="w-full h-8 bg-[#232323] border border-slate-700 px-2 text-xs text-white mt-1"
                >
                  <option value="256x256">256x256</option>
                  <option value="320x320">320x320</option>
                  <option value="384x384">384x384</option>
                  <option value="512x512">512x512</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400">Flip (°)</label>
                <input
                  type="number"
                  value={editingSequence.flip_default}
                  onChange={(e) => setEditingSequence({ ...editingSequence, flip_default: parseInt(e.target.value) })}
                  className="w-full h-8 bg-[#232323] border border-slate-700 px-2 text-xs text-white mt-1"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleSaveSequence}
                className="px-4 py-2 bg-emerald-600 text-xs rounded hover:bg-emerald-500"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingSequence(null)}
                className="px-4 py-2 bg-gray-700 text-xs rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-xs">
            Select a sequence to edit
          </div>
        )}
      </div>
    </div>
  );
}