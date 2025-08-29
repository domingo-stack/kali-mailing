'use client'

import { useEffect, useState } from 'react'
import RichTextEditor from './RichTextEditor' // Importamos nuestro nuevo editor

// Tipos de datos que usa este componente
type Comment = { id: number; created_at: string; content: string; user_name: string | null; };
type Subtask = { id: number; title: string; is_completed: boolean; task_id: number; description: string | null; due_date: string | null; user_responsible: string | null; };
type Project = { id: number; name: string; };
type Task = { id: number; title: string; description: string | null; due_date: string | null; completed: boolean; user_responsible: string | null; status: string; projects: { id: number; name: string; } | null; };

// Propiedades que el formulario de edición recibe
type EditTaskFormProps = {
  task: Task;
  projects: Project[];
  subtasks: Subtask[];
  comments: Comment[];
  onSave: (updatedData: any) => Promise<void>;
  onCancel: () => void;
  onSubtaskAdd: (subtaskData: { title: string; responsible: string | null; dueDate: string | null; }) => Promise<void>;
  onSubtaskToggle: (subtaskId: number, newStatus: boolean) => Promise<void>;
  onCommentAdd: (content: string) => Promise<void>;
  onToggleComplete: (task: Task) => void;
};

export default function EditTaskForm({ task, projects, subtasks = [], comments = [], onSave, onCancel, onSubtaskAdd, onSubtaskToggle, onCommentAdd, onToggleComplete }: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '');
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>(task.projects?.id || '');
  const [responsible, setResponsible] = useState(task.user_responsible || '');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskResponsible, setNewSubtaskResponsible] = useState('');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
    setSelectedProjectId(task.projects?.id || '');
    setResponsible(task.user_responsible || '');
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData = {
      title: title.trim(),
      description: description,
      due_date: dueDate === '' ? null : dueDate,
      project_id: selectedProjectId === '' ? null : Number(selectedProjectId),
      user_responsible: responsible.trim() === '' ? null : responsible.trim()
    };
    await onSave(updatedData);
  };

  const handleAddSubtask = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      onSubtaskAdd({
        title: newSubtaskTitle.trim(),
        responsible: newSubtaskResponsible.trim() === '' ? null : newSubtaskResponsible.trim(),
        dueDate: newSubtaskDueDate === '' ? null : newSubtaskDueDate,
      });
      setNewSubtaskTitle('');
      setNewSubtaskResponsible('');
      setNewSubtaskDueDate('');
    }
  };
  
  const handleAddComment = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (newComment.trim()) {
      onCommentAdd(newComment.trim());
      setNewComment('');
    }
  };

  const isCompleted = task.completed;
  const disabledClass = isCompleted ? 'opacity-60 pointer-events-none' : '';

  return (
    <div className="relative p-6">
       <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 z-10">
        <svg xmlns="http://www.w.3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div className="flex items-center mb-6 pb-4 border-b">
        <button
          onClick={() => onToggleComplete(task)}
          className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center transition-colors ${
            isCompleted ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isCompleted ? 'text-green-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {isCompleted ? 'Finalizada' : 'Marcar como finalizada'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className={`space-y-4 ${disabledClass}`}>
          <div className={`text-2xl font-bold ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full font-bold text-2xl border-none focus:ring-0 p-0 bg-transparent"
              disabled={isCompleted}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Descripción</label>
            <RichTextEditor
              content={description}
              onChange={(newDescription) => setDescription(newDescription)}
              disabled={isCompleted}
            />
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Responsable</label>
              <input type="text" value={responsible} onChange={(e) => setResponsible(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" disabled={isCompleted} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Fecha de Entrega</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" disabled={isCompleted} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-500">Proyecto</label>
              <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(Number(e.target.value))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" disabled={isCompleted}>
                  <option value="">Sin Proyecto</option>
                  {projects.map((project) => (<option key={project.id} value={project.id}>{project.name}</option>))}
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700">Sub-tareas</label>
            <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
              {subtasks.map(subtask => {
                const subtaskUserInitial = subtask.user_responsible ? subtask.user_responsible.charAt(0).toUpperCase() : null;
                return (
                  <div key={subtask.id} className="flex items-center p-2 rounded-md hover:bg-gray-50">
                    <input type="checkbox" checked={subtask.is_completed} onChange={() => onSubtaskToggle(subtask.id, !subtask.is_completed)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <div className="ml-3 text-sm flex-grow"><span className={`${subtask.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>{subtask.title}</span></div>
                    {subtask.due_date && <span className="text-xs text-gray-500 mr-3">{subtask.due_date}</span>}
                    {subtaskUserInitial && <div className="w-6 h-6 text-xs rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold flex-shrink-0">{subtaskUserInitial}</div>}
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 pt-2 border-t border-dashed">
              <input type="text" value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} placeholder="Título nueva sub-tarea" className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm" />
              <div className="flex items-center gap-2">
                <input type="text" value={newSubtaskResponsible} onChange={(e) => setNewSubtaskResponsible(e.target.value)} placeholder="Responsable (opcional)" className="flex-grow border-gray-300 rounded-md shadow-sm sm:text-sm" />
                <input type="date" value={newSubtaskDueDate} onChange={(e) => setNewSubtaskDueDate(e.target.value)} className="border-gray-300 rounded-md shadow-sm sm:text-sm" />
                <button type="button" onClick={handleAddSubtask} className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300" disabled={isCompleted}>Añadir</button>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700">Comentarios</label>
            <div className="max-h-40 overflow-y-auto pr-2 space-y-3 bg-gray-50 p-3 rounded-md">
              {comments.map(comment => (
                <div key={comment.id} className="text-sm">
                  <p className="font-semibold">{comment.user_name || 'Anónimo'}</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(comment.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 pt-2">
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escribe un comentario..." rows={2} className="flex-grow border-gray-300 rounded-md shadow-sm" disabled={isCompleted} />
              <button type="button" onClick={handleAddComment} className="px-4 py-2 text-sm bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700" disabled={isCompleted}>Comentar</button>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700" disabled={isCompleted}>Guardar Cambios</button>
          </div>
      </form>
    </div>
  );
}