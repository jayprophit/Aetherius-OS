
import React, { useState, useMemo } from 'react';
import { SearchIcon, ChevronDownIcon, BriefcaseIcon, ClockIcon, CircleStackIcon, BuildingOfficeIcon, UserCircleIcon, CheckCircleIcon, ChartBarIcon, FunnelIcon, MapPinIcon, PlusIcon } from './Icons';
import { jobs, mockCompanies, mockFreelanceProjects } from '../data';
import { Job, Company, FreelanceProject } from '../types';

// --- Types for View State ---
type ViewType = 'jobs' | 'freelance' | 'companies';

// --- JOB COMPONENTS ---

const JobCard: React.FC<{ job: Job }> = ({ job }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 flex flex-col sm:flex-row items-start gap-4">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src={job.logoUrl} alt={`${job.company} logo`} className="w-full h-full object-cover"/>
        </div>
        <div className="flex-grow">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{job.title}</h3>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{job.company}</span>
                <span className="mx-2">&middot;</span>
                <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3"/> {job.location}</span>
            </div>
             <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2 gap-2">
                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full"><BriefcaseIcon className="w-3 h-3" /> {job.type}</span>
                <span className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full"><CircleStackIcon className="w-3 h-3" /> {job.salary}</span>
                <span className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">{job.category}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                {job.tags.map(tag => <span key={tag} className="px-2 py-0.5 text-xs font-semibold border border-gray-200 dark:border-gray-600 rounded text-gray-500 dark:text-gray-400">{tag}</span>)}
            </div>
        </div>
        <div className="w-full sm:w-auto mt-4 sm:mt-0 flex sm:flex-col items-end justify-between h-full">
             <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{job.postedDate}</p>
             <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto">Apply Now</button>
        </div>
    </div>
);

// --- FREELANCE COMPONENTS ---

const ProjectCard: React.FC<{ project: FreelanceProject }> = ({ project }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 hover:text-blue-600 cursor-pointer">{project.title}</h3>
            <div className="flex flex-col items-end">
                <span className="font-bold text-green-600 dark:text-green-400">
                    {project.budget.type === 'fixed' ? `$${project.budget.min} - $${project.budget.max}` : `$${project.budget.min}-$${project.budget.max}/hr`}
                </span>
                <span className="text-xs text-gray-500">{project.budget.type === 'fixed' ? 'Fixed Price' : 'Hourly'}</span>
            </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{project.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
            {project.skills.map(skill => (
                <span key={skill} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md font-medium">
                    {skill}
                </span>
            ))}
        </div>

        <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-3 mt-auto">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-200">{project.clientName}</span>
                <span>•</span>
                <span>{project.postedDate}</span>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{project.proposalsCount} Proposals</span>
        </div>
    </div>
);

// --- COMPANY COMPONENTS ---

const CompanyCard: React.FC<{ company: Company }> = ({ company }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 flex flex-col hover:border-blue-500 transition-colors">
        <div className="flex items-center gap-3 mb-3">
            <img src={company.logoUrl} alt={company.name} className="w-12 h-12 rounded-md object-cover bg-gray-100"/>
            <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1">
                    {company.name}
                    {company.verified && <CheckCircleIcon className="w-4 h-4 text-blue-500" />}
                </h3>
                <p className="text-xs text-gray-500">{company.industry} • {company.size} Employees</p>
            </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow line-clamp-3">{company.description}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <MapPinIcon className="w-3 h-3"/>
            {company.locations.join(', ')}
        </div>
        <button className="w-full py-2 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-md font-semibold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            View Profile
        </button>
    </div>
);

// --- MAIN COMPONENT ---

export const JobsPlatform: React.FC = () => {
    const [view, setView] = useState<ViewType>('jobs');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filter Logic
    const filteredJobs = useMemo(() => jobs.filter(j => j.title.toLowerCase().includes(searchTerm.toLowerCase()) || j.company.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm]);
    const filteredProjects = useMemo(() => mockFreelanceProjects.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm]);
    const filteredCompanies = useMemo(() => mockCompanies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm]);

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto flex flex-col">
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <BriefcaseIcon className="w-8 h-8 text-blue-600" />
                        Jobs & Careers
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Find your dream job, freelance gigs, or next great hire.</p>
                </div>
                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <button 
                        onClick={() => setView('jobs')}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${view === 'jobs' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        Find Jobs
                    </button>
                    <button 
                        onClick={() => setView('freelance')}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${view === 'freelance' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        Freelance
                    </button>
                    <button 
                        onClick={() => setView('companies')}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${view === 'companies' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        Companies
                    </button>
                </div>
            </header>

            {/* Search & Filter Bar */}
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center gap-4 sticky top-0 z-10 shadow-sm">
                <div className="relative w-full">
                    <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder={view === 'jobs' ? "Search jobs, skills, or companies" : view === 'freelance' ? "Search projects or skills" : "Search companies"} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md h-10 pl-10 pr-4 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                     {view === 'jobs' && (
                         <>
                            <div className="relative w-full md:w-40">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                                </div>
                                <input type="text" placeholder="Location" className="pl-9 w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md h-10 text-sm focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <button className="flex items-center gap-2 px-4 h-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">
                                <FunnelIcon className="w-4 h-4"/> Filters
                            </button>
                         </>
                     )}
                     {view === 'freelance' && (
                         <button className="flex items-center gap-2 px-6 h-10 bg-green-600 text-white rounded-md text-sm font-bold hover:bg-green-700 shadow-md">
                             <PlusIcon className="w-4 h-4"/> Post a Job
                         </button>
                     )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
                {view === 'jobs' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="font-bold text-gray-700 dark:text-gray-300">{filteredJobs.length} Jobs Found</h2>
                            <span className="text-xs text-gray-500">Sorted by: Relevance</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {filteredJobs.map(job => <JobCard key={job.id} job={job} />)}
                        </div>
                    </div>
                )}

                {view === 'freelance' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="font-bold text-gray-700 dark:text-gray-300">{filteredProjects.length} Projects Available</h2>
                             <div className="flex gap-2">
                                <span className="text-xs font-semibold bg-white dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-700">Best Match</span>
                                <span className="text-xs text-gray-500 px-2 py-1">Most Recent</span>
                             </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredProjects.map(project => <ProjectCard key={project.id} project={project} />)}
                        </div>
                    </div>
                )}

                {view === 'companies' && (
                     <div className="space-y-4">
                         <h2 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Top Companies Hiring</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCompanies.map(company => <CompanyCard key={company.id} company={company} />)}
                         </div>
                     </div>
                )}

                {((view === 'jobs' && filteredJobs.length === 0) || 
                  (view === 'freelance' && filteredProjects.length === 0) || 
                  (view === 'companies' && filteredCompanies.length === 0)) && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <SearchIcon className="w-12 h-12 mb-4 opacity-20" />
                        <p>No results found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Export for backward compatibility if needed, though we replaced the file content
export const JobSearch = JobsPlatform; 
