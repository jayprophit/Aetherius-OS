
import React, { useState } from 'react';
import { Globe, Shield, Cpu, Link } from 'lucide-react'; // Assuming lucide-react or similar icon lib

const QuantumBrowser = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [activeLayer, setActiveLayer] = useState('all');

  const handleSearch = async () => {
    // Call Gateway API
    const res = await fetch('/api/v1/query', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ prompt: query, type: 'research' })
    });
    const data = await res.json();
    setResults(data.search_results?.data || {});
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-green-400 font-mono p-4">
      {/* Address Bar */}
      <div className="flex items-center bg-slate-800 p-2 rounded border border-green-500/30 mb-4">
        <div className="mr-4 flex space-x-2">
          <Globe size={16} className={activeLayer === 'surface' ? 'text-blue-400' : 'text-gray-500'} />
          <Shield size={16} className={activeLayer === 'onion' ? 'text-purple-400' : 'text-gray-500'} />
          <Link size={16} className={activeLayer === 'blockchain' ? 'text-yellow-400' : 'text-gray-500'} />
        </div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent border-none outline-none flex-grow text-white"
          placeholder="Enter query or quantum address..."
        />
        <button onClick={handleSearch} className="bg-green-600 text-black px-4 py-1 rounded hover:bg-green-500">
          QUANTUM SEARCH
        </button>
      </div>

      {/* Results Area */}
      <div className="flex-grow overflow-auto">
        {results && Object.entries(results).map(([layer, items]: [string, any]) => (
          <div key={layer} className="mb-6">
            <h3 className="text-xl border-b border-gray-700 mb-2 uppercase">{layer} Layer</h3>
            {items.map((item: any, idx: number) => (
              <div key={idx} className="mb-3 p-3 bg-slate-800/50 rounded border-l-2 border-green-500 hover:bg-slate-800">
                <div className="flex justify-between">
                  <a href={item.url} className="text-blue-400 hover:underline text-lg">{item.url}</a>
                  <span className="text-xs text-gray-400">Q-Score: {item.quantum_score.toFixed(4)}</span>
                </div>
                <p className="text-sm text-gray-300 mt-1">{item.snippet}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Footer / Status */}
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>TOR PROXY: CONNECTED</span>
        <span>QUANTUM ENCRYPTION: ACTIVE (Kyber-1024)</span>
        <span>WILLOW CHIP: SIMULATION MODE</span>
      </div>
    </div>
  );
};

export default QuantumBrowser;
