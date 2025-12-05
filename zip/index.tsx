
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Types & Constants ---

// Exactly matching the requested department flow
const DEPARTMENTS = [
  'Sample',
  'Shima Seiki', 
  'Mending', 
  'Katchi', 
  'Washing', 
  'Cutting', 
  'Linking', 
  'Printing', 
  'Dyeing', 
  'Turpai', 
  'Half Stitching', 
  'Kaj Button', 
  'Stitching', 
  'Finishing', 
  'Final Wash', 
  'Final Finishing', 
  'Packing', 
  'Dispatch'
];

interface ProductionRow {
  id: string;
  buyerPo: string;
  style: string;
  color: string;
  date: string;
  orderQty: number;
  orderStatus: string; 
  category: string;    
  name: string;        
  // Map of Department Name -> [Received, Issued]
  tracking: Record<string, { recd: number; issue: number }>;
}

// Helper to create tracking object easily
const createTracking = (values: number[]) => {
  const tracking: Record<string, { recd: number; issue: number }> = {};
  DEPARTMENTS.forEach((dept, index) => {
    // 2 values per department: Recd, Issue
    // If values run out, default to 0
    const recd = values[index * 2] || 0;
    const issue = values[index * 2 + 1] || 0;
    tracking[dept] = { recd, issue };
  });
  return tracking;
};

const INITIAL_DATA: ProductionRow[] = [
  {
    id: '1',
    buyerPo: '3402/3417/3429',
    style: '1336',
    color: 'Black',
    date: '27/10/2025',
    orderQty: 20,
    orderStatus: 'In Production',
    category: 'Sweaters',
    name: 'John Doe',
    // 0 20 0 0 0 0 20 20 20 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 6 6 (parsed from prompt)
    tracking: createTracking([0, 20, 0, 0, 0, 0, 20, 20, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6])
  },
  {
    id: '2',
    buyerPo: '3402/3417/3429',
    style: '1336',
    color: 'OLIVE',
    date: '27/10/2025',
    orderQty: 20,
    orderStatus: 'In Production',
    category: 'Sweaters',
    name: 'John Doe',
    tracking: createTracking([0, 20, 0, 0, 0, 0, 20, 20, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6])
  },
  {
    id: '3',
    buyerPo: '3402/3417/3429',
    style: '1336',
    color: 'NATURAL',
    date: '27/10/2025',
    orderQty: 20,
    orderStatus: 'Pending Material',
    category: 'Sweaters',
    name: 'Jane Smith',
    tracking: createTracking([0, 20, 0, 0, 0, 0, 20, 20, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  },
  {
    id: '4',
    buyerPo: '3402/3417/3429',
    style: '1337',
    color: 'OLIVE',
    date: '27/10/2025',
    orderQty: 20,
    orderStatus: 'In Production',
    category: 'Sweaters',
    name: 'John Doe',
    // 0 20 0 0 0 0 20 20 20 20 0 0 0 0 0 0 0 0 0 0 0 0 0 0 20 20 20 0 0 0 0 0 0 6 6
    tracking: createTracking([0, 20, 0, 0, 0, 0, 20, 20, 20, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 20, 20, 0, 0, 0, 0, 0, 0, 6, 6])
  },
  {
    id: '5',
    buyerPo: '3402/3417/3429',
    style: '1337',
    color: 'NATURAL',
    date: '27/10/2025',
    orderQty: 20,
    orderStatus: 'In Production',
    category: 'Sweaters',
    name: 'Jane Smith',
    tracking: createTracking([0, 20, 0, 0, 0, 0, 20, 20, 20, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 20, 20, 0, 0, 0, 0, 0, 0, 6, 6])
  },
  {
    id: '6',
    buyerPo: '3402/3417/3429',
    style: '1337',
    color: 'Black',
    date: '27/10/2025',
    orderQty: 17,
    orderStatus: 'Delayed',
    category: 'Sweaters',
    name: 'Jane Smith',
    tracking: createTracking([0, 14, 0, 0, 0, 0, 14, 14, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  },
  {
    id: '7',
    buyerPo: '3402/3417/3429',
    style: '1337',
    color: 'COBALT',
    date: '27/10/2025',
    orderQty: 3,
    orderStatus: 'Delayed',
    category: 'Sweaters',
    name: 'John Doe',
    tracking: createTracking([0, 3, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0])
  },
  {
    id: '8',
    buyerPo: '3402/3417/3429',
    style: '1338',
    color: 'Black',
    date: '27/10/2025',
    orderQty: 20,
    orderStatus: 'In Production',
    category: 'Sweaters',
    name: 'Mike Ross',
    tracking: createTracking([0, 20, 0, 0, 0, 0, 20, 20, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6])
  },
  {
    id: '9',
    buyerPo: '3402/3417/3429',
    style: '1338',
    color: 'OLIVE',
    date: '27/10/2025',
    orderQty: 20,
    orderStatus: 'On Hold',
    category: 'Sweaters',
    name: 'Mike Ross',
    // 0 20 0 0 0 20 20 16 0 0 0 0 0 0 0 0 0 0 0 0 16 16 16 3 0 0 0 0 3 6 6
    tracking: createTracking([0, 20, 0, 0, 0, 20, 20, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 16, 3, 0, 0, 0, 0, 3, 6, 6])
  },
  {
    id: '10',
    buyerPo: '3402/3417/3429',
    style: '1338',
    color: 'NATURAL',
    date: '27/10/2025',
    orderQty: 17,
    orderStatus: 'In Production',
    category: 'Sweaters',
    name: 'Mike Ross',
    tracking: createTracking([0, 17, 0, 0, 0, 0, 17, 17, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 15, 15, 0, 0, 0, 0, 0, 0, 0])
  }
];

// --- Components ---

const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const App = () => {
  const [data, setData] = useState<ProductionRow[]>(INITIAL_DATA);
  const [filteredData, setFilteredData] = useState<ProductionRow[]>(INITIAL_DATA);
  
  // Filter States
  const [selectedBuyer, setSelectedBuyer] = useState('ORIENTIQUE');
  const [selectedProcess, setSelectedProcess] = useState('Sweaters');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedName, setSelectedName] = useState('All');

  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trivia'>('dashboard');
  const [triviaQuestion, setTriviaQuestion] = useState<string | null>(null);
  const [triviaAnswer, setTriviaAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('10:42 AM');

  // Filter Logic
  useEffect(() => {
    let result = data;
    if (selectedOrderStatus !== 'All') {
      result = result.filter(row => row.orderStatus === selectedOrderStatus);
    }
    if (selectedCategory !== 'All') {
      result = result.filter(row => row.category === selectedCategory);
    }
    if (selectedName !== 'All') {
      result = result.filter(row => row.name === selectedName);
    }
    setFilteredData(result);
  }, [data, selectedOrderStatus, selectedCategory, selectedName, selectedBuyer, selectedProcess]);

  // --- AI Logic ---

  const getAI = () => {
    if (!process.env.API_KEY) {
      alert("API Key not found in environment.");
      return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  };

  const analyzeProduction = async () => {
    const ai = getAI();
    if (!ai) return;

    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const dataStr = JSON.stringify(filteredData.map(d => ({
        po: d.buyerPo, style: d.style, color: d.color, qty: d.orderQty, tracking: d.tracking
      })), null, 2);
      
      const prompt = `
        You are a Production Manager AI Assistant. 
        Analyze the following textile production data for Buyer "${selectedBuyer}" and Process "${selectedProcess}".
        
        The flow is: ${DEPARTMENTS.join(' -> ')}.
        
        Identify:
        1. Bottlenecks (Departments where Received > Issued significantly).
        2. Stuck Styles (No movement in later stages like Stitching/Finishing).
        3. A brief summary of the overall health of these orders.
        
        Keep it concise and professional.
        Data: ${dataStr}
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      setAiResponse(result.text || "");
    } catch (error) {
      console.error(error);
      setAiResponse("Error generating analysis. Please check your API key.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const generateTrivia = async () => {
    const ai = getAI();
    if (!ai) return;

    setIsAiLoading(true);
    setTriviaQuestion(null);
    setTriviaAnswer(null);
    setShowAnswer(false);

    try {
      const dataStr = JSON.stringify(data.map(d => ({ style: d.style, color: d.color, tracking: d.tracking })), null, 2);
      const prompt = `
        Create a fun "Production Floor Trivia" question based on this data.
        The question should be something like "Which style has the most pieces stuck in Mending?" or "How many total pieces have been dispatched?".
        
        Return ONLY a JSON object with this format (do not use code blocks):
        {
          "question": "The question string",
          "answer": "The answer string"
        }

        Data: ${dataStr}
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      
      const text = result.text || "{}";
      const json = JSON.parse(text);
      setTriviaQuestion(json.question);
      setTriviaAnswer(json.answer);
    } catch (error) {
      console.error(error);
      setTriviaQuestion("Failed to generate trivia.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 2000);
  };

  // --- Helpers ---
  
  const uniqueOrderStatuses = ['All', ...Array.from(new Set(data.map(row => row.orderStatus)))];
  const uniqueCategories = ['All', ...Array.from(new Set(data.map(row => row.category)))];
  const uniqueNames = ['All', ...Array.from(new Set(data.map(row => row.name)))];

  // --- Views ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between h-24">
          <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Total Orders</div>
          <div className="text-2xl font-bold text-gray-800">{filteredData.length}</div>
          <div className="text-[10px] text-green-600 font-medium">Active</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between h-24">
          <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Total Qty</div>
          <div className="text-2xl font-bold text-indigo-600">{filteredData.reduce((a, b) => a + b.orderQty, 0)}</div>
          <div className="text-[10px] text-indigo-400 font-medium">Pieces</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between h-24">
          <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Start (Sample)</div>
          <div className="text-2xl font-bold text-emerald-600">
            {filteredData.reduce((acc, row) => acc + (row.tracking['Sample']?.issue || 0), 0)}
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">Issued</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between h-24">
          <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Dispatched</div>
          <div className="text-2xl font-bold text-blue-600">
            {filteredData.reduce((acc, row) => acc + (row.tracking['Dispatch']?.issue || 0), 0)}
          </div>
          <div className="text-[10px] text-blue-400 font-medium">Completed</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between h-24">
          <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Balance</div>
          <div className="text-2xl font-bold text-amber-600">
             {filteredData.reduce((a, b) => a + b.orderQty, 0) - filteredData.reduce((acc, row) => acc + (row.tracking['Dispatch']?.issue || 0), 0)}
          </div>
          <div className="text-[10px] text-amber-400 font-medium">Remaining</div>
        </div>
      </div>

      {/* Main Tracking Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[650px]">
        {/* Table Toolbar */}
        <div className="p-3 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Tracking
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 border border-green-200">
              Synced: {lastSyncTime}
            </span>
          </div>
          
          <div className="flex gap-2 items-center flex-wrap justify-end">
             {/* Google Sheet Links */}
             <a href="https://docs.google.com/spreadsheets/d/1S9ziNHvrrCKT0bedv4qeoLSTdTU5Oi8gnKIhnxf5OKY/edit?gid=1062268421#gid=1062268421" target="_blank" rel="noopener noreferrer" 
                className="text-[10px] flex items-center gap-1 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors text-blue-700 font-medium" title="Buyer Order Details">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6zM8 12h8m-4-4v8" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                <span>Buyer Orders</span>
             </a>
             <a href="https://docs.google.com/spreadsheets/d/1JZch3lt4rQIa9ALITGLnnbNEXyZwYJ9_4j8oX1M6m0E/edit?gid=715958833#gid=715958833" target="_blank" rel="noopener noreferrer" 
                className="text-[10px] flex items-center gap-1 px-2 py-1.5 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors text-green-700 font-medium" title="Production Data Sheet">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" stroke="none"/></svg>
                <span>Production Data</span>
             </a>

             <div className="h-4 border-r border-gray-300 mx-1"></div>

             <button 
                onClick={handleSync}
                className="text-[10px] flex items-center gap-1 px-3 py-1.5 bg-indigo-600 border border-indigo-600 rounded hover:bg-indigo-700 transition-colors text-white shadow-sm"
                disabled={isSyncing}
             >
                {isSyncing ? <LoadingSpinner /> : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                )}
                <span>Sync</span>
             </button>
          </div>
        </div>
        
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="min-w-max text-xs text-left border-collapse">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-30 font-bold tracking-tight">
              <tr>
                {/* Fixed Columns Header */}
                <th className="px-2 py-3 sticky left-0 bg-gray-100 z-40 border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[120px]">Buyer Po</th>
                <th className="px-2 py-3 sticky left-[120px] bg-gray-100 z-40 border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[60px]">Style Name</th>
                <th className="px-2 py-3 sticky left-[180px] bg-gray-100 z-40 border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[80px]">Colour</th>
                <th className="px-2 py-3 sticky left-[260px] bg-gray-100 z-40 border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[80px] text-center">Shpt Date</th>
                <th className="px-2 py-3 border-r border-gray-300 min-w-[50px] text-center bg-gray-100 z-30">Order Qty</th>
                
                {/* Dynamic Departments Header */}
                {DEPARTMENTS.map(dept => (
                  <th key={dept} colSpan={2} className="px-1 py-2 text-center border-r border-gray-300 min-w-[70px] bg-gray-50">
                    <div className="truncate w-full text-[10px]" title={dept}>{dept}</div>
                  </th>
                ))}
              </tr>
              {/* Sub Header for Recd / Issue */}
              <tr>
                <th className="sticky left-0 bg-gray-100 z-40 border-r border-gray-300 border-b"></th>
                <th className="sticky left-[120px] bg-gray-100 z-40 border-r border-gray-300 border-b"></th>
                <th className="sticky left-[180px] bg-gray-100 z-40 border-r border-gray-300 border-b"></th>
                <th className="sticky left-[260px] bg-gray-100 z-40 border-r border-gray-300 border-b"></th>
                <th className="border-r border-gray-300 border-b"></th>
                {DEPARTMENTS.map(dept => (
                  <React.Fragment key={dept + '-sub'}>
                    <th className="px-1 py-1 text-center text-[9px] text-gray-500 border-r border-gray-200 bg-gray-50 border-b min-w-[35px]">Recd</th>
                    <th className="px-1 py-1 text-center text-[9px] text-gray-500 border-r border-gray-300 bg-gray-50 border-b min-w-[35px]">Issue</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-indigo-50 transition-colors group">
                  <td className="px-2 py-2 font-medium text-gray-900 sticky left-0 bg-white z-20 border-r border-gray-200 group-hover:bg-indigo-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-[11px] truncate max-w-[120px]" title={row.buyerPo}>
                    {row.buyerPo}
                  </td>
                  <td className="px-2 py-2 font-medium text-gray-600 sticky left-[120px] bg-white z-20 border-r border-gray-200 group-hover:bg-indigo-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-[11px]">
                    {row.style}
                  </td>
                  <td className="px-2 py-2 text-gray-500 sticky left-[180px] bg-white z-20 border-r border-gray-200 group-hover:bg-indigo-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-[10px]">
                    <span className="truncate block max-w-[70px]" title={row.color}>
                      {row.color}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-gray-500 sticky left-[260px] bg-white z-20 border-r border-gray-200 group-hover:bg-indigo-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-[10px] text-center">
                    {row.date}
                  </td>
                  <td className="px-2 py-2 font-bold text-center border-r border-gray-200 text-gray-800 text-[11px] bg-gray-50">
                    {row.orderQty}
                  </td>
                  {DEPARTMENTS.map(dept => {
                    const stats = row.tracking[dept] || { recd: 0, issue: 0 };
                    // Highlight logic
                    const hasActivity = stats.recd > 0 || stats.issue > 0;
                    const isBottleneck = stats.recd > stats.issue;
                    
                    return (
                      <React.Fragment key={dept}>
                        <td className={`px-1 py-2 text-center border-r border-gray-100 text-[10px] ${stats.recd > 0 ? 'text-gray-900 font-medium' : 'text-gray-200'}`}>
                          {stats.recd > 0 ? stats.recd : (hasActivity ? '0' : '-')}
                        </td>
                        <td className={`px-1 py-2 text-center border-r border-gray-300 text-[10px] ${
                            isBottleneck ? 'bg-amber-50 text-amber-600 font-bold' : 
                            (stats.issue > 0 ? 'text-indigo-600 font-medium' : 'text-gray-200')
                          }`}>
                          {stats.issue > 0 ? stats.issue : (hasActivity ? '0' : '-')}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 sticky bottom-0 z-30 shadow-[0_-2px_5px_-2px_rgba(0,0,0,0.1)]">
                <td className="px-2 py-2 sticky left-0 bg-gray-100 z-40 border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Totals</td>
                <td className="sticky left-[120px] bg-gray-100 z-40 border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></td>
                <td className="sticky left-[180px] bg-gray-100 z-40 border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></td>
                <td className="sticky left-[260px] bg-gray-100 z-40 border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></td>
                <td className="px-2 py-2 text-center border-r border-gray-300 text-indigo-700 bg-gray-100">{filteredData.reduce((a,b)=>a+b.orderQty,0)}</td>
                {DEPARTMENTS.map(dept => {
                   const totalRecd = filteredData.reduce((acc, row) => acc + (row.tracking[dept]?.recd || 0), 0);
                   const totalIssue = filteredData.reduce((acc, row) => acc + (row.tracking[dept]?.issue || 0), 0);
                   return (
                     <React.Fragment key={'total-'+dept}>
                       <td className="px-1 py-2 text-center text-[10px] border-r border-gray-200 text-gray-600 bg-gray-100">{totalRecd}</td>
                       <td className="px-1 py-2 text-center text-[10px] border-r border-gray-300 text-gray-800 bg-gray-100">{totalIssue}</td>
                     </React.Fragment>
                   )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-r from-slate-800 to-indigo-900 rounded-xl shadow-xl text-white p-6 mt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              AI Production Analyst
            </h3>
            <p className="text-indigo-200 text-sm mt-1">Analyzing flow for {selectedBuyer} / {selectedProcess}</p>
          </div>
          <button 
            onClick={analyzeProduction}
            disabled={isAiLoading}
            className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-100 px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-indigo-500/30 transition-colors flex items-center gap-2"
          >
            {isAiLoading ? <LoadingSpinner /> : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                Run Analysis
              </>
            )}
          </button>
        </div>
        
        {aiResponse && (
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 text-sm leading-relaxed border border-white/10 animate-fade-in shadow-inner">
            <pre className="whitespace-pre-wrap font-sans text-gray-200">{aiResponse}</pre>
          </div>
        )}
        {!aiResponse && !isAiLoading && (
          <div className="text-indigo-300/50 text-sm italic border-l-2 border-indigo-500/30 pl-3">
            Click "Run Analysis" to identify bottlenecks in Shima Seiki, Washing, or Dispatch.
          </div>
        )}
      </div>
    </div>
  );

  const renderTrivia = () => (
    <div className="max-w-2xl mx-auto space-y-8 py-10">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-800">Production Floor Trivia</h2>
        <p className="text-gray-500">How well do you know the current status?</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 min-h-[300px] flex flex-col justify-center items-center text-center relative overflow-hidden">
        {isAiLoading ? (
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner />
            <p className="text-gray-400 font-medium">Generating question from live data...</p>
          </div>
        ) : !triviaQuestion ? (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-gray-600">Ready to test your knowledge?</p>
            <button 
              onClick={generateTrivia}
              className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-700 transform hover:scale-105 transition-all"
            >
              Start Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-6 w-full animate-slide-up">
             <div className="text-xs font-bold tracking-widest text-indigo-500 uppercase">Question</div>
             <h3 className="text-2xl font-bold text-gray-800">{triviaQuestion}</h3>
             
             {!showAnswer ? (
               <button 
                 onClick={() => setShowAnswer(true)}
                 className="mt-8 text-indigo-600 font-semibold hover:underline"
               >
                 Show Answer
               </button>
             ) : (
               <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200 animate-fade-in">
                 <div className="text-xs font-bold text-green-600 uppercase mb-1">Answer</div>
                 <div className="text-xl font-bold text-green-800">{triviaAnswer}</div>
               </div>
             )}
             
             <div className="pt-8 border-t border-gray-100 mt-8">
               <button 
                 onClick={generateTrivia}
                 className="text-gray-400 hover:text-gray-600 text-sm font-medium flex items-center justify-center gap-2 mx-auto"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                 Next Question
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-indigo-100">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 10px; width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 6px; border: 2px solid #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .animate-slide-up { animation: fade-in 0.5s ease-out forwards; }
      `}</style>

      {/* Sidebar / Navigation */}
      <nav className="fixed top-0 left-0 h-full w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 z-50 shadow-sm">
        <div className="mb-8 p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
        </div>
        
        <div className="space-y-6 w-full flex flex-col items-center">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600 shadow-inner ring-1 ring-indigo-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            title="Dashboard"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
          </button>
          <button 
            onClick={() => setActiveTab('trivia')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'trivia' ? 'bg-indigo-50 text-indigo-600 shadow-inner ring-1 ring-indigo-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            title="Production Trivia"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="ml-20 p-6 md:p-8 max-w-[1920px]">
        {/* Header */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              Production Order Tracking
            </h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
              Dashboard for <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{selectedBuyer}</span>
              process <span className="font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">{selectedProcess}</span>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
             
             {/* Buyer Filter */}
             <div className="relative group">
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Buyer</label>
                <select 
                  className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1.5 pl-2 pr-6 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-xs w-28 cursor-pointer hover:bg-gray-100 transition-colors"
                  value={selectedBuyer}
                  onChange={(e) => setSelectedBuyer(e.target.value)}
                >
                  <option>ORIENTIQUE</option>
                  <option>NORDSTROM</option>
                  <option>ZARA</option>
                  <option>H&M</option>
                </select>
             </div>

             {/* Process Filter */}
             <div className="relative group">
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Process</label>
                <select 
                  className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1.5 pl-2 pr-6 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-xs w-24 cursor-pointer hover:bg-gray-100 transition-colors"
                  value={selectedProcess}
                  onChange={(e) => setSelectedProcess(e.target.value)}
                >
                  <option>Sweaters</option>
                  <option>Wovens</option>
                  <option>Denim</option>
                </select>
             </div>

             {/* Order Status Filter */}
             <div className="relative group">
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Status</label>
                <select 
                  className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1.5 pl-2 pr-6 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-xs w-28 cursor-pointer hover:bg-gray-100 transition-colors"
                  value={selectedOrderStatus}
                  onChange={(e) => setSelectedOrderStatus(e.target.value)}
                >
                  {uniqueOrderStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>

             {/* Category Filter */}
             <div className="relative group">
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Category</label>
                <select 
                  className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1.5 pl-2 pr-6 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-xs w-24 cursor-pointer hover:bg-gray-100 transition-colors"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                   {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>

            {/* Name Filter */}
             <div className="relative group">
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Name</label>
                <select 
                  className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1.5 pl-2 pr-6 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-xs w-24 cursor-pointer hover:bg-gray-100 transition-colors"
                  value={selectedName}
                  onChange={(e) => setSelectedName(e.target.value)}
                >
                   {uniqueNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
             </div>

             <div className="h-8 w-8 ml-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-lg ring-2 ring-white cursor-pointer hover:scale-110 transition-transform">
                JD
             </div>
          </div>
        </header>

        {activeTab === 'dashboard' ? renderDashboard() : renderTrivia()}
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
