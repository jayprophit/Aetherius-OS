import React from 'react';
import { learnAndEarnCourses } from '../../data';
import { LearnAndEarnCourse } from '../../types';
import { AcademicCapIcon, PlayIcon } from '../Icons';

const CourseCard: React.FC<{ course: LearnAndEarnCourse }> = ({ course }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-5">
        <img src={course.asset.logoUrl} alt={course.asset.symbol} className="w-16 h-16" />
        <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{course.title}</h3>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{course.duration}</span>
                <span>&bull;</span>
                <span>{course.lessons} Lessons</span>
            </div>
        </div>
        <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Earn</p>
            <p className="font-bold text-green-500 text-lg">${course.reward} in {course.asset.symbol}</p>
             <button className="mt-1 flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                <PlayIcon className="w-4 h-4" /> Start
            </button>
        </div>
    </div>
);

export const LearnAndEarn: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6 max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <AcademicCapIcon className="w-8 h-8" /> Learn & Earn
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Discover how crypto works and get a bit of each crypto to try out for yourself.</p>
            </header>
            
            <div className="max-w-3xl mx-auto space-y-4">
                {learnAndEarnCourses.map(course => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </div>
    );
};
