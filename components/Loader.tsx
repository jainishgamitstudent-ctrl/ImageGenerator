
import React, { useState, useEffect } from 'react';

const defaultMessages = [
    "Analyzing your body shape and posture...",
    "Digitally tailoring the outfit...",
    "Simulating realistic fabric textures...",
    "Adjusting shadows and lighting...",
    "Rendering the front view...",
    "Capturing the perfect side angles...",
    "Generating the final images...",
    "Almost there, polishing the results..."
];

interface LoaderProps {
    messages?: string[];
}

const Loader: React.FC<LoaderProps> = ({ messages = defaultMessages }) => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        setMessageIndex(0); // Reset index when messages change
        
        const intervalId = setInterval(() => {
            setMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
        }, 2500);

        return () => clearInterval(intervalId);
    }, [messages]);

    return (
        <div className="flex flex-col items-center justify-center my-12 text-center">
            <div className="w-14 h-14 border-4 border-dashed rounded-full animate-spin border-pink-500" role="status" aria-label="Loading"></div>
            <p className="mt-4 text-base text-slate-600 font-medium transition-opacity duration-500" aria-live="polite">
                {messages[messageIndex]}
            </p>
        </div>
    );
};

export default Loader;
