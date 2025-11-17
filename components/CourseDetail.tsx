import React, { useState } from 'react';
import { courses, enrolledCourses, achievements } from '../data';
import { Course } from '../types';
import { StarIcon, UserCircleIcon, PlayIcon, DocumentTextIcon, LockClosedIcon, ChatBubbleOvalLeftEllipsisIcon, LightBulbIcon, TrophyIcon, CheckCircleIcon } from './Icons';
import { GoogleGenAI } from '@google/genai';

interface CourseDetailProps {
    context: { courseId: number };
    onSetView: (view: string, context?: any) => void;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({ context, onSetView }) => {
    const { courseId } = context;
    const course = courses.find(c => c.id === courseId);
    const [activeTab, setActiveTab] = useState('overview');
    const [hint, setHint] = useState<{ [lessonId: string]: string | null }>({});
    const [isLoadingHint, setIsLoadingHint] = useState<string | null>(null);
    
    const enrollment = enrolledCourses.find(e => e.courseId === courseId);
    const progress = enrollment ? enrollment.progress : 0;
    const isCompleted = progress === 100;

    const isClaimed = achievements.some(ach => ach.courseTitle === course?.title);
    const [claimed, setClaimed] = useState(isClaimed);

    const handleGetHint = async (lessonTitle: string, lessonId: string) => {
        setIsLoadingHint(lessonId);
        setHint(prev => ({ ...prev, [lessonId]: 'Thinking...' }));

        if (!process.env.API_KEY) {
            setHint(prev => ({ ...prev, [lessonId]: 'Error: API key not set.' }));
            setIsLoadingHint(null);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `The user is studying a lesson titled "${lessonTitle}" and has requested a hint. Provide a concise, helpful hint that guides them toward understanding the key concept without giving away the direct answer or solution. The hint should be encouraging.`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setHint(prev => ({ ...prev, [lessonId]: response.text }));
        } catch (error) {
            console.error(error);
            setHint(prev => ({ ...prev, [lessonId]: 'Sorry, I couldn\'t fetch a hint right now.' }));
        } finally {
            setIsLoadingHint(null);
        }
    };

    const handleClaimCertificate = () => {
        if (!course) return;
        const newAchievement = {
            id: `achieve-${Date.now()}`,
            courseTitle: course.title,
            completionDate: new Date().toISOString().split('T')[0],
            transactionId: `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
            certificateUrl: 'https://i.imgur.com/example-cert.png',
        };
        // In a real app, this would be a state update. For this demo, we can push to the imported array.
        achievements.push(newAchievement);
        setClaimed(true);
        alert(`Achievement for "${course.title}" recorded on the blockchain!`);
    };

    if (!course) {
        return (
            <div className="flex items-center justify-center h-full text-center">
                <div>
                    <h1 className="text-xl font-bold">Course not found</h1>
                    <button onClick={() => onSetView('courses')} className="mt-4 text-blue-500 hover:underline">Back to Catalog</button>
                </div>
            </div>
        );
    }
    
    const renderContent = () => {
        switch (activeTab) {
            case 'curriculum':
                return (
                    <div className="space-y-4">
                        {course.modules.map((module, index) => (
                            <div key={module.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <h3 className="font-bold p-4 border-b border-gray-200 dark:border-gray-700">Module {index + 1}: {module.title}</h3>
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {module.lessons.map(lesson => (
                                        <li key={lesson.id} className="p-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    {lesson.type === 'video' ? <PlayIcon className="w-5 h-5 text-gray-500"/> : <DocumentTextIcon className="w-5 h-5 text-gray-500"/>}
                                                    <span className="text-sm">{lesson.title}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                                    <span>{lesson.duration}</span>
                                                    <button 
                                                        onClick={() => handleGetHint(lesson.title, lesson.id)} 
                                                        disabled={!!isLoadingHint}
                                                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                                        title="Get a hint"
                                                    >
                                                        <LightBulbIcon className="w-5 h-5 text-yellow-500"/>
                                                    </button>
                                                    <LockClosedIcon className="w-4 h-4 text-gray-400"/>
                                                </div>
                                            </div>
                                            {hint[lesson.id] && (
                                                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 text-sm text-yellow-800 dark:text-yellow-200">
                                                    <strong>Hint:</strong> {hint[lesson.id]}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                );
            case 'reviews':
                 return (
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <UserCircleIcon className="w-12 h-12 text-gray-400"/>
                            <div>
                                <p className="font-semibold">Jennifer</p>
                                <div className="flex items-center"><StarIcon solid className="w-4 h-4 text-yellow-400" /><StarIcon solid className="w-4 h-4 text-yellow-400" /><StarIcon solid className="w-4 h-4 text-yellow-400" /><StarIcon solid className="w-4 h-4 text-yellow-400" /><StarIcon className="w-4 h-4 text-gray-300" /></div>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">A fantastic introduction to the topic. The instructor was clear and concise. Highly recommended for beginners!</p>
                            </div>
                        </div>
                    </div>
                 );
            case 'chat':
                return (
                    <div className="text-center py-10">
                        <ChatBubbleOvalLeftEllipsisIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                        <h3 className="mt-2 text-lg font-semibold">Course Chat Room</h3>
                        <p className="text-sm text-gray-500">This feature is coming soon.</p>
                    </div>
                );
            case 'overview':
            default:
                 return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold mb-2">About this course</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{course.longDescription}</p>
                        </div>
                        <div>
                             <h3 className="text-xl font-bold mb-2">What you'll learn</h3>
                             <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                {course.whatYoullLearn.map(point => (
                                    <li key={point} className="flex items-start gap-2 text-sm">
                                        <span className="text-green-500 mt-1">&#10003;</span>
                                        <span>{point}</span>
                                    </li>
                                ))}
                             </ul>
                        </div>
                    </div>
                 );
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-gray-100 dark:bg-gray-900 animate-fade-in">
            {/* Header */}
            <header className="bg-gray-800 dark:bg-black text-white p-6 md:p-8">
                <div className="max-w-5xl mx-auto">
                    <button onClick={() => onSetView('courses', {})} className="text-sm opacity-80 hover:opacity-100 mb-4">&larr; Back to Catalog</button>
                    <h1 className="text-3xl font-bold">{course.title}</h1>
                    <p className="mt-2 text-lg opacity-90">{course.description}</p>
                    <div className="flex items-center mt-3 text-sm">
                        <span className="font-bold text-yellow-400 mr-1">{course.rating}</span>
                        <div className="flex">
                            {[...Array(5)].map((_, i) => <StarIcon key={i} solid className={`w-4 h-4 ${i < Math.round(course.rating) ? 'text-yellow-400' : 'text-gray-300'}`} />)}
                        </div>
                        <span className="ml-2 opacity-80">({course.students.toLocaleString()} students)</span>
                    </div>
                    <p className="mt-2 text-sm opacity-80">Created by {course.instructor}</p>
                </div>
            </header>
            
            {/* Main content & sidebar */}
            <div className="max-w-5xl mx-auto py-6 md:py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <main className="md:col-span-2">
                    {/* Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                        <nav className="flex space-x-4">
                            {['overview', 'curriculum', 'reviews', 'chat'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-2 text-sm font-semibold capitalize border-b-2 ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>
                    {renderContent()}
                </main>

                <aside className="md:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <img src={course.imageUrl} alt={course.title} className="w-full h-40 object-cover" />
                        <div className="p-4">
                            <p className="text-3xl font-bold mb-4">${course.price}</p>
                            {isCompleted ? (
                                claimed ? (
                                    <div className="flex items-center justify-center gap-2 p-3 bg-green-100 dark:bg-green-900/50 rounded-md text-green-700 dark:text-green-300 font-semibold">
                                        <CheckCircleIcon className="w-5 h-5"/>
                                        Certificate Claimed
                                    </div>
                                ) : (
                                    <button onClick={handleClaimCertificate} className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white font-semibold py-3 rounded-md hover:bg-yellow-600 transition-colors">
                                        <TrophyIcon className="w-5 h-5" />
                                        Claim Certificate
                                    </button>
                                )
                            ) : (
                                <button className="w-full bg-blue-600 text-white font-semibold py-3 rounded-md hover:bg-blue-700 transition-colors">Enroll Now</button>
                            )}

                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-4">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">{progress}% complete</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
