
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
import SparklesIcon from './components/icons/SparklesIcon';
import ResetIcon from './components/icons/ResetIcon';

const App: React.FC = () => {
    const [personImage, setPersonImage] = useState<string | null>(null);
    const [outfitImage, setOutfitImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [additionalInfo, setAdditionalInfo] = useState<string | null>(null);
    
    const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);

    const handleReset = useCallback(() => {
        setPersonImage(null);
        setOutfitImage(null);
        setGeneratedImages([]);
        setError(null);
        setAdditionalInfo(null);
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

        handleReset();
        setIsLoading(true);

        try {
            const views: ViewType[] = [ViewType.FRONT, ViewType.LEFT, ViewType.RIGHT, ViewType.BACK];
            
            const results = await Promise.all(
                views.map(view => generateTryOnImage(personImage, outfitImage, view))
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
    }, [personImage, outfitImage, handleReset]);
    
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

    const hasContent = personImage || outfitImage || generatedImages.length > 0;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto bg-gray-800/50 rounded-2xl shadow-2xl shadow-indigo-500/10 backdrop-blur-sm overflow-hidden">
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <ImageUploader 
                                title="Upload Your Photo" 
                                onImageUpload={setPersonImage}
                                icon={<UserIcon />}
                                image={personImage}
                            />
                            <ImageUploader 
                                title="Upload Outfit Image" 
                                onImageUpload={setOutfitImage}
                                icon={<OutfitIcon />}
                                image={outfitImage}
                            />
                        </div>

                        <div className="flex justify-center items-center gap-4">
                            <button
                                onClick={handleTryOn}
                                disabled={!personImage || !outfitImage || isLoading || isVideoLoading}
                                className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 text-white font-bold rounded-full text-lg hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-600/30"
                            >
                                <SparklesIcon />
                                <span className="ml-2">{isLoading ? 'Generating...' : 'Virtual Try-On'}</span>
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={!hasContent || isLoading || isVideoLoading}
                                className="inline-flex items-center justify-center p-4 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300"
                                aria-label="Reset application"
                            >
                                <ResetIcon />
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="max-w-4xl mx-auto mt-8 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center">
                        <p>{error}</p>
                    </div>
                )}
                
                {additionalInfo && !isLoading && (
                    <div className="max-w-4xl mx-auto mt-8 p-4 bg-blue-900/50 border border-blue-700 text-blue-300 rounded-lg text-center">
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
                                    className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white font-bold rounded-full text-lg hover:bg-green-500 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-600/30"
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
                                <div className="mt-4 p-4 max-w-2xl mx-auto bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
                                    <p><strong>Video Generation Failed:</strong> {videoError}</p>
                                </div>
                            )}

                            {generatedVideoUrl && (
                                <div className="mt-8">
                                    <h3 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-cyan-400">Video Preview</h3>
                                    <video
                                        key={generatedVideoUrl}
                                        src={generatedVideoUrl}
                                        controls
                                        autoPlay
                                        loop
                                        playsInline
                                        className="w-full max-w-2xl mx-auto rounded-xl shadow-2xl shadow-green-500/20"
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
