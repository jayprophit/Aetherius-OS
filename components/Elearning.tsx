import React from 'react';
import { StarIcon, SearchIcon, ChevronDownIcon } from './Icons';
import { courses } from '../data';
import { Course } from '../types';

const CourseCard: React.FC<{ course: Course, onSelectCourse: (id: number) => void }> = ({ course, onSelectCourse }) => (
    <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 cursor-pointer"
        onClick={() => onSelectCourse(course.id)}
    >
        <img src={course.imageUrl} alt={course.title} className="w-full h-40 object-cover"/>
        <div className="p-4">
            <span className="text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase">{course.category}</span>
            <h3 className="font-bold text-md mt-1 h-12 text-gray-800 dark:text-gray-100">{course.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">by {course.instructor}</p>
            <div className="flex items-center mt-2">
                <span className="font-bold text-yellow-500 mr-1">{course.rating}</span>
                <div className="flex">
                    {[...Array(5)].map((_, i) => <StarIcon key={i} solid className={`w-4 h-4 ${i < Math.round(course.rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />)}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({course.students.toLocaleString()})</span>
            </div>
            <div className="flex justify-between items-center mt-4">
                <span className="text-xl font-bold text-gray-900 dark:text-white">${course.price}</span>
                <button className="px-4 py-2 text-sm font-semibold text-white bg-gray-800 dark:bg-blue-600 rounded-md hover:bg-gray-700 dark:hover:bg-blue-500 transition-colors">View Course</button>
            </div>
        </div>
    </div>
);

interface ElearningProps {
    onSetView: (view: string, context: any) => void;
}

export const Elearning: React.FC<ElearningProps> = ({ onSetView }) => {
    
    const handleSelectCourse = (courseId: number) => {
        onSetView('courseDetail', { courseId });
    };

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Course Catalog</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Expand your knowledge and skills with our expert-led courses.</p>
            </header>

            {/* Filters and Search */}
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-1/2">
                    <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search for courses..." className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md h-10 pl-10 pr-4 w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative">
                        <button className="flex items-center justify-between w-full sm:w-36 text-sm px-3 h-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                            <span>Category</span>
                            <ChevronDownIcon className="w-4 h-4"/>
                        </button>
                    </div>
                     <div className="relative">
                        <button className="flex items-center justify-between w-full sm:w-32 text-sm px-3 h-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                            <span>Price</span>
                            <ChevronDownIcon className="w-4 h-4"/>
                        </button>
                    </div>
                </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map(course => <CourseCard key={course.id} course={course} onSelectCourse={handleSelectCourse} />)}
            </div>
        </div>
    );
};