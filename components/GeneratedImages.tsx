import React from 'react';
import type { GeneratedImage } from '../types';
import DownloadIcon from './icons/DownloadIcon';

interface GeneratedImagesProps {
    images: GeneratedImage[];
}

const GeneratedImages: React.FC<GeneratedImagesProps> = ({ images }) => {
    return (
        <div className="max-w-6xl mx-auto mt-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">Your Virtual Try-On Results</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {images.map((image, index) => (
                    <div key={index} className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200/80 transform transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                        <div className="aspect-w-3 aspect-h-4 bg-slate-100">
                             <img 
                                src={image.src} 
                                alt={image.alt} 
                                className="w-full h-full object-cover"
                                loading="lazy"
                             />
                        </div>
                        <div className="p-4 text-center">
                            <h3 className="font-semibold text-base text-slate-700">{image.label}</h3>
                        </div>
                        <a
                            href={image.src}
                            download={`virtual-try-on-${image.label.replace(/\s+/g, '-').toLowerCase()}.png`}
                            className="absolute top-3 right-3 p-2 bg-slate-900/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-slate-900 focus:opacity-100 focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                            aria-label={`Download ${image.label}`}
                            title={`Download ${image.label}`}
                        >
                            <DownloadIcon />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GeneratedImages;