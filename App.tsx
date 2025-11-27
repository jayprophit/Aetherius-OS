import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";

// Define the Task interface with new Priority field
interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate: string; // ISO Date string YYYY-MM-DD
  priority: 'High' | 'Medium' | 'Low';
}

const App: React.FC = () => {
  // Task State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Filter & Sort State
  const [filterPriority, setFilterPriority] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Completed' | 'Pending'>('All');
  const [sortOrder, setSortOrder] = useState<'Asc' | 'Desc'>('Asc');

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');

  // Add Task Function
  const addTask = () => {
    if (newTask.trim() === '') return;
    const task: Task = {
      id: Date.now().toString(),
      text: newTask,
      completed: false,
      dueDate: newDate,
      priority: newPriority,
    };
    setTasks([...tasks, task]);
    setNewTask('');
    setNewDate('');
    setNewPriority('Medium'); // Reset to default
  };

  // Toggle Completion
  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Delete Task with Confirmation
  const deleteTask = (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this task?")) {
      setTasks(tasks.filter((task) => task.id !== id));
    }
  };

  // AI Suggestions Handler
  const getAiSuggestions = async () => {
    if (!process.env.API_KEY) {
      alert("Please set the API_KEY environment variable.");
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = "gemini-2.5-flash";
      
      const prompt = `I have these tasks: ${tasks.map(t => t.text).join(', ')}. 
      Suggest 3 concise, actionable sub-tasks or related tasks for: "${aiPrompt || 'general productivity'}". 
      Return strictly a JSON array of strings.`;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const suggestions = JSON.parse(response.text || "[]");
      
      if (Array.isArray(suggestions)) {
        const newTasks = suggestions.map((text: string) => ({
          id: Date.now().toString() + Math.random(),
          text: text,
          completed: false,
          dueDate: '',
          priority: 'Medium' as const
        }));
        setTasks([...tasks, ...newTasks]);
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert("Failed to get AI suggestions.");
    }
  };

  // Derived state for Filtering and Sorting
  const processedTasks = useMemo(() => {
    let result = [...tasks];

    // 1. Filter by Priority
    if (filterPriority !== 'All') {
      result = result.filter(t => t.priority === filterPriority);
    }

    // 2. Filter by Status
    if (filterStatus !== 'Completed') { // If not asking specifically for completed
       if (filterStatus === 'Pending') {
         result = result.filter(t => !t.completed);
       }
    } else {
       result = result.filter(t => t.completed);
    }

    // 3. Sort by Due Date
    result.sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity; // No date goes to bottom
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;

      if (sortOrder === 'Asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });

    return result;
  }, [tasks, filterPriority, filterStatus, sortOrder]);

  // Check for overdue
  const isOverdue = (dateStr: string, isCompleted: boolean) => {
    if (!dateStr || isCompleted) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
    const due = new Date(dateStr);
    return due < today;
  };

  return (
    <div>
      <h1>GenAI Task Manager</h1>

      {/* Input Section */}
      <div className="input-group">
        <input
          type="text"
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
        />
        <input 
          type="date" 
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          title="Due Date"
        />
        <select 
          value={newPriority} 
          onChange={(e) => setNewPriority(e.target.value as 'High' | 'Medium' | 'Low')}
          title="Priority"
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <button className="add-btn" onClick={addTask}>Add</button>
      </div>

      {/* AI Section */}
      <div className="input-group" style={{marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px'}}>
        <input 
            type="text" 
            placeholder="Ask AI for sub-tasks (e.g., 'Plan a party')"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
        />
        <button className="ai-btn" onClick={getAiSuggestions}>✨ AI Suggest</button>
      </div>

      {/* Filter Controls */}
      <div className="controls">
        <div className="control-group">
          <label>Priority:</label>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as any)}>
            <option value="All">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="control-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="control-group">
          <label>Sort Due Date:</label>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}>
            <option value="Asc">Earliest First</option>
            <option value="Desc">Latest First</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <ul>
        {processedTasks.map((task) => {
          const overdue = isOverdue(task.dueDate, task.completed);
          
          return (
            <li 
              key={task.id} 
              className={`task-item priority-${task.priority} ${task.completed ? 'completed' : ''} ${overdue ? 'overdue' : ''}`}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
              />
              
              <div className="task-content">
                <div className="task-header">
                  <span style={{ fontWeight: 500 }}>{task.text}</span>
                  <span className={`badge ${task.priority}`}>{task.priority}</span>
                </div>
                
                <div className="task-meta">
                   {task.dueDate && (
                     <span className="due-date">
                       Due: {task.dueDate} {overdue ? '(Overdue)' : ''}
                     </span>
                   )}
                </div>
              </div>

              <div className="actions">
                <button className="delete-btn" onClick={() => deleteTask(task.id)}>Delete</button>
              </div>
            </li>
          );
        })}
      </ul>
      
      {processedTasks.length === 0 && <p style={{textAlign: 'center', color: '#888'}}>No tasks found.</p>}
    </div>
  );
};

export default App;
