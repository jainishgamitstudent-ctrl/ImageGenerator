
import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="text-center py-8 border-b border-gray-700/50">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                Virtual Try-On Assistant
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                See yourself in any outfit. Upload your photo and a clothing item to get a realistic preview from every angle.
            </p>
        </header>
    );
};

export default Header;
