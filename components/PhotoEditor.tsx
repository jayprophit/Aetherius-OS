
import React, { useState, useRef } from 'react';
import { 
    PhotoIcon, ArrowDownTrayIcon, ArrowPathIcon, 
    AdjustmentsHorizontalIcon, EyeIcon, TrashIcon,
    SunIcon, SparklesIcon, ArrowLeftIcon
} from './Icons';

interface Adjustments {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    grayscale: number;
    sepia: number;
    rotation: number;
}

const initialAdjustments: Adjustments = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    rotation: 0
};

export const PhotoEditor: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [adjustments, setAdjustments] = useState<Adjustments>(initialAdjustments);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) setImage(event.target.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const updateAdjustment = (key: keyof Adjustments, value: number) => {
        setAdjustments(prev => ({ ...prev, [key]: value }));
    };

    const getImageStyle = (): React.CSSProperties => ({
        filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) blur(${adjustments.blur}px) grayscale(${adjustments.grayscale}%) sepia(${adjustments.sepia}%)`,
        transform: `rotate(${adjustments.rotation}deg)`,
        transition: 'filter 0.2s, transform 0.3s'
    });

    const reset = () => setAdjustments(initialAdjustments);

    return (
        <div className="flex h-full bg-gray-900 text-white overflow-hidden font-sans">
            {/* Sidebar Controls */}
            <aside className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700">
                    <h2 className="font-bold flex items-center gap-2">
                        <PhotoIcon className="w-5 h-5 text-purple-400"/> Photo Studio
                    </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {!image ? (
                        <div className="text-center text-gray-500 py-10">
                            <p>No image loaded.</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase text-gray-400">Light & Color</h3>
                                <div className="space-y-1">
                                    <label className="text-xs flex justify-between">Brightness <span>{adjustments.brightness}%</span></label>
                                    <input type="range" min="0" max="200" value={adjustments.brightness} onChange={(e) => updateAdjustment('brightness', Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs flex justify-between">Contrast <span>{adjustments.contrast}%</span></label>
                                    <input type="range" min="0" max="200" value={adjustments.contrast} onChange={(e) => updateAdjustment('contrast', Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs flex justify-between">Saturation <span>{adjustments.saturation}%</span></label>
                                    <input type="range" min="0" max="200" value={adjustments.saturation} onChange={(e) => updateAdjustment('saturation', Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase text-gray-400">Effects</h3>
                                <div className="space-y-1">
                                    <label className="text-xs flex justify-between">Blur <span>{adjustments.blur}px</span></label>
                                    <input type="range" min="0" max="20" value={adjustments.blur} onChange={(e) => updateAdjustment('blur', Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs flex justify-between">Grayscale <span>{adjustments.grayscale}%</span></label>
                                    <input type="range" min="0" max="100" value={adjustments.grayscale} onChange={(e) => updateAdjustment('grayscale', Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs flex justify-between">Sepia <span>{adjustments.sepia}%</span></label>
                                    <input type="range" min="0" max="100" value={adjustments.sepia} onChange={(e) => updateAdjustment('sepia', Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase text-gray-400">Transform</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => updateAdjustment('rotation', adjustments.rotation - 90)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded text-xs font-bold"><ArrowPathIcon className="w-4 h-4 mx-auto mb-1 -scale-x-100"/> -90°</button>
                                    <button onClick={() => updateAdjustment('rotation', adjustments.rotation + 90)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded text-xs font-bold"><ArrowPathIcon className="w-4 h-4 mx-auto mb-1"/> +90°</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="p-4 border-t border-gray-700 bg-gray-850">
                    <button onClick={reset} className="w-full py-2 mb-2 text-xs font-bold text-gray-400 hover:text-white">Reset All</button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleUpload}
                    />
                    {!image ? (
                        <button onClick={() => fileInputRef.current?.click()} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg">
                            Open Image
                        </button>
                    ) : (
                        <button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2">
                            <ArrowDownTrayIcon className="w-4 h-4"/> Save
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Canvas */}
            <main className="flex-1 bg-black relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20"></div>
                {image ? (
                    <img 
                        src={image} 
                        alt="Editing" 
                        className="max-w-[90%] max-h-[90%] object-contain shadow-2xl border-4 border-gray-800"
                        style={getImageStyle()}
                    />
                ) : (
                    <div className="text-center text-gray-600 z-10">
                        <PhotoIcon className="w-24 h-24 mx-auto mb-4 opacity-20"/>
                        <p className="text-xl font-bold">No Image Selected</p>
                        <p className="text-sm mt-2">Upload an image to start editing</p>
                        <button onClick={() => fileInputRef.current?.click()} className="mt-6 px-6 py-3 bg-gray-800 border border-gray-700 rounded-full hover:bg-gray-700 transition-colors">
                            Browse Files
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};
