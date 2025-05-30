import React from 'react';
import ArtifactViewer from '@/app/components/ArtifactViewer';
import { Part } from '@/types/a2a';

interface ArtifactDetailsProps {
  artifact: { artifactId: string; name?: string; parts: Part[] } | null;
  onClose: () => void;
}

const ArtifactDetails: React.FC<ArtifactDetailsProps> = ({ artifact, onClose }) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [artifact]);

  return (
    <div
      className={`fixed inset-y-0 right-0 w-1/2 z-10 bg-white shadow-xl transform transition-all duration-300 ease-in-out ${artifact ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {artifact && (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">{artifact.name || 'Artifact Details'}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div ref={contentRef} className="flex-1 overflow-y-auto p-4">
            {artifact.parts.map((part, index) => (
              <div key={index} className="mb-4">
                <ArtifactViewer part={part} name={artifact.name} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtifactDetails; 