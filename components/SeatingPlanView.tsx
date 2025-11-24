
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Desk, SeatingLayout, BehaviourEntry } from '../types';
import { STUDENTS } from '../data/students';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { 
  LayoutGrid, 
  Save, 
  Plus, 
  Trash2, 
  RotateCw, 
  Users, 
  X, 
  Monitor, 
  Armchair,
  Grid,
  CheckCircle2,
  Image,
  FileSpreadsheet,
  Loader2,
  Edit2,
  ChevronDown,
  Circle,
  Box,
  Settings2,
  Zap
} from 'lucide-react';

interface SeatingPlanViewProps {
  onSave?: (layout: SeatingLayout) => void;
  behaviourEntries?: BehaviourEntry[]; // New Prop
}

const SeatingPlanView: React.FC<SeatingPlanViewProps> = ({ onSave, behaviourEntries = [] }) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [desks, setDesks] = useState<Desk[]>([]);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState<string>('Standard Layout');
  
  // Multiple Plans Management
  const [availablePlans, setAvailablePlans] = useState<SeatingLayout[]>([]);
  
  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Heatmap State
  const [showHeatmap, setShowHeatmap] = useState(false);

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
        // Init default
        handleNewPlan();
      }
    } else {
        setDesks([]);
        setAvailablePlans([]);
    }
  }, [selectedClass]);

  // Clear success message after 3 seconds
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
      
      // Update state
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
    
    // Find a non-overlapping spot roughly in center
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
            // Remove current version of this layout ID
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
      // Use html2canvas to capture the seating plan area
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#f1f5f9', // Match bg-slate-100
        scale: 2, // Higher resolution
        logging: false
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `SeatingPlan_${selectedClass}_${layoutName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (e) {
      console.error("Export failed:", e);
      alert("Failed to export image.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    if (!selectedClass) return;
    
    const rows = desks
        .filter(d => (d.type === 'STUDENT' || d.type === 'GROUP_TABLE') && d.studentId)
        .map(d => ({
            Student: getStudentName(d.studentId),
            ID: d.studentId,
            Type: d.type === 'GROUP_TABLE' ? 'Group Table' : 'Student Desk',
        }));
    
    if (rows.length === 0) {
        alert("No students assigned to desks to export.");
        return;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Plan - ${layoutName}`);
    XLSX.writeFile(wb, `SeatingList_${selectedClass}_${layoutName}_.xlsx`);
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

  const handleClear = () => {
      if (window.confirm("Clear all desks?")) setDesks([]);
  };

  // --- Drag Logic for DESKS (Moving position) ---
  const handleMouseDown = (e: React.MouseEvent, deskId: string) => {
    e.stopPropagation(); // Prevent drag from hitting container
    const desk = desks.find(d => d.id === deskId);
    if (!desk) return;

    setIsDraggingDesk(deskId);
    // Calculate offset from the top-left of the desk
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    // In a real app with proper scaling we might need more math, 
    // but here we just need relative movement tracking
    setDragOffset({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingDesk || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left - dragOffset.x;
    const y = e.clientY - containerRect.top - dragOffset.y;

    setDesks(desks.map(d => 
      d.id === isDraggingDesk ? { ...d, x, y } : d
    ));
  };

  const handleMouseUp = () => {
    setIsDraggingDesk(null);
  };

  // --- Touch Support for Dragging Desks ---
  const handleTouchStart = (e: React.TouchEvent, deskId: string) => {
    e.stopPropagation();
    const desk = desks.find(d => d.id === deskId);
    if (!desk) return;
    setIsDraggingDesk(deskId);
    
    // Approximate offset for touch since we don't have offsetX/Y
    // Use target rect vs touch point
    const touch = e.touches[0];
    const target = e.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    setDragOffset({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingDesk || !containerRef.current) return;
    
    // Prevent scrolling while dragging a desk
    e.preventDefault();

    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const x = touch.clientX - containerRect.left - dragOffset.x;
    const y = touch.clientY - containerRect.top - dragOffset.y;

    setDesks(desks.map(d => 
      d.id === isDraggingDesk ? { ...d, x, y } : d
    ));
  };

  // --- Drag Logic for STUDENTS (Assignment) ---
  const handleDragStart = (e: React.DragEvent, studentId: string) => {
    e.dataTransfer.setData('studentId', studentId);
  };

  const handleDrop = (e: React.DragEvent, deskId: string) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData('studentId');
    if (!studentId) return;

    // Remove student from any other desk first
    const cleanDesks = desks.map(d => d.studentId === studentId ? { ...d, studentId: undefined } : d);
    
    // Assign to new desk
    setDesks(cleanDesks.map(d => d.id === deskId ? { ...d, studentId } : d));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeStudentFromDesk = (deskId: string) => {
    setDesks(desks.map(d => d.id === deskId ? { ...d, studentId: undefined } : d));
  };

  const rotateDesk = (deskId: string) => {
    setDesks(desks.map(d => d.id === deskId ? { ...d, rotation: (d.rotation + 90) % 360 } : d));
  };

  const deleteDesk = (deskId: string) => {
    setDesks(desks.filter(d => d.id !== deskId));
  };

  const getStudentName = (id?: string) => {
    if (!id) return null;
    return STUDENTS.find(s => s.id === id)?.name;
  };

  // Calculate scores for heatmap
  const getStudentScore = (id?: string) => {
      if(!id || !behaviourEntries) return 0;
      const student = STUDENTS.find(s => s.id === id);
      if(!student) return 0;
      return behaviourEntries
          .filter(b => b.studentName === student.name)
          .reduce((acc, curr) => acc + curr.points, 0);
  };

  const getDeskStyle = (desk: Desk) => {
      const baseStyle: React.CSSProperties = {
          position: 'absolute',
          left: desk.x,
          top: desk.y,
          transform: `rotate(${desk.rotation}deg)`,
          cursor: isDraggingDesk === desk.id ? 'grabbing' : 'grab',
          transition: isDraggingDesk ? 'none' : 'transform 0.2s',
      };
      return baseStyle;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] animate-fade-in relative" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchEnd={handleMouseUp}>
      
      {/* --- Header & Controls --- */}
      <div className="bg-white border-b border-slate-200 p-4 flex flex-col xl:flex-row gap-4 items-center justify-between z-20 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-center">
            {/* Class Selector */}
            <div className="relative w-full md:w-48">
                <Grid className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-700"
                >
                    <option value="">Select Class...</option>
                    {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {selectedClass && (
                <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                    {/* Plan Selector */}
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
                        <div className="relative group">
                            <select
                                value={activeLayoutId || ''}
                                onChange={(e) => {
                                    const plan = availablePlans.find(p => p.id === e.target.value);
                                    if(plan) loadLayout(plan);
                                }}
                                className="appearance-none bg-transparent font-bold text-slate-700 text-sm py-1 pl-2 pr-6 cursor-pointer outline-none hover:text-blue-700 w-40 truncate"
                            >
                                {availablePlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    )}
                    
                    <button onClick={() => setIsEditingName(true)} className="p-1 hover:bg-slate-200 rounded text-slate-500" title="Rename Plan">
                        <Edit2 size={14} />
                    </button>
                    
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    
                    <button onClick={handleNewPlan} className="p-1 hover:bg-slate-200 rounded text-slate-500" title="New Plan">
                        <Plus size={16} />
                    </button>
                     <button onClick={handleDeletePlan} className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500" title="Delete Plan">
                        <Trash2 size={16} />
                    </button>
                </div>
            )}
        </div>

        {selectedClass && (
            <div className="flex gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 scrollbar-hide">
                <button 
                  onClick={() => setShowHeatmap(!showHeatmap)} 
                  className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap shadow-sm border ${showHeatmap ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                >
                    <Zap size={16} className={`mr-2 ${showHeatmap ? 'text-yellow-300' : 'text-slate-400'}`} /> 
                    {showHeatmap ? 'Heatmap On' : 'Heatmap Off'}
                </button>

                <div className="w-px h-8 bg-slate-200 mx-1"></div>

                <button onClick={() => handleAddDesk('STUDENT')} className="flex items-center px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap shadow-sm">
                    <Armchair size={16} className="mr-2 text-blue-500" /> + Desk
                </button>
                 <button onClick={() => handleAddDesk('GROUP_TABLE')} className="flex items-center px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap shadow-sm">
                    <Circle size={16} className="mr-2 text-indigo-500" /> + Table
                </button>
                <button onClick={() => handleAddDesk('TEACHER')} className="flex items-center px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap shadow-sm">
                    <Monitor size={16} className="mr-2 text-amber-500" /> + Teacher
                </button>
                 <button onClick={() => handleAddDesk('RESOURCE')} className="flex items-center px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap shadow-sm">
                    <Box size={16} className="mr-2 text-emerald-500" /> + Resource
                </button>
                <button onClick={() => setShowAutoArrangeModal(true)} className="flex items-center px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors whitespace-nowrap ml-2">
                    <Settings2 size={16} className="mr-2" /> Auto-Fill
                </button>
                <button onClick={handleClear} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2" title="Clear All">
                    <Trash2 size={18} />
                </button>
                
                <div className="w-px h-8 bg-slate-200 mx-1"></div>

                 <button 
                    onClick={handleExportExcel}
                    className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Export List to Excel"
                 >
                    <FileSpreadsheet size={20} />
                </button>

                <button 
                    onClick={handleExportImage}
                    disabled={isExporting}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Export Image"
                >
                    {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Image size={20} />}
                </button>

                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className={`flex items-center px-4 py-2 rounded-lg text-white font-medium shadow-md transition-all whitespace-nowrap ml-2 ${saveSuccess ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : saveSuccess ? <CheckCircle2 size={18} className="mr-2" /> : <Save size={18} className="mr-2" />}
                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Plan'}
                </button>
            </div>
        )}
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        
        {/* Left: Students Sidebar (Draggable Source) */}
        {selectedClass && (
            <div className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col z-10 shadow-lg lg:shadow-none h-48 lg:h-auto flex-shrink-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-700 text-sm flex items-center">
                        <Users size={16} className="mr-2" /> Unseated Students
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{unseatedStudents.length} remaining</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 lg:block flex gap-2 overflow-x-auto lg:overflow-x-hidden">
                    {unseatedStudents.map(student => (
                        <div
                            key={student.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, student.id)}
                            className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm cursor-grab hover:border-blue-400 hover:shadow-md transition-all active:cursor-grabbing min-w-[150px] lg:min-w-0"
                        >
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 mr-3">
                                    {student.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 leading-tight truncate max-w-[100px]">{student.name}</p>
                                    <p className="text-[10px] text-slate-400">{student.id.slice(-4)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {unseatedStudents.length === 0 && (
                        <div className="text-center p-4 text-slate-400 italic text-sm">
                            All students seated.
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Center: Canvas (Drop Target) */}
        <div 
            ref={containerRef}
            className="flex-1 bg-slate-100 relative overflow-hidden cursor-crosshair touch-none"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
        >
            {/* Grid Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ 
                     backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
                     backgroundSize: '20px 20px' 
                 }}>
            </div>

            {!selectedClass ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <LayoutGrid size={48} className="mb-4 opacity-50" />
                    <p>Select a class to begin planning</p>
                </div>
            ) : (
                desks.map(desk => {
                    const studentName = getStudentName(desk.studentId);
                    const score = showHeatmap ? getStudentScore(desk.studentId) : 0;
                    
                    let bgClass = 'bg-white';
                    let borderClass = studentName ? 'border-blue-500' : 'border-slate-300';
                    let textClass = 'text-slate-700';

                    if (showHeatmap && studentName) {
                         if (score > 2) {
                             bgClass = 'bg-green-100';
                             borderClass = 'border-green-400';
                             textClass = 'text-green-800';
                         } else if (score < -2) {
                             bgClass = 'bg-red-100';
                             borderClass = 'border-red-400';
                             textClass = 'text-red-800';
                         } else {
                             bgClass = 'bg-slate-100';
                             borderClass = 'border-slate-300';
                             textClass = 'text-slate-500';
                         }
                    }

                    return (
                        <div
                            key={desk.id}
                            style={getDeskStyle(desk)}
                            onMouseDown={(e) => handleMouseDown(e, desk.id)}
                            onTouchStart={(e) => handleTouchStart(e, desk.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, desk.id)}
                            className={`group transition-all shadow-sm hover:shadow-lg rounded-lg border-2 
                                ${desk.type === 'TEACHER' ? 'bg-amber-100 border-amber-300 w-32 h-20 rounded-xl' :
                                  desk.type === 'BOARD' ? 'bg-slate-800 border-slate-900 w-64 h-4 text-white' :
                                  desk.type === 'GROUP_TABLE' ? 'bg-indigo-50 border-indigo-200 w-32 h-32 rounded-full' :
                                  desk.type === 'RESOURCE' ? 'bg-emerald-50 border-emerald-200 w-24 h-24 rounded-lg' :
                                  `${bgClass} ${borderClass} w-24 h-24 rounded-lg`
                                } flex flex-col items-center justify-center relative select-none`}
                        >
                            {/* Desk Controls (Hover) */}
                            <div className="absolute -top-3 -right-3 hidden group-hover:flex bg-white rounded-full shadow border border-slate-200 p-0.5 z-20">
                                <button onClick={() => rotateDesk(desk.id)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><RotateCw size={12} /></button>
                                <button onClick={() => deleteDesk(desk.id)} className="p-1 hover:bg-red-50 rounded-full text-red-500"><Trash2 size={12} /></button>
                            </div>

                            {/* Content based on type */}
                            {desk.type === 'TEACHER' && <span className="text-amber-700 font-bold text-xs uppercase tracking-wider">Teacher</span>}
                            
                            {desk.type === 'BOARD' && <span className="text-[10px] uppercase tracking-widest opacity-50">Whiteboard</span>}
                            
                            {desk.type === 'RESOURCE' && <Box className="text-emerald-300" size={24}/>}

                            {(desk.type === 'STUDENT' || desk.type === 'GROUP_TABLE') && (
                                <>
                                    {studentName ? (
                                        <div className="text-center w-full px-1">
                                            {!showHeatmap && (
                                                <div className="w-8 h-8 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mb-1">
                                                    {studentName.charAt(0)}
                                                </div>
                                            )}
                                            {showHeatmap && (
                                                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold mb-1 border-2 ${
                                                    score > 0 ? 'bg-green-100 border-green-300 text-green-700' : 
                                                    score < 0 ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-slate-200 text-slate-400'
                                                }`}>
                                                    {score > 0 ? '+' : ''}{score}
                                                </div>
                                            )}
                                            <p className={`text-[10px] font-bold leading-tight line-clamp-2 ${textClass}`}>{studentName}</p>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); removeStudentFromDesk(desk.id); }}
                                                className="absolute -top-1 -left-1 bg-red-100 text-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">
                                            {desk.type === 'GROUP_TABLE' ? 'Group' : 'Desk'}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })
            )}
            
            {/* Heatmap Legend Overlay */}
            {showHeatmap && (
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg shadow border border-slate-200 p-3 pointer-events-none">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Behaviour Heatmap</h4>
                    <div className="space-y-1">
                        <div className="flex items-center text-xs text-slate-600"><span className="w-3 h-3 bg-green-100 border border-green-400 rounded mr-2"></span> Positive ({'>'}2 pts)</div>
                        <div className="flex items-center text-xs text-slate-600"><span className="w-3 h-3 bg-red-100 border border-red-400 rounded mr-2"></span> Negative ({'<'} -2 pts)</div>
                        <div className="flex items-center text-xs text-slate-600"><span className="w-3 h-3 bg-slate-100 border border-slate-300 rounded mr-2"></span> Neutral</div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Auto Arrange Modal */}
      {showAutoArrangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-slate-200">
               <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                   <Settings2 size={20} className="mr-2 text-blue-600" /> Auto-Arrange Config
               </h3>
               <div className="space-y-4">
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Columns</label>
                       <input 
                           type="number" 
                           min="1" max="10" 
                           value={gridCols} 
                           onChange={(e) => setGridCols(parseInt(e.target.value))}
                           className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                       />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Spacing X</label>
                            <input 
                                type="number" 
                                step="10"
                                value={gridSpacingX} 
                                onChange={(e) => setGridSpacingX(parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Spacing Y</label>
                            <input 
                                type="number" 
                                step="10"
                                value={gridSpacingY} 
                                onChange={(e) => setGridSpacingY(parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                   </div>
                   <div className="pt-4 flex space-x-3">
                       <button onClick={() => setShowAutoArrangeModal(false)} className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                       <button onClick={performAutoArrange} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md">Generate Grid</button>
                   </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SeatingPlanView;
