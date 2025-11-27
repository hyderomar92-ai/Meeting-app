
import React, { useState, useMemo } from 'react';
import { Search, User, GraduationCap, Plus, Filter, CalendarRange, Shield } from 'lucide-react';
import { STUDENTS } from '../data/students';
import { SafeguardingCase } from '../types';

interface StudentDirectoryProps {
  onSelectStudent: (name: string) => void;
  onQuickLog: (name: string) => void;
  safeguardingCases?: SafeguardingCase[];
}

const StudentDirectory: React.FC<StudentDirectoryProps> = ({ onSelectStudent, onQuickLog, safeguardingCases = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Extract unique options for filters
  const { classes, years } = useMemo(() => {
    const uniqueClasses = new Set(STUDENTS.map(s => s.studentClass).filter(Boolean));
    // Assuming class format '01A', '09B' -> Year is first 2 chars
    const uniqueYears = new Set(STUDENTS.map(s => s.studentClass ? s.studentClass.substring(0, 2) : '').filter(Boolean));
    
    return {
      classes: Array.from(uniqueClasses).sort(),
      years: Array.from(uniqueYears).sort()
    };
  }, []);

  const filteredStudents = STUDENTS.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass ? student.studentClass === selectedClass : true;
    const matchesYear = selectedYear ? student.studentClass?.startsWith(selectedYear) : true;

    return matchesSearch && matchesClass && matchesYear;
  });

  // Check real safeguarding data for risk status
  const getRiskStatus = (studentName: string) => {
      const activeCases = safeguardingCases.filter(c => 
          c.studentName === studentName && 
          (c.status === 'Open' || c.status === 'Investigating')
      );

      if (activeCases.length === 0) return 'NONE';

      const hasHighRisk = activeCases.some(c => 
          c.generatedReport.riskLevel === 'High' || 
          c.generatedReport.riskLevel === 'Critical'
      );

      return hasHighRisk ? 'HIGH' : 'MEDIUM';
  };

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">Student Directory</h1>
        <p className="text-slate-500">Browse and manage student profiles.</p>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 sticky top-0 z-10 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
            type="text"
            placeholder="Search students by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-1 md:pb-0">
             {/* Year Filter */}
             <div className="relative min-w-[140px]">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
                    <CalendarRange size={18} />
                </div>
                <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setSelectedClass(''); // Reset class if year changes
                    }}
                    className="w-full pl-10 pr-8 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white text-slate-600 cursor-pointer"
                >
                    <option value="">All Years</option>
                    {years.map(yr => (
                        <option key={yr} value={yr}>Year {yr}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Filter size={14} />
                </div>
            </div>

            {/* Class Filter */}
            <div className="relative min-w-[140px]">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
                    <GraduationCap size={18} />
                </div>
                <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full pl-10 pr-8 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white text-slate-600 cursor-pointer"
                >
                    <option value="">All Classes</option>
                    {classes
                      .filter(c => !selectedYear || c?.startsWith(selectedYear))
                      .map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Filter size={14} />
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map(student => {
          const risk = getRiskStatus(student.name);
          return (
            <div
              key={student.id}
              onClick={() => onSelectStudent(student.name)}
              className={`bg-white p-4 rounded-xl border transition-all text-left group cursor-pointer relative flex items-center justify-between hover:shadow-md ${
                  risk === 'HIGH' ? 'border-red-200 bg-red-50/20' : 
                  risk === 'MEDIUM' ? 'border-orange-200 bg-orange-50/20' : 'border-slate-200 hover:border-blue-500'
              }`}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        risk === 'HIGH' ? 'bg-red-100 text-red-600' : 
                        risk === 'MEDIUM' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                    }`}>
                      <User size={24} />
                    </div>
                    {risk !== 'NONE' && (
                        <div className={`absolute -top-1 -right-1 text-white rounded-full p-0.5 border-2 border-white ${risk === 'HIGH' ? 'bg-red-500' : 'bg-orange-500'}`} title={`${risk} Risk Alert`}>
                            <Shield size={10} />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold truncate ${risk === 'HIGH' ? 'text-red-800' : risk === 'MEDIUM' ? 'text-orange-800' : 'text-slate-800 group-hover:text-blue-700'}`}>
                      {student.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {student.id.slice(-6)}
                      </span>
                      {student.studentClass && (
                          <span className="inline-flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              <GraduationCap size={10} className="mr-1" />
                              {student.studentClass}
                          </span>
                      )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickLog(student.name);
                }}
                className="p-2 ml-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors z-10"
                title="Quick Log"
              >
                <Plus size={20} />
              </button>
            </div>
          );
        })}
        
        {filteredStudents.length === 0 && (
             <div className="col-span-full text-center py-16 bg-white rounded-xl border border-slate-100 border-dashed">
                 <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <Search size={24} className="text-slate-300" />
                 </div>
                 <p className="text-slate-500">No students found matching your criteria.</p>
             </div>
        )}
      </div>
    </div>
  );
};

export default StudentDirectory;
