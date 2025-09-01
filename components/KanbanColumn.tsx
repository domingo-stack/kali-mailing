'use client'

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard, { Task } from './TaskCard';

type KanbanColumnProps = {
  id: string;
  title: string;
  tasks: Task[];
  onUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onSelect: (task: Task) => void;
};

export default function KanbanColumn({ id, title, tasks, onUpdate, onDelete, onSelect }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const columnBackgroundColor = isOver ? 'bg-blue-100' : 'bg-gray-100';

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg p-4 flex flex-col transition-colors ${columnBackgroundColor}`}
    >
      <h2 className="font-bold text-lg mb-4 text-gray-700">{title} ({tasks.length})</h2>
      
      <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
        <div className="space-y-4 flex-grow min-h-[100px]">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onSelect={onSelect}
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