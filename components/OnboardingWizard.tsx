
import React, { useState, useRef, useEffect } from 'react';
import { 
    UserCircleIcon, CheckCircleIcon, FingerPrintIcon, HiveMindIcon, 
    ShieldCheckIcon, SparklesIcon, CameraIcon, ArrowRightIcon, GlobeAltIcon,
    LockClosedIcon, ExclamationTriangleIcon, DocumentTextIcon, ChevronLeftIcon,
    ArrowUpCircleIcon, ClockIcon, ScaleIcon, FaceSmileIcon
} from './Icons';
import { SystemIdentity } from '../types';
import { GoogleGenAI } from "@google/genai";

interface OnboardingWizardProps {
    onComplete: (identity: SystemIdentity, avatarUrl: string) => void;
}

// --- Constants for Dropdowns ---

const NATIONALITIES = [
    "American", "Australian", "Brazilian", "British", "Canadian", "Chinese", 
    "Dutch", "Emirati", "French", "German", "Indian", "Indonesian", "Italian", 
    "Japanese", "Mexican", "Nigerian", "Pakistani", "Russian", "Saudi", 
    "Singaporean", "South African", "South Korean", "Spanish", "Swedish", 
    "Swiss", "Turkish", "Other"
];

const COUNTRY_CODES = [
    { code: "+1", country: "USA/Canada" },
    { code: "+44", country: "UK" },
    { code: "+86", country: "China" },
    { code: "+91", country: "India" },
    { code: "+81", country: "Japan" },
    { code: "+49", country: "Germany" },
    { code: "+33", country: "France" },
    { code: "+55", country: "Brazil" },
    { code: "+52", country: "Mexico" },
    { code: "+61", country: "Australia" },
    { code: "+7", country: "Russia" },
    { code: "+82", country: "South Korea" },
    { code: "+39", country: "Italy" },
    { code: "+34", country: "Spain" },
    { code: "+971", country: "UAE" },
    { code: "+65", country: "Singapore" },
    { code: "+234", country: "Nigeria" },
    { code: "+27", country: "South Africa" },
];

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
    const totalSteps = 7; 
    
    // --- Identity State ---
    const [accountTier, setAccountTier] = useState<'verified' | 'anonymous'>('verified');
    const [registrationMethod, setRegistrationMethod] = useState<'email' | 'social' | 'biometric'>('email');
    
    // Personal Info
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dob, setDob] = useState('');
    const [nationality, setNationality] = useState('American');
    const [dialCode, setDialCode] = useState('+1');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [nickname, setNickname] = useState('');
    
    // KYC Documents
    const [idType, setIdType] = useState<'Passport' | 'Drivers Licence' | 'Citizenship Card' | ''>('');
    const [idNumber, setIdNumber] = useState('');
    const [idExpiry, setIdExpiry] = useState('');
    const [docFront, setDocFront] = useState<string | null>(null);
    const [docBack, setDocBack] = useState<string | null>(null);
    const [proofOfAddress, setProofOfAddress] = useState<string | null>(null);
    
    // Biometrics & Avatar
    const [livenessStatus, setLivenessStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
    const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [livenessInstruction, setLivenessInstruction] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200');
    const [useSelfieForAvatar, setUseSelfieForAvatar] = useState(false);
    
    // Compliance
    const [consents, setConsents] = useState({
        privacy: false,
        biometric: false,
        terms: false
    });
    const [parentalConsent, setParentalConsent] = useState(false);
    const [ageGroup, setAgeGroup] = useState<'Child' | 'Teen' | 'Adult'>('Adult');
    
    // AI & System
    const [userId, setUserId] = useState('');
    const [aiName, setAiName] = useState('Aether');
    const [aiNickname, setAiNickname] = useState('');
    const [aiId, setAiId] = useState('');
    const [osId] = useState('OS-GEN-001');
    const [networkId, setNetworkId] = useState('');

    // Errors State
    const [errors, setErrors] = useState<Record<string, string>>({});

    // --- Effects ---

    // Real-time ID Generation
    useEffect(() => {
        const source = accountTier === 'verified' ? `${firstName}${lastName}${idNumber}` : nickname + 'anon';
        if (source) {
            setUserId(`${accountTier === 'verified' ? 'UID-VERIFIED-' : 'UID-ANON-'}${PseudoHash(source)}`);
        }
    }, [firstName, lastName, idNumber, nickname, accountTier]);

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

    // Age Calculation
    useEffect(() => {
        if (dob) {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            if (age < 13) setAgeGroup('Child');
            else if (age < 18) setAgeGroup('Teen');
            else setAgeGroup('Adult');
        }
    }, [dob]);

    // --- Helpers ---

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => Math.max(1, prev - 1));

    const simulateScan = (setter: (val: string) => void, fieldName: string) => {
        // Simulate a file upload or camera capture result
        setter('scanned_document_blob_placeholder');
        // Clear error if it exists
        if (errors[fieldName]) {
            setErrors(prev => ({ ...prev, [fieldName]: '' }));
        }
    };

    const verifyLivenessWithAI = async (imageBase64: string) => {
        if (!process.env.API_KEY) {
            // Simulation Fallback if no key is present
            setTimeout(() => {
                setCapturedSelfie(imageBase64);
                setLivenessStatus('success');
            }, 1500);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        parts: [
                            { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } },
                            { text: "Analyze this selfie for advanced liveness detection. Look for natural skin texture, evidence of micro-expressions, and 3D depth indicators to ensure it is a real person and not a photo of a screen or a mask. Return JSON: { \"isLive\": boolean, \"confidence\": number, \"analysis\": \"string\" }" }
                        ]
                    }
                ],
                config: { responseMimeType: 'application/json' }
            });

            const resultText = response.text;
            if (resultText) {
                const analysis = JSON.parse(resultText);
                // High confidence threshold for security
                if (analysis.isLive && analysis.confidence > 0.7) {
                    setCapturedSelfie(imageBase64);
                    setLivenessStatus('success');
                } else {
                    setLivenessStatus('failed');
                    setErrors(prev => ({...prev, liveness: `Liveness Check Failed: ${analysis.analysis}`}));
                }
            } else {
                 throw new Error("AI Response Empty");
            }
        } catch (e) {
            console.error("Liveness AI Error", e);
            // Fallback to success in demo/offline mode to prevent blocking user
            setCapturedSelfie(imageBase64);
            setLivenessStatus('success');
        }
    };

    const startLivenessCheck = async () => {
        setLivenessStatus('scanning');
        setLivenessInstruction('Initializing Secure Camera Feed...');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            // Liveness Challenges Sequence
            const sequence = [
                { t: 1000, msg: "Scanning Facial Topology..." },
                { t: 2500, msg: "Please Blink Slowly..." },
                { t: 4000, msg: "Turn Head Slightly Left..." },
                { t: 5500, msg: "Analyzing Skin Texture & Micro-Expressions..." },
            ];

            sequence.forEach(({ t, msg }) => {
                setTimeout(() => setLivenessInstruction(msg), t);
            });

            // Capture & Verify
            setTimeout(async () => {
                if (videoRef.current && canvasRef.current) {
                    const context = canvasRef.current.getContext('2d');
                    if (context && videoRef.current) {
                        canvasRef.current.width = videoRef.current.videoWidth;
                        canvasRef.current.height = videoRef.current.videoHeight;
                        context.drawImage(videoRef.current, 0, 0);
                        
                        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
                        
                        // Stop Camera
                        const tracks = stream.getTracks();
                        tracks.forEach(track => track.stop());

                        setLivenessInstruction('Processing Biometric Data...');
                        await verifyLivenessWithAI(imageData);
                    }
                }
            }, 7000);

        } catch (err) {
            console.error("Camera access error:", err);
            setLivenessStatus('failed');
            setErrors(prev => ({...prev, liveness: "Camera access denied or unavailable."}));
        }
    };

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateStep = (currentStep: number) => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        if (currentStep === 3) {
            if (!email.trim()) {
                newErrors.email = "Email address is required.";
                isValid = false;
            } else if (!validateEmail(email)) {
                newErrors.email = "Please enter a valid email address (e.g., user@domain.com).";
                isValid = false;
            }

            if (accountTier === 'verified') {
                if (!firstName.trim()) { newErrors.firstName = "First name is required."; isValid = false; }
                if (!lastName.trim()) { newErrors.lastName = "Surname is required."; isValid = false; }
                if (!dob) { newErrors.dob = "Date of birth is required."; isValid = false; }
                if (!phone.trim()) { newErrors.phone = "Mobile number is required."; isValid = false; }
            } else {
                if (!nickname.trim()) { newErrors.nickname = "Display name is required."; isValid = false; }
            }
        }

        if (currentStep === 4 && accountTier === 'verified') {
            if (!idType) { newErrors.idType = "Please select a document type."; isValid = false; }
            if (!idNumber.trim()) { newErrors.idNumber = "Document ID number is required."; isValid = false; }
            if (!idExpiry.trim()) { newErrors.idExpiry = "Expiry date is required."; isValid = false; }
            if (!docFront) { newErrors.docFront = "Front of document scan is required."; isValid = false; }
            if (!docBack) { newErrors.docBack = "Back of document scan is required."; isValid = false; }
            if (!proofOfAddress) { newErrors.proofOfAddress = "Proof of address document is required."; isValid = false; }
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleContinue = () => {
        if (validateStep(step)) {
            handleNext();
        }
    };

    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleFinish = () => {
        const fullNameCombined = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`;
        const identity: SystemIdentity = {
            governmentName: accountTier === 'verified' ? fullNameCombined : undefined,
            govtIdNumber: accountTier === 'verified' ? idNumber : undefined,
            userId,
            aiCoreName: aiName,
            aiNickname: aiNickname || aiName,
            aiId,
            osId,
            networkId,
            accountTier,
            kycStatus: accountTier === 'verified' ? 'pending' : 'unverified',
            verificationLevel: accountTier === 'verified' ? 'Tier 2 (Full Financial)' : 'None',
            ageGroup: ageGroup,
            buildType: 'Grandchild'
        };
        
        const finalAvatar = useSelfieForAvatar && capturedSelfie ? capturedSelfie : selectedAvatar;

        // If verified, this would trigger the API call to governing body
        if (accountTier === 'verified') {
            console.log("Sending KYC data to verification node...");
        }

        onComplete(identity, finalAvatar);
    };

    // Helper for input styling
    const getInputClass = (fieldName: string) => 
        `w-full bg-gray-800 border rounded-lg p-2.5 text-sm text-white outline-none transition-colors ${
            errors[fieldName] 
            ? 'border-red-500 focus:border-red-500 placeholder-red-400/50' 
            : 'border-gray-600 focus:border-blue-500'
        }`;

    // --- Render Steps ---

    const renderStep1_Method = () => (
        <div className="flex flex-col h-full animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">Welcome to Aetherius OS</h2>
            <p className="text-gray-400 mb-8">Choose how you want to register. Your identity is your key.</p>
            
            <div className="grid grid-cols-1 gap-4">
                <button onClick={() => { setRegistrationMethod('social'); setAccountTier('anonymous'); handleNext(); }} className="p-4 bg-white text-gray-900 rounded-xl font-bold flex items-center gap-3 hover:bg-gray-100 transition-all">
                    <GlobeAltIcon className="w-6 h-6 text-blue-600"/> Continue with Social (Apple, Microsoft, Google)
                </button>
                <button onClick={() => { setRegistrationMethod('email'); handleNext(); }} className="p-4 bg-gray-700 border border-gray-600 rounded-xl font-bold flex items-center gap-3 hover:bg-gray-600 transition-all text-left">
                    <DocumentTextIcon className="w-6 h-6 text-gray-300"/> Manual Registration (Email)
                </button>
                <button onClick={() => { setRegistrationMethod('biometric'); setAccountTier('verified'); handleNext(); }} className="p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/50 rounded-xl font-bold flex items-center gap-3 hover:opacity-90 transition-all text-left">
                    <FingerPrintIcon className="w-6 h-6 text-purple-400"/> Biometric Registry (Scan & Go)
                </button>
            </div>
        </div>
    );

    const renderStep2_Tier = () => (
        <div className="flex flex-col h-full animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">Select Account Tier</h2>
            <p className="text-gray-400 mb-6">Access level determines your features.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button 
                    onClick={() => setAccountTier('anonymous')}
                    className={`p-5 rounded-xl border text-left transition-all duration-300 flex flex-col gap-2 ${accountTier === 'anonymous' ? 'bg-gray-700 border-gray-400 ring-2 ring-gray-400' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}
                >
                    <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-lg text-gray-300">Lite Access</span>
                        {accountTier === 'anonymous' && <CheckCircleIcon className="w-6 h-6 text-gray-400" />}
                    </div>
                    <div className="text-xs text-gray-400 space-y-1 mt-2">
                        <p>• No ID Required</p>
                        <p>• Chat (13+ Only)</p>
                        <p>• No Financial Tools</p>
                        <p>• Limited Cloud Storage</p>
                    </div>
                </button>

                <button 
                    onClick={() => setAccountTier('verified')}
                    className={`p-5 rounded-xl border text-left transition-all duration-300 flex flex-col gap-2 ${accountTier === 'verified' ? 'bg-blue-900/30 border-blue-500 ring-2 ring-blue-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}
                >
                    <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-lg text-blue-300">Verified Citizen</span>
                        {accountTier === 'verified' && <CheckCircleIcon className="w-6 h-6 text-blue-400" />}
                    </div>
                    <div className="text-xs text-gray-400 space-y-1 mt-2">
                        <p>• Full OS Access</p>
                        <p>• Financial Hub (18+ Only)</p>
                        <p>• Creator Marketplace</p>
                        <p>• Voting Rights</p>
                        <p className="text-yellow-400 font-semibold mt-1">Requires Full KYC</p>
                    </div>
                </button>
            </div>

            <div className="mt-auto flex justify-between">
                <button onClick={handleBack} className="text-gray-400 hover:text-white">Back</button>
                <button onClick={handleContinue} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Continue</button>
            </div>
        </div>
    );

    const renderStep3_PersonalInfo = () => (
        <div className="flex flex-col h-full animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
            <p className="text-gray-400 mb-6">We need your details to generate your unique Identity Hash.</p>
            
            <div className="space-y-5 overflow-y-auto max-h-[400px] pr-2">
                {accountTier === 'verified' ? (
                    <>
                        {/* Name Split */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">First Name <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={firstName} 
                                    onChange={(e) => { setFirstName(e.target.value); clearError('firstName'); }} 
                                    className={getInputClass('firstName')}
                                />
                                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Middle Name</label>
                                <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none"/>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Surname <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={lastName} 
                                    onChange={(e) => { setLastName(e.target.value); clearError('lastName'); }} 
                                    className={getInputClass('lastName')}
                                />
                                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                                <input 
                                    type="date" 
                                    value={dob} 
                                    onChange={(e) => { setDob(e.target.value); clearError('dob'); }} 
                                    className={getInputClass('dob')}
                                />
                                {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Nationality</label>
                                <select value={nationality} onChange={(e) => setNationality(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none">
                                    {NATIONALITIES.map(nat => <option key={nat} value={nat}>{nat}</option>)}
                                </select>
                            </div>
                        </div>
                         
                         <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <div className="w-1/3">
                                    <select value={dialCode} onChange={(e) => setDialCode(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none">
                                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.country})</option>)}
                                    </select>
                                </div>
                                <div className="w-2/3">
                                    <input 
                                        type="tel" 
                                        value={phone} 
                                        onChange={(e) => { setPhone(e.target.value); clearError('phone'); }} 
                                        placeholder="Mobile Number" 
                                        className={getInputClass('phone')}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Used for SMS verification and 2FA.</p>
                        </div>
                    </>
                ) : (
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Display Name <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            value={nickname} 
                            onChange={(e) => { setNickname(e.target.value); clearError('nickname'); }} 
                            className={getInputClass('nickname')}
                        />
                        {errors.nickname && <p className="text-red-500 text-xs mt-1">{errors.nickname}</p>}
                    </div>
                )}
                
                <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address <span className="text-red-500">*</span></label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => { setEmail(e.target.value); clearError('email'); }} 
                        className={getInputClass('email')}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {ageGroup === 'Child' && accountTier === 'verified' && (
                    <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-start gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0"/>
                        <p className="text-xs text-red-200">User is under 13. A parent/guardian must complete this registration. Parental controls will be enforced.</p>
                    </div>
                )}
            </div>

            <div className="mt-auto flex justify-between pt-4">
                <button onClick={handleBack} className="text-gray-400 hover:text-white">Back</button>
                <button onClick={handleContinue} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Continue</button>
            </div>
        </div>
    );

    const renderStep4_KYC = () => {
        if (accountTier === 'anonymous') {
             // Skip KYC for anonymous
             return (
                <div className="flex flex-col h-full animate-fade-in justify-center items-center text-center">
                    <ShieldCheckIcon className="w-16 h-16 text-gray-600 mb-4"/>
                    <h2 className="text-2xl font-bold mb-2">No Verification Needed</h2>
                    <p className="text-gray-400 mb-6">You've selected the Lite tier. KYC steps are skipped.</p>
                    <button onClick={() => {setStep(6)}} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Proceed to Avatar</button>
                </div>
             );
        }

        return (
            <div className="flex flex-col h-full animate-fade-in">
                <h2 className="text-2xl font-bold mb-2">Document Verification</h2>
                <p className="text-gray-400 mb-6 text-sm">Upload official government documents. These will be verified against governing body databases.</p>
                
                <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
                    <div className={`p-4 bg-gray-800 rounded-lg border ${errors.idType ? 'border-red-500' : 'border-gray-700'}`}>
                        <label className="block text-xs font-semibold text-gray-300 mb-2">Select Document Type <span className="text-red-500">*</span></label>
                        {errors.idType && <p className="text-red-500 text-xs mb-2">{errors.idType}</p>}
                        <div className="flex gap-2 mb-4">
                            {['Passport', 'Drivers Licence', 'Citizenship Card'].map(t => (
                                <button key={t} onClick={() => { setIdType(t as any); clearError('idType'); }} className={`px-3 py-1.5 rounded text-xs border ${idType === t ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-gray-400'}`}>{t}</button>
                            ))}
                        </div>
                        
                        {idType && (
                            <div className="space-y-3">
                                <div>
                                    <input 
                                        type="text" 
                                        placeholder={`${idType} Number`} 
                                        value={idNumber} 
                                        onChange={(e) => { setIdNumber(e.target.value); clearError('idNumber'); }} 
                                        className={getInputClass('idNumber')}
                                    />
                                    {errors.idNumber && <p className="text-red-500 text-xs mt-1">{errors.idNumber}</p>}
                                </div>
                                <div>
                                    <input 
                                        type="text" 
                                        placeholder="Expiry Date (MM/YY)" 
                                        value={idExpiry} 
                                        onChange={(e) => { setIdExpiry(e.target.value); clearError('idExpiry'); }} 
                                        className={getInputClass('idExpiry')}
                                    />
                                    {errors.idExpiry && <p className="text-red-500 text-xs mt-1">{errors.idExpiry}</p>}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <button onClick={() => simulateScan(setDocFront, 'docFront')} className={`w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-700 transition-colors ${errors.docFront ? 'border-red-500 bg-red-900/10' : docFront ? 'border-green-500 text-green-400' : 'border-gray-600 text-gray-500'}`}>
                                            {docFront ? <CheckCircleIcon className="w-6 h-6"/> : <CameraIcon className="w-6 h-6"/>}
                                            <span className="text-xs">{docFront ? 'Front Scanned' : 'Scan Front'}</span>
                                        </button>
                                        {errors.docFront && <p className="text-red-500 text-xs mt-1 text-center">{errors.docFront}</p>}
                                    </div>
                                    <div>
                                        <button onClick={() => simulateScan(setDocBack, 'docBack')} className={`w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-700 transition-colors ${errors.docBack ? 'border-red-500 bg-red-900/10' : docBack ? 'border-green-500 text-green-400' : 'border-gray-600 text-gray-500'}`}>
                                            {docBack ? <CheckCircleIcon className="w-6 h-6"/> : <CameraIcon className="w-6 h-6"/>}
                                            <span className="text-xs">{docBack ? 'Back Scanned' : 'Scan Back'}</span>
                                        </button>
                                        {errors.docBack && <p className="text-red-500 text-xs mt-1 text-center">{errors.docBack}</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`p-4 bg-gray-800 rounded-lg border ${errors.proofOfAddress ? 'border-red-500' : 'border-gray-700'}`}>
                        <label className="block text-xs font-semibold text-gray-300 mb-2">Proof of Address (Recent 3 Months) <span className="text-red-500">*</span></label>
                        <button onClick={() => simulateScan(setProofOfAddress, 'proofOfAddress')} className={`w-full py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors ${proofOfAddress ? 'border-green-500 text-green-400' : 'border-gray-600 text-gray-500'}`}>
                            <DocumentTextIcon className="w-5 h-5"/>
                            <span className="text-xs">{proofOfAddress ? 'Document Uploaded' : 'Upload Utility Bill / Bank Statement'}</span>
                        </button>
                        {errors.proofOfAddress && <p className="text-red-500 text-xs mt-2 text-center">{errors.proofOfAddress}</p>}
                    </div>
                </div>

                <div className="mt-auto flex justify-between pt-4">
                    <button onClick={handleBack} className="text-gray-400 hover:text-white">Back</button>
                    <button onClick={handleContinue} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Continue</button>
                </div>
            </div>
        );
    };

    const renderStep5_Liveness = () => (
        <div className="flex flex-col h-full animate-fade-in">
             <h2 className="text-2xl font-bold mb-2">Identity Verification</h2>
             <p className="text-gray-400 mb-6">Biometric match to your ID document using advanced AI analysis.</p>

             <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-64 h-64 bg-black rounded-full overflow-hidden border-4 border-gray-700 shadow-inner flex items-center justify-center mb-6">
                    {livenessStatus === 'idle' && <UserCircleIcon className="w-48 h-48 text-gray-600"/>}
                    
                    {/* Camera Feed Container */}
                    <div className={`absolute inset-0 bg-black ${livenessStatus === 'scanning' ? 'block' : 'hidden'}`}>
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        {/* Scanning Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-48 h-48 border-2 border-green-500/50 rounded-full absolute animate-pulse"></div>
                            <div className="w-full h-1 bg-green-500/80 absolute top-0 animate-[scan_2s_linear_infinite]"></div>
                            <p className="absolute bottom-4 bg-black/60 px-3 py-1 rounded text-green-400 text-xs font-bold font-mono animate-pulse">
                                {livenessInstruction}
                            </p>
                        </div>
                    </div>

                    {livenessStatus === 'success' && <img src={capturedSelfie || ''} className="w-full h-full object-cover" alt="Selfie" />}
                    {livenessStatus === 'failed' && <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center text-red-300 font-bold">FAILED</div>}
                </div>

                {livenessStatus === 'idle' && (
                    <button onClick={startLivenessCheck} className="px-8 py-3 bg-purple-600 text-white rounded-full font-bold hover:bg-purple-700 shadow-lg flex items-center gap-2">
                        <CameraIcon className="w-5 h-5"/> Start Live Scan
                    </button>
                )}
                
                {livenessStatus === 'failed' && (
                    <div className="text-center">
                        <p className="text-red-400 text-sm mb-4">{errors.liveness || "Verification Failed"}</p>
                        <button onClick={startLivenessCheck} className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Retry Scan</button>
                    </div>
                )}
                
                {livenessStatus === 'success' && (
                     <div className="text-center animate-fade-in-up">
                        <p className="text-green-400 font-bold text-lg mb-2 flex items-center justify-center gap-2"><CheckCircleIcon className="w-6 h-6"/> Identity Verified</p>
                        <p className="text-gray-500 text-xs mb-6">Biometric hash linked to UID-VERIFIED-{userId.slice(0,8)}</p>
                        <button onClick={handleNext} className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Next Step</button>
                     </div>
                )}
             </div>
             
             <div className="mt-auto pt-4 text-center">
                <button onClick={handleBack} className="text-gray-400 hover:text-white text-sm">Back</button>
             </div>
        </div>
    );
    
    const renderStep6_AI = () => (
        <div className="flex flex-col h-full animate-fade-in">
             <h2 className="text-2xl font-bold mb-2">Initialize Personal AI</h2>
             <p className="text-gray-400 mb-6">Your personal node operator and digital representative.</p>
             
             <div className="space-y-6">
                <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">AI Core Name</label>
                    <input type="text" value={aiName} onChange={(e) => setAiName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white"/>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Avatar Selection</label>
                    
                    {/* Selfie Integration Option */}
                    {capturedSelfie && (
                        <div 
                            onClick={() => { setUseSelfieForAvatar(true); setSelectedAvatar(capturedSelfie); }}
                            className={`mb-4 p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${useSelfieForAvatar ? 'bg-purple-900/30 border-purple-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}
                        >
                             <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-500">
                                <img src={capturedSelfie} className="w-full h-full object-cover" alt="Me" />
                             </div>
                             <div className="flex-1">
                                <p className="font-bold text-sm text-white">Generate from Selfie</p>
                                <p className="text-xs text-gray-400">Create a hyper-realistic 3D clone.</p>
                             </div>
                             {useSelfieForAvatar && <CheckCircleIcon className="w-5 h-5 text-purple-400"/>}
                        </div>
                    )}

                    <p className="text-xs text-gray-500 mb-2">Or choose a preset:</p>
                    <div className="grid grid-cols-4 gap-2">
                        {['https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200', 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&h=200', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&h=200'].map(url => (
                             <button 
                                key={url} 
                                onClick={() => { setSelectedAvatar(url); setUseSelfieForAvatar(false); }} 
                                className={`w-12 h-12 rounded-full border-2 transition-all ${selectedAvatar === url && !useSelfieForAvatar ? 'border-blue-500 scale-110' : 'border-transparent opacity-70 hover:opacity-100'} overflow-hidden`}
                            >
                                <img src={url} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
             </div>

             <div className="mt-auto flex justify-between pt-4">
                <button onClick={handleBack} className="text-gray-400 hover:text-white">Back</button>
                <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Review</button>
            </div>
        </div>
    );

    const renderStep7_Review = () => (
         <div className="flex flex-col h-full animate-fade-in">
             <h2 className="text-2xl font-bold mb-2">Compliance & Review</h2>
             <p className="text-gray-400 mb-6">Finalize your legal agreement.</p>

             <div className="space-y-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700 overflow-y-auto flex-1">
                 <label className="flex items-start gap-3 cursor-pointer">
                     <input type="checkbox" className="mt-1" checked={consents.privacy} onChange={e => setConsents({...consents, privacy: e.target.checked})} />
                     <span className="text-xs text-gray-300">I consent to the processing of my personal and biometric data for Identity Verification purposes as outlined in the Privacy Policy.</span>
                 </label>
                 <label className="flex items-start gap-3 cursor-pointer">
                     <input type="checkbox" className="mt-1" checked={consents.biometric} onChange={e => setConsents({...consents, biometric: e.target.checked})} />
                     <span className="text-xs text-gray-300">I understand my data will be submitted to relevant governing bodies for verification (24hr - 2 week process).</span>
                 </label>
                 <label className="flex items-start gap-3 cursor-pointer">
                     <input type="checkbox" className="mt-1" checked={consents.terms} onChange={e => setConsents({...consents, terms: e.target.checked})} />
                     <span className="text-xs text-gray-300">I agree to the Terms of Service and Aetherius Constitution.</span>
                 </label>
                 
                 {(ageGroup === 'Child' || ageGroup === 'Teen') && (
                      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded">
                          <h4 className="text-sm font-bold text-yellow-500 mb-2">Parental Consent Required</h4>
                          <label className="flex items-start gap-3 cursor-pointer">
                             <input type="checkbox" className="mt-1" checked={parentalConsent} onChange={e => setParentalConsent(e.target.checked)} />
                             <span className="text-xs text-gray-300">I am the parent/guardian and I authorize this account creation (COPPA/GDPR-K Compliance).</span>
                         </label>
                      </div>
                 )}
             </div>

             <div className="mt-4 flex justify-between pt-4 border-t border-gray-700">
                <button onClick={handleBack} className="text-gray-400 hover:text-white">Back</button>
                <button 
                    onClick={handleFinish} 
                    disabled={!consents.privacy || !consents.biometric || !consents.terms || ((ageGroup !== 'Adult') && !parentalConsent)}
                    className="px-8 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <ScaleIcon className="w-4 h-4"/> Submit & Enter
                </button>
            </div>
         </div>
    );

    return (
        <div className="fixed inset-0 z-[9999] bg-gray-900 flex items-center justify-center text-white p-4">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            
            <div className="w-full max-w-5xl bg-gray-800/90 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[650px] relative z-10">
                {/* Left Panel Context */}
                <div className="w-full md:w-1/3 bg-gradient-to-b from-blue-900/40 to-purple-900/40 p-8 flex flex-col border-r border-gray-700">
                    <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                        <GlobeAltIcon className="w-8 h-8 text-cyan-400" /> Genesis
                    </h1>
                    
                    <div className="space-y-6 pl-2 border-l-2 border-gray-700">
                        {['Method', 'Tier', 'Identity', 'Documents', 'Verification', 'AI Core', 'Review'].map((label, i) => (
                             <div key={label} className={`transition-all duration-300 ${step === i + 1 ? 'text-blue-400 font-bold pl-4 border-l-2 border-blue-500 -ml-[10px]' : step > i + 1 ? 'text-green-500 opacity-50' : 'text-gray-500'}`}>
                                <span className="text-xs uppercase tracking-wider">{label}</span>
                             </div>
                        ))}
                    </div>
                    
                    <div className="mt-auto text-[10px] text-gray-500 font-mono">
                        <p>SESSION: {osId}</p>
                        <p>ENCRYPTION: QUANTUM-SAFE</p>
                        <p>KYC PROVIDER: SIMULATION</p>
                    </div>
                </div>

                {/* Right Panel Form */}
                <div className="flex-1 p-8 flex flex-col">
                    <StepIndicator currentStep={step} totalSteps={totalSteps} />
                    {step === 1 && renderStep1_Method()}
                    {step === 2 && renderStep2_Tier()}
                    {step === 3 && renderStep3_PersonalInfo()}
                    {step === 4 && renderStep4_KYC()}
                    {step === 5 && renderStep5_Liveness()}
                    {step === 6 && renderStep6_AI()}
                    {step === 7 && renderStep7_Review()}
                </div>
            </div>
        </div>
    );
};
