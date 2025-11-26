import React, { useState, useRef } from 'react';
import { AcademicCapIcon, CameraIcon } from '../Icons';
import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';
import { healthAndWellnessData } from '../../healthData';

const RecipeCard: React.FC<{ title: string, description: string, ingredients: string[], instructions: string }> = ({ title, description, ingredients, instructions }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-bold text-lg text-green-700 dark:text-green-400">{title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h5 className="font-semibold mb-2">Ingredients</h5>
                <ul className="list-disc list-inside text-sm space-y-1">
                    {ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                </ul>
            </div>
            <div>
                <h5 className="font-semibold mb-2">Instructions</h5>
                <p className="text-sm">{instructions}</p>
            </div>
        </div>
    </div>
);

const DirtyItem: React.FC<{ title: string, description: string }> = ({ title, description }) => (
    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-900/30">
        <h4 className="font-bold text-lg text-red-700 dark:text-red-400">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{description}</p>
    </div>
);

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
}

const { cleanRecipes, dirtyFoods } = healthAndWellnessData.nutrition;

export const NutritionGuide: React.FC = () => {
    const [activeTab, setActiveTab] = useState('clean');
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageSrc(reader.result as string);
        };
        reader.readAsDataURL(file);

        await analyzeImage(file);
    };
    
    const analyzeImage = async (file: File) => {
        setIsAnalyzing(true);
        setAnalysisResult(null);
        setError('');

        if (!process.env.API_KEY) {
            setError('API key is not configured.');
            setIsAnalyzing(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const imagePart = await fileToGenerativePart(file);
            const prompt = `You are a nutrition expert and chef. Analyze this image of food. Provide the following in your response, formatted in Markdown: 1. A list of 2-3 suggested recipes using these ingredients. 2. A step-by-step cooking guide for one of the recipes. 3. A detailed nutritional breakdown including pros, cons, and a table with key data (Calories, Protein, Fat, Carbs, key Vitamins/Minerals).`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-flash-latest',
                contents: { parts: [imagePart, { text: prompt }] },
            });

            setAnalysisResult(response.text);

        } catch (e: any) {
            console.error(e);
            if (e.status === 429 || e.message?.includes('429') || e.error?.code === 429) {
                setError("Error: API Quota Exceeded. Please check your billing plan.");
            } else {
                setError(`An error occurred: ${e.message}`);
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const renderContent = () => {
        if (activeTab === 'dirty') {
            return (
                <div className="space-y-4">
                    {dirtyFoods.map(item => <DirtyItem key={item.title} {...item} />)}
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <p className="mb-4 text-gray-600 dark:text-gray-300">Focus on natural, unprocessed, non-GMO foods. Super alkaline foods can help balance the body's pH levels.</p>
                {cleanRecipes.map(recipe => <RecipeCard key={recipe.title} {...recipe} />)}
            </div>
        );
    }
    
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <AcademicCapIcon className="w-8 h-8" />
                    Nutrition Guide
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Information on clean eating, recipes, and foods to be mindful of.</p>
            </header>

            <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-4">Analyze Your Food</h2>
                    <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <CameraIcon className="w-6 h-6"/>
                        Scan Food with Camera
                    </button>
                    {imageSrc && (
                        <div className="mt-4">
                            <img src={imageSrc} alt="Food to analyze" className="w-full max-w-sm mx-auto rounded-lg shadow-md" />
                        </div>
                    )}
                    {isAnalyzing && (
                        <div className="mt-4 text-center">
                            <p className="font-semibold animate-pulse">Analyzing...</p>
                        </div>
                    )}
                    {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
                    {analysisResult && (
                         <div className="mt-6 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(analysisResult) as string }} />
                    )}
                </div>

                <div>
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                        <nav className="flex space-x-4">
                            <button 
                                onClick={() => setActiveTab('clean')}
                                className={`px-3 py-2 text-sm font-semibold border-b-2 ${activeTab === 'clean' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Clean Eating & Recipes
                            </button>
                             <button 
                                onClick={() => setActiveTab('dirty')}
                                className={`px-3 py-2 text-sm font-semibold border-b-2 ${activeTab === 'dirty' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                               Foods to Limit
                            </button>
                        </nav>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};