
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AIDepartment, AIAgentProfile, AIAgentTask, ProcessingMode } from '../types';
import { 
    HiveMindIcon, UserCircleIcon, Cog6ToothIcon, BriefcaseIcon, ChartBarIcon, 
    ArrowPathIcon, AcademicCapIcon, HeartIcon, WrenchIcon, PaintBrushIcon, 
    ScaleIcon, CpuChipIcon, BoltIcon, SparklesIcon, PlayIcon, ServerIcon
} from './Icons';
import { aiConsciousnessLayers } from '../data';
import { rigService } from '../services/RigService';

const initialParentAI: AIAgentProfile = {
  id: 'parent-ai-01',
  name: 'Genesis Core (Parent)',
  role: 'Parent',
  specialization: 'Unified Intelligence',
  status: 'Idle',
  mode: 'Hive Mind',
};

// Expanded Departments covering all OS operations
const initialDepartments: Omit<AIDepartment, 'manager' | 'employees' | 'tasks'>[] = [
  { id: 'dept-tech', name: 'Technology' },
  { id: 'dept-edu', name: 'Education' },
  { id: 'dept-eng', name: 'Engineering' },
  { id: 'dept-health', name: 'Health' },
  { id: 'dept-fin', name: 'Finance' },
  { id: 'dept-creative', name: 'Creative' },
  { id: 'dept-career', name: 'Careers' },
  { id: 'dept-legal', name: 'Legal' },
];

// Detailed roles for each department
const employeeRoles: { [key: string]: string[] } = {
    Technology: ['Full Stack Developer', 'Cybersecurity Sentinel', 'System Architect', 'Network Optimizer', 'Database Sharding Bot'],
    Education: ['Curriculum Designer', 'Personal Tutor', 'Research Assistant', 'Knowledge Graph Architect', 'Pedagogy Adapter'],
    Engineering: ['CAD Architect', 'Physics Simulator', 'Material Scientist', 'Manufacturing Bot Controller', 'Structural Analyst'],
    Health: ['Wellness Advisor', 'Diagnostic Specialist', 'Nutritionist', 'Bio-Feedback Analyst', 'Genomic Scanner'],
    Finance: ['Quant Trader', 'Risk Analyst', 'DeFi Strategist', 'Tax Compliance Officer', 'Market Predictor'],
    Creative: ['Generative Artist', 'Video Editor', 'Sound Engineer', 'Narrative Designer', 'UX/UI Specialist'],
    Careers: ['Career Coach', 'Resume Optimizer', 'Job Market Analyst', 'Interview Simulator', 'Skill Gap Analyzer'],
    Legal: ['Contract Auditor', 'Regulatory Monitor', 'IP Specialist', 'Governance Verifier', 'Ethics Compliance Bot']
};

// Icon mapping
const deptIcons: { [key: string]: React.FC<any> } = {
    Technology: Cog6ToothIcon,
    Education: AcademicCapIcon,
    Engineering: WrenchIcon,
    Health: HeartIcon,
    Finance: ChartBarIcon,
    Creative: PaintBrushIcon,
    Careers: BriefcaseIcon,
    Legal: ScaleIcon,
};

const useSimulatedOrchestrator = (initialGoal: string) => {
    const [parentAI, setParentAI] = useState<AIAgentProfile>(initialParentAI);
    const [departments, setDepartments] = useState<AIDepartment[]>([]);
    const [log, setLog] = useState<string[]>(['Parent AI ready. Workforce sub-routines on standby.']);
    const [tasks, setTasks] = useState<AIAgentTask[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    
    // New States for selection and hardware
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [processingMode, setProcessingMode] = useState<ProcessingMode>('Hive Mind');
    const [activeHardware, setActiveHardware] = useState<string[]>([]);
    const [consciousnessState, setConsciousnessState] = useState<string>("Idle");
    const [rigState, setRigState] = useState(rigService.getRig());

    useEffect(() => {
        const sub = rigService.rigState$.subscribe(setRigState);
        return () => sub.unsubscribe();
    }, []);

    // Initialize departments structure
    useEffect(() => {
        const depts = initialDepartments.map(dept => ({
            ...dept,
            manager: {
                id: `mgr-${dept.id}`,
                name: `${dept.name} Sub-Core`,
                role: 'Manager' as const,
                specialization: `${dept.name} Orchestration`,
                status: 'Idle' as const,
                mode: 'Dual Processing' as const
            },
            employees: employeeRoles[dept.name].map((role, i) => ({
                id: `emp-${dept.id}-${i}`,
                name: `${role.split(' ')[0]} Agent`,
                role: 'Employee' as const,
                specialization: role,
                status: 'Idle' as const,
                mode: 'Singular Mind' as const
            })),
            tasks: []
        }));
        setDepartments(depts);
    }, []);

    const addLog = (message: string) => {
        setLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 100)]);
    };

    // Heuristic to find ALL relevant departments for a complex task
    const determineRelevantDepartments = (goal: string): string[] => {
        const lowerGoal = goal.toLowerCase();
        const relevantDepts: string[] = [];

        // Logic mapping
        if (lowerGoal.includes('game') || lowerGoal.includes('app') || lowerGoal.includes('software')) {
            relevantDepts.push('Technology', 'Creative');
        }
        if (lowerGoal.includes('business') || lowerGoal.includes('company') || lowerGoal.includes('startup')) {
            relevantDepts.push('Finance', 'Legal', 'Technology');
        }
        if (lowerGoal.includes('teach') || lowerGoal.includes('course') || lowerGoal.includes('school')) {
            relevantDepts.push('Education', 'Creative');
        }
        if (lowerGoal.includes('robot') || lowerGoal.includes('drone') || lowerGoal.includes('car')) {
            relevantDepts.push('Engineering', 'Technology');
        }
        if (lowerGoal.includes('health') || lowerGoal.includes('hospital') || lowerGoal.includes('diet')) {
            relevantDepts.push('Health', 'Technology');
        }
        
        // Fallback or direct mapping
        if (relevantDepts.length === 0) {
            if (lowerGoal.includes('design')) relevantDepts.push('Creative');
            else if (lowerGoal.includes('invest')) relevantDepts.push('Finance');
            else if (lowerGoal.includes('law')) relevantDepts.push('Legal');
            else relevantDepts.push('Technology'); // Default
        }

        return [...new Set(relevantDepts)]; // Unique values
    };

    const runSimulation = useCallback((customGoal?: string) => {
        const goalToProcess = customGoal || initialGoal;
        setIsRunning(true);
        setParentAI(prev => ({ ...prev, status: 'Working' }));
        
        // 1. Parent AI Analysis Phase
        addLog(`Parent AI received objective: "${goalToProcess}"`);
        
        // Determine available hardware from Rig
        const availableHw = ['vQPU']; // Base
        if (rigState.Bridge_Accelerator.length > 0) availableHw.push('Time Crystal');
        if (rigState.Binary_CPU.length > 0 && rigState.Binary_CPU[0].name.includes('Neural')) availableHw.push('Neuromorphic Array');
        
        if (processingMode === 'Deep Think (R1)') {
             setActiveHardware(availableHw);
             setConsciousnessState("R1 Protocol: Iterative Reasoning");
             addLog("R1 Deep Think engaged. Analyzing multi-file context and dependency graph...");
        } else {
             setActiveHardware(['vQPU']);
             setConsciousnessState("Core Intelligence: Analysis");
        }

        setTimeout(() => {
            // Determine multiple departments for parallel processing
            const targetDeptNames = determineRelevantDepartments(goalToProcess);
            
            addLog(`Parent AI generating sub-cores for domains: ${targetDeptNames.join(', ')}`);
            
            if (processingMode !== 'Deep Think (R1)') {
                setConsciousnessState("Hive Mind: Agent Generation");
                setActiveHardware(availableHw.filter(h => h !== 'Neuromorphic Array'));
            }

            // Activate Managers of all relevant departments
            setDepartments(prevDepts => prevDepts.map(dept => {
                if (targetDeptNames.includes(dept.name)) {
                    const newTask: AIAgentTask = { 
                        id: `task-${Date.now()}-${dept.id}`, 
                        description: `Orchestrate ${dept.name} Strategy for: "${goalToProcess}"`, 
                        status: 'In Progress', 
                        assignee: dept.manager.id 
                    };
                    setTasks(prev => [newTask, ...prev]);
                    return { 
                        ...dept, 
                        manager: { ...dept.manager, status: 'Working' },
                        tasks: [newTask, ...dept.tasks] 
                    };
                }
                return dept;
            }));

        }, 1500);

        // 2. Swarm Activation Phase (Managers splitting tasks to Agents)
        setTimeout(() => {
            if (processingMode === 'Deep Think (R1)') {
                 addLog("R1 CoT: Distilling tasks with recursive refinement...");
            } else {
                 setActiveHardware(availableHw);
                 setConsciousnessState("Collective Intelligence: Swarm Processing");
                 addLog("Sub-Cores spawning specialized worker agents...");
            }

            setDepartments(prevDepts => prevDepts.map(dept => {
                if (dept.manager.status === 'Working') {
                    // Select 2-3 random agents to work in parallel within this department
                    const availableAgents = [...dept.employees].sort(() => 0.5 - Math.random());
                    const selectedAgents = availableAgents.slice(0, 3);

                    // Generate sub-tasks for these agents
                    const newTasks = selectedAgents.map(agent => ({
                        id: `subtask-${Date.now()}-${agent.id}`,
                        description: `Processing ${dept.name} vector: ${agent.specialization}`,
                        status: 'In Progress' as const,
                        assignee: agent.id
                    }));

                    setTasks(prev => [...newTasks, ...prev]);
                    addLog(`[${dept.name}] Generated agents: ${selectedAgents.map(a => a.name).join(', ')}`);

                    return {
                        ...dept,
                        employees: dept.employees.map(emp => 
                            selectedAgents.find(sa => sa.id === emp.id) 
                                ? { ...emp, status: 'Working' } 
                                : emp
                        ),
                        tasks: [...newTasks, ...dept.tasks]
                    };
                }
                return dept;
            }));
        }, 3500);

        // 3. Deep Processing & Refinement Phase
        setTimeout(() => {
            if (processingMode === 'Deep Think (R1)') {
                 setConsciousnessState("R1: 512MB Context Integration");
                 addLog("Synthesizing project files and validating code/logic integrity...");
            } else {
                 setConsciousnessState("Deep Learning: Quality Tuning");
                 addLog("Agents submitting work to Parent AI for review...");
            }
        }, 6000);


        // 4. Synthesis & Completion
        setTimeout(() => {
             addLog("Parent AI synthesizing final output from all agents.");
             setConsciousnessState("Supreme Consciousness: Synthesis");
             setActiveHardware([]);
             
             // Reset all agents to idle
             setDepartments(prev => prev.map(d => ({
                 ...d,
                 manager: { ...d.manager, status: 'Idle' },
                 employees: d.employees.map(e => ({ ...e, status: 'Idle' }))
             })));
             
             setParentAI(prev => ({ ...prev, status: 'Idle' }));
             setIsRunning(false);
             setConsciousnessState("Idle");
             setTasks(prev => prev.map(t => t.status === 'In Progress' ? { ...t, status: 'Completed', report: 'Data Processed' } : t));

        }, 9000);

    }, [initialGoal, processingMode, rigState]);

    return { 
        parentAI, departments, log, tasks, runSimulation, isRunning, 
        activeHardware, consciousnessState,
        selectedDepartmentId, setSelectedDepartmentId,
        selectedAgentId, setSelectedAgentId,
        processingMode, setProcessingMode
    };
};

const AgentCard: React.FC<{ agent: AIAgentProfile, isSelected?: boolean, onSelect?: () => void }> = ({ agent, isSelected, onSelect }) => {
    return (
        <div 
            onClick={onSelect}
            className={`p-3 rounded-md border transition-all cursor-pointer relative overflow-hidden ${isSelected ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 ring-2 ring-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}
        >
            {agent.status === 'Working' && (
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-scanline"></div>
            )}
            <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${agent.status === 'Working' ? 'bg-green-100 text-green-600 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-200 text-gray-500'}`}>
                    <UserCircleIcon className="w-6 h-6" />
                </div>
                <div className="overflow-hidden flex-1">
                    <p className="font-bold text-sm truncate flex justify-between items-center">
                        {agent.name}
                        {agent.status === 'Working' && <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{agent.specialization}</p>
                </div>
            </div>
            <div className="mt-2 text-xs flex justify-between items-center">
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full font-semibold text-[10px] uppercase tracking-wider">{agent.role}</span>
            </div>
        </div>
    );
};

const HardwareIndicator: React.FC<{ name: string, isActive: boolean }> = ({ name, isActive }) => (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${isActive ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.6)] scale-105' : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'}`}>
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-purple-500 animate-ping' : 'bg-gray-400'}`}></div>
        <span className="text-xs font-mono font-bold">{name}</span>
    </div>
);


export const AiWorkforceOrchestrator: React.FC = () => {
    const [inputGoal, setInputGoal] = useState('');
    const { 
        parentAI, departments, log, tasks, runSimulation, isRunning, 
        activeHardware, consciousnessState,
        selectedDepartmentId, setSelectedDepartmentId,
        selectedAgentId, setSelectedAgentId,
        processingMode, setProcessingMode
    } = useSimulatedOrchestrator('');

    const handleStart = () => {
        if (!inputGoal.trim()) return;
        runSimulation(inputGoal);
    };

    const handleDepartmentSelect = (deptId: string) => {
        setSelectedDepartmentId(prev => prev === deptId ? null : deptId);
        setSelectedAgentId(null); // Reset agent when dept changes
    };

    const toggleMode = () => {
        const modes: ProcessingMode[] = ['Singular Mind', 'Hive Mind', 'Dual Processing', 'Deep Think (R1)'];
        const currentIndex = modes.indexOf(processingMode);
        setProcessingMode(modes[(currentIndex + 1) % modes.length]);
    };

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto flex flex-col">
            {/* Header & Input */}
            <header className="mb-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                            <HiveMindIcon className="w-8 h-8 text-blue-600"/> AI Workforce Orchestrator
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Command the Parent AI to generate specialized sub-agents for complex tasks.</p>
                    </div>
                    <button 
                        onClick={toggleMode}
                        className="hidden md:flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <div className={`w-2 h-2 rounded-full ${
                            processingMode === 'Deep Think (R1)' ? 'bg-purple-500 animate-pulse' : 
                            processingMode === 'Hive Mind' ? 'bg-green-500' : 
                            'bg-blue-500'
                        }`}></div>
                        <span className="text-xs font-semibold">{processingMode} Active</span>
                        <span className="text-[10px] text-gray-400">(Click to Toggle)</span>
                    </button>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-end shadow-sm">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-semibold mb-1">Operational Directive (Prompt)</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={inputGoal}
                                onChange={(e) => setInputGoal(e.target.value)}
                                placeholder="e.g., 'Build a new DeFi App', 'Launch a Marketing Campaign', 'Develop a Quantum Engine'..."
                                className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                            />
                            <button 
                                onClick={handleStart}
                                disabled={isRunning || !inputGoal.trim()}
                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                            >
                                {isRunning ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <PlayIcon className="w-4 h-4"/>}
                                Generate Workforce
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Hardware & State Monitor */}
                <div className="flex flex-wrap gap-3 items-center bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-black/5 dark:border-white/5">
                    <span className="text-xs font-bold uppercase text-gray-500 px-2 flex items-center gap-1"><ServerIcon className="w-3 h-3"/> Hardware Link:</span>
                    <HardwareIndicator name="vQPU Core" isActive={activeHardware.includes('vQPU')} />
                    <HardwareIndicator name="Time Crystal" isActive={activeHardware.includes('Time Crystal')} />
                    <HardwareIndicator name="Neuromorphic Net" isActive={activeHardware.includes('Neuromorphic Array')} />
                    <div className="ml-auto flex items-center gap-2 bg-white dark:bg-black/20 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                        <SparklesIcon className={`w-4 h-4 ${consciousnessState !== 'Idle' ? 'text-yellow-400 animate-pulse' : 'text-gray-400'}`} />
                        <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">{consciousnessState}</span>
                    </div>
                </div>
            </header>
            
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Left: Department & Agent Selection */}
                <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2 pb-10">
                    {/* Parent AI */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                         {parentAI.status === 'Working' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-gradient-x"></div>}
                        <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <BoltIcon className="w-5 h-5 text-yellow-500"/> Parent AI (Genesis Core)
                        </h2>
                        <AgentCard agent={parentAI} />
                    </div>

                    {/* Departments Grid */}
                    <div>
                        <h2 className="font-bold text-lg mb-3 text-gray-700 dark:text-gray-300 flex items-center justify-between">
                            <span>Sub-Agent Domains</span>
                            <span className="text-xs font-normal bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{departments.length} Domains</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {departments.map(dept => {
                                const DeptIcon = deptIcons[dept.name] || Cog6ToothIcon;
                                const isDeptSelected = selectedDepartmentId === dept.id;
                                const isWorking = dept.manager.status === 'Working';
                                const activeEmployees = dept.employees.filter(e => e.status === 'Working').length;
                                
                                return (
                                    <div key={dept.id} className={`border rounded-lg transition-all duration-300 ${isWorking ? 'border-green-400 ring-1 ring-green-400 shadow-lg' : 'border-gray-200 dark:border-gray-700'} ${isDeptSelected ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-800'}`}>
                                        <div 
                                            className="p-3 flex items-center justify-between cursor-pointer border-b border-gray-100 dark:border-gray-700/50"
                                            onClick={() => handleDepartmentSelect(dept.id)}
                                        >
                                            <h3 className="font-bold flex items-center gap-2 text-sm">
                                                <DeptIcon className={`w-5 h-5 ${isWorking ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} /> 
                                                {dept.name}
                                            </h3>
                                            <div className="flex gap-2">
                                                 {isWorking && <span className="text-xs font-bold text-green-600 animate-pulse">{activeEmployees} Active</span>}
                                                 <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-500">{dept.employees.length}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Manager & Employees (Visible if dept selected or simulation running in this dept) */}
                                        <div className={`p-3 space-y-3 ${(isDeptSelected || isWorking) ? 'block' : 'hidden'}`}>
                                            <div className="pl-2 border-l-2 border-gray-200 dark:border-gray-600">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Sub-Core Lead</p>
                                                <AgentCard agent={dept.manager} />
                                            </div>
                                            
                                            {/* Only show employees if the department is expanded or working */}
                                            <div className="pl-2 border-l-2 border-gray-200 dark:border-gray-600">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Worker Agents</p>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {dept.employees.map(emp => (
                                                        <AgentCard 
                                                            key={emp.id} 
                                                            agent={emp} 
                                                            isSelected={selectedAgentId === emp.id}
                                                            onSelect={() => setSelectedAgentId(emp.id)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Live Logs & Tasks */}
                <aside className="lg:col-span-1 space-y-4 flex flex-col min-h-0">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col flex-1 min-h-[300px] shadow-sm">
                        <h2 className="p-3 font-bold border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg text-sm">
                           <ArrowPathIcon className={`w-4 h-4 text-blue-500 ${isRunning ? 'animate-spin' : ''}`} /> Live Agent Feed
                        </h2>
                        <div className="flex-1 p-3 font-mono text-[10px] md:text-xs text-gray-600 dark:text-gray-300 overflow-y-auto bg-gray-50 dark:bg-black/20">
                            {log.map((entry, i) => (
                                <div key={i} className="mb-1.5 border-l-2 border-blue-500 pl-2 animate-fade-in-up leading-tight">
                                    {entry}
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[350px] shadow-sm">
                        <h2 className="p-3 font-bold border-b border-gray-200 dark:border-gray-700 text-sm flex justify-between items-center">
                            <span>Task Queue</span>
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === 'In Progress').length} Running</span>
                        </h2>
                         <div className="p-3 space-y-2 text-sm overflow-y-auto">
                            {tasks.length === 0 && <p className="text-gray-400 text-center italic text-xs mt-4">No tasks in queue. Workforce idle.</p>}
                            {tasks.map(task => (
                                <div key={task.id} className={`p-2 rounded-md border-l-4 text-xs transition-all ${task.status === 'Completed' ? 'bg-green-50 dark:bg-green-900/10 border-green-500 opacity-60' : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500'}`}>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{task.description}</p>
                                    <div className="flex justify-between mt-1 text-gray-500">
                                        <span>{task.status}</span>
                                        {task.assignee && <span className="font-mono opacity-70">{task.assignee.split('-')[0]}-{task.assignee.split('-')[1]}</span>}
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
