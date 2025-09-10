import React, { useState, useRef, useCallback } from 'react';
import CameraIcon from './icons/CameraIcon';
import UploadIcon from './icons/UploadIcon';

interface ImageUploaderProps {
    title: string;
    onImageUpload: (images: string | string[] | null) => void;
    icon: React.ReactNode;
    images: string | string[] | null;
    multiple?: boolean;
    allowCamera?: boolean;
}

const XIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const convertFileToPngBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('File is not an image.'));
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const pngDataUrl = canvas.toDataURL('image/png');
                    resolve(pngDataUrl);
                } else {
                    reject(new Error('Could not get canvas context.'));
                }
            };
            img.onerror = () => reject(new Error('Error loading image.'));
            if (event.target?.result && typeof event.target.result === 'string') {
                img.src = event.target.result;
            } else {
                reject(new Error('FileReader did not return a valid result.'));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};


const ImageUploader: React.FC<ImageUploaderProps> = ({ title, onImageUpload, icon, images, multiple = false, allowCamera = false }) => {
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const openCamera = useCallback(async () => {
        setCameraError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError("Camera is not supported on this browser.");
            setIsCameraOpen(true);
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraOpen(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setCameraError("Could not access camera. Please check permissions in your browser settings.");
            setIsCameraOpen(true);
        }
    }, []);

    const closeCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
        setCameraError(null);
    }, []);

    const handleCapture = useCallback(() => {
        const video = videoRef.current;
        if (!video || !streamRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            onImageUpload(dataUrl);
        }
        closeCamera();
    }, [onImageUpload, closeCamera]);

    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) {
            if(!multiple) onImageUpload(null);
            return;
        }

        try {
            const conversionPromises = Array.from(files).map(convertFileToPngBase64);
            const base64Strings = await Promise.all(conversionPromises);

            if (multiple) {
                const currentImages = Array.isArray(images) ? images : [];
                onImageUpload([...currentImages, ...base64Strings]);
            } else {
                onImageUpload(base64Strings[0] || null);
            }
        } catch (error) {
            console.error("Error converting files:", error);
        }

    }, [onImageUpload, multiple, images]);

    const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(event.target.files);
        event.target.value = '';
    };

    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleRemove = (indexToRemove: number) => {
        if (multiple && Array.isArray(images)) {
            const newImages = images.filter((_, index) => index !== indexToRemove);
            onImageUpload(newImages.length > 0 ? newImages : []);
        }
    };

    const hasImages = Array.isArray(images) ? images.length > 0 : !!images;

    return (
        <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-slate-700 mb-3 text-center">{title}</h2>
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className="w-full"
            >
                {multiple && Array.isArray(images) && images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        {images.map((img, index) => (
                            <div key={index} className="relative group aspect-square">
                                <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                                <button
                                    onClick={() => handleRemove(index)}
                                    className="absolute top-1 right-1 p-0.5 bg-slate-900/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900"
                                    aria-label={`Remove image ${index + 1}`}
                                >
                                    <XIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : null}

                <div
                    className={`relative w-full border-2 border-dashed rounded-xl flex flex-col justify-center items-center transition-all duration-300 ${isDragging ? 'border-pink-500 bg-pink-50' : 'border-slate-300'} ${multiple && hasImages ? 'h-24' : 'h-64 md:h-80'}`}
                    role="group"
                    aria-label={`Upload options for ${title}`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onFileSelect}
                        className="hidden"
                        multiple={multiple}
                    />
                    {!multiple && typeof images === 'string' ? (
                        <img src={images} alt="Preview" className="w-full h-full object-contain rounded-xl p-2" />
                    ) : allowCamera && !hasImages ? (
                         <div className="flex flex-col items-center justify-center h-full p-4">
                            <div className="mb-4 text-slate-400 w-10 h-10">{icon}</div>
                            <button onClick={onButtonClick} className="inline-flex items-center justify-center w-48 px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-full text-base hover:bg-slate-300 transition-colors duration-300">
                                <UploadIcon /> Upload File
                            </button>
                            <div className="my-2 text-sm text-slate-400 font-medium">or</div>
                            <button onClick={openCamera} className="inline-flex items-center justify-center w-48 px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-full text-base hover:bg-slate-300 transition-colors duration-300">
                                <CameraIcon /> Take Photo
                            </button>
                        </div>
                    ) : (
                        <div onClick={onButtonClick} className="w-full h-full flex flex-col justify-center items-center cursor-pointer hover:bg-slate-50/50 rounded-xl transition-colors duration-300">
                            <div className="text-center text-slate-500 pointer-events-none">
                                <div className={`mx-auto text-slate-400 ${multiple && hasImages ? 'w-8 h-8 mb-1' : 'w-10 h-10 mb-2'}`}>{icon}</div>
                                <p className="font-semibold text-slate-600">
                                    {multiple && hasImages ? 'Add more' : 'Click or Drag & Drop'}
                                </p>
                                {!hasImages && <p className="text-sm">PNG, JPG, WEBP</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isCameraOpen && (
                <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm" onClick={closeCamera}>
                    <div className="bg-slate-800 rounded-2xl shadow-2xl p-4 border border-slate-700 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]"></video>
                             {cameraError && (
                                <div className="absolute inset-0 flex items-center justify-center p-4">
                                    <p className="text-center text-white bg-red-600/80 p-3 rounded-lg">{cameraError}</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex justify-center gap-4">
                            <button 
                                onClick={handleCapture} 
                                disabled={!!cameraError}
                                className="px-8 py-3 bg-pink-600 text-white font-bold rounded-full hover:bg-pink-700 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
                            >
                                Capture Photo
                            </button>
                            <button 
                                onClick={closeCamera} 
                                className="px-8 py-3 bg-slate-600 text-white font-bold rounded-full hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;