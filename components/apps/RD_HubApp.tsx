
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { DigitalTwinEngine } from '../DigitalTwinEngine';
import { CubeTransparentIcon, EyeIcon, SparklesIcon, PlayIcon } from '../Icons';

// --- Sub Components ---

const VRStudio: React.FC = () => (
    <div className="h-full flex flex-col bg-black text-white p-4">
        <header className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2"><CubeTransparentIcon className="w-6 h-6 text-purple-500"/> VR Spatial Studio</h2>
            <button className="px-4 py-1 bg-purple-600 rounded text-sm font-bold">Enter VR</button>
        </header>
        <div className="flex-1 border border-gray-800 rounded-lg relative overflow-hidden flex items-center justify-center bg-gray-900">
            {/* 3D Grid Floor */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [transform:perspective(500px)_rotateX(60deg)_translateY(200px)_scale(2)] opacity-50"></div>
            
            <div className="relative z-10 text-center">
                <div className="w-24 h-24 border-4 border-purple-500/50 rounded-lg animate-spin-slow mx-auto mb-4"></div>
                <p className="text-gray-400 text-sm font-mono">Awaiting Headset Connection...</p>
            </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 h-32">
            {['Environment', 'Physics', 'Lighting'].map(p => (
                <div key={p} className="bg-gray-800 rounded p-3 border border-gray-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">{p}</h3>
                    <div className="h-1 bg-gray-700 rounded overflow-hidden"><div className="h-full bg-purple-500 w-2/3"></div></div>
                </div>
            ))}
        </div>
    </div>
);

const BCILab: React.FC = () => (
    <div className="h-full flex flex-col bg-gray-900 text-green-400 font-mono p-6">
        <header className="mb-8 border-b border-green-900/50 pb-4">
            <h1 className="text-2xl font-bold flex items-center gap-3"><SparklesIcon className="w-8 h-8"/> Neural Interface Lab</h1>
            <p className="text-xs text-gray-500 mt-1">Brain-Computer Interface Signal Processing Unit</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
            <div className="bg-black border border-green-900 rounded-lg p-4 relative overflow-hidden">
                <div className="absolute top-2 right-2 text-xs animate-pulse">● RECORDING</div>
                {/* Fake EEG Graph */}
                <div className="flex items-end h-full gap-1">
                    {[...Array(50)].map((_, i) => (
                        <div 
                            key={i} 
                            className="w-full bg-green-500/50 transition-all duration-100" 
                            style={{ height: `${Math.random() * 80 + 10}%` }}
                        ></div>
                    ))}
                </div>
            </div>
            
            <div className="space-y-4">
                <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                    <h3 className="text-sm font-bold text-white mb-2">Signal Quality</h3>
                    <div className="flex gap-2">
                        {['Alpha', 'Beta', 'Gamma', 'Delta', 'Theta'].map(wave => (
                            <div key={wave} className="flex-1 bg-black p-2 rounded text-center">
                                <div className="text-[10px] text-gray-500">{wave}</div>
                                <div className="text-lg font-bold">{Math.floor(Math.random() * 50)}hz</div>
                            </div>
                        ))}
                    </div>
                </div>
                <button className="w-full py-4 bg-green-900/30 border border-green-500 text-green-400 font-bold rounded hover:bg-green-900/50 transition-colors flex items-center justify-center gap-2">
                    <PlayIcon className="w-5 h-5"/> Calibrate Neural Link
                </button>
            </div>
        </div>
    </div>
);


const rdComponentMap: { [key: string]: React.FC<any> } = {
  vrStudio: VRStudio,
  bciLab: BCILab,
  digitalTwinSim: DigitalTwinEngine,
};

interface RD_HubAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const RD_HubApp: React.FC<RD_HubAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }

    const augmentedMenuItem = { ...context.menuItem };
    let children = augmentedMenuItem.children ? [...augmentedMenuItem.children] : [];
    
    if (!children.some(c => c.component === 'digitalTwinSim')) {
         children.push({ title: 'Digital Twin Engine', icon: CubeTransparentIcon, component: 'digitalTwinSim' });
    }
    
    if (!children.some(c => c.component === 'vrStudio')) {
        children.push({ title: 'VR/AR Studio', icon: EyeIcon, component: 'vrStudio' });
    }

    if (!children.some(c => c.component === 'bciLab')) {
        children.push({ title: 'BCI Lab', icon: SparklesIcon, component: 'bciLab' });
    }

    augmentedMenuItem.children = children;

    return <AppContainer menuItem={augmentedMenuItem} componentMap={rdComponentMap} onSetView={onSetView} />;
};
