import React from 'react';
import { courses, enrolledCourses } from '../data';
import { Course } from '../types';
import { AcademicCapIcon } from './Icons';

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