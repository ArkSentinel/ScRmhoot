import { Viewer, type Box, type ViewerParams } from './Viewer';
import { viewerData } from '../../data/mockData';

interface ViewerGridProps {
  params: ViewerParams;
  box: Box;
  onBoxChange: (box: Box) => void;
}

export function ViewerGrid({ params, box, onBoxChange }: ViewerGridProps) {
  return (
    <div className="grid grid-cols-3 gap-1 h-full">
      {viewerData.map((data) => (
        <Viewer
          key={data.id}
          data={data}
          params={params}
          initialBox={box}
          onBoxChange={onBoxChange}
        />
      ))}
    </div>
  );
}