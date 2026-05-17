import { clsx } from 'clsx';

interface SequenceData {
  id: number;
  name: string;
  status: 'idle' | 'ready' | 'running' | 'completed';
  [key: string]: unknown;
}

interface SequenceListProps {
  sequences: SequenceData[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onSequenceSelect?: (sequence: SequenceData) => void;
}

export function SequenceList({ sequences, selectedId, onSelect, onSequenceSelect }: SequenceListProps) {
  const handleClick = (seq: SequenceData) => {
    onSelect(seq.id);
    if (onSequenceSelect) {
      onSequenceSelect(seq);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {sequences.map((seq) => {
        const isSelected = selectedId === seq.id;
        return (
          <button
            key={seq.id}
            onClick={() => handleClick(seq)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 text-left text-xs font-mono transition-colors',
              isSelected && 'bg-emerald-600 text-white',
              !isSelected && seq.status === 'running' && 'bg-emerald-800/50 text-white',
              !isSelected && seq.status !== 'running' && 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'
            )}
          >
            <span className="w-6 text-gray-400">{seq.id}</span>
            <span className="flex-1 truncate">{seq.name}</span>
            <span
              className={clsx(
                'w-2 h-2 rounded-full',
                isSelected && 'bg-white',
                !isSelected && seq.status === 'running' && 'bg-yellow-300 animate-pulse',
                !isSelected && seq.status === 'ready' && 'bg-green-400',
                !isSelected && (seq.status === 'completed' || seq.status === 'idle') && 'bg-gray-500'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}