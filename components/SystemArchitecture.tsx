
import React from 'react';
import { CubeTransparentIcon, GlobeIcon, UserCircleIcon, ShareIcon, SparklesIcon, LockClosedIcon } from './Icons';

const ArchitectureCard: React.FC<{
    icon: React.FC<any>;
    title: string;
    description: string;
    status: string;
    statusColor: string;
}> = ({ icon: Icon, title, description, status, statusColor }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500">
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-baseline">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`}></div>
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{status}</span>
                    </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm whitespace-pre-line">{description}</p>
            </div>
        </div>
    </div>
);


export const SystemArchitecture: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">System Architecture</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Visualizing the hierarchical, element-based architecture of Aetherius OS.</p>
            </header>

            <div className="space-y-8">
                <ArchitectureCard 
                    icon={SparklesIcon}
                    title="Elemental Foundation Layer"
                    description="The Quantum DNA Core utilizing Fractal Compression and Organic Loaders. Organized by the 5 Core Elements:
                    - Earth: Blockchain Immutability
                    - Water: Fluid Data Lakes
                    - Fire: AI/MLOps Nucleus
                    - Air: Neural Networking
                    - Ether: Quantum-Spiritual Interface"
                    status="Eternal"
                    statusColor="bg-purple-500"
                />

                <div className="text-center">
                    <ShareIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 transform rotate-90 mx-auto" />
                </div>

                <ArchitectureCard 
                    icon={CubeTransparentIcon}
                    title="Cyclical Operations Engine"
                    description="Continuous Rotation System for DevOps & Governance.
                    - 7-Node Energy Grid Pipelines
                    - Container Ecosystem
                    - Ethical Law Validation Engine"
                    status="Rotating"
                    statusColor="bg-orange-500"
                />

                <div className="text-center">
                    <ShareIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 transform rotate-90 mx-auto" />
                </div>

                <ArchitectureCard 
                    icon={LockClosedIcon}
                    title="Multi-Layered Security Shield"
                    description="5-Sheath Protection Model:
                    - Physical Layer: Hardware Root of Trust
                    - Energy Layer: Quantum Key Distribution
                    - Mental Layer: Neuro-Linguistic Firewall
                    - Wisdom Layer: Blockchain Witness Consensus
                    - Core Layer: Absolute State Encryption"
                    status="Secure"
                    statusColor="bg-green-500"
                />
                
                <div className="text-center">
                    <ShareIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 transform rotate-90 mx-auto" />
                </div>

                <ArchitectureCard 
                    icon={UserCircleIcon}
                    title="Holographic Interface Layer"
                    description="Multi-Dimensional User Experience.
                    - Sacred Geometry Controls
                    - Knowledge Scribe Integration
                    - Immersive Simulation Modules
                    - Voice Assistant UI"
                    status="Active"
                    statusColor="bg-blue-500"
                />
            </div>
        </div>
    );
};
