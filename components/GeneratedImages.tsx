
import React from 'react';
import type { GeneratedImage } from '../types';

interface GeneratedImagesProps {
    images: GeneratedImage[];
}

const GeneratedImages: React.FC<GeneratedImagesProps> = ({ images }) => {
    return (
        <div className="max-w-6xl mx-auto mt-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-400">Your Virtual Try-On Results</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {images.map((image, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-xl overflow-hidden shadow-lg transform transition-transform duration-300 hover:scale-105 hover:shadow-indigo-500/30">
                        <div className="aspect-w-3 aspect-h-4">
                             <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 bg-gray-900 text-center">
                            <h3 className="font-semibold text-lg text-gray-200">{image.label}</h3>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GeneratedImages;
