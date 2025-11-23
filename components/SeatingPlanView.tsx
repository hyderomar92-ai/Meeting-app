
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Desk, SeatingLayout } from '../types';
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
  Move, 
  X, 
  Monitor, 
  DoorOpen, 
  User, 
  Armchair,
  Grid,
  CheckCircle2,
  Image,
  FileSpreadsheet,
  Loader2,
  Edit2,
  ChevronDown,
  Circle,
  Box
} from 'lucide-react';

interface SeatingPlanViewProps {
  onSave?: (layout: SeatingLayout) => void;
}

const SeatingPlanView: React.FC<SeatingPlanViewProps> = ({ onSave }) => {
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

  const handleAutoArrange = () => {
    if (!selectedClass) return;
    if (!window.confirm("This will clear the current layout and auto-arrange students. Continue?")) return;

    // Simple grid layout
    const cols = 5;
    const spacingX = 140;
    const spacingY = 100;
    const startX = 50;
    const startY = 80;

    const newDesks: Desk[] = [
        { id: 'board', x: 350, y: 10, rotation: 0, type: 'BOARD' },
        { id: 'teacher', x: 650, y: 50, rotation: 180, type: 'TEACHER' }
    ];

    studentsInClass.forEach((student, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      newDesks.push({
        id: crypto.randomUUID(),
        x: startX + (col * spacingX),
        y: startY + (row * spacingY),
        rotation: 0,
        type: 'STUDENT',
        studentId: student.id
      });
    });

    setDesks(newDesks);
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
    setDragOffset({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingDesk || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left - 40; // Center roughly
    const y = e.clientY - containerRect.top - 20;

    // Simple constraints
    const constrainedX = Math.max(0, Math.min(x, containerRect.width - 50));
    const constrainedY = Math.max(0, Math.min(y, containerRect.height - 50));

    setDesks(prev => prev.map(d => 
      d.id === isDraggingDesk ? { ...d, x: constrainedX, y: constrainedY } : d
    ));
  };

  const handleMouseUp = () => {
    setIsDraggingDesk(null);
  };

  // --- Touch Logic for Mobile ---
  const handleTouchStart = (e: React.TouchEvent, deskId: string) => {
    e.stopPropagation();
    const desk = desks.find(d => d.id === deskId);
    if (!desk) return;
    setIsDraggingDesk(deskId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingDesk || !containerRef.current) return;
    e.preventDefault(); // Prevent scrolling
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    
    const x = touch.clientX - containerRect.left - 40; 
    const y = touch.clientY - containerRect.top - 20;

    const constrainedX = Math.max(0, Math.min(x, containerRect.width - 50));
    const constrainedY = Math.max(0, Math.min(y, containerRect.height - 50));

    setDesks(prev => prev.map(d => 
      d.id === isDraggingDesk ? { ...d, x: constrainedX, y: constrainedY } : d
    ));
  };

  // --- Drag Logic for STUDENTS (Assignment) ---
  const handleDragStartStudent = (e: React.DragEvent, studentId: string) => {
     e.dataTransfer.setData("studentId", studentId);
  };

  const handleDropOnDesk = (e: React.DragEvent, deskId: string) => {
     e.preventDefault();
     const studentId = e.dataTransfer.getData("studentId");
     if (!studentId) return;

     setDesks(prev => prev.map(d => {
         if (d.id === deskId) return { ...d, studentId };
         if (d.studentId === studentId) return { ...d, studentId: undefined }; // Remove from previous desk
         return d;
     }));
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  // Desk Actions
  const rotateDesk = (deskId: string) => {
    setDesks(prev => prev.map(d => 
        d.id === deskId ? { ...d, rotation: (d.rotation + 90) % 360 } : d
    ));
  };

  const deleteDesk = (deskId: string) => {
    setDesks(prev => prev.filter(d => d.id !== deskId));
  };

  const removeStudentFromDesk = (deskId: string) => {
      setDesks(prev => prev.map(d => d.id === deskId ? { ...d, studentId: undefined } : d));
  };

  const getStudentName = (id?: string) => {
      return STUDENTS.find(s => s.id === id)?.name || 'Unknown';
  };

  // Determine Desk Styles
  const getDeskDimensions = (type: Desk['type']) => {
    switch (type) {
      case 'BOARD': return { width: '200px', height: '20px' };
      case 'TEACHER': return { width: '120px', height: '60px' };
      case 'GROUP_TABLE': return { width: '120px', height: '120px' }; // Square/Round
      case 'RESOURCE': return { width: '140px', height: '60px' };
      default: return { width: '100px', height: '60px' }; // Student & Door
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in overflow-hidden">
      <header className="mb-4 flex flex-col gap-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Seating Plan Creator</h1>
              <p className="text-sm md:text-base text-slate-500">Design classroom layouts and manage student seating.</p>
            </div>
            
            {/* Class Selector */}
            <div className="relative mt-2 md:mt-0 w-full md:w-auto">
                <LayoutGrid className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full md:w-auto pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer font-medium shadow-sm min-w-[200px]"
                >
                    <option value="">Select a Class...</option>
                    {uniqueClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={14} />
                </div>
             </div>
        </div>

        {selectedClass && (
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                 {/* Plan Management */}
                 <div className="flex items-center gap-2 w-full md:w-auto flex-1">
                    <div className="relative flex-1 max-w-xs">
                         {isEditingName ? (
                             <div className="flex items-center">
                                <input 
                                  type="text" 
                                  value={layoutName} 
                                  onChange={(e) => setLayoutName(e.target.value)}
                                  onBlur={() => setIsEditingName(false)}
                                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                                  autoFocus
                                  className="w-full px-3 py-1.5 rounded-lg border border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none text-sm font-bold text-slate-700"
                                />
                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => setIsEditingName(false)} className="ml-2 text-green-600"><CheckCircle2 size={18} /></button>
                             </div>
                         ) : (
                             <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => setIsEditingName(true)}>
                                <span className="text-sm font-bold text-slate-700 truncate mr-2">{layoutName}</span>
                                <Edit2 size={12} className="text-slate-400 group-hover:text-blue-500" />
                             </div>
                         )}
                    </div>
                    
                    {availablePlans.length > 1 && (
                        <select 
                          value={activeLayoutId || ''}
                          onChange={(e) => {
                             const plan = availablePlans.find(p => p.id === e.target.value);
                             if (plan) loadLayout(plan);
                          }}
                          className="w-32 md:w-40 px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 outline-none cursor-pointer"
                        >
                           {availablePlans.map(p => <option key={p.id} value={p.id}>{p.name || 'Unnamed Plan'}</option>)}
                        </select>
                    )}

                    <button 
                       onClick={handleNewPlan}
                       className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" 
                       title="Create New Plan for this Class"
                    >
                       <Plus size={18} />
                    </button>
                    
                    <button 
                       onClick={handleDeletePlan}
                       className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" 
                       title="Delete current plan"
                    >
                       <Trash2 size={18} />
                    </button>
                 </div>

                 {/* Actions */}
                 <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4">
                    <button 
                        onClick={handleExportExcel}
                        title="Export List to Excel"
                        className="p-2 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-green-600 transition-colors"
                    >
                        <FileSpreadsheet size={20} />
                    </button>
                    <button 
                        onClick={handleExportImage}
                        title="Export Plan as Image"
                        disabled={isExporting}
                        className="p-2 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                        {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Image size={20} />}
                    </button>
                    
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center px-4 py-2 rounded-lg shadow-md transition-all font-medium whitespace-nowrap min-w-[100px] justify-center ml-auto md:ml-0 ${
                            saveSuccess 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-slate-900 text-white hover:bg-black'
                        }`}
                    >
                        {isSaving ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : saveSuccess ? (
                            <><CheckCircle2 size={18} className="mr-2" /> Saved</>
                        ) : (
                            <><Save size={18} className="mr-2" /> Save Plan</>
                        )}
                    </button>
                 </div>
            </div>
        )}
      </header>

      {selectedClass ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden min-h-0">
             
             {/* Unseated Students Sidebar */}
             <div className="lg:w-64 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col order-1 lg:order-2 flex-shrink-0 lg:h-full max-h-[160px] lg:max-h-none">
                 <div className="p-3 md:p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl flex justify-between items-center sticky top-0 z-10">
                     <div>
                         <h3 className="font-bold text-slate-700 flex items-center text-sm md:text-base">
                             <Users size={18} className="mr-2 text-blue-600" />
                             Students ({unseatedStudents.length})
                         </h3>
                     </div>
                 </div>
                 {/* Horizontal scroll on mobile, vertical on desktop */}
                 <div className="flex-1 overflow-auto p-2 gap-2 flex lg:flex-col flex-row items-center lg:items-stretch custom-scrollbar">
                     {unseatedStudents.length === 0 ? (
                         <div className="text-center py-4 px-8 text-slate-400 w-full">
                             <CheckCircle2 size={24} className="mx-auto mb-1 text-green-400" />
                             <p className="text-xs">All seated!</p>
                         </div>
                     ) : (
                         unseatedStudents.map(student => (
                             <div 
                                key={student.id}
                                draggable
                                onDragStart={(e) => handleDragStartStudent(e, student.id)}
                                className="p-2 md:p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm cursor-grab active:cursor-grabbing flex items-center transition-all min-w-[160px] lg:min-w-0"
                             >
                                 <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold mr-2 md:mr-3 flex-shrink-0">
                                     {student.name.charAt(0)}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <p className="text-xs md:text-sm font-medium text-slate-700 truncate">{student.name}</p>
                                     <p className="text-[10px] text-slate-400">ID: {student.id.slice(-4)}</p>
                                 </div>
                                 <Move size={14} className="text-slate-300 ml-1 hidden md:block" />
                             </div>
                         ))
                     )}
                 </div>
             </div>

             {/* Canvas Container */}
             <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden order-2 lg:order-1 h-full min-h-0">
                 {/* Toolbar - Scrollable on mobile */}
                 <div className="p-2 md:p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                     <button onClick={() => handleAddDesk('STUDENT')} className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-700 text-sm hover:bg-slate-50 shadow-sm"><Plus size={14} className="mr-1" /> Student</button>
                     <button onClick={() => handleAddDesk('GROUP_TABLE')} className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-700 text-sm hover:bg-slate-50 shadow-sm"><Circle size={14} className="mr-1" /> Group</button>
                     <button onClick={() => handleAddDesk('RESOURCE')} className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-700 text-sm hover:bg-slate-50 shadow-sm"><Box size={14} className="mr-1" /> Resource</button>
                     <button onClick={() => handleAddDesk('TEACHER')} className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-700 text-sm hover:bg-slate-50 shadow-sm"><User size={14} className="mr-1" /> Teacher</button>
                     <button onClick={() => handleAddDesk('BOARD')} className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-700 text-sm hover:bg-slate-50 shadow-sm"><Monitor size={14} className="mr-1" /> Board</button>
                     <button onClick={() => handleAddDesk('DOOR')} className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-700 text-sm hover:bg-slate-50 shadow-sm"><DoorOpen size={14} className="mr-1" /> Door</button>
                     <div className="h-6 w-px bg-slate-300 mx-2 flex-shrink-0"></div>
                     <button onClick={handleAutoArrange} className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-700 text-sm hover:bg-slate-50 shadow-sm"><Grid size={14} className="mr-1" /> Auto-Fill</button>
                     <button onClick={handleClear} className="flex items-center px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md text-sm transition-colors ml-auto flex-shrink-0"><Trash2 size={14} className="mr-1" /> Clear</button>
                 </div>

                 {/* Canvas */}
                 <div 
                    ref={containerRef}
                    className="flex-1 relative bg-slate-100 overflow-hidden cursor-crosshair touch-none"
                    style={{ 
                        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
                        backgroundSize: '20px 20px' 
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUp}
                 >
                     {desks.map(desk => {
                         const dims = getDeskDimensions(desk.type);
                         return (
                         <div
                            key={desk.id}
                            onMouseDown={(e) => handleMouseDown(e, desk.id)}
                            onTouchStart={(e) => handleTouchStart(e, desk.id)}
                            onDrop={(e) => handleDropOnDesk(e, desk.id)}
                            onDragOver={handleDragOver}
                            style={{
                                left: desk.x,
                                top: desk.y,
                                transform: `rotate(${desk.rotation}deg)`,
                                width: dims.width,
                                height: dims.height,
                            }}
                            className={`absolute shadow-md rounded-lg flex flex-col items-center justify-center transition-shadow select-none group
                                ${isDraggingDesk === desk.id ? 'cursor-grabbing shadow-xl z-50 ring-2 ring-blue-400' : 'cursor-grab'}
                                ${desk.type === 'BOARD' ? 'bg-slate-800 text-white' : 
                                  desk.type === 'TEACHER' ? 'bg-amber-100 border-2 border-amber-300 text-amber-900' : 
                                  desk.type === 'GROUP_TABLE' ? 'bg-indigo-100 border-2 border-indigo-300 rounded-full' :
                                  desk.type === 'RESOURCE' ? 'bg-teal-50 border-2 border-teal-300' :
                                  desk.type === 'DOOR' ? 'bg-slate-300 border-2 border-slate-400' :
                                  'bg-white border-2 border-slate-300 hover:border-blue-400'
                                }
                            `}
                         >
                            {/* Controls Overlay (Mouse Only) */}
                            {['STUDENT', 'GROUP_TABLE', 'RESOURCE'].includes(desk.type) && (
                                <div className="absolute -top-3 -right-3 hidden group-hover:flex bg-white rounded-full shadow border border-slate-200 overflow-hidden z-20">
                                    <button onMouseDown={(e) => e.stopPropagation()} onClick={() => rotateDesk(desk.id)} className="p-1 hover:bg-slate-100 text-slate-500" title="Rotate"><RotateCw size={12} /></button>
                                    <button onMouseDown={(e) => e.stopPropagation()} onClick={() => deleteDesk(desk.id)} className="p-1 hover:bg-red-50 text-red-500" title="Delete"><Trash2 size={12} /></button>
                                </div>
                            )}
                            
                            {/* Content */}
                            {['STUDENT', 'GROUP_TABLE', 'RESOURCE'].includes(desk.type) ? (
                                <>
                                   {desk.studentId ? (
                                       <div className="text-center w-full px-1">
                                           <div className="flex justify-center mb-1">
                                               <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                                   {getStudentName(desk.studentId).charAt(0)}
                                               </div>
                                           </div>
                                           <p className="text-[9px] md:text-[10px] font-bold text-slate-700 leading-tight truncate px-1">
                                               {getStudentName(desk.studentId)}
                                           </p>
                                           <button 
                                             onMouseDown={(e) => e.stopPropagation()}
                                             onClick={() => removeStudentFromDesk(desk.id)}
                                             className="absolute -top-1 -left-1 bg-red-100 text-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-200 transition-opacity"
                                             title="Unseat Student"
                                           >
                                               <X size={10} />
                                           </button>
                                       </div>
                                   ) : (
                                       <div className="flex flex-col items-center">
                                            {desk.type === 'GROUP_TABLE' && <Circle size={16} className="text-indigo-300 mb-1" />}
                                            {desk.type === 'RESOURCE' && <Box size={16} className="text-teal-300 mb-1" />}
                                            <span className="text-[10px] text-slate-400 font-medium uppercase">{desk.type === 'GROUP_TABLE' ? 'Table' : desk.type === 'RESOURCE' ? 'Station' : 'Empty'}</span>
                                       </div>
                                   )}
                                </>
                            ) : desk.type === 'BOARD' ? (
                                <span className="text-xs font-bold tracking-widest">INTERACTIVE BOARD</span>
                            ) : desk.type === 'TEACHER' ? (
                                <span className="text-xs font-bold text-amber-800">TEACHER</span>
                            ) : (
                                <span className="text-xs font-bold text-slate-500">DOOR</span>
                            )}
                            
                            {/* Rotation Indicator */}
                             <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-slate-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         </div>
                     );
                     })}
                 </div>
                 
                 {/* Footer Help Text */}
                 <div className="p-2 bg-white border-t border-slate-200 text-[10px] md:text-xs text-slate-400 flex justify-between items-center">
                    <span>Drag desks to arrange. Drag students from sidebar to assign.</span>
                    <span className="hidden md:inline">Click desk to rotate/delete.</span>
                 </div>
             </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 border-dashed min-h-[400px] text-slate-400 p-8">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Armchair size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Select a Class</h3>
            <p className="text-sm text-center max-w-xs leading-relaxed">
                Choose a class from the dropdown above to start designing your seating plan.
            </p>
        </div>
      )}
    </div>
  );
};

export default SeatingPlanView;