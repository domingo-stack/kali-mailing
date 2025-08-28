'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabaseClient'
import TaskCard, { Task } from '../../../components/TaskCard'
import Modal from '../../../components/Modal'
import EditTaskForm from '../../../components/EditTaskForm'
import KanbanColumn from '../../../components/KanbanColumn'

import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay } from '@dnd-kit/core'

type Project = {
  id: number;
  name: string;
  description: string | null;
};

const KANBAN_COLUMNS = ['Por Hacer', 'En Progreso', 'Hecho'];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  }));

  const fetchProjectData = async () => {
    if (!projectId) return;
    setLoading(true);
    const { data: projectData, error: projectError } = await supabase.from('projects').select('*').eq('id', projectId).single();
    const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*, projects ( id, name )').eq('project_id', projectId).is('deleted_at', null).order('created_at', { ascending: false });
    if (projectError) console.error('Error fetching project details:', projectError);
    else setProject(projectData as Project);
    if (tasksError) console.error('Error fetching tasks for project:', tasksError);
    else if (tasksData) setTasks(tasksData as Task[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const handleTaskCompleted = async (taskToUpdate: Task) => {
    setTasks(tasks.map(task => task.id === taskToUpdate.id ? taskToUpdate : task));
    const { error } = await supabase.from('tasks').update({ completed: taskToUpdate.completed }).eq('id', taskToUpdate.id);
    if (error) {
      console.error('Error updating task:', error);
      await fetchProjectData();
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    const { error } = await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', taskId);
    if (error) {
      console.error('Error soft-deleting task:', error);
      await fetchProjectData();
    }
  };

  const handleUpdateTask = async (updatedData: any) => {
    if (!editingTask) return;
    const { error } = await supabase.rpc('update_task_details', {
      task_id: editingTask.id,
      new_title: updatedData.title,
      new_due_date: updatedData.due_date,
      new_project_id: updatedData.project_id,
      new_responsible: updatedData.user_responsible
    });
    if (error) {
      console.error('Error updating task via RPC:', error);
    } else {
      await fetchProjectData();
    }
    setEditingTask(null);
  };

  const handleDragStart = (event: DragEndEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as string;
    const activeTask = tasks.find(t => t.id === activeId);

    if (activeTask && overId && activeTask.status !== overId && KANBAN_COLUMNS.includes(overId)) {
      setTasks(prevTasks => prevTasks.map(t => t.id === activeId ? { ...t, status: overId } : t));
      const { error } = await supabase.from('tasks').update({ status: overId }).eq('id', activeId);
      if (error) {
        console.error("Error updating task status:", error);
        await fetchProjectData();
      }
    }
  };

  if (loading) return <p className="text-center p-8">Cargando proyecto...</p>;
  if (!project) return <p className="text-center p-8">Proyecto no encontrado.</p>;

  const tasksByStatus = KANBAN_COLUMNS.reduce((acc, status) => {
    acc[status] = tasks.filter(task => task.status === status);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="bg-gray-50 min-h-screen font-sans">
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <Link href="/projects" className="text-blue-600 hover:underline">&larr; Volver a todos los proyectos</Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {KANBAN_COLUMNS.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status] || []}
                onUpdate={handleTaskCompleted}
                onDelete={handleDeleteTask}
                onSelect={setEditingTask}
              />
            ))}
          </div>
        </main>

        <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)}>
          {editingTask && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Editar Tarea</h2>
              <EditTaskForm task={editingTask} projects={project ? [project] : []} onSave={handleUpdateTask} onCancel={() => setEditingTask(null)} />
            </div>
          )}
        </Modal>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} onUpdate={()=>{}} onDelete={()=>{}} onSelect={()=>{}} /> : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}