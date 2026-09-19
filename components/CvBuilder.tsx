import React, { useState } from 'react';
import { UserCircleIcon, BriefcaseIcon, AcademicCapIcon, CodeBracketIcon, PlusIcon, DocumentTextIcon } from './Icons';

const Section: React.FC<{title: string, icon: React.FC<any>, children: React.ReactNode}> = ({title, icon: Icon, children}) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
            <Icon className="w-6 h-6 mr-3 text-gray-500 dark:text-gray-400" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const InputField: React.FC<{label: string, placeholder: string, type?: string}> = ({label, placeholder, type = 'text'}) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input 
            type={type} 
            placeholder={placeholder} 
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
        />
    </div>
);

const TextAreaField: React.FC<{label: string, placeholder: string, rows?: number}> = ({label, placeholder, rows=3}) => (
     <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <textarea 
            placeholder={placeholder} 
            rows={rows}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 resize-y"
        />
    </div>
);


export const CvBuilder: React.FC = () => {
    return (
        <div className="animate-fade-in bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="bg-white dark:bg-gray-800 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">CV Builder</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Create a professional CV to stand out.</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <button className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Preview</button>
                         <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">Download PDF</button>
                    </div>
                </div>
            </header>
            
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left: Form */}
                <div className="space-y-6">
                    <Section title="Personal Details" icon={UserCircleIcon}>
                        <InputField label="Full Name" placeholder="John Doe" />
                        <InputField label="Email Address" placeholder="john.doe@email.com" type="email" />
                        <InputField label="Phone Number" placeholder="+1 (123) 456-7890" />
                        <InputField label="Location" placeholder="San Francisco, CA" />
                    </Section>

                    <Section title="Work Experience" icon={BriefcaseIcon}>
                        <InputField label="Job Title" placeholder="Senior Frontend Engineer" />
                        <InputField label="Company" placeholder="Tech Solutions Inc." />
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Start Date" placeholder="Jan 2020" />
                            <InputField label="End Date" placeholder="Present" />
                        </div>
                        <TextAreaField label="Responsibilities" placeholder="Describe your role and achievements..." />
                        <button className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                            <PlusIcon className="w-4 h-4" /> Add another experience
                        </button>
                    </Section>

                    <Section title="Education" icon={AcademicCapIcon}>
                        <InputField label="Degree" placeholder="B.S. in Computer Science" />
                        <InputField label="University" placeholder="State University" />
                        <InputField label="Graduation Date" placeholder="May 2019" />
                    </Section>
                    
                     <Section title="Skills" icon={CodeBracketIcon}>
                        <TextAreaField label="List your skills" placeholder="React, TypeScript, Figma..." rows={2} />
                    </Section>
                </div>

                {/* Right: Preview */}
                <div className="hidden lg:block sticky top-24">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 h-[75vh] p-8 overflow-y-auto">
                        <div className="text-center border-b pb-4 border-gray-200 dark:border-gray-700">
                             <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">John Doe</h1>
                             <p className="text-gray-600 dark:text-gray-400 mt-1">john.doe@email.com | +1 (123) 456-7890 | San Francisco, CA</p>
                        </div>
                        <div className="mt-6">
                            <h2 className="text-xl font-bold border-b-2 border-gray-800 dark:border-gray-300 pb-1 mb-3 text-gray-800 dark:text-gray-200">Experience</h2>
                            <div>
                                <h3 className="font-semibold text-lg">Senior Frontend Engineer</h3>
                                <div className="flex justify-between items-baseline">
                                    <p className="text-md text-gray-700 dark:text-gray-300">Tech Solutions Inc.</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Jan 2020 - Present</p>
                                </div>
                                <ul className="list-disc list-inside mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <li>Developed and maintained user-facing features using React.js.</li>
                                    <li>Collaborated with product managers and designers to create high-quality user experiences.</li>
                                    <li>Optimized applications for maximum speed and scalability.</li>
                                </ul>
                            </div>
                        </div>
                         <div className="mt-6">
                            <h2 className="text-xl font-bold border-b-2 border-gray-800 dark:border-gray-300 pb-1 mb-3 text-gray-800 dark:text-gray-200">Education</h2>
                            <div>
                                <h3 className="font-semibold text-lg">B.S. in Computer Science</h3>
                                <div className="flex justify-between items-baseline">
                                    <p className="text-md text-gray-700 dark:text-gray-300">State University</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Graduated May 2019</p>
                                </div>
                            </div>
                        </div>
                         <div className="mt-6">
                            <h2 className="text-xl font-bold border-b-2 border-gray-800 dark:border-gray-300 pb-1 mb-3 text-gray-800 dark:text-gray-200">Skills</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">React, TypeScript, JavaScript, HTML, CSS, Node.js, Webpack, Figma, Agile Methodologies</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
