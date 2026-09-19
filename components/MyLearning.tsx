import React, { useState } from 'react';
import { courses, enrolledCourses, achievements } from '../data';
import { Course, LearningPath } from '../types';
import { AcademicCapIcon, LightBulbIcon, TrophyIcon } from './Icons';
import { GoogleGenAI, Type } from '@google/genai';

interface MyLearningProps {
    onSetView: (view: string, context?: any) => void;
}

const CourseProgressCard: React.FC<{ course: Course, progress: number, onSetView: Function }> = ({ course, progress, onSetView }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-4">
        <img src={course.imageUrl} alt={course.title} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
        <div className="flex-grow">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">{course.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">by {course.instructor}</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{progress}% complete</p>
        </div>
        <button onClick={() => onSetView('courseDetail', {courseId: course.id})} className="px-4 py-2 text-sm font-semibold text-white bg-gray-800 dark:bg-blue-600 rounded-md hover:bg-gray-700 dark:hover:bg-blue-500 transition-colors">
            Continue
        </button>
    </div>
);

export const MyLearning: React.FC<MyLearningProps> = ({ onSetView }) => {
    
    const userCourses = enrolledCourses.map(enrolled => {
        const courseDetails = courses.find(c => c.id === enrolled.courseId);
        return { ...courseDetails, progress: enrolled.progress };
    }).filter(c => c.id);

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Learning</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Your personal dashboard for tracking course progress and achievements.</p>
            </header>

            <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Enrolled Courses</h2>
                    <div className="space-y-4">
                        {userCourses.map(course => (
                            <CourseProgressCard key={course.id} course={course as Course} progress={course.progress} onSetView={onSetView} />
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">My Certificates</h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
                        <AcademicCapIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600"/>
                        <h3 className="mt-2 font-semibold">No Certificates Yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Complete a course to earn your first certificate!</p>
                         <button onClick={() => onSetView('courses')} className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                            Explore Courses
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- NEW COMPONENTS ---

export const LearningAssistant: React.FC<{ onSetView: (view: string, context?: any) => void; }> = ({ onSetView }) => {
    const [goal, setGoal] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
    const [error, setError] = useState('');

    const handleGeneratePath = async () => {
        if (!goal.trim()) return;
        setIsLoading(true);
        setError('');
        setLearningPath(null);

        if (!process.env.API_KEY) {
            setError('API key is not configured.');
            setIsLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const courseCatalog = JSON.stringify(courses.map(({ id, title, description, category }) => ({ id, title, description, category })));
            const prompt = `You are an AI Learning Advisor for Aetherius OS. The user wants to achieve the following goal: "${goal}". Based on this goal, analyze the following course catalog and generate a personalized learning path. The path should be a sequence of courses. For each course, provide a short, one-sentence rationale explaining why it's a necessary step towards the user's goal. Also suggest complementary skills. Here is the course catalog in JSON format: ${courseCatalog}. Respond with ONLY a valid JSON object.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            steps: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        courseId: { type: Type.NUMBER },
                                        rationale: { type: Type.STRING },
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const responseJson = JSON.parse(response.text);
            setLearningPath(responseJson);

        } catch (e: any) {
            console.error(e);
            setError(`An error occurred: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6 max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <LightBulbIcon className="w-8 h-8"/> AI Learning Assistant
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Enter your goal and let our AI build a custom learning path for you.</p>
            </header>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <label htmlFor="learning-goal" className="block text-lg font-semibold mb-2">What do you want to learn?</label>
                    <textarea 
                        id="learning-goal"
                        rows={3}
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g., 'Become a full-stack web developer' or 'Launch my own online store'"
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button onClick={handleGeneratePath} disabled={isLoading || !goal.trim()} className="mt-4 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                        {isLoading ? 'Generating Your Path...' : 'Generate Path'}
                    </button>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
                {learningPath && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold mb-2">{learningPath.title}</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{learningPath.description}</p>
                        <div className="space-y-4">
                            {learningPath.steps.map((step, index) => {
                                const course = courses.find(c => c.id === step.courseId);
                                if (!course) return null;
                                return (
                                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="text-2xl font-bold text-gray-300 dark:text-gray-600">{index + 1}</div>
                                            <img src={course.imageUrl} alt={course.title} className="w-16 h-16 object-cover rounded-md" />
                                            <div className="flex-1">
                                                <h3 className="font-bold">{course.title}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">"{step.rationale}"</p>
                                            </div>
                                            <button onClick={() => onSetView('courseDetail', { courseId: course.id })} className="px-3 py-1.5 text-sm font-semibold text-white bg-gray-800 dark:bg-blue-600 rounded-md hover:bg-gray-700 dark:hover:bg-blue-500">View</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const Achievements: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
             <header className="mb-6 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <TrophyIcon className="w-8 h-8"/> My Achievements
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">A verifiable record of your completed courses, stored on the blockchain.</p>
            </header>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                {achievements.map(ach => (
                    <div key={ach.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center">
                                <TrophyIcon className="w-7 h-7 text-yellow-500"/>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">{ach.courseTitle}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Completed on: {ach.completionDate}</p>
                            </div>
                        </div>
                        <div className="mt-4 text-xs font-mono bg-gray-100 dark:bg-gray-700/50 p-2 rounded-md">
                            <p className="font-semibold">Blockchain Transaction ID:</p>
                            <p className="text-gray-500 dark:text-gray-400 truncate">{ach.transactionId}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
