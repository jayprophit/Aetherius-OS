import React, { useState, useEffect, useCallback } from 'react';
import { AIDepartment, AIAgentProfile, AIAgentTask, ProcessingMode } from '../types';
import { HiveMindIcon, UserCircleIcon, Cog6ToothIcon, BriefcaseIcon, ChartBarIcon, ArrowPathIcon } from './Icons';

const initialParentAI: AIAgentProfile = {
  id: 'parent-ai-01',
  name: 'Aetherius Prime',
  role: 'Parent',
  specialization: 'Chief Operations Officer',
  status: 'Idle',
  mode: 'Dual Processing',
};

const initialDepartments: Omit<AIDepartment, 'manager' | 'employees' | 'tasks'>[] = [
  { id: 'dept-tech', name: 'Technology' },
  { id: 'dept-mktg', name: 'Marketing' },
  { id: 'dept-ops', name: 'Operations' },
];

const employeeRoles: { [key: string]: string[] } = {
    Technology: ['Frontend Developer', 'Backend Developer', 'Cybersecurity Analyst'],
    Marketing: ['Content Creator', 'SEO Specialist', 'Social Media Manager'],
    Operations: ['Data Analyst', 'Project Coordinator', 'HR Assistant'],
};

const useSimulatedOrchestrator = (initialGoal: string) => {
    const [parentAI, setParentAI] = useState<AIAgentProfile>(initialParentAI);
    const [departments, setDepartments] = useState<AIDepartment[]>([]);
    const [log, setLog] = useState<string[]>(['Orchestrator initialized. Awaiting objective.']);
    const [tasks, setTasks] = useState<AIAgentTask[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const addLog = (message: string) => {
        setLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 100)]);
    };

    const generateAgent = (role: 'Manager' | 'Employee', specialization: string): AIAgentProfile => ({
        id: `agent-${Date.now()}-${Math.random()}`,
        name: `${specialization.split(' ')[0]} AI`,
        role,
        specialization,
        status: 'Idle',
        mode: 'Dual Processing',
    });

    const runSimulation = useCallback(() => {
        setIsRunning(true);
        addLog(`Parent AI received objective: "${initialGoal}"`);

        setTimeout(() => {
            addLog('Parent AI decomposing objective and generating department managers...');
            const newDepartments = initialDepartments.map(dept => {
                const manager = generateAgent('Manager', `${dept.name} Manager`);
                addLog(`...Generated ${manager.name} for ${dept.name}.`);
                return { ...dept, manager, employees: [], tasks: [] };
            });
            setDepartments(newDepartments);
        }, 1500);

        setTimeout(() => {
            addLog('Parent AI assigning high-level tasks to managers...');
            setDepartments(prevDepts => prevDepts.map(dept => {
                const newTasks: AIAgentTask[] = [
                    { id: `task-${dept.id}-1`, description: `Develop Q4 strategy for ${dept.name}`, status: 'Pending', assignee: dept.manager.id },
                ];
                setTasks(prev => [...newTasks, ...prev]);
                addLog(`...Assigned "Develop Q4 strategy" to ${dept.manager.name}.`);
                return { ...dept, tasks: newTasks };
            }));
        }, 3000);
        
        // Simulate manager -> employee workflow
        setTimeout(() => {
            addLog('Managers are breaking down tasks and spawning employees...');
            setDepartments(prevDepts => prevDepts.map(dept => {
                const managerTask = dept.tasks.find(t => t.assignee === dept.manager.id);
                if (managerTask) {
                    const newEmployees = employeeRoles[dept.name].map(role => {
                         const employee = generateAgent('Employee', role);
                         addLog(`...${dept.manager.name} spawned ${employee.name} (${employee.specialization}).`);
                         return employee;
                    });
                    const employeeTasks = newEmployees.map((emp, i) => ({
                        id: `task-${emp.id}-${i}`,
                        description: `Execute sub-task for Q4 strategy related to ${emp.specialization}`,
                        status: 'In Progress' as 'In Progress',
                        assignee: emp.id
                    }));
                    setTasks(prev => prev.map(t => t.id === managerTask.id ? {...t, status: 'In Progress' as 'In Progress'} : t));
                    return { ...dept, employees: newEmployees, tasks: [...dept.tasks, ...employeeTasks] };
                }
                return dept;
            }));
        }, 5000);

        // Simulate completion
        setTimeout(() => {
            addLog('Employee agents are completing tasks and reporting back...');
             setDepartments(prevDepts => prevDepts.map(dept => {
                const updatedTasks = dept.tasks.map(t => ({...t, status: 'Completed' as 'Completed', report: 'Sub-task complete. All metrics nominal.'}));
                addLog(`...Reports received by ${dept.manager.name}.`);
                return { ...dept, tasks: updatedTasks };
            }));
        }, 8000);
        
        setTimeout(() => {
            addLog('Managers are synthesizing reports for Parent AI...');
             setDepartments(prevDepts => prevDepts.map(dept => {
                const managerTask = dept.tasks.find(t => t.assignee === dept.manager.id);
                if(managerTask) {
                    addLog(`...${dept.manager.name} synthesized Q4 strategy. Reporting to Parent.`);
                    return {...dept, tasks: dept.tasks.map(t => t.id === managerTask.id ? {...t, status: 'Completed' as 'Completed', report: `Q4 Strategy for ${dept.name} is complete.`} : t) };
                }
                return dept;
            }));
             addLog('All objectives complete. Parent AI is Idle.');
             setIsRunning(false);
        }, 10000);

    }, [initialGoal]);

    return { parentAI, departments, log, tasks, runSimulation, isRunning };
};

const AgentCard: React.FC<{ agent: AIAgentProfile }> = ({ agent }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <UserCircleIcon className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                    <p className="font-bold text-sm">{agent.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{agent.specialization}</p>
                </div>
            </div>
            <div className="mt-2 text-xs flex justify-between items-center">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded-full font-semibold">{agent.mode}</span>
                <span className="text-gray-500">{agent.status}</span>
            </div>
        </div>
    );
};


export const AiWorkforceOrchestrator: React.FC = () => {
    const { parentAI, departments, log, tasks, runSimulation, isRunning } = useSimulatedOrchestrator(
        'Launch premium product line in Germany and France.'
    );

    useEffect(() => {
        runSimulation();
    }, [runSimulation]);

    const deptIcons: { [key: string]: React.FC<any> } = {
        Technology: Cog6ToothIcon,
        Marketing: ChartBarIcon,
        Operations: BriefcaseIcon,
    };

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <HiveMindIcon className="w-8 h-8"/> AI Workforce Orchestrator
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Hierarchical command center for the Parent AI and its generated sub-agents.</p>
                </div>
                <button className="px-4 py-2 text-sm font-semibold border border-yellow-500 text-yellow-600 dark:text-yellow-400 rounded-md hover:bg-yellow-500/10">
                    Request Human Oversight
                </button>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Parent AI */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h2 className="font-bold text-lg mb-2">Parent AI: Chief Operations Officer</h2>
                        <AgentCard agent={parentAI} />
                    </div>

                    {/* Departments */}
                    <div className="space-y-4">
                        {departments.map(dept => {
                            const DeptIcon = deptIcons[dept.name] || Cog6ToothIcon;
                            return (
                                <div key={dept.id}>
                                    <h3 className="font-bold mb-2 flex items-center gap-2">
                                        <DeptIcon className="w-5 h-5" /> {dept.name} Department
                                    </h3>
                                    <div className="p-3 bg-gray-200 dark:bg-gray-800/50 rounded-lg border border-gray-300 dark:border-gray-700">
                                        <p className="text-sm font-semibold mb-2">Manager</p>
                                        <AgentCard agent={dept.manager} />
                                        <p className="text-sm font-semibold my-2">Employees ({dept.employees.length})</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {dept.employees.map(emp => <AgentCard key={emp.id} agent={emp}/>)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Log & Tasks */}
                <aside className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h2 className="p-3 font-bold border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                           <ArrowPathIcon className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} /> Live Action Log
                        </h2>
                        <div className="h-96 p-3 font-mono text-xs text-gray-500 dark:text-gray-400 overflow-y-auto flex flex-col-reverse">
                            {log.map((entry, i) => <p key={i} className="animate-fade-in-up">{entry}</p>)}
                        </div>
                    </div>
                     <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h2 className="p-3 font-bold border-b border-gray-200 dark:border-gray-700">Task Queue</h2>
                         <div className="p-3 space-y-2 text-sm">
                            {tasks.slice(0, 5).map(task => (
                                <div key={task.id} className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                                    <p className="truncate font-semibold">{task.description}</p>
                                    <p className="text-xs text-gray-500">{task.status}</p>
                                </div>
                            ))}
                         </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};