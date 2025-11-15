import React from 'react';
import { SearchIcon, ChevronDownIcon, BriefcaseIcon, ClockIcon, CircleStackIcon } from './Icons';
import { jobs } from '../data';

const JobCard: React.FC<{ job: typeof jobs[0] }> = ({ job }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 flex flex-col sm:flex-row items-start gap-4">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0">
            <img src={job.logoUrl} alt={`${job.company} logo`} className="w-8 h-8"/>
        </div>
        <div className="flex-grow">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{job.title}</h3>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>{job.company}</span>
                <span className="mx-2">&middot;</span>
                <span>{job.location}</span>
            </div>
             <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2 gap-2">
                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full"><BriefcaseIcon className="w-3 h-3" /> {job.type}</span>
                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full"><CircleStackIcon className="w-3 h-3" /> {job.salary}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                {job.tags.map(tag => <span key={tag} className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">{tag}</span>)}
            </div>
        </div>
        <div className="w-full sm:w-auto mt-4 sm:mt-0 flex sm:flex-col items-end justify-between">
             <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">Apply</button>
             <p className="text-xs text-gray-400 dark:text-gray-500 mt-0 sm:mt-2">2 days ago</p>
        </div>
    </div>
);

export const JobSearch: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Find Your Next Opportunity</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Browse thousands of jobs from top companies.</p>
            </header>

            {/* Filters and Search */}
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full">
                    <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Job title, keywords, or company" className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md h-10 pl-10 pr-4 w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                 <div className="relative w-full">
                    <input type="text" placeholder="Location" className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md h-10 pl-4 pr-4 w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <button className="w-full md:w-auto px-6 h-10 text-sm font-semibold text-white bg-gray-800 dark:bg-blue-600 rounded-md hover:bg-gray-700 dark:hover:bg-blue-500 transition-colors">Search</button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {jobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
        </div>
    );
};