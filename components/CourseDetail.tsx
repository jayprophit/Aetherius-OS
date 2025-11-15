import React, { useState } from 'react';
import { courses } from '../data';
import { Course } from '../types';
import { StarIcon, UserCircleIcon, PlayIcon, DocumentTextIcon, LockClosedIcon, ChatBubbleOvalLeftEllipsisIcon } from './Icons';

interface CourseDetailProps {
    courseId: number;
    onSetView: (view: string) => void;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({ courseId, onSetView }) => {
    const course = courses.find(c => c.id === courseId);
    const [activeTab, setActiveTab] = useState('overview');

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
                                        <li key={lesson.id} className="p-4 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                {lesson.type === 'video' ? <PlayIcon className="w-5 h-5 text-gray-500"/> : <DocumentTextIcon className="w-5 h-5 text-gray-500"/>}
                                                <span className="text-sm">{lesson.title}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <span>{lesson.duration}</span>
                                                <LockClosedIcon className="w-4 h-4 text-gray-400"/>
                                            </div>
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
                    <button onClick={() => onSetView('courses')} className="text-sm opacity-80 hover:opacity-100 mb-4">&larr; Back to Catalog</button>
                    <h1 className="text-3xl font-bold">{course.title}</h1>
                    <p className="mt-2 text-lg opacity-90">{course.description}</p>
                    <div className="flex items-center mt-3 text-sm">
                        <span className="font-bold text-yellow-400 mr-1">{course.rating}</span>
                        <div className="flex">
                            {[...Array(5)].map((_, i) => <StarIcon key={i} solid className={`w-4 h-4 ${i < Math.round(course.rating) ? 'text-yellow-400' : 'text-gray-300/50'}`} />)}
                        </div>
                        <span className="ml-2 opacity-80">({course.students.toLocaleString()} students)</span>
                        <span className="ml-4 opacity-80">Created by {course.instructor}</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {/* Left/Main column */}
                    <div className="lg:col-span-2">
                        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                            <nav className="flex space-x-4">
                                {['overview', 'curriculum', 'reviews', 'chat'].map(tab => (
                                     <button 
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`capitalize px-3 py-2 text-sm font-semibold border-b-2 ${activeTab === tab ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                     >{tab}</button>
                                ))}
                            </nav>
                        </div>
                         <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                             {renderContent()}
                         </div>
                    </div>
                    {/* Right sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 sticky top-6">
                            <img src={course.imageUrl} alt={course.title} className="w-full h-48 object-cover rounded-t-lg"/>
                            <div className="p-6">
                                <p className="text-3xl font-bold mb-4">${course.price}</p>
                                <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">Enroll now</button>
                                <p className="text-xs text-center mt-3 text-gray-500">30-Day Money-Back Guarantee</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
