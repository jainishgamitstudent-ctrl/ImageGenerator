
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import GeneratedImages from './components/GeneratedImages';
import Loader from './components/Loader';
import { generateTryOnImage, generateTryOnVideo } from './services/geminiService';
import type { GeneratedImage } from './types';
import { ViewType } from './types';
import UserIcon from './components/icons/UserIcon';
import OutfitIcon from './components/icons/OutfitIcon';
import StyleIcon from './components/icons/StyleIcon';
import SparklesIcon from './components/icons/SparklesIcon';
import ResetIcon from './components/icons/ResetIcon';
import PencilIcon from './components/icons/PencilIcon';

const App: React.FC = () => {
    const [personImage, setPersonImage] = useState<string | null>(null);
    const [outfitImage, setOutfitImage] = useState<string | null>(null);
    const [styleImage, setStyleImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [additionalInfo, setAdditionalInfo] = useState<string | null>(null);
    const [customPrompt, setCustomPrompt] = useState<string>('');
    
    const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);

    const handleReset = useCallback(() => {
        setPersonImage(null);
        setOutfitImage(null);
        setStyleImage(null);
        setGeneratedImages([]);
        setError(null);
        setAdditionalInfo(null);
        setCustomPrompt('');
        setGeneratedVideoUrl(null);
        setVideoError(null);
        setIsLoading(false);
        setIsVideoLoading(false);
    }, []);

    const handleTryOn = useCallback(async () => {
        if (!personImage || !outfitImage) {
            setError('Please upload both your photo and an outfit image.');
            return;
        }

        // Reset previous results, but keep inputs
        setGeneratedImages([]);
        setError(null);
        setAdditionalInfo(null);
        setGeneratedVideoUrl(null);
        setVideoError(null);
        setIsLoading(true);

        try {
            const views: ViewType[] = [ViewType.FRONT, ViewType.LEFT, ViewType.RIGHT, ViewType.BACK];
            
            const results = await Promise.all(
                views.map(view => generateTryOnImage(personImage, outfitImage, styleImage, view, customPrompt))
            );

            const successfulResults: GeneratedImage[] = [];
            let apiError: string | null = null;
            let infoMessage: string | null = null;

            results.forEach((result, index) => {
                if (result.error) {
                    if (!apiError) apiError = result.error;
                } else if (result.image) {
                    successfulResults.push({
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
                setError(apiError);
            } else {
                setGeneratedImages(successfulResults);
                setAdditionalInfo(infoMessage);
            }

        } catch (err) {
            console.error(err);
            setError('An unexpected error occurred while generating images. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [personImage, outfitImage, styleImage, customPrompt]);
    
    const handleGenerateVideo = useCallback(async () => {
        const frontViewImage = generatedImages.find(img => img.label === ViewType.FRONT);
        if (!frontViewImage) {
            setVideoError("Could not find the front view image, which is required to generate the video.");
            return;
        }

        setIsVideoLoading(true);
        setVideoError(null);
        setGeneratedVideoUrl(null);

        try {
            const { videoUrl, error } = await generateTryOnVideo(frontViewImage.src);

            if (error) {
                setVideoError(error);
            } else {
                setGeneratedVideoUrl(videoUrl);
            }
        } catch (err) {
            console.error(err);
            setVideoError('An unexpected error occurred while generating the video.');
        } finally {
            setIsVideoLoading(false);
        }
    }, [generatedImages]);

    const hasContent = personImage || outfitImage || styleImage || generatedImages.length > 0 || customPrompt;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            <ImageUploader 
                                title="Your Photo" 
                                onImageUpload={setPersonImage}
                                icon={<UserIcon />}
                                image={personImage}
                            />
                            <ImageUploader 
                                title="Outfit Image" 
                                onImageUpload={setOutfitImage}
                                icon={<OutfitIcon />}
                                image={outfitImage}
                            />
                             <ImageUploader 
                                title="Style/Pattern (Optional)" 
                                onImageUpload={setStyleImage}
                                icon={<StyleIcon />}
                                image={styleImage}
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

                        <div className="flex justify-center items-center gap-4">
                            <button
                                onClick={handleTryOn}
                                disabled={!personImage || !outfitImage || isLoading || isVideoLoading}
                                className="inline-flex items-center justify-center px-8 py-3 bg-slate-900 text-white font-bold rounded-full text-base hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                            >
                                <SparklesIcon />
                                <span className="ml-2">{isLoading ? 'Generating...' : 'Virtual Try-On'}</span>
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={!hasContent || isLoading || isVideoLoading}
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
                        <p>{error}</p>
                    </div>
                )}
                
                {additionalInfo && !isLoading && (
                    <div className="max-w-4xl mx-auto mt-8 p-4 bg-blue-100 border border-blue-300 text-blue-800 rounded-lg text-center">
                        <p>{additionalInfo}</p>
                    </div>
                )}

                {isLoading && <Loader />}
                
                {!isLoading && generatedImages.length > 0 && (
                     <>
                        <GeneratedImages images={generatedImages} />
                        <div className="max-w-6xl mx-auto mt-12 text-center">
                            {!generatedVideoUrl && !isVideoLoading && (
                                <button
                                    onClick={handleGenerateVideo}
                                    className="inline-flex items-center justify-center px-8 py-3 bg-slate-800 text-white font-bold rounded-full text-base hover:bg-slate-700 transition-all duration-300 transform hover:scale-105"
                                >
                                    Generate Video Preview
                                </button>
                            )}
                            
                            {isVideoLoading && <Loader messages={[
                                "Preparing video generation...",
                                "This can take a few minutes, please wait.",
                                "Animating the 360-degree view...",
                                "Rendering high-quality video frames...",
                                "Finalizing the video file...",
                                "Hang tight, it's worth the wait!"
                            ]} />}

                            {videoError && (
                                <div className="mt-4 p-4 max-w-2xl mx-auto bg-red-100 border border-red-300 text-red-800 rounded-lg">
                                    <p><strong>Video Generation Failed:</strong> {videoError}</p>
                                </div>
                            )}

                            {generatedVideoUrl && (
                                <div className="mt-8">
                                    <h3 className="text-2xl font-bold mb-4 text-slate-800">Video Preview</h3>
                                    <video
                                        key={generatedVideoUrl}
                                        src={generatedVideoUrl}
                                        controls
                                        autoPlay
                                        loop
                                        playsInline
                                        className="w-full max-w-sm mx-auto rounded-xl shadow-lg border border-slate-200"
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default App;
