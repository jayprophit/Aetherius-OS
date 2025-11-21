
import React, { useState, useRef, useEffect } from 'react';
import { 
    UserCircleIcon, CheckCircleIcon, FingerPrintIcon, HiveMindIcon, 
    ShieldCheckIcon, SparklesIcon, CameraIcon, ArrowRightIcon, GlobeAltIcon,
    LockClosedIcon, ExclamationTriangleIcon, DocumentTextIcon, ChevronLeftIcon
} from './Icons';
import { SystemIdentity } from '../types';

interface OnboardingWizardProps {
    onComplete: (identity: SystemIdentity, avatarUrl: string) => void;
}

const StepIndicator: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => (
    <div className="flex items-center justify-center space-x-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, idx) => (
            <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx + 1 === currentStep ? 'w-8 bg-blue-500' : 
                    idx + 1 < currentStep ? 'w-4 bg-green-500' : 'w-2 bg-gray-600'
                }`} 
            />
        ))}
    </div>
);

const PseudoHash = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; 
    }
    return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
};

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    
    // Identity State
    const [accountTier, setAccountTier] = useState<'verified' | 'anonymous'>('verified');
    const [govName, setGovName] = useState('');
    const [govtIdNumber, setGovtIdNumber] = useState('');
    const [nickname, setNickname] = useState('');
    const [userId, setUserId] = useState('');
    
    // AI State
    const [aiName, setAiName] = useState('Aether');
    const [aiNickname, setAiNickname] = useState('Buddy');
    const [aiId, setAiId] = useState('');
    
    // Network State
    const [osId] = useState('OS-GEN-001');
    const [networkId, setNetworkId] = useState('');
    
    // Avatar State
    const [avatarMode, setAvatarMode] = useState<'default' | 'customize' | 'selfie'>('default');
    const [selectedAvatar, setSelectedAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200');
    const [selfieProcessing, setSelfieProcessing] = useState(false);

    // Real-time ID Generation
    useEffect(() => {
        const source = accountTier === 'verified' ? govName + govtIdNumber : nickname + 'anon';
        if (source) {
            setUserId(`${accountTier === 'verified' ? 'UID-VERIFIED-' : 'UID-ANON-'}${PseudoHash(source)}`);
        }
    }, [govName, govtIdNumber, nickname, accountTier]);

    useEffect(() => {
        if (aiName) {
            setAiId(`AI-${PseudoHash(aiName)}`);
        }
    }, [aiName]);

    useEffect(() => {
        if (osId && userId && aiId) {
            setNetworkId(`${osId}::${userId}::${aiId}`);
        }
    }, [osId, userId, aiId]);

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => Math.max(1, prev - 1));
    };

    const handleSelfieCapture = () => {
        setSelfieProcessing(true);
        setTimeout(() => {
            setSelfieProcessing(false);
            // Simulating a generated AI avatar from selfie
            setSelectedAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200');
        }, 2000);
    };

    const handleFinish = () => {
        const identity: SystemIdentity = {
            governmentName: accountTier === 'verified' ? govName : undefined,
            govtIdNumber: accountTier === 'verified' ? govtIdNumber : undefined,
            userId,
            aiCoreName: aiName,
            aiNickname,
            aiId,
            osId,
            networkId,
            accountTier
        };
        // Use nickname as display name for anon users if govName is empty
        const displayName = accountTier === 'verified' ? govName : nickname;
        // Hack to pass display name through existing flow
        identity.governmentName = displayName; 
        
        onComplete(identity, selectedAvatar);
    };

    const isStep1Valid = () => {
        if (accountTier === 'verified') {
            return govName.trim().length > 0 && govtIdNumber.trim().length > 0 && nickname.trim().length > 0;
        }
        return nickname.trim().length > 0;
    };

    const defaultAvatars = [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200', // Human Male
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200', // Human Female
        'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&h=200', // Minimalist Male
        'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&h=200', // Portrait
        'https://images.unsplash.com/photo-1618331835717-801e976710b2?auto=format&fit=crop&w=200&h=200', // Abstract 3D
        'https://images.unsplash.com/photo-1634926878768-2a5b3c426d49?auto=format&fit=crop&w=200&h=200', // 3D Bot
        'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=200&h=200', // Cyberpunk
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200', // Realism
    ];

    return (
        <div className="fixed inset-0 z-[9999] bg-gray-900 flex items-center justify-center text-white p-4">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            
            <div className="w-full max-w-5xl bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[650px] relative z-10">
                
                {/* Left Panel: Context */}
                <div className="w-full md:w-1/3 bg-gradient-to-b from-blue-900/50 to-purple-900/50 p-8 flex flex-col justify-between border-r border-gray-700">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                            <GlobeAltIcon className="w-8 h-8 text-cyan-400" />
                            Genesis
                        </h1>
                        <p className="text-blue-200 text-sm mb-8">System Initialization Sequence</p>
                        
                        <div className="space-y-6">
                            <div className={`transition-opacity duration-500 ${step >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                                <h3 className="font-bold text-white flex items-center gap-2"><FingerPrintIcon className="w-5 h-5"/> Identity</h3>
                                <p className="text-xs text-gray-300 mt-1">Access Tier & Verification</p>
                            </div>
                             <div className={`transition-opacity duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                                <h3 className="font-bold text-white flex items-center gap-2"><HiveMindIcon className="w-5 h-5"/> Parent AI</h3>
                                <p className="text-xs text-gray-300 mt-1">Core Intelligence Naming</p>
                            </div>
                             <div className={`transition-opacity duration-500 ${step >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                                <h3 className="font-bold text-white flex items-center gap-2"><UserCircleIcon className="w-5 h-5"/> Avatar</h3>
                                <p className="text-xs text-gray-300 mt-1">Digital Representation</p>
                            </div>
                             <div className={`transition-opacity duration-500 ${step >= 4 ? 'opacity-100' : 'opacity-30'}`}>
                                <h3 className="font-bold text-white flex items-center gap-2"><ShieldCheckIcon className="w-5 h-5"/> Network</h3>
                                <p className="text-xs text-gray-300 mt-1">Blockchain Registration</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-8">
                        Secure Connection <br/>
                        Grandchild Node v1.0
                    </div>
                </div>

                {/* Right Panel: Form */}
                <div className="flex-1 p-8 flex flex-col">
                    <StepIndicator currentStep={step} totalSteps={4} />

                    {step === 1 && (
                        <div className="flex-1 animate-fade-in flex flex-col">
                            <h2 className="text-2xl font-bold mb-2">Establish Identity & Access</h2>
                            <p className="text-gray-400 mb-6">Select your account tier. <span className="text-yellow-400 font-semibold">Strictly one account per individual.</span></p>
                            
                            {/* Tier Selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <button 
                                    onClick={() => setAccountTier('anonymous')}
                                    className={`p-4 rounded-xl border text-left transition-all duration-300 flex flex-col gap-2 ${accountTier === 'anonymous' ? 'bg-gray-700 border-gray-500 ring-2 ring-gray-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="font-bold text-gray-300">Anonymous / Lite</span>
                                        {accountTier === 'anonymous' && <CheckCircleIcon className="w-5 h-5 text-gray-400" />}
                                    </div>
                                    <div className="text-xs text-gray-400 space-y-1">
                                        <p>• No ID Required</p>
                                        <p>• Viewer Access Only</p>
                                        <p>• Limited Transactions</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setAccountTier('verified')}
                                    className={`p-4 rounded-xl border text-left transition-all duration-300 flex flex-col gap-2 ${accountTier === 'verified' ? 'bg-blue-900/30 border-blue-500 ring-2 ring-blue-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="font-bold text-blue-300">Verified Citizen</span>
                                        {accountTier === 'verified' && <CheckCircleIcon className="w-5 h-5 text-blue-400" />}
                                    </div>
                                    <div className="text-xs text-gray-400 space-y-1">
                                        <p>• Full OS Access</p>
                                        <p>• Banking, Jobs, Voting</p>
                                        <p>• Requires KYC</p>
                                    </div>
                                </button>
                            </div>

                            {/* Dynamic Form Fields */}
                            <div className="space-y-4 bg-gray-900/30 p-4 rounded-xl border border-gray-700">
                                {accountTier === 'verified' && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-300 mb-1">Government Name (Legal ID)</label>
                                                <input 
                                                    type="text" 
                                                    value={govName} 
                                                    onChange={(e) => setGovName(e.target.value)}
                                                    placeholder="e.g., Johnathan Doe"
                                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-300 mb-1">Government ID Number</label>
                                                <input 
                                                    type="text" 
                                                    value={govtIdNumber} 
                                                    onChange={(e) => setGovtIdNumber(e.target.value)}
                                                    placeholder="e.g., A12345678"
                                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                                            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-[10px] text-yellow-200/80">
                                                <strong>One Account Policy:</strong> Your ID will be hashed into the blockchain. Any attempt to create a second account with this ID will be rejected by the network consensus. You cannot create multiple "Grandchild" nodes for yourself.
                                            </p>
                                        </div>
                                    </>
                                )}
                                
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">{accountTier === 'verified' ? 'Preferred Nickname' : 'Display Name'}</label>
                                    <input 
                                        type="text" 
                                        value={nickname} 
                                        onChange={(e) => setNickname(e.target.value)}
                                        placeholder={accountTier === 'verified' ? "e.g., Johnny" : "e.g., AnonUser001"}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>

                                {accountTier === 'anonymous' && (
                                     <div className="flex items-start gap-2 p-2 bg-gray-700/30 border border-gray-600/30 rounded-lg">
                                        <LockClosedIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-[10px] text-gray-400">
                                            Limited to one anonymous account per device fingerprint. Features like Marketplace selling and Voting are disabled.
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-auto pt-6 flex justify-end">
                                <button 
                                    onClick={handleNext} 
                                    disabled={!isStep1Valid()}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                                >
                                    Confirm & Continue <ArrowRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex-1 animate-fade-in flex flex-col">
                            <h2 className="text-2xl font-bold mb-2">Initialize Parent AI</h2>
                            <p className="text-gray-400 mb-8">This AI manages your Grandchild OS node and sub-agents.</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">AI Core Name (Permanent)</label>
                                    <input 
                                        type="text" 
                                        value={aiName} 
                                        onChange={(e) => setAiName(e.target.value)}
                                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">This name is hardcoded into your node's DNA.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">AI Nickname (Changeable)</label>
                                    <input 
                                        type="text" 
                                        value={aiNickname} 
                                        onChange={(e) => setAiNickname(e.target.value)}
                                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">How you address the AI daily.</p>
                                </div>
                                <div className="bg-black/30 p-4 rounded-lg border border-gray-700 font-mono text-sm">
                                    <span className="text-gray-500 block mb-1">GENERATED AI ID</span>
                                    <span className="text-purple-400 text-lg tracking-wider">{aiId}</span>
                                </div>
                            </div>
                             <div className="mt-auto pt-8 flex justify-between">
                                <button onClick={handleBack} className="px-6 py-3 text-gray-400 hover:text-white font-semibold flex items-center gap-2">
                                    <ChevronLeftIcon className="w-4 h-4" /> Back
                                </button>
                                <button 
                                    onClick={handleNext} 
                                    disabled={!aiName}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg disabled:opacity-50 flex items-center gap-2"
                                >
                                    Initialize Core <ArrowRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex-1 animate-fade-in flex flex-col">
                            <h2 className="text-2xl font-bold mb-2">AI Avatar Synthesis</h2>
                            <p className="text-gray-400 mb-6">Configure the visual interface for your Parent AI.</p>

                            <div className="flex gap-2 mb-6 bg-gray-900/50 p-1 rounded-lg self-start">
                                <button onClick={() => setAvatarMode('default')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${avatarMode === 'default' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Default</button>
                                <button onClick={() => setAvatarMode('customize')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${avatarMode === 'customize' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Customize</button>
                                <button onClick={() => setAvatarMode('selfie')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${avatarMode === 'selfie' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Bio-Gen (Selfie)</button>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="relative w-48 h-48 mb-6 group">
                                    <img src={selectedAvatar} alt="AI Avatar" className="w-full h-full rounded-full object-cover border-4 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)]" />
                                    {avatarMode === 'customize' && (
                                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <span className="text-sm font-bold">Open Forge</span>
                                        </div>
                                    )}
                                </div>

                                {avatarMode === 'default' && (
                                    <div className="grid grid-cols-4 gap-4">
                                        {defaultAvatars.map((url, index) => (
                                            <button key={index} onClick={() => setSelectedAvatar(url)} className={`w-14 h-14 rounded-full border-2 ${selectedAvatar === url ? 'border-blue-500 ring-2 ring-blue-500' : 'border-transparent border-gray-600'} overflow-hidden hover:opacity-80 transition-all`}>
                                                <img src={url} className="w-full h-full object-cover" alt={`Avatar Option ${index + 1}`} />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {avatarMode === 'selfie' && (
                                    <button 
                                        onClick={handleSelfieCapture}
                                        disabled={selfieProcessing}
                                        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold flex items-center gap-2 transition-all"
                                    >
                                        {selfieProcessing ? <SparklesIcon className="w-5 h-5 animate-spin" /> : <CameraIcon className="w-5 h-5" />}
                                        {selfieProcessing ? 'Synthesizing Clone...' : 'Capture & Generate'}
                                    </button>
                                )}
                            </div>

                            <div className="mt-auto pt-8 flex justify-between">
                                <button onClick={handleBack} className="px-6 py-3 text-gray-400 hover:text-white font-semibold flex items-center gap-2">
                                    <ChevronLeftIcon className="w-4 h-4" /> Back
                                </button>
                                <button 
                                    onClick={handleNext} 
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2"
                                >
                                    Confirm Avatar <ArrowRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="flex-1 animate-fade-in flex flex-col">
                            <h2 className="text-2xl font-bold mb-2 text-center">Network Registration Complete</h2>
                            <p className="text-gray-400 mb-8 text-center">Your node has been successfully minted on the Aetherius Blockchain.</p>

                            <div className="bg-black/40 border border-gray-700 rounded-xl p-6 space-y-4 font-mono text-sm mb-6">
                                <div className="flex justify-between border-b border-gray-700 pb-2">
                                    <span className="text-gray-500">OS ID</span>
                                    <span className="text-gray-300">{osId}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-700 pb-2">
                                    <span className="text-gray-500">USER ID</span>
                                    <span className="text-green-400">{userId}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-700 pb-2">
                                    <span className="text-gray-500">AI ID</span>
                                    <span className="text-purple-400">{aiId}</span>
                                </div>
                                <div className="pt-2">
                                    <span className="text-gray-500 block mb-1 text-xs">NETWORK ID (BLOCKCHAIN ADDRESS)</span>
                                    <span className="text-blue-400 break-all font-bold">{networkId}</span>
                                </div>
                                <div className="pt-2 border-t border-gray-700">
                                    <span className="text-gray-500 block mb-1 text-xs">ACCOUNT TIER</span>
                                    <span className={`font-bold uppercase ${accountTier === 'verified' ? 'text-green-400' : 'text-gray-400'}`}>{accountTier}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-4 text-sm text-gray-400 mb-8">
                                <div className="flex items-center gap-1"><CheckCircleIcon className="w-4 h-4 text-green-500"/> Identity Verified</div>
                                <div className="flex items-center gap-1"><CheckCircleIcon className="w-4 h-4 text-green-500"/> AI Core Online</div>
                                <div className="flex items-center gap-1"><CheckCircleIcon className="w-4 h-4 text-green-500"/> Wallet Created</div>
                            </div>

                            <div className="mt-auto pt-8 flex justify-between">
                                <button onClick={handleBack} className="px-6 py-3 text-gray-400 hover:text-white font-semibold flex items-center gap-2">
                                    <ChevronLeftIcon className="w-4 h-4" /> Back
                                </button>
                                <button 
                                    onClick={handleFinish} 
                                    className="w-full max-w-sm px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-3"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    Enter Aetherius OS
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
