
import React, { useState } from 'react';
import { 
    EnvelopeIcon, CalendarIcon, DocumentTextIcon, StarIcon, 
    TrashIcon, ArchiveBoxIcon, PlusIcon, MagnifyingGlassIcon,
    CheckCircleIcon, ClockIcon, ExclamationTriangleIcon,
    ChartBarIcon, UsersIcon, CurrencyDollarIcon, CubeIcon,
    PlayIcon, GameControllerIcon, CloudIcon, DevicePhoneMobileIcon,
    ComputerDesktopIcon
} from './Icons';

// --- TYPES ---
type AppType = 'mail' | 'calendar' | 'kanban' | 'list' | 'grid' | 'dashboard' | 'editor' | 'devices' | 'todo';

// --- MOCK DATA GENERATORS ---

const generateEmails = () => Array.from({ length: 15 }).map((_, i) => ({
    id: `email-${i}`,
    from: `User ${i + 1}`,
    subject: `Project Update: Phase ${i + 1}`,
    preview: 'Just checking in on the status of the quantum core integration...',
    time: `${Math.floor(Math.random() * 12) + 1}:00 PM`,
    unread: Math.random() > 0.7
}));

const generateTasks = () => [
    { id: 't1', title: 'Review QPU Logs', status: 'Todo', priority: 'High' },
    { id: 't2', title: 'Update Firmware', status: 'In Progress', priority: 'Medium' },
    { id: 't3', title: 'Design new UI Layout', status: 'Done', priority: 'Low' },
    { id: 't4', title: 'Fix CSS Grid Bug', status: 'Todo', priority: 'High' },
    { id: 't5', title: 'Meeting with Team', status: 'In Progress', priority: 'Medium' },
];

const generateGames = () => [
    { id: 'g1', title: 'Cyber Drifter', genre: 'Racing', rating: 4.8, installed: true },
    { id: 'g2', title: 'Void Slayer', genre: 'FPS', rating: 4.5, installed: false },
    { id: 'g3', title: 'Quantum Chess', genre: 'Strategy', rating: 4.9, installed: true },
    { id: 'g4', title: 'Neon City RPG', genre: 'RPG', rating: 4.2, installed: true },
    { id: 'g5', title: 'Starfield Sim', genre: 'Simulation', rating: 4.7, installed: false },
    { id: 'g6', title: 'Echoes of Mars', genre: 'Adventure', rating: 4.4, installed: true },
];

// --- SUB-COMPONENTS ---

const MailLayout: React.FC = () => {
    const [emails] = useState(generateEmails());
    const [selectedEmail, setSelectedEmail] = useState(emails[0].id);

    return (
        <div className="flex h-full bg-white dark:bg-gray-900">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2">
                        <PlusIcon className="w-4 h-4" /> Compose
                    </button>
                </div>
                <nav className="space-y-1 px-2">
                    {['Inbox', 'Sent', 'Drafts', 'Archive', 'Trash'].map(folder => (
                        <button key={folder} className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 ${folder === 'Inbox' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            {folder === 'Inbox' && <EnvelopeIcon className="w-4 h-4" />}
                            {folder === 'Trash' && <TrashIcon className="w-4 h-4" />}
                            {folder === 'Archive' && <ArchiveBoxIcon className="w-4 h-4" />}
                            {!['Inbox', 'Trash', 'Archive'].includes(folder) && <DocumentTextIcon className="w-4 h-4" />}
                            {folder}
                        </button>
                    ))}
                </nav>
            </div>

            {/* List */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
                {emails.map(email => (
                    <div 
                        key={email.id} 
                        onClick={() => setSelectedEmail(email.id)}
                        className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors ${selectedEmail === email.id ? 'bg-white dark:bg-gray-800 border-l-4 border-l-blue-500' : ''}`}
                    >
                        <div className="flex justify-between items-baseline mb-1">
                            <h4 className={`text-sm ${email.unread ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{email.from}</h4>
                            <span className="text-xs text-gray-500">{email.time}</span>
                        </div>
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{email.subject}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{email.preview}</p>
                    </div>
                ))}
            </div>

            {/* Detail */}
            <div className="flex-1 p-8 overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Project Update: Phase 1</h2>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">U1</div>
                    <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">User 1 &lt;user1@aetherius.net&gt;</p>
                        <p className="text-xs text-gray-500">To: Me</p>
                    </div>
                </div>
                <div className="prose dark:prose-invert text-sm">
                    <p>Hello,</p>
                    <p>This is a fully functional simulated mail client layout. You can browse the list on the left.</p>
                    <p>The quantum core integration is proceeding as scheduled. We have achieved 99.9% coherence stability.</p>
                    <br />
                    <p>Best regards,</p>
                    <p>User 1</p>
                </div>
            </div>
        </div>
    );
};

const CalendarLayout: React.FC = () => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 p-6">
        <header className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">October 2025</h2>
            <div className="flex gap-2">
                <button className="px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800">Day</button>
                <button className="px-3 py-1 border rounded bg-blue-600 text-white">Month</button>
                <button className="px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800">Year</button>
            </div>
        </header>
        <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-bold text-gray-500">{day}</div>
            ))}
            {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 p-2 min-h-[100px] relative hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                    <span className="text-sm text-gray-500">{i + 1 <= 31 ? i + 1 : ''}</span>
                    {i === 14 && (
                        <div className="mt-2 p-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded truncate">
                            Project Deadline
                        </div>
                    )}
                     {i === 8 && (
                        <div className="mt-2 p-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs rounded truncate">
                            Team Sync
                        </div>
                    )}
                    <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <PlusIcon className="w-4 h-4 text-gray-500"/>
                    </button>
                </div>
            ))}
        </div>
    </div>
);

const KanbanLayout: React.FC = () => {
    const tasks = generateTasks();
    const columns = ['Todo', 'In Progress', 'Done'];

    return (
        <div className="h-full overflow-x-auto p-6 bg-gray-100 dark:bg-gray-900">
            <div className="flex gap-6 h-full">
                {columns.map(col => (
                    <div key={col} className="w-80 flex-shrink-0 bg-gray-200 dark:bg-gray-800 rounded-xl p-4 flex flex-col">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex justify-between">
                            {col}
                            <span className="bg-gray-300 dark:bg-gray-700 px-2 rounded text-sm">{tasks.filter(t => t.status === col).length}</span>
                        </h3>
                        <div className="space-y-3 flex-1 overflow-y-auto">
                            {tasks.filter(t => t.status === col).map(task => (
                                <div key={task.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow border border-transparent hover:border-blue-500">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${task.priority === 'High' ? 'bg-red-100 text-red-600' : task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{task.title}</h4>
                                </div>
                            ))}
                             <button className="w-full py-2 mt-2 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-700 rounded dashed border border-gray-400 dark:border-gray-600 text-sm">
                                + Add Task
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TodoListLayout: React.FC = () => {
    const [tasks, setTasks] = useState([
        { id: 1, text: 'Review quarterly goals', completed: false },
        { id: 2, text: 'Sync with design team', completed: true },
        { id: 3, text: 'Update project roadmap', completed: false },
        { id: 4, text: 'Draft newsletter', completed: false },
        { id: 5, text: 'Optimize database queries', completed: false },
    ]);

    const toggleTask = (id: number) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-900 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">My Tasks</h2>
            <div className="space-y-3 max-w-3xl">
                {tasks.map(task => (
                    <div 
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 group ${
                            task.completed 
                            ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-75' 
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md'
                        }`}
                    >
                        <div 
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
                                task.completed 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-500'
                            }`}
                        >
                             {task.completed && (
                                 <svg className="w-3.5 h-3.5 text-white animate-checkmark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                     <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                 </svg>
                             )}
                        </div>
                        <span className={`text-base transition-all duration-300 ${task.completed ? 'text-gray-400 line-through decoration-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                            {task.text}
                        </span>
                    </div>
                ))}
            </div>
            <button className="mt-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
                 <PlusIcon className="w-5 h-5" /> Add Task
            </button>
            <style>{`
                @keyframes checkmark {
                    0% { stroke-dasharray: 24; stroke-dashoffset: 24; opacity: 0; transform: scale(0.5); }
                    50% { opacity: 1; transform: scale(1.2); }
                    100% { stroke-dasharray: 24; stroke-dashoffset: 0; transform: scale(1); }
                }
                .animate-checkmark {
                    animation: checkmark 0.4s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                }
            `}</style>
        </div>
    );
};

const GridLayout: React.FC = () => {
    const games = generateGames();
    return (
        <div className="p-6 bg-gray-900 text-white h-full overflow-y-auto">
            <header className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <GameControllerIcon className="w-6 h-6 text-purple-500"/> My Library
                </h2>
                <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                    <input type="text" placeholder="Filter..." className="bg-gray-800 rounded-full py-1 pl-9 pr-4 text-sm border border-gray-700 focus:border-purple-500 outline-none"/>
                </div>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {games.map(game => (
                    <div key={game.id} className="group relative bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:ring-2 ring-purple-500 transition-all">
                        <div className="h-40 bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
                            <GameControllerIcon className="w-12 h-12 text-white/20 group-hover:scale-110 transition-transform duration-300"/>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-lg truncate">{game.title}</h3>
                            <p className="text-xs text-gray-400">{game.genre}</p>
                            <div className="mt-3 flex justify-between items-center">
                                <div className="flex text-yellow-500 text-xs gap-1">
                                    <StarIcon className="w-3 h-3" solid /> {game.rating}
                                </div>
                                <button className={`px-3 py-1 rounded text-xs font-bold ${game.installed ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                    {game.installed ? 'PLAY' : 'INSTALL'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GenericDashboard: React.FC<{ title: string }> = ({ title }) => (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{title} Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Metric {i}</p>
                    <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                        {Math.floor(Math.random() * 1000).toLocaleString()}
                    </p>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 h-64 flex flex-col justify-center items-center text-gray-400">
                <ChartBarIcon className="w-12 h-12 mb-2 opacity-50"/>
                <p>Activity Chart Visualization</p>
            </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold mb-4 text-gray-800 dark:text-white">Recent Actions</h3>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-gray-600 dark:text-gray-300">System process completed task #{200+i}</span>
                            <span className="ml-auto text-gray-400 text-xs">2m ago</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const DevicesLayout: React.FC = () => (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
         <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Linked Devices</h1>
         <div className="space-y-4 max-w-3xl">
             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                     <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600">
                         <ComputerDesktopIcon className="w-6 h-6"/>
                     </div>
                     <div>
                         <h3 className="font-bold text-gray-800 dark:text-white">This Device (Web Client)</h3>
                         <p className="text-xs text-green-500 font-bold">Active Now</p>
                     </div>
                 </div>
                 <button className="text-sm text-gray-500 border px-3 py-1 rounded">Details</button>
             </div>

             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between opacity-75">
                 <div className="flex items-center gap-4">
                     <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600">
                         <DevicePhoneMobileIcon className="w-6 h-6"/>
                     </div>
                     <div>
                         <h3 className="font-bold text-gray-800 dark:text-white">iPhone 15 Pro</h3>
                         <p className="text-xs text-gray-500">Last active: 2 hours ago</p>
                     </div>
                 </div>
                 <button className="text-sm text-red-500 border border-red-200 px-3 py-1 rounded hover:bg-red-50">Unlink</button>
             </div>
         </div>
    </div>
)

// --- MAIN COMPONENT ---

export const UniversalAppRenderer: React.FC<{ type: AppType; title?: string }> = ({ type, title }) => {
    switch (type) {
        case 'mail': return <MailLayout />;
        case 'calendar': return <CalendarLayout />;
        case 'kanban': return <KanbanLayout />;
        case 'grid': return <GridLayout />;
        case 'dashboard': return <GenericDashboard title={title || 'App'} />;
        case 'editor': return <div className="h-full flex items-center justify-center text-gray-500">Rich Text Editor Placeholder</div>;
        case 'devices': return <DevicesLayout />;
        case 'todo': return <TodoListLayout />;
        default: return <GenericDashboard title={title || 'App'} />;
    }
};
