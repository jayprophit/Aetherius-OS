import React, { useState } from 'react';
import { BeakerIcon, PlusIcon } from './Icons';
import { TrainingDataSample } from '../types';

const initialIntents = ['support_request', 'code_help', 'user_management', 'communication', 'analysis'];

const generateSample = (intent: string): TrainingDataSample => {
    let input = '', output = '';
    const id = `data-${Date.now()}-${Math.random()}`;
    switch (intent) {
        case 'support_request':
            input = `I need help with login issues.`;
            output = `I can assist with login issues. What specific problem are you facing?`;
            break;
        case 'code_help':
            input = `Can you generate Python code for a simple web server?`;
            output = `Certainly. Here is a basic web server using Python's http.server library...`;
            break;
        case 'user_management':
            input = `Please unblock user 'testuser123'.`;
            output = `Executing user unblock command for 'testuser123'.`;
            break;
        default:
            input = `Tell me about ${intent}.`;
            output = `Here is some information about ${intent}.`;
    }
    return { id, input, output, intent };
};

const initialData: TrainingDataSample[] = [
    generateSample('support_request'),
    generateSample('code_help'),
    generateSample('user_management'),
];

export const TrainingDataHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState('view');
    const [dataset, setDataset] = useState<TrainingDataSample[]>(initialData);
    const [selectedIntent, setSelectedIntent] = useState(initialIntents[0]);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingLog, setTrainingLog] = useState<string[]>([]);
    const [trainingProgress, setTrainingProgress] = useState(0);

    const handleGenerate = () => {
        const newSample = generateSample(selectedIntent);
        setDataset(prev => [newSample, ...prev]);
    };

    const handleStartTraining = () => {
        setIsTraining(true);
        setTrainingProgress(0);
        setTrainingLog(['[INFO] Starting training process...']);
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setTrainingProgress(progress);
            
            if (progress % 20 === 0) {
                setTrainingLog(prev => [...prev, `[EPOCH ${progress/20}/5] Loss: ${0.5 - (progress/100 * 0.4)}`]);
            }
            
            if (progress >= 100) {
                clearInterval(interval);
                setIsTraining(false);
                 setTrainingLog(prev => [...prev, '[SUCCESS] Model training complete. New version deployed.']);
            }
        }, 500);
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'generate':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Select Intent</label>
                            <select
                                value={selectedIntent}
                                onChange={e => setSelectedIntent(e.target.value)}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                            >
                                {initialIntents.map(intent => <option key={intent} value={intent}>{intent.replace(/_/g, ' ').toUpperCase()}</option>)}
                            </select>
                        </div>
                        <button onClick={handleGenerate} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700">
                            <PlusIcon className="w-5 h-5"/> Generate Sample Pair
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Generates a synthetic input/output pair for the selected intent and adds it to the dataset.</p>
                    </div>
                );
            case 'train':
                return (
                    <div className="space-y-4">
                        <button onClick={handleStartTraining} disabled={isTraining} className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                            {isTraining ? 'Training In Progress...' : 'Start Training Model'}
                        </button>
                        {isTraining && (
                            <div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${trainingProgress}%` }}></div>
                                </div>
                                 <p className="text-xs text-right mt-1">{trainingProgress}%</p>
                            </div>
                        )}
                        <div className="h-64 bg-black text-white font-mono text-xs p-3 rounded-md overflow-y-auto">
                            {trainingLog.map((line, i) => <p key={i}>{`> ${line}`}</p>)}
                        </div>
                    </div>
                );
            case 'view':
            default:
                return (
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase">
                                <tr>
                                    <th className="p-3">Intent</th>
                                    <th className="p-3">User Input (Prompt)</th>
                                    <th className="p-3">AI Output (Completion)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {dataset.map(sample => (
                                    <tr key={sample.id}>
                                        <td className="p-3 font-mono text-purple-600 dark:text-purple-400">{sample.intent}</td>
                                        <td className="p-3">{sample.input}</td>
                                        <td className="p-3">{sample.output}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
        }
    };
    
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <BeakerIcon className="w-8 h-8"/> AI Training Data Hub
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and generate training data for the Aetherius AI models.</p>
            </header>

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                        <nav className="flex space-x-4">
                             {['view', 'generate', 'train'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-2 text-sm font-semibold capitalize border-b-2 ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    {tab.replace('_', ' ')}
                                </button>
                             ))}
                        </nav>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
