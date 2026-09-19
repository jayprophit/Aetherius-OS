


import React, { useState, useEffect } from 'react';
import { ComputerDesktopIcon, CommandLineIcon, GlobeAltIcon, UserCircleIcon, SignalIcon, BatteryIcon, SearchIcon, WifiIcon, SparklesIcon, CubeTransparentIcon } from '../Icons';

interface GuestOSProps {
    context: { os: 'Linux' | 'Windows' | 'macOS' | 'Custom'; name: string };
}

const BootScreen: React.FC<{ os: string; onComplete: () => void }> = ({ os, onComplete }) => {
    const [lines, setLines] = useState<string[]>([]);

    useEffect(() => {
        let mounted = true;
        const bootSequence = [
            `BIOS Date 01/28/25 14:22:51 Ver: 09.00.22`,
            `CPU: Virtual Quantum Core (12) @ 6.0GHz`,
            `Memory Test: 32768MB OK`,
            `Detecting Primary Master ... Aetherius Quantum Drive (1TB)`,
            `Detecting Secondary ... Neural Cache (256GB)`,
            `Booting from Hypervisor...`,
            `Loading ${os} Kernel...`,
            `Mounting root file system...`,
            `Initializing ZPE Power Grid...`,
            `Syncing Time Crystal Clock...`,
            `Starting system services...`,
            `Initializing Holographic Adapter...`,
            `Welcome to ${os}!`
        ];

        let delay = 0;
        const timeouts: number[] = [];

        bootSequence.forEach((line, index) => {
            delay += Math.random() * 300 + 100;
            const t = window.setTimeout(() => {
                if (mounted) {
                    setLines(prev => [...prev, line]);
                    if (index === bootSequence.length - 1) {
                         const t2 = window.setTimeout(onComplete, 1000);
                         timeouts.push(t2);
                    }
                }
            }, delay);
            timeouts.push(t);
        });

        return () => {
            mounted = false;
            timeouts.forEach(clearTimeout);
        };
    }, [os, onComplete]);

    return (
        <div className="h-full w-full bg-black text-gray-300 font-mono p-4 text-sm overflow-hidden flex flex-col">
            <div className="mb-4 text-blue-400">Aetherius Virtual Machine BIOS v2.0</div>
            {lines.map((line, i) => (
                <div key={i} className="text-green-500">{`> ${line}`}</div>
            ))}
            <div className="animate-pulse mt-2">_</div>
        </div>
    );
};

const UbuntuDesktop: React.FC = () => (
    <div className="h-full w-full bg-gradient-to-br from-[#772953] to-[#E95420] relative flex flex-col font-sans">
        <div className="h-7 bg-[#1d1d1d] text-gray-300 text-xs flex items-center justify-between px-4 shadow-md z-10">
            <span className="font-bold text-white">Activities</span>
            <span className="absolute left-1/2 -translate-x-1/2 font-semibold">Jan 25 14:30</span>
            <div className="flex gap-3 items-center">
                <span>EN</span>
                <SignalIcon className="w-3 h-3" />
                <BatteryIcon className="w-3 h-3" />
                <UserCircleIcon className="w-3 h-3" />
            </div>
        </div>
        <div className="flex-1 flex relative">
            <div className="w-16 bg-[#1d1d1d]/90 flex flex-col items-center py-4 gap-4 z-10">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg cursor-pointer hover:bg-orange-500">FF</div>
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-gray-600">File</div>
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-blue-500">Word</div>
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-green-500">Soft</div>
                <div className="mt-auto w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/20">:::</div>
            </div>
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-white/10 select-none">
                    <h1 className="text-8xl font-bold tracking-tighter">Ubuntu</h1>
                    <p className="text-2xl mt-2 tracking-widest">24.04 LTS</p>
                </div>
            </div>
        </div>
    </div>
);

const WindowsDesktop: React.FC = () => (
    <div className="h-full w-full bg-[#0078D7] relative flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center relative">
             {/* Wallpaper Pattern */}
            <div className="absolute right-[10%] top-[20%] w-64 h-64 bg-[#00A4EF] skew-y-12 opacity-30 blur-3xl"></div>
            <div className="absolute left-[10%] bottom-[20%] w-96 h-96 bg-[#002050] skew-y-12 opacity-40 blur-3xl"></div>
            
            <div className="grid grid-cols-1 gap-4 absolute top-4 left-4">
                <div className="flex flex-col items-center gap-1 group cursor-pointer">
                    <ComputerDesktopIcon className="w-10 h-10 text-white drop-shadow-md group-hover:opacity-80"/>
                    <span className="text-white text-xs drop-shadow-md">This PC</span>
                </div>
                <div className="flex flex-col items-center gap-1 group cursor-pointer">
                    <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:opacity-80">e</div>
                    <span className="text-white text-xs drop-shadow-md">Edge</span>
                </div>
            </div>
        </div>
        <div className="h-12 bg-[#f3f3f3]/90 backdrop-blur-xl border-t border-white/20 flex items-center px-2 gap-2 z-10">
            <div className="w-9 h-9 flex items-center justify-center hover:bg-white/50 rounded transition-colors cursor-pointer">
                <div className="grid grid-cols-2 gap-[2px]">
                    <div className="w-3 h-3 bg-[#0078D7]"></div>
                    <div className="w-3 h-3 bg-[#0078D7]"></div>
                    <div className="w-3 h-3 bg-[#0078D7]"></div>
                    <div className="w-3 h-3 bg-[#0078D7]"></div>
                </div>
            </div>
            <div className="h-8 flex-1 max-w-xs bg-white rounded-full border border-gray-300 flex items-center px-3 gap-2">
                <SearchIcon className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">Type here to search</span>
            </div>
            <div className="w-9 h-9 flex items-center justify-center hover:bg-white/50 rounded transition-colors cursor-pointer">
                <div className="w-6 h-6 bg-gray-400/50 rounded-sm relative overflow-hidden">
                    <div className="absolute top-0 bg-blue-300 w-full h-1"></div>
                </div>
            </div>
             <div className="w-9 h-9 flex items-center justify-center hover:bg-white/50 rounded transition-colors cursor-pointer">
                <div className="w-6 h-6 bg-yellow-400 rounded-sm"></div>
            </div>
            <div className="ml-auto flex flex-col items-end pr-2 text-xs text-gray-700">
                <span>2:30 PM</span>
                <span>1/25/2025</span>
            </div>
            <div className="w-1 h-full border-l border-gray-300 ml-1"></div>
        </div>
    </div>
);

const MacOSDesktop: React.FC = () => (
    <div className="h-full w-full bg-cover bg-center relative flex flex-col" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000)' }}>
        {/* Menu Bar */}
        <div className="h-7 bg-white/20 backdrop-blur-lg flex items-center justify-between px-4 text-xs font-medium text-white shadow-sm">
            <div className="flex gap-4">
                <span className="font-bold text-sm"></span>
                <span className="font-bold">Finder</span>
                <span>File</span>
                <span>Edit</span>
                <span>View</span>
                <span>Go</span>
                <span>Window</span>
                <span>Help</span>
            </div>
            <div className="flex gap-4 items-center">
                <BatteryIcon className="w-4 h-4"/>
                <WifiIcon className="w-4 h-4"/>
                <SearchIcon className="w-3 h-3"/>
                <span>Sat Jan 25</span>
                <span>2:45 PM</span>
            </div>
        </div>

        {/* Desktop Icons */}
        <div className="flex-1 p-4 flex flex-col items-end gap-6">
            <div className="flex flex-col items-center gap-1 group cursor-pointer w-20">
                <div className="w-14 h-16 bg-gray-200 rounded shadow-lg border border-gray-300 flex items-center justify-center">
                    <div className="w-10 h-10 bg-blue-500 rounded-full"></div>
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-md bg-blue-500/30 px-2 rounded">Macintosh HD</span>
            </div>
        </div>

        {/* Dock */}
        <div className="mb-2 flex justify-center">
            <div className="h-16 bg-white/20 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center px-4 gap-3 shadow-2xl">
                <div className="w-12 h-12 bg-blue-500 rounded-xl shadow-lg hover:-translate-y-2 transition-transform cursor-pointer flex items-center justify-center text-white font-bold text-xl">F</div>
                <div className="w-12 h-12 bg-gray-200 rounded-xl shadow-lg hover:-translate-y-2 transition-transform cursor-pointer flex items-center justify-center">
                    <GlobeAltIcon className="w-8 h-8 text-blue-600"/>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl shadow-lg hover:-translate-y-2 transition-transform cursor-pointer flex items-center justify-center text-white">
                    <CommandLineIcon className="w-8 h-8"/>
                </div>
                <div className="w-px h-10 bg-white/30 mx-1"></div>
                <div className="w-12 h-12 bg-gray-400 rounded-full shadow-lg hover:-translate-y-2 transition-transform cursor-pointer flex items-center justify-center text-white text-xs">Trash</div>
            </div>
        </div>
    </div>
);

const AetheriusDesktop: React.FC = () => (
    <div className="h-full w-full bg-black relative flex flex-col font-mono text-cyan-300 overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
         
         {/* Custom Desktop UI */}
         <div className="flex-1 p-6 grid grid-cols-3 gap-4 relative z-10">
             {/* Left Panel: Quantum Status */}
             <div className="border border-cyan-900 bg-black/60 backdrop-blur p-4 rounded-lg">
                 <h3 className="text-sm font-bold border-b border-cyan-900 pb-2 mb-2 flex items-center gap-2">
                     <SparklesIcon className="w-4 h-4"/> QUANTUM COHERENCE
                 </h3>
                 <div className="space-y-2 text-xs">
                     <div className="flex justify-between"><span>Qubit Stability:</span><span className="text-green-400">99.99%</span></div>
                     <div className="flex justify-between"><span>Entanglement:</span><span className="text-blue-400">LOCKED</span></div>
                     <div className="flex justify-between"><span>Error Rate:</span><span className="text-green-400">0.0001%</span></div>
                 </div>
                 <div className="mt-4 h-24 border border-cyan-900/50 rounded flex items-center justify-center">
                     <div className="w-full h-full bg-cyan-500/5 animate-pulse"></div>
                 </div>
             </div>

             {/* Center: Terminal */}
             <div className="col-span-2 border border-cyan-900 bg-black/80 backdrop-blur p-0 rounded-lg flex flex-col font-mono text-sm">
                 <div className="bg-cyan-900/20 p-2 border-b border-cyan-900 flex justify-between">
                     <span>user@aetherius-prime:~/workspace</span>
                     <span className="text-xs opacity-70">v2.0.4</span>
                 </div>
                 <div className="p-4 flex-1 text-green-400">
                     <p>user@aetherius-prime:~$ ./init_neural_link.sh</p>
                     <p className="text-cyan-500">[INFO] Establishing bridge to neural cortex...</p>
                     <p className="text-cyan-500">[INFO] Handshake successful. Latency: 2ms</p>
                     <p className="text-cyan-500">[INFO] Loading ternary logic gates...</p>
                     <p className="text-white">System Ready.</p>
                     <p className="mt-2">user@aetherius-prime:~$ <span className="animate-pulse">_</span></p>
                 </div>
             </div>
         </div>
         
         {/* Bottom Bar */}
         <div className="h-10 bg-cyan-950/30 border-t border-cyan-900 flex items-center px-4 justify-between z-10">
             <div className="flex gap-4 text-xs font-bold">
                 <span className="cursor-pointer hover:text-white">APPLICATIONS</span>
                 <span className="cursor-pointer hover:text-white">PLACES</span>
                 <span className="cursor-pointer hover:text-white">SYSTEM</span>
             </div>
             <div className="flex gap-4 text-xs text-cyan-500">
                 <span>CPU: 12%</span>
                 <span>MEM: 24GB</span>
                 <span>NET: 10Gbps</span>
                 <span className="text-white">14:35 UTC</span>
             </div>
         </div>
    </div>
);

export const GuestOS: React.FC<GuestOSProps> = ({ context }) => {
    const [booted, setBooted] = useState(false);
    const { os } = context;

    return (
        <div className="h-full w-full flex flex-col bg-black overflow-hidden select-none">
            {!booted ? (
                <BootScreen os={os === 'Custom' ? 'AetheriusOS' : os} onComplete={() => setBooted(true)} />
            ) : (
                <>
                    {os === 'Linux' && <UbuntuDesktop />}
                    {os === 'Windows' && <WindowsDesktop />}
                    {os === 'macOS' && <MacOSDesktop />}
                    {os === 'Custom' && <AetheriusDesktop />}
                </>
            )}
        </div>
    );
};
