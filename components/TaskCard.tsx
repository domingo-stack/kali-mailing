'use client'
import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '@/lib/types'

type TaskCardProps = {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onSelect: (task: Task) => void;
  onArchive: (taskId: number) => void;
  onUnarchive: (taskId: number) => void; // 👇 NUEVO
  isArchivedView?: boolean;
}

export default function TaskCard({ task, onUpdate, onDelete, onSelect, onArchive, onUnarchive, isArchivedView = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, };
  
  
  const isOverdue = React.useMemo(() => {
    if (task.completed || !task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    return dueDate < today;
  }, [task.due_date, task.completed]);

  const assigneeInitial = task.assignee?.email ? task.assignee.email.charAt(0).toUpperCase() : '?';
  const completedClass = task.completed ? 'opacity-50' : '';
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que quieres borrar la tarea: "${task.title}"?`)) {
      onDelete(task.id);
    }
  };
  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que quieres archivar la tarea: "${task.title}"?`)) {
      onArchive(task.id);
    }
  };
  const handleUnarchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUnarchive(task.id);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      className={`group bg-white p-3 rounded-lg shadow-sm border flex flex-col justify-between gap-3 transition-all h-28 ${isArchivedView ? 'opacity-70' : (task.completed ? 'opacity-50' : '')}`}
    >
      {/* --- SECCIÓN SUPERIOR: CHECKBOX Y TÍTULO --- */}
      <div className="flex items-start gap-3 w-full">
        {!isArchivedView && (
          <div className="flex items-center gap-2 pt-1">
             <div {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-gray-300 group-hover:text-gray-500">
                <svg viewBox="0 0 20 20" width="12" fill="currentColor"><path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-12a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path></svg>
             </div>
             <div 
                onClick={handleToggle} 
                className={`w-5 h-5 rounded-full flex-shrink-0 cursor-pointer transition-all border-2 flex items-center justify-center`}
                style={{
                  borderColor: task.completed ? '#ff8080' : '#9CA3AF',
                  backgroundColor: task.completed ? '#ff8080' : 'transparent'
                }}
             >
               {task.completed && <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
             </div>
          </div>
        )}
        <div onClick={() => onSelect(task)} className="flex-grow cursor-pointer w-full overflow-hidden pt-0.5">
            {/* 👇 ARREGLO 1: Lógica para tachar el texto restaurada */}
            <p 
              className={`font-semibold truncate ${task.completed && !isArchivedView ? 'line-through text-gray-500' : ''}`}
              style={{color: '#383838'}}
              title={task.title}
            >
              {task.title}
            </p>
        </div>
      </div>

      {/* --- ROBUST UNIFIED FOOTER --- */}
      <div className="flex justify-between items-center w-full">
        {/* Left Side: Meta Info */}
        <div className="flex items-center gap-2 text-xs text-gray-500 overflow-hidden">
            {task.due_date && (
                <div 
                  className={`flex items-center space-x-1 flex-shrink-0`}
                  style={!task.completed && new Date(task.due_date) < new Date() ? { color: '#ff8080', fontWeight: '600' } : {}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span>{new Date(task.due_date).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })}</span>
                </div>
            )}
            {task.projects && (
              <span 
                className="px-2 py-0.5 bg-gray-100 rounded-full truncate" 
                title={task.projects.name}
              >
                {task.projects.name}
              </span>
            )}
        </div>

        {/* Right Side: Assignee & Action Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
            <div 
                className="w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-xs flex-shrink-0" 
                title={task.assignee?.email || 'Sin asignar'}
                style={{ backgroundColor: '#3c527a' }}
            >
                {assigneeInitial}
            </div>
            {/* 👇 ARREGLO 2: Lógica de botones restaurada */}
            <div>
                {isArchivedView ? (
                    <button onClick={handleUnarchive} className="text-gray-400 transition-colors p-1" title="Desarchivar tarea" onMouseEnter={(e) => e.currentTarget.style.color = '#3c527a'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M7 9a7 7 0 0110-5.46M20 20v-5h-5M17 15a7 7 0 01-10 5.46" /></svg>
                    </button>
                ) : task.completed ? (
                    <button onClick={handleArchive} className="text-gray-400 transition-colors p-1" title="Archivar tarea" onMouseEnter={(e) => e.currentTarget.style.color = '#3c527a'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                    </button>
                ) : (
                    <button onClick={handleDelete} className="text-gray-400 transition-colors p-1" onMouseEnter={(e) => e.currentTarget.style.color = '#ff8080'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'} title="Eliminar tarea">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );}
