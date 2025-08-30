
import React, { useState, useRef, useCallback } from 'react';

interface ImageUploaderProps {
    title: string;
    onImageUpload: (base64: string | null) => void;
    icon: React.ReactNode;
    image: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ title, onImageUpload, icon, image }) => {
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((file: File | null) => {
        if (file && file.type.startsWith('image/')) {
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
                        // Force conversion to PNG which is widely supported by the Gemini API
                        const pngDataUrl = canvas.toDataURL('image/png');
                        onImageUpload(pngDataUrl);
                    } else {
                        console.error("Could not get canvas context to convert image.");
                        onImageUpload(null);
                    }
                };
                img.onerror = () => {
                    console.error("Error loading image for conversion. It might be corrupt.");
                    onImageUpload(null);
                };
                
                if (event.target?.result && typeof event.target.result === 'string') {
                    img.src = event.target.result;
                } else {
                    console.error("FileReader did not return a valid result.");
                    onImageUpload(null);
                }
            };
            reader.onerror = (error) => {
                console.error("Error reading file for conversion:", error);
                onImageUpload(null);
            };
            reader.readAsDataURL(file);
        } else {
            onImageUpload(null);
        }
    }, [onImageUpload]);
    
    const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFileChange(event.target.files?.[0] || null);
        event.target.value = ''; // Allow re-uploading the same file
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
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold text-slate-700 mb-3">{title}</h2>
            <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
                className={`relative w-full h-64 md:h-80 border-2 border-dashed rounded-xl flex flex-col justify-center items-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-pink-500 bg-pink-50' : 'border-slate-300 hover:border-pink-400 hover:bg-slate-50/50'}`}
                role="button"
                aria-label={`Upload ${title}`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileSelect}
                    className="hidden"
                />
                {image ? (
                    <img src={image} alt="Preview" className="w-full h-full object-contain rounded-xl p-2" />
                ) : (
                    <div className="text-center text-slate-500 pointer-events-none">
                        <div className="w-10 h-10 mx-auto mb-2 text-slate-400">{icon}</div>
                        <p className="font-semibold text-slate-600">Click or Drag & Drop</p>
                        <p className="text-sm">PNG, JPG, WEBP</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUploader;
