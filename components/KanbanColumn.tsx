'use client'

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { Task } from '@/lib/types'; // O la ruta correcta a tu archivo de tipos

type KanbanColumnProps = {
  id: string;
  title: string;
  tasks: Task[];
  onUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onSelect: (task: Task) => void;
  onArchive: (taskId: number) => void;
  onUnarchive: (taskId: number) => void;
  isArchivedView?: boolean;
};

export default function KanbanColumn({ id, title, tasks, onUpdate, onDelete, onSelect, onArchive, onUnarchive, isArchivedView = false }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  

  return (
    <div
      ref={setNodeRef}
      className="rounded-lg p-4 flex flex-col transition-colors"
      // 👇 Y la aplicamos con `style` para usar nuestros colores de marca
      style={{ 
        backgroundColor: isOver ? '#EBF0F7' : '#F9FAFB' // Azul claro de marca o Gris muy claro
      }}
    >
      <h2 
        className="font-bold text-lg mb-4" 
        style={{ color: '#383838' }}
      >
        {title} ({tasks.length})
      </h2>
      
      <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
      <div className="space-y-3 flex-grow min-h-[100px] max-h-[65vh] overflow-y-auto p-1 pr-2">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onSelect={onSelect}
                onArchive={onArchive}
                onUnarchive={onUnarchive}
                isArchivedView={isArchivedView}

              />
            ))
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-full flex items-center justify-center">
              <p className="text-sm text-gray-500">Arrastra una tarea aquí</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}