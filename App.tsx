
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import GeneratedImages from './components/GeneratedImages';
import Loader from './components/Loader';
import { generateTryOnImage, generateTryOnVideo } from './services/geminiService';
import type { GeneratedImage, GeneratedResultGroup, Quality, AnimationType, VideoDuration } from './types';
import { ViewType } from './types';
import UserIcon from './components/icons/UserIcon';
import OutfitIcon from './components/icons/OutfitIcon';
import StyleIcon from './components/icons/StyleIcon';
import SparklesIcon from './components/icons/SparklesIcon';
import ResetIcon from './components/icons/ResetIcon';
import PencilIcon from './components/icons/PencilIcon';
import QualitySelector from './components/QualitySelector';

const App: React.FC = () => {
    const [personImage, setPersonImage] = useState<string | null>(null);
    const [outfitImages, setOutfitImages] = useState<string[]>([]);
    const [styleImages, setStyleImages] = useState<string[]>([]);
    const [generatedResults, setGeneratedResults] = useState<GeneratedResultGroup[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [customPrompt, setCustomPrompt] = useState<string>('');
    const [quality, setQuality] = useState<Quality>('High');
    
    const handleReset = useCallback(() => {
        setPersonImage(null);
        setOutfitImages([]);
        setStyleImages([]);
        setGeneratedResults([]);
        setError(null);
        setCustomPrompt('');
        setIsLoading(false);
    }, []);

    const handleTryOn = useCallback(async () => {
        if (!personImage || outfitImages.length === 0) {
            setError('Please upload your photo and at least one outfit image.');
            return;
        }

        setGeneratedResults([]);
        setError(null);
        setIsLoading(true);

        const combinations: { outfit: string; style: string | null }[] = [];
        if (styleImages.length > 0) {
            for (const outfit of outfitImages) {
                for (const style of styleImages) {
                    combinations.push({ outfit, style });
                }
            }
        } else {
            for (const outfit of outfitImages) {
                combinations.push({ outfit, style: null });
            }
        }

        try {
            for (const combo of combinations) {
                const seed = Math.floor(Math.random() * 1000000);
                const views: ViewType[] = [ViewType.FRONT, ViewType.LEFT, ViewType.RIGHT, ViewType.BACK];
                
                const results = await Promise.all(
                    views.map(view => generateTryOnImage(personImage, combo.outfit, combo.style, view, customPrompt, quality, seed))
                );

                const successfulViews: GeneratedImage[] = [];
                let apiError: string | null = null;
                let infoMessage: string | null = null;

                results.forEach((result, index) => {
                    if (result.error) {
                        if (!apiError) apiError = result.error;
                    } else if (result.image) {
                        successfulViews.push({
                            src: result.image,
                            alt: `${views[index]} view`,
                            label: views[index]
                        });
                        if (result.text && !infoMessage) {
                            infoMessage = result.text;
                        }
                    }
                });

                if (apiError) {
                    setError(prevError => `${prevError ? prevError + '\n' : ''}Failed for one combination: ${apiError}`);
                }

                if (successfulViews.length > 0) {
                     setGeneratedResults(prev => [...prev, {
                        id: `${combo.outfit.slice(-10)}-${combo.style?.slice(-10) ?? 'no-style'}`,
                        outfitImage: combo.outfit,
                        styleImage: combo.style,
                        views: successfulViews,
                        info: infoMessage,
                    }]);
                }
            }
        } catch (err) {
            console.error(err);
            setError('An unexpected error occurred during batch generation. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [personImage, outfitImages, styleImages, customPrompt, quality]);
    
    const handleGenerateVideo = useCallback(async (resultId: string, duration: VideoDuration, animation: AnimationType) => {
        const resultIndex = generatedResults.findIndex(r => r.id === resultId);
        if (resultIndex === -1) {
            console.error("Could not find result group to generate video for.");
            return;
        }

        const frontViewImage = generatedResults[resultIndex].views.find(img => img.label === ViewType.FRONT);

        if (!frontViewImage) {
            setGeneratedResults(prev => prev.map((r, i) => i === resultIndex ? { ...r, videoError: "Front view image not found for this result." } : r));
            return;
        }

        setGeneratedResults(prev => prev.map((r, i) => i === resultIndex ? { ...r, isVideoLoading: true, videoError: null, videoUrl: null } : r));

        try {
            const { videoUrl, error } = await generateTryOnVideo(frontViewImage.src, duration, animation);
            if (error) {
                setGeneratedResults(prev => prev.map((r, i) => i === resultIndex ? { ...r, videoError: error } : r));
            } else {
                setGeneratedResults(prev => prev.map((r, i) => i === resultIndex ? { ...r, videoUrl } : r));
            }
        } catch (err) {
            console.error(err);
            setGeneratedResults(prev => prev.map((r, i) => i === resultIndex ? { ...r, videoError: 'An unexpected error occurred.' } : r));
        } finally {
            setGeneratedResults(prev => prev.map((r, i) => i === resultIndex ? { ...r, isVideoLoading: false } : r));
        }
    }, [generatedResults]);

    const hasContent = personImage || outfitImages.length > 0 || styleImages.length > 0 || generatedResults.length > 0 || customPrompt;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            <ImageUploader 
                                title="Your Photo"
                                onImageUpload={(img) => setPersonImage(img as string | null)}
                                icon={<UserIcon />}
                                images={personImage}
                                allowCamera
                            />
                            <ImageUploader 
                                title="Outfit Images" 
                                onImageUpload={(imgs) => setOutfitImages(imgs as string[] || [])}
                                icon={<OutfitIcon />}
                                images={outfitImages}
                                multiple
                            />
                             <ImageUploader 
                                title="Style/Pattern (Optional)" 
                                onImageUpload={(imgs) => setStyleImages(imgs as string[] || [])}
                                icon={<StyleIcon />}
                                images={styleImages}
                                multiple
                            />
                        </div>

                        <div className="mb-8">
                            <label htmlFor="custom-prompt" className="flex items-center text-lg font-semibold text-slate-700 mb-3">
                                <PencilIcon />
                                Additional Instructions
                            </label>
                            <textarea
                                id="custom-prompt"
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder='e.g., "Change outfit color to navy blue", "Make sleeves short", "Add a floral pattern..."'
                                className="w-full h-24 p-4 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors duration-300 resize-none placeholder:text-slate-400"
                                aria-label="Additional instructions for the virtual try-on"
                            />
                        </div>

                        <div className="mb-8 max-w-sm mx-auto">
                            <QualitySelector selectedQuality={quality} onQualityChange={setQuality} />
                        </div>

                        <div className="flex justify-center items-center gap-4">
                            <button
                                onClick={handleTryOn}
                                disabled={!personImage || outfitImages.length === 0 || isLoading}
                                className="inline-flex items-center justify-center px-8 py-3 bg-slate-900 text-white font-bold rounded-full text-base hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                            >
                                <SparklesIcon />
                                <span className="ml-2">{isLoading ? 'Generating...' : 'Virtual Try-On'}</span>
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={!hasContent || isLoading}
                                className="inline-flex items-center justify-center p-3.5 bg-slate-200 text-slate-600 font-bold rounded-full hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors duration-300"
                                aria-label="Reset application"
                            >
                                <ResetIcon />
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="max-w-4xl mx-auto mt-8 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg text-center">
                        <p className="whitespace-pre-wrap">{error}</p>
                    </div>
                )}

                {isLoading && <Loader />}
                
                {!isLoading && generatedResults.length > 0 && (
                    <GeneratedImages results={generatedResults} onGenerateVideo={handleGenerateVideo} />
                )}
            </main>
        </div>
    );
};

export default App;
