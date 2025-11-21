import React from 'react';
import { StarIcon, SearchIcon, ChevronDownIcon, GlobeIcon, CodeBracketIcon, AcademicCapIcon, HeartIcon, PuzzlePieceIcon, BeakerIcon, MusicNoteIcon } from './Icons';
import { courses } from '../data';
import { Course } from '../types';

// The original course catalog component, now used inside the new realms
export const CourseCatalog: React.FC<{ onSelectCourse: (id: number) => void }> = ({ onSelectCourse }) => (
     <div className="p-4 sm:p-6">
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
            {courses.map(course => <CourseCard key={course.id} course={course} onSelectCourse={onSelectCourse} />)}
        </div>
     </div>
);


const CourseCard: React.FC<{ course: Course, onSelectCourse: (id: number) => void }> = ({ course, onSelectCourse }) => (
    <div 
        role="button"
        tabIndex={0}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 cursor-pointer group"
        onClick={() => onSelectCourse(course.id)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectCourse(course.id)}
    >
        <div className="overflow-hidden h-40">
            <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
        </div>
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
                <span className="px-4 py-2 text-sm font-semibold text-white bg-gray-800 dark:bg-blue-600 rounded-md group-hover:bg-gray-700 dark:group-hover:bg-blue-500 transition-colors">View Course</span>
            </div>
        </div>
    </div>
);

interface RealmProps {
    onSetView: (view: string, context?: any) => void;
}

// --- NEW LEARNING REALM COMPONENTS ---

export const SparkIsland: React.FC<RealmProps> = () => {
    const activities = [
        { name: "Alphabet Songs", color: "bg-red-400 hover:bg-red-500", icon: MusicNoteIcon },
        { name: "Counting Games", color: "bg-blue-400 hover:bg-blue-500", icon: BeakerIcon },
        { name: "Shape Sorters", color: "bg-green-400 hover:bg-green-500", icon: StarIcon },
        { name: "Simple Puzzles", color: "bg-purple-400 hover:bg-purple-500", icon: PuzzlePieceIcon },
    ];
    return (
        <div className="h-full bg-yellow-100 dark:bg-yellow-900/50 p-8 flex flex-col items-center justify-center text-center overflow-hidden">
            <h1 className="text-5xl font-extrabold text-yellow-800 dark:text-yellow-200" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>Welcome to Spark Island!</h1>
            <p className="text-yellow-700 dark:text-yellow-300 mt-2 text-lg">Let's learn and play!</p>
            <div className="mt-8 grid grid-cols-2 gap-6">
                {activities.map(activity => {
                    const Icon = activity.icon;
                    return (
                        <button key={activity.name} className={`w-48 h-48 rounded-2xl ${activity.color} text-white font-bold text-xl shadow-lg transform hover:scale-105 transition-transform flex flex-col items-center justify-center`}>
                            <Icon className="w-16 h-16 mb-2" />
                            {activity.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export const ExplorerAcademy: React.FC<RealmProps> = () => (
    <div className="h-full bg-cover bg-center p-8 flex flex-col text-white" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1525092029968-195a74a2f778?q=80&w=2070')"}}>
        <div className="bg-black/60 p-6 rounded-xl backdrop-blur-sm w-full max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold">Explorer Academy</h1>
            <p className="mt-2 text-lg">Choose your adventure and start learning!</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-6 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-center">
                    <AcademicCapIcon className="w-12 h-12 mx-auto mb-2"/>
                    <span className="font-bold text-lg">Math Mountain</span>
                </button>
                <button className="p-6 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-center">
                    <BeakerIcon className="w-12 h-12 mx-auto mb-2"/>
                    <span className="font-bold text-lg">Science Sea</span>
                </button>
                <button className="p-6 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-center">
                    <GlobeIcon className="w-12 h-12 mx-auto mb-2"/>
                    <span className="font-bold text-lg">History Jungle</span>
                </button>
            </div>
        </div>
    </div>
);

export const InnovatorsForge: React.FC<RealmProps> = ({ onSetView }) => {
    const handleSelectCourse = (courseId: number) => {
        onSetView('courseDetail', { courseId });
    };
    return (
        <div className="h-full flex bg-gray-100 dark:bg-gray-900">
            <aside className="w-60 bg-white dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold">Innovator's Forge</h2>
                <nav className="mt-6 space-y-2">
                    <button className="w-full text-left p-2 rounded bg-blue-100 dark:bg-blue-900/50 font-semibold text-blue-700 dark:text-blue-300">Course Catalog</button>
                    <button className="w-full text-left p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">My Projects</button>
                    <button className="w-full text-left p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Study Groups</button>
                </nav>
            </aside>
            <main className="flex-1 overflow-y-auto">
                 <header className="p-6 sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-10">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Course Catalog</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Master subjects and develop critical thinking.</p>
                </header>
                <CourseCatalog onSelectCourse={handleSelectCourse} />
            </main>
        </div>
    );
};

export const ScholarsNexus: React.FC<RealmProps> = ({ onSetView }) => {
    const handleSelectCourse = (courseId: number) => {
        onSetView('courseDetail', { courseId });
    };
    return (
         <div className="h-full overflow-y-auto bg-gray-100 dark:bg-gray-900">
            <header className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Scholar's Nexus</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Advanced specialization and professional development.</p>
            </header>
            <CourseCatalog onSelectCourse={handleSelectCourse} />
        </div>
    );
};

export const LuminaryLabs: React.FC<RealmProps> = ({ onSetView }) => {
    const handleSelectCourse = (courseId: number) => {
        onSetView('courseDetail', { courseId });
    };
     return (
         <div className="h-full overflow-y-auto bg-gray-100 dark:bg-gray-900">
             <header className="p-8 text-center" style={{ background: 'linear-gradient(to right, #6d28d9, #d946ef)'}}>
                <h1 className="text-4xl font-bold text-white">Luminary Labs</h1>
                <p className="text-white/80 mt-1 text-lg">Learn for passion, hobbies, and personal growth.</p>
            </header>
            <CourseCatalog onSelectCourse={handleSelectCourse} />
        </div>
    );
};