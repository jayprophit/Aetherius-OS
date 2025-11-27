
import React from 'react';
import { ChartBarIcon, PlusIcon, UsersIcon, CurrencyDollarIcon, StarIcon, VideoIcon, DocumentTextIcon } from '../Icons';
import { loggedInUser } from '../../data';

const StatCard: React.FC<{ title: string; value: string; icon: React.FC<any>; color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-4 shadow-sm">
        <div className={`p-4 rounded-full bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</h3>
        </div>
    </div>
);

export const InstructorStudio: React.FC = () => {
    const profile = loggedInUser.instructorProfile;

    if (!profile) return <div>Loading Instructor Profile...</div>;

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto p-6 animate-fade-in">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Instructor Studio</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your courses, students, and earnings.</p>
                </div>
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg">
                    <PlusIcon className="w-5 h-5" /> Create New Course
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Earnings" value={`$${profile.totalEarnings.toLocaleString()}`} icon={CurrencyDollarIcon} color="text-green-500" />
                <StatCard title="Total Students" value={profile.totalStudents.toLocaleString()} icon={UsersIcon} color="text-blue-500" />
                <StatCard title="Average Rating" value={profile.averageRating.toString()} icon={StarIcon} color="text-yellow-500" />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">My Courses</h2>
                    <div className="flex gap-2">
                         <select className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm">
                             <option>All Statuses</option>
                             <option>Published</option>
                             <option>Draft</option>
                         </select>
                    </div>
                </div>
                
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                        <tr>
                            <th className="px-6 py-3">Course Title</th>
                            <th className="px-6 py-3">Students</th>
                            <th className="px-6 py-3">Rating</th>
                            <th className="px-6 py-3">Earnings</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {/* Mock Row 1 */}
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center text-blue-600">
                                    <VideoIcon className="w-5 h-5" />
                                </div>
                                Introduction to Quantum Computing
                            </td>
                            <td className="px-6 py-4">5,000</td>
                            <td className="px-6 py-4 flex items-center gap-1">
                                <StarIcon className="w-4 h-4 text-yellow-400" solid /> 4.9
                            </td>
                            <td className="px-6 py-4 font-mono">$8,450.00</td>
                            <td className="px-6 py-4"><span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs px-2 py-1 rounded-full font-bold">Published</span></td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-blue-600 hover:text-blue-800 font-bold text-xs">Edit</button>
                            </td>
                        </tr>
                         {/* Mock Row 2 */}
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center text-purple-600">
                                    <DocumentTextIcon className="w-5 h-5" />
                                </div>
                                Advanced React Patterns
                            </td>
                            <td className="px-6 py-4">0</td>
                            <td className="px-6 py-4 flex items-center gap-1">
                                <span className="text-gray-400">-</span>
                            </td>
                            <td className="px-6 py-4 font-mono">$0.00</td>
                            <td className="px-6 py-4"><span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs px-2 py-1 rounded-full font-bold">Draft</span></td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-blue-600 hover:text-blue-800 font-bold text-xs">Continue</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-2">Payout Information</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                    Your earnings are paid out monthly via Smart Contract to your Aetherius Wallet. 
                    Next payout scheduled for: <strong>Oct 31, 2025</strong>.
                </p>
                <div className="flex gap-4">
                    <button className="text-xs font-bold uppercase tracking-wider text-blue-700 hover:underline">View Transaction History</button>
                    <button className="text-xs font-bold uppercase tracking-wider text-blue-700 hover:underline">Update Payment Method</button>
                </div>
            </div>
        </div>
    );
};