
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { GeneratedResultGroup, AnimationType, VideoDuration } from '../types';
import DownloadIcon from './icons/DownloadIcon';
import Loader from './Loader';
import VideoIcon from './icons/VideoIcon';

interface GeneratedImagesProps {
    results: GeneratedResultGroup[];
    onGenerateVideo: (resultId: string, duration: VideoDuration, animation: AnimationType) => void;
}

const animationOptions: { id: AnimationType; name: string }[] = [
    { id: '360 Turn', name: '360° Turn' },
    { id: 'Subtle Sway', name: 'Sway' },
    { id: 'Catwalk Pose', name: 'Catwalk' },
];

const durationOptions: { id: VideoDuration; name: string }[] = [
    { id: 5, name: '5s' },
    { id: 8, name: '8s' },
    { id: 10, name: '10s' },
];

const ResultGroup: React.FC<{ result: GeneratedResultGroup; onGenerateVideo: (resultId: string, duration: VideoDuration, animation: AnimationType) => void }> = ({ result, onGenerateVideo }) => {
    const [animation, setAnimation] = useState<AnimationType>('360 Turn');
    const [duration, setDuration] = useState<VideoDuration>(5);
    const refVideoInputRef = useRef<HTMLInputElement>(null);
    const [refVideoUrl, setRefVideoUrl] = useState<string | null>(null);

    const handleRefVideoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            const url = URL.createObjectURL(file);
            setRefVideoUrl(prevUrl => {
                if (prevUrl) {
                    URL.revokeObjectURL(prevUrl);
                }
                return url;
            });
        }
        event.target.value = '';
    }, []);

    const triggerRefVideoUpload = useCallback(() => {
        refVideoInputRef.current?.click();
    }, []);

    useEffect(() => {
        return () => {
            if (refVideoUrl) {
                URL.revokeObjectURL(refVideoUrl);
            }
        };
    }, [refVideoUrl]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden p-6 mb-8">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200">
                <div>
                    <h3 className="font-semibold text-sm text-slate-500 mb-1">Outfit</h3>
                    <img src={result.outfitImage} alt="Outfit source" className="w-16 h-16 object-cover rounded-md border border-slate-200" />
                </div>
                {result.styleImage && (
                     <div>
                        <h3 className="font-semibold text-sm text-slate-500 mb-1">Style</h3>
                        <img src={result.styleImage} alt="Style source" className="w-16 h-16 object-cover rounded-md border border-slate-200" />
                    </div>
                )}
            </div>

            {result.info && (
                <div className="mb-4 p-3 bg-blue-100 border border-blue-200 text-blue-800 rounded-lg text-sm">
                    <p>{result.info}</p>
                </div>
            )}
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {result.views.map((image, index) => (
                    <div key={index} className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200/80 transform transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                        <div className="aspect-w-3 aspect-h-4 bg-slate-100">
                             <img 
                                src={image.src} 
                                alt={image.alt} 
                                className="w-full h-full object-cover"
                                loading="lazy"
                             />
                        </div>
                        <div className="p-3 text-center">
                            <h3 className="font-semibold text-sm text-slate-700">{image.label}</h3>
                        </div>
                        <a
                            href={image.src}
                            download={`virtual-try-on-${image.label.replace(/\s+/g, '-').toLowerCase()}.png`}
                            className="absolute top-2 right-2 p-1.5 bg-slate-900/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-slate-900 focus:opacity-100 focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                            aria-label={`Download ${image.label}`}
                            title={`Download ${image.label}`}
                        >
                            <DownloadIcon />
                        </a>
                    </div>
                ))}
            </div>

            <div className="mt-8 text-center">
                {!result.videoUrl && !result.isVideoLoading && (
                    <>
                        <div className="max-w-xl mx-auto mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <h4 className="text-lg font-bold text-slate-800 text-center mb-4">Video Generation Options</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Animation Style</label>
                                    <div className="flex justify-center bg-slate-200 p-1 rounded-full">
                                        {animationOptions.map(opt => (
                                            <button key={opt.id} onClick={() => setAnimation(opt.id)} className={`w-full px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${animation === opt.id ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-500 hover:bg-slate-200/60'}`} aria-pressed={animation === opt.id}>
                                                {opt.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Duration</label>
                                    <div className="flex justify-center bg-slate-200 p-1 rounded-full">
                                        {durationOptions.map(opt => (
                                            <button key={opt.id} onClick={() => setDuration(opt.id)} className={`w-full px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${duration === opt.id ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-500 hover:bg-slate-200/60'}`} aria-pressed={duration === opt.id}>
                                                {opt.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                             <div className="mt-6">
                                <label className="block text-sm font-medium text-slate-600 mb-2">Reference Video (Coming Soon)</label>
                                <div onClick={triggerRefVideoUpload} className="relative w-full h-32 bg-slate-200/60 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-200/80 hover:border-pink-500 transition-all">
                                    <input type="file" accept="video/*" ref={refVideoInputRef} onChange={handleRefVideoUpload} className="hidden" />
                                    {refVideoUrl ? (
                                        <video src={refVideoUrl} muted playsInline loop className="w-full h-full object-contain rounded-lg p-1" />
                                    ) : (
                                        <div className="text-center pointer-events-none">
                                            <div className="w-8 h-8 mx-auto mb-1"><VideoIcon/></div>
                                            <span className="text-sm font-semibold">Upload Video</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-2 px-4">This feature, allowing a video to guide the animation, is currently in development and not yet functional.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onGenerateVideo(result.id, duration, animation)}
                            className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-800 text-white font-bold rounded-full text-sm hover:bg-slate-700 transition-all duration-300 transform hover:scale-105"
                        >
                            Generate Video Preview
                        </button>
                    </>
                )}
                
                {result.isVideoLoading && <Loader messages={[
                    "Preparing video generation...",
                    "This can take a few minutes...",
                    "Animating the 360-degree view...",
                    "Rendering video frames...",
                    "Finalizing the video...",
                ]} />}

                {result.videoError && (
                    <div className="mt-4 p-3 max-w-md mx-auto bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">
                        <p><strong>Video Failed:</strong> {result.videoError}</p>
                    </div>
                )}

                {result.videoUrl && (
                    <div className="mt-4">
                        <h3 className="text-xl font-bold mb-3 text-slate-800">Video Preview</h3>
                        <video
                            key={result.videoUrl}
                            src={result.videoUrl}
                            controls
                            autoPlay
                            loop
                            playsInline
                            className="w-full max-w-xs mx-auto rounded-xl shadow-lg border border-slate-200"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const GeneratedImages: React.FC<GeneratedImagesProps> = ({ results, onGenerateVideo }) => {
    return (
        <div className="max-w-6xl mx-auto mt-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">Your Virtual Try-On Results</h2>
            <div>
                {results.map((result) => (
                    <ResultGroup key={result.id} result={result} onGenerateVideo={onGenerateVideo} />
                ))}
            </div>
        </div>
    );
};

export default GeneratedImages;
