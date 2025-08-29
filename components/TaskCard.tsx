'use client'
import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export type Task = {
  id: number;
  title: string;
  description: string | null; // <-- La línea añadida
  due_date: string | null;
  completed: boolean;
  user_responsible: string | null;
  status: string;
  projects: {
    id: number;
    name: string;
  } | null;
};

type TaskCardProps = {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onSelect: (task: Task) => void;
}

export default function TaskCard({ task, onUpdate, onDelete, onSelect }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const completedClass = task.completed ? 'line-through text-gray-400' : '';
  const projectName = task.projects ? task.projects.name : 'Sin Proyecto';
  const userInitial = task.user_responsible ? task.user_responsible.charAt(0).toUpperCase() : '?';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ ...task, completed: !task.completed });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que quieres borrar la tarea: "${task.title}"?`)) {
      onDelete(task.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-3 transition-all ${completedClass}`}
    >
      <div {...listeners} className="cursor-grab active:cursor-grabbing touch-none p-2 text-gray-400">
        <svg viewBox="0 0 20 20" width="16" fill="currentColor">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-12a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
        </svg>
      </div>
      
      <div 
        onClick={handleToggle}
        className={`w-5 h-5 rounded-full flex-shrink-0 cursor-pointer transition-all border-2 ${task.completed ? 'border-blue-500 bg-blue-500' : 'border-gray-400 bg-white'}`}
      ></div>

      <div onClick={() => onSelect(task)} className="flex-grow cursor-pointer">
        <p className="font-semibold text-gray-800">{task.title}</p>
      </div>
      
      <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
        {userInitial}
      </div>
      
      <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 transition-colors p-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};