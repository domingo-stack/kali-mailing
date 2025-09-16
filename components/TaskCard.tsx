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
}

export default function TaskCard({ task, onUpdate, onDelete, onSelect }: TaskCardProps) {
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={`bg-white p-3 rounded-lg shadow-sm border flex items-start space-x-3 transition-all ${completedClass}`}>
      <div {...listeners} className="cursor-grab active:cursor-grabbing touch-none pt-1 text-gray-400">
        <svg viewBox="0 0 20 20" width="16" fill="currentColor"><path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-12a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path></svg>
      </div>
      
      {/* 👇 CAMBIO 1: Checkbox usa el color primario (naranja) al completarse */}
      <div 
        onClick={handleToggle} 
        className={`w-5 h-5 mt-1 rounded-full flex-shrink-0 cursor-pointer transition-all border-2`}
        style={{
          borderColor: task.completed ? '#ff8080' : '#9CA3AF', // Naranja o Gris
          backgroundColor: task.completed ? '#ff8080' : 'white'
        }}
      ></div>

      <div onClick={() => onSelect(task)} className="flex-grow cursor-pointer space-y-1">
        <p className={`font-medium text-gray-800 ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          {task.due_date && (
            // 👇 CAMBIO 2: Fechas vencidas usan el color primario (naranja)
            <div 
              className={`flex items-center space-x-1`}
              style={isOverdue ? { color: '#ff8080', fontWeight: '600' } : {}}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>{new Date(task.due_date).toLocaleDateString()}</span>
              {isOverdue && <span className="font-bold">⚠️</span>}
            </div>
          )}
          {task.projects && <span>•</span>}
          {task.projects && <span>{task.projects.name}</span>}
        </div>
      </div>

      {/* 👇 CAMBIO 3: Círculo del asignado usa el color secundario (azul) */}
      <div 
        className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0" 
        title={task.assignee?.email || 'Sin asignar'}
        style={{ backgroundColor: '#3c527a' }}
      >
        {assigneeInitial}
      </div>

      {/* 👇 CAMBIO 4: Icono de borrar usa el color primario (naranja) en hover */}
      <button 
        onClick={handleDelete} 
        className="text-gray-400 transition-colors p-1"
        onMouseEnter={(e) => e.currentTarget.style.color = '#ff8080'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>
  );
};