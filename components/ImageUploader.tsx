
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
            reader.onloadend = () => {
                const base64String = reader.result as string;
                onImageUpload(base64String);
            };
            reader.readAsDataURL(file);
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
            <h2 className="text-xl font-semibold text-gray-300 mb-4">{title}</h2>
            <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
                className={`relative w-full h-64 md:h-80 border-2 border-dashed rounded-xl flex flex-col justify-center items-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-900/20' : 'border-gray-600 hover:border-indigo-500 hover:bg-gray-700/50'}`}
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
                    <div className="text-center text-gray-500 pointer-events-none">
                        <div className="w-12 h-12 mx-auto mb-2 text-gray-400">{icon}</div>
                        <p className="font-semibold">Drag & Drop or Click to Upload</p>
                        <p className="text-sm">PNG, JPG, WEBP</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUploader;
