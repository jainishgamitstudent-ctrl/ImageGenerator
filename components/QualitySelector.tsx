
import React from 'react';
import type { Quality } from '../types';

interface QualitySelectorProps {
    selectedQuality: Quality;
    onQualityChange: (quality: Quality) => void;
}

const qualities: { id: Quality, name: string, description: string }[] = [
    { id: 'Standard', name: 'Standard', description: 'Fast generation, good quality.' },
    { id: 'High', name: 'High', description: 'Balanced speed and detail.' },
    { id: 'Ultra', name: 'Ultra', description: 'Highest detail, longer generation.' }
];

const QualitySelector: React.FC<QualitySelectorProps> = ({ selectedQuality, onQualityChange }) => {
    return (
        <div>
            <label className="flex items-center justify-center text-lg font-semibold text-slate-700 mb-3">
                Image Quality
            </label>
            <div className="flex justify-center bg-slate-100 p-1.5 rounded-full">
                {qualities.map(quality => (
                    <button
                        key={quality.id}
                        onClick={() => onQualityChange(quality.id)}
                        className={`w-full px-4 py-2 text-sm font-bold rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 ${
                            selectedQuality === quality.id 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'bg-transparent text-slate-500 hover:bg-slate-200/60'
                        }`}
                        aria-pressed={selectedQuality === quality.id}
                        title={quality.description}
                    >
                        {quality.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QualitySelector;
