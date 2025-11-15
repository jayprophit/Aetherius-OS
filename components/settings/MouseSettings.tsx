import React, { useState } from 'react';

const Card: React.FC<{ title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">{title}</h2>
        {children}
    </div>
);

const ToggleRow: React.FC<{ title: string, description?: string, initialValue?: boolean }> = ({ title, description, initialValue = true }) => {
    const [toggled, setToggled] = useState(initialValue);
    return (
        <div className="flex justify-between items-center py-3">
            <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">{title}</p>
                {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
            </div>
            <button 
                onClick={() => setToggled(!toggled)} 
                role="switch" 
                aria-checked={toggled} 
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${toggled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${toggled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
};

export const MouseSettings: React.FC<{ title: string }> = ({ title }) => {
    const [primaryButton, setPrimaryButton] = useState('left');

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1">{title}</h1>
            
            <Card title="Buttons">
                <div className="space-y-3">
                    <p className="font-medium">Primary mouse button</p>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input type="radio" name="primary-button" value="left" checked={primaryButton === 'left'} onChange={() => setPrimaryButton('left')} className="form-radio text-blue-600" />
                            <span>Left</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" name="primary-button" value="right" checked={primaryButton === 'right'} onChange={() => setPrimaryButton('right')} className="form-radio text-blue-600" />
                            <span>Right</span>
                        </label>
                    </div>
                </div>
            </Card>

            <Card title="Pointer Speed">
                <div className="flex items-center gap-4">
                    <span>Slow</span>
                    <input type="range" min="1" max="10" defaultValue="5" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                    <span>Fast</span>
                </div>
            </Card>

            <Card title="Scrolling">
                <div className="space-y-4">
                    <div>
                        <p className="font-medium mb-2">Scroll speed</p>
                        <div className="flex items-center gap-4">
                            <span>Slow</span>
                            <input type="range" min="1" max="10" defaultValue="4" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                            <span>Fast</span>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <ToggleRow title="Natural scrolling" description="Content tracks finger movement." initialValue={true}/>
                    </div>
                </div>
            </Card>

            <Card title="Side Buttons">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Customize the actions for your mouse's side buttons.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Button 4 (Forward)</label>
                        <select className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm">
                            <option>Forward</option>
                            <option>Back</option>
                            <option>Mission Control</option>
                            <option>None</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Button 5 (Back)</label>
                        <select className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm">
                            <option>Back</option>
                            <option>Forward</option>
                            <option>Launch AI</option>
                            <option>None</option>
                        </select>
                    </div>
                </div>
            </Card>
        </div>
    );
};
