
import React, { useState, useEffect } from 'react';
import { ComputerDesktopIcon, CommandLineIcon, GlobeAltIcon, UserCircleIcon, SignalIcon, BatteryIcon, SearchIcon, WifiIcon } from '../Icons';

interface GuestOSProps {
    context: { os: 'Linux' | 'Windows' | 'macOS' | 'Custom'; name: string };
}

const BootScreen: React.FC<{ os: string; onComplete: () => void }> = ({ os, onComplete }) => {
    const [lines, setLines] = useState<string[]>([]);

    useEffect(() => {
        let mounted = true;
        const bootSequence = [
            `BIOS Date 01/15/25 14:22:51 Ver: 08.00.15`,
            `CPU: Virtual Quantum Core (4) @ 4.5GHz`,
            `Memory Test: 8192MB OK`,
            `Detecting Primary Master ... Aetherius Virtual Disk`,
            `Detecting Primary Slave ... None`,
            `Booting from Hard Disk...`,
            `Loading ${os} Kernel...`,
            `Mounting root file system...`,
            `Starting system services...`,
            `Initializing graphics adapter...`,
            `Welcome to ${os}!`
        ];

        let delay = 0;
        const timeouts: number[] = [];

        bootSequence.forEach((line, index) => {
            delay += Math.random() * 500 + 200;
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
            <div className="mb-4">Aetherius Virtual Machine BIOS v1.0</div>
            {lines.map((line, i) => (
                <div key={i}>{line}</div>
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

const KaliDesktop: React.FC = () => (
    <div className="h-full w-full bg-gray-900 relative flex flex-col font-mono">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
         <div className="absolute top-10 left-10 w-3/4 h-3/4 bg-black border border-blue-600 shadow-2xl rounded-t-lg overflow-hidden flex flex-col">
            <div className="bg-gray-800 h-8 flex items-center px-3 text-xs text-gray-300 gap-2 border-b border-gray-700">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="ml-4">root@kali:~</span>
            </div>
            <div className="flex-1 p-4 text-green-400 text-sm font-bold">
                <p>root@kali:~# nmap -sV 192.168.1.1</p>
                <p className="text-gray-400 mt-1">Starting Nmap 7.94 at 2025-01-25 14:35 UTC</p>
                <p className="text-gray-400">Nmap scan report for 192.168.1.1</p>
                <p className="text-gray-400">Host is up (0.0012s latency).</p>
                <p className="mt-2">PORT   STATE SERVICE VERSION</p>
                <p>22/tcp open  ssh     OpenSSH 8.2p1</p>
                <p>80/tcp open  http    nginx 1.18.0</p>
                <p className="animate-pulse mt-2">_</p>
            </div>
         </div>
         
         {/* Kali Top Bar */}
         <div className="h-8 bg-black border-b border-blue-900 flex items-center px-4 justify-between z-10">
             <div className="flex gap-6 text-gray-300 text-sm font-bold">
                 <span className="text-blue-400">Applications</span>
                 <span>Places</span>
             </div>
             <div className="flex gap-4 text-blue-400 text-xs">
                 <span>eth0: 100Mb/s</span>
                 <span>root</span>
                 <span>14:35</span>
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
                <BootScreen os={os} onComplete={() => setBooted(true)} />
            ) : (
                <>
                    {os === 'Linux' && <UbuntuDesktop />}
                    {os === 'Windows' && <WindowsDesktop />}
                    {os === 'macOS' && <MacOSDesktop />}
                    {(os === 'Custom') && <KaliDesktop />}
                </>
            )}
        </div>
    );
};
