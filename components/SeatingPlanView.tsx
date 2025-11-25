
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Desk, SeatingLayout, BehaviourEntry, SafeguardingCase } from '../types';
import { STUDENTS } from '../data/students';
import html2canvas from 'html2canvas';
import { 
  LayoutGrid, 
  Save, 
  Plus, 
  Trash2, 
  RotateCw, 
  X, 
  Monitor, 
  Armchair,
  Grid,
  CheckCircle2,
  Image,
  Loader2,
  Edit2,
  ChevronDown,
  Circle,
  Box,
  Settings2,
  Zap,
  Shield
} from 'lucide-react';

interface SeatingPlanViewProps {
  onSave?: (layout: SeatingLayout) => void;
  behaviourEntries?: BehaviourEntry[];
  safeguardingCases?: SafeguardingCase[];
}

const SeatingPlanView: React.FC<SeatingPlanViewProps> = ({ onSave, behaviourEntries = [], safeguardingCases = [] }) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [desks, setDesks] = useState<Desk[]>([]);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState<string>('Standard Layout');
  
  // Data Layer Modes
  const [viewMode, setViewMode] = useState<'STANDARD' | 'HEATMAP' | 'RISK_RADAR'>('STANDARD');

  // Multiple Plans Management
  const [availablePlans, setAvailablePlans] = useState<SeatingLayout[]>([]);
  
  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Auto-Arrange Config State
  const [showAutoArrangeModal, setShowAutoArrangeModal] = useState(false);
  const [gridCols, setGridCols] = useState(5);
  const [gridSpacingX, setGridSpacingX] = useState(120);
  const [gridSpacingY, setGridSpacingY] = useState(100);

  // Dragging State
  const [isDraggingDesk, setIsDraggingDesk] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Load classes
  const uniqueClasses = useMemo(() => Array.from(new Set(STUDENTS.map(s => s.studentClass).filter(Boolean))).sort(), []);

  // Fetch all layouts from storage
  const getAllLayouts = (): SeatingLayout[] => {
    try {
      const saved = localStorage.getItem('edulog_seating_layouts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading layouts", e);
      return [];
    }
  };

  // Load plans when class changes
  useEffect(() => {
    if (selectedClass) {
      const allLayouts = getAllLayouts();
      const classLayouts = allLayouts.filter(l => l.className === selectedClass);
      
      setAvailablePlans(classLayouts);

      if (classLayouts.length > 0) {
        // Load the most recently updated or first plan
        const toLoad = classLayouts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
        loadLayout(toLoad);
      } else {
        handleNewPlan();
      }
    } else {
        setDesks([]);
        setAvailablePlans([]);
    }
  }, [selectedClass]);

  // Clear success message
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const loadLayout = (layout: SeatingLayout) => {
      setDesks(layout.desks);
      setActiveLayoutId(layout.id);
      setLayoutName(layout.name || 'Standard Layout');
  };

  const handleNewPlan = () => {
      setDesks([]);
      setActiveLayoutId(crypto.randomUUID());
      setLayoutName('New Seating Plan');
      setIsEditingName(true);
  };

  const handleDeletePlan = () => {
      if(!activeLayoutId) return;
      if(!window.confirm(`Are you sure you want to delete "${layoutName}"?`)) return;

      const allLayouts = getAllLayouts();
      const filtered = allLayouts.filter(l => l.id !== activeLayoutId);
      localStorage.setItem('edulog_seating_layouts', JSON.stringify(filtered));
      
      const remainingClassLayouts = filtered.filter(l => l.className === selectedClass);
      setAvailablePlans(remainingClassLayouts);
      
      if(remainingClassLayouts.length > 0) {
          loadLayout(remainingClassLayouts[0]);
      } else {
          handleNewPlan();
      }
  };

  const studentsInClass = useMemo(() => {
    return STUDENTS.filter(s => s.studentClass === selectedClass);
  }, [selectedClass]);

  const unseatedStudents = useMemo(() => {
    const seatedIds = desks.map(d => d.studentId).filter(Boolean);
    return studentsInClass.filter(s => !seatedIds.includes(s.id));
  }, [studentsInClass, desks]);

  const handleAddDesk = (type: Desk['type'] = 'STUDENT') => {
    if (!selectedClass) return;
    const newDesk: Desk = {
      id: crypto.randomUUID(),
      x: type === 'BOARD' ? 300 : 50 + (desks.length * 20) % 600,
      y: type === 'BOARD' ? 10 : 50 + (Math.floor(desks.length / 10) * 100) % 400,
      rotation: 0,
      type: type,
      studentId: undefined
    };
    setDesks([...desks, newDesk]);
  };

  const handleSave = () => {
    if (!selectedClass || !activeLayoutId) return;
    
    setIsSaving(true);
    
    setTimeout(() => {
        const newLayout: SeatingLayout = {
            id: activeLayoutId,
            name: layoutName,
            className: selectedClass,
            desks,
            updatedAt: new Date().toISOString()
        };

        try {
            const allLayouts = getAllLayouts();
            const otherLayouts = allLayouts.filter(l => l.id !== activeLayoutId);
            const updatedAll = [...otherLayouts, newLayout];
            localStorage.setItem('edulog_seating_layouts', JSON.stringify(updatedAll));
            setAvailablePlans(updatedAll.filter(l => l.className === selectedClass));
            setSaveSuccess(true);
            setIsEditingName(false);
        } catch (e) {
            console.error(e);
            alert('Failed to save layout locally.');
        } finally {
            setIsSaving(false);
        }
    }, 600);
  };

  const handleExportImage = async () => {
    if (!containerRef.current || !selectedClass) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#f1f5f9',
        scale: 2,
        logging: false
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `ClassroomPlan_${selectedClass}.png`;
      link.click();
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setIsExporting(false);
    }
  };

  const performAutoArrange = () => {
    if (!selectedClass) return;
    const startX = 50;
    const startY = 80;
    const newDesks: Desk[] = [
        { id: 'board', x: (gridCols * gridSpacingX) / 2, y: 10, rotation: 0, type: 'BOARD' },
        { id: 'teacher', x: (gridCols * gridSpacingX) + 50, y: 50, rotation: 180, type: 'TEACHER' }
    ];
    studentsInClass.forEach((student, index) => {
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      newDesks.push({
        id: crypto.randomUUID(),
        x: startX + (col * gridSpacingX),
        y: startY + (row * gridSpacingY),
        rotation: 0,
        type: 'STUDENT',
        studentId: student.id
      });
    });
    setDesks(newDesks);
    setShowAutoArrangeModal(false);
  };

  // Dragging Logic
  const handleMouseDown = (e: React.MouseEvent, deskId: string) => {
    e.stopPropagation();
    const desk = desks.find(d => d.id === deskId);
    if (!desk) return;
    setIsDraggingDesk(deskId);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingDesk || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left - dragOffset.x;
    const y = e.clientY - containerRect.top - dragOffset.y;
    setDesks(desks.map(d => d.id === isDraggingDesk ? { ...d, x, y } : d));
  };

  const handleMouseUp = () => setIsDraggingDesk(null);

  const handleTouchStart = (e: React.TouchEvent, deskId: string) => {
    e.stopPropagation();
    const desk = desks.find(d => d.id === deskId);
    if (!desk) return;
    setIsDraggingDesk(deskId);
    const touch = e.touches[0];
    const target = e.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    setDragOffset({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingDesk || !containerRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - containerRect.left - dragOffset.x;
    const y = touch.clientY - containerRect.top - dragOffset.y;
    setDesks(desks.map(d => d.id === isDraggingDesk ? { ...d, x, y } : d));
  };

  const handleDrop = (e: React.DragEvent, deskId: string) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData('studentId');
    if (!studentId) return;
    const cleanDesks = desks.map(d => d.studentId === studentId ? { ...d, studentId: undefined } : d);
    setDesks(cleanDesks.map(d => d.id === deskId ? { ...d, studentId } : d));
  };

  // Helper Calculations
  const getStudentScore = (id?: string) => {
      if(!id || !behaviourEntries) return 0;
      const student = STUDENTS.find(s => s.id === id);
      if(!student) return 0;
      return behaviourEntries
          .filter(b => b.studentName === student.name)
          .reduce((acc, curr) => acc + curr.points, 0);
  };

  const getRiskStatus = (id?: string) => {
      if (!id || !safeguardingCases) return null;
      const student = STUDENTS.find(s => s.id === id);
      if (!student) return null;
      const cases = safeguardingCases.filter(c => c.studentName === student.name && c.status !== 'Closed');
      if (cases.length === 0) return null;
      
      const isCritical = cases.some(c => c.generatedReport.riskLevel === 'High' || c.generatedReport.riskLevel === 'Critical');
      return isCritical ? 'Critical' : 'Active';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] animate-fade-in relative bg-slate-50" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchEnd={handleMouseUp}>
      
      {/* --- Control Command Bar --- */}
      <div className="bg-white border-b border-slate-200 p-3 flex flex-col xl:flex-row gap-4 items-center justify-between z-20 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-center">
            {/* Class Selector */}
            <div className="relative w-full md:w-56">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Grid size={16} />
                </div>
                <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 font-bold text-slate-700 text-sm"
                >
                    <option value="">Select Class...</option>
                    {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {selectedClass && (
                <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
                     {isEditingName ? (
                        <input 
                            type="text" 
                            value={layoutName} 
                            onChange={(e) => setLayoutName(e.target.value)} 
                            onBlur={() => setIsEditingName(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                            autoFocus
                            className="bg-white border border-blue-300 rounded px-2 py-1 text-sm font-bold w-40 outline-none"
                        />
                    ) : (
                        <div className="relative">
                             <select
                                value={activeLayoutId || ''}
                                onChange={(e) => {
                                    const plan = availablePlans.find(p => p.id === e.target.value);
                                    if(plan) loadLayout(plan);
                                }}
                                className="appearance-none bg-transparent font-bold text-slate-700 text-sm py-1 pl-3 pr-8 cursor-pointer outline-none hover:text-indigo-700 w-44 truncate"
                            >
                                {availablePlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    )}
                    <button onClick={() => setIsEditingName(true)} className="p-1.5 hover:bg-white rounded text-slate-500 shadow-sm" title="Rename"><Edit2 size={12} /></button>
                    <button onClick={handleNewPlan} className="p-1.5 hover:bg-white rounded text-slate-500 shadow-sm" title="New"><Plus size={14} /></button>
                    <button onClick={handleDeletePlan} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded text-slate-400 transition-colors" title="Delete"><Trash2 size={14} /></button>
                </div>
            )}
        </div>

        {selectedClass && (
            <div className="flex items-center space-x-4 w-full xl:w-auto justify-between xl:justify-end">
                {/* Visual Layers Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('STANDARD')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'STANDARD' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Standard
                    </button>
                    <button 
                        onClick={() => setViewMode('HEATMAP')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center ${viewMode === 'HEATMAP' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Zap size={12} className="mr-1" /> Behavior
                    </button>
                    <button 
                        onClick={() => setViewMode('RISK_RADAR')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center ${viewMode === 'RISK_RADAR' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Shield size={12} className="mr-1" /> Risks
                    </button>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setShowAutoArrangeModal(true)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Auto-Arrange">
                        <Settings2 size={20} />
                    </button>
                    <button onClick={handleExportImage} disabled={isExporting} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Export Image">
                        {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Image size={20} />}
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className={`flex items-center px-4 py-2 rounded-lg text-white font-medium shadow-md transition-all ${saveSuccess ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : saveSuccess ? <CheckCircle2 size={18} className="mr-2" /> : <Save size={18} className="mr-2" />}
                        {isSaving ? 'Saving' : saveSuccess ? 'Saved' : 'Save'}
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* --- Floating Toolbar (Desk Types) --- */}
      {selectedClass && (
        <div className="absolute left-4 top-24 flex flex-col gap-2 bg-white/90 backdrop-blur p-2 rounded-xl border border-slate-200 shadow-lg z-20">
            <button onClick={() => handleAddDesk('STUDENT')} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm" title="Student Desk">
                <Armchair size={20} />
            </button>
            <button onClick={() => handleAddDesk('GROUP_TABLE')} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm" title="Group Table">
                <Circle size={20} />
            </button>
            <button onClick={() => handleAddDesk('TEACHER')} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm" title="Teacher Desk">
                <Monitor size={20} />
            </button>
            <button onClick={() => handleAddDesk('RESOURCE')} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm" title="Resource">
                <Box size={20} />
            </button>
            <div className="h-px bg-slate-200 my-1"></div>
            <button onClick={() => setDesks([])} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm" title="Clear All">
                <Trash2 size={20} />
            </button>
        </div>
      )}

      {/* --- Main Workspace --- */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        
        {/* Canvas */}
        <div 
            ref={containerRef}
            className="flex-1 bg-slate-50 relative overflow-hidden cursor-crosshair touch-none"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
        >
             {/* Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ 
                     backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
                     backgroundSize: '40px 40px' 
                 }}>
            </div>

            {!selectedClass ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                    <LayoutGrid size={64} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a class to access the Command Center</p>
                </div>
            ) : (
                desks.map(desk => {
                    const studentName = STUDENTS.find(s => s.id === desk.studentId)?.name;
                    const score = viewMode === 'HEATMAP' ? getStudentScore(desk.studentId) : 0;
                    const risk = viewMode === 'RISK_RADAR' ? getRiskStatus(desk.studentId) : null;
                    
                    let deskStyle = 'bg-white border-slate-300 shadow-sm';
                    let labelStyle = 'text-slate-700';

                    if (viewMode === 'HEATMAP' && studentName) {
                         if (score > 2) { deskStyle = 'bg-green-50 border-green-400 shadow-md ring-2 ring-green-100'; labelStyle = 'text-green-800 font-bold'; }
                         else if (score < -2) { deskStyle = 'bg-red-50 border-red-400 shadow-md ring-2 ring-red-100'; labelStyle = 'text-red-800 font-bold'; }
                    }

                    if (viewMode === 'RISK_RADAR' && risk) {
                        if (risk === 'Critical') { deskStyle = 'bg-red-50 border-red-500 shadow-lg ring-4 ring-red-200/50 animate-pulse'; labelStyle = 'text-red-700 font-bold'; }
                        else { deskStyle = 'bg-orange-50 border-orange-400 shadow-md ring-2 ring-orange-100'; labelStyle = 'text-orange-800 font-bold'; }
                    }

                    return (
                        <div
                            key={desk.id}
                            style={{
                                position: 'absolute',
                                left: desk.x,
                                top: desk.y,
                                transform: `rotate(${desk.rotation}deg)`,
                                cursor: isDraggingDesk === desk.id ? 'grabbing' : 'grab',
                                transition: isDraggingDesk ? 'none' : 'transform 0.2s',
                            }}
                            onMouseDown={(e) => handleMouseDown(e, desk.id)}
                            onTouchStart={(e) => handleTouchStart(e, desk.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, desk.id)}
                            className={`group rounded-xl border-2 flex flex-col items-center justify-center relative select-none
                                ${desk.type === 'TEACHER' ? 'bg-amber-50 border-amber-300 w-32 h-20' :
                                  desk.type === 'BOARD' ? 'bg-slate-800 border-slate-900 w-72 h-4 text-white rounded-full' :
                                  desk.type === 'GROUP_TABLE' ? 'bg-white border-slate-300 w-36 h-36 rounded-full' :
                                  desk.type === 'RESOURCE' ? 'bg-emerald-50 border-emerald-300 w-24 h-24' :
                                  `${deskStyle} w-24 h-24`
                                }
                            `}
                        >
                             {/* Controls */}
                             <div className="absolute -top-3 -right-3 hidden group-hover:flex bg-white rounded-full shadow border border-slate-200 p-0.5 z-30 scale-90">
                                <button onClick={() => {
                                    const newRotation = (desk.rotation + 45) % 360;
                                    setDesks(desks.map(d => d.id === desk.id ? { ...d, rotation: newRotation } : d));
                                }} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><RotateCw size={12} /></button>
                                <button onClick={() => setDesks(desks.filter(d => d.id !== desk.id))} className="p-1 hover:bg-red-50 rounded-full text-red-500"><Trash2 size={12} /></button>
                            </div>

                            {/* Content */}
                            {desk.type === 'TEACHER' && <span className="text-amber-700 font-bold text-xs uppercase tracking-wider">Teacher</span>}
                            {desk.type === 'BOARD' && <span className="text-[9px] uppercase tracking-widest opacity-50">Interactive Board</span>}
                            {desk.type === 'RESOURCE' && <Box className="text-emerald-400" size={24}/>}

                            {(desk.type === 'STUDENT' || desk.type === 'GROUP_TABLE') && (
                                <>
                                    {studentName ? (
                                        <div className="text-center w-full px-1">
                                            {/* Avatar / Indicator */}
                                            <div className="flex justify-center mb-1">
                                                {viewMode === 'RISK_RADAR' && risk ? (
                                                     <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center border border-red-200">
                                                         <Shield size={14} />
                                                     </div>
                                                ) : viewMode === 'HEATMAP' && score !== 0 ? (
                                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs ${score > 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                         {score > 0 ? '+' : ''}{score}
                                                     </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs border border-slate-200">
                                                        {studentName.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <p className={`text-[10px] leading-tight line-clamp-2 ${labelStyle}`}>{studentName}</p>
                                            
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); const clean = desks.map(d => d.id === desk.id ? { ...d, studentId: undefined } : d); setDesks(clean); }}
                                                className="absolute -top-1 -left-1 bg-red-100 text-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-slate-300 font-bold text-[10px] uppercase tracking-wider">Empty</span>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })
            )}

            {/* Legend / Overlay Info */}
            {selectedClass && viewMode !== 'STANDARD' && (
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-slate-200 p-4 pointer-events-none z-10 max-w-xs animate-slide-up">
                    {viewMode === 'HEATMAP' && (
                        <>
                            <h4 className="text-xs font-bold text-slate-800 uppercase mb-2 flex items-center"><Zap size={14} className="mr-1 text-indigo-500" /> Behavior Heatmap</h4>
                            <div className="space-y-2">
                                <div className="flex items-center text-xs text-slate-600"><span className="w-3 h-3 bg-green-100 border border-green-400 rounded mr-2"></span> High Merit Count</div>
                                <div className="flex items-center text-xs text-slate-600"><span className="w-3 h-3 bg-red-100 border border-red-400 rounded mr-2"></span> Active Sanctions</div>
                            </div>
                        </>
                    )}
                    {viewMode === 'RISK_RADAR' && (
                        <>
                            <h4 className="text-xs font-bold text-slate-800 uppercase mb-2 flex items-center"><Shield size={14} className="mr-1 text-red-500" /> Risk Radar</h4>
                            <div className="space-y-2">
                                <div className="flex items-center text-xs text-slate-600"><span className="w-3 h-3 bg-red-100 border border-red-500 ring-2 ring-red-100 rounded mr-2"></span> Critical Safeguarding Risk</div>
                                <div className="flex items-center text-xs text-slate-600"><span className="w-3 h-3 bg-orange-100 border border-orange-400 rounded mr-2"></span> Active Investigation</div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>

        {/* Sidebar */}
        {selectedClass && (
            <div className="w-full lg:w-64 bg-white border-l border-slate-200 flex flex-col z-10 shadow-lg h-48 lg:h-auto flex-shrink-0">
                 <div className="p-3 bg-slate-50 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Unseated Students ({unseatedStudents.length})</h3>
                 </div>
                 <div className="flex-1 overflow-y-auto p-2 space-y-2 lg:block flex gap-2 overflow-x-auto">
                    {unseatedStudents.map(student => (
                        <div
                            key={student.id}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData('studentId', student.id)}
                            className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm cursor-grab hover:border-indigo-400 hover:shadow-md transition-all active:cursor-grabbing min-w-[140px] lg:min-w-0"
                        >
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 mr-2 flex-shrink-0">
                                    {student.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-700 truncate">{student.name}</p>
                                    <p className="text-[9px] text-slate-400">{student.id}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {unseatedStudents.length === 0 && (
                        <div className="text-center p-8 text-slate-300 italic text-xs">All students seated</div>
                    )}
                 </div>
            </div>
        )}

      </div>

      {/* Auto Arrange Modal */}
      {showAutoArrangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-slate-200">
               <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                   <Settings2 size={20} className="mr-2 text-indigo-600" /> Smart Layout
               </h3>
               <div className="space-y-4">
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Columns</label>
                       <input 
                           type="number" 
                           min="1" max="10" 
                           value={gridCols} 
                           onChange={(e) => setGridCols(parseInt(e.target.value))}
                           className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                       />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">X Spacing</label>
                            <input type="number" step="10" value={gridSpacingX} onChange={(e) => setGridSpacingX(parseInt(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Y Spacing</label>
                            <input type="number" step="10" value={gridSpacingY} onChange={(e) => setGridSpacingY(parseInt(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                   </div>
                   <div className="pt-4 flex space-x-3">
                       <button onClick={() => setShowAutoArrangeModal(false)} className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                       <button onClick={performAutoArrange} className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md">Apply Layout</button>
                   </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SeatingPlanView;
