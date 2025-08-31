'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AddTaskForm from '@/components/AddTaskForm'
import Modal from '@/components/Modal'
import EditTaskForm from '@/components/EditTaskForm'
import TaskCard, { Task } from '@/components/TaskCard'
import AuthGuard from '@/components/AuthGuard'

// Tipos de datos
type Project = {
  id: number;
  name: string;
};

type Subtask = {
  id: number;
  title: string;
  is_completed: boolean;
  task_id: number;
  description: string | null;
  due_date: string | null;
  user_responsible: string | null;
};

type Comment = {
  id: number;
  created_at: string;
  content: string;
  user_name: string | null;
  task_id: number;
};

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*, projects ( id, name )').is('deleted_at', null).order('created_at', { ascending: false });
    const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*');
    if (tasksError) console.error('Error fetching tasks:', tasksError);
    else if (tasksData) setTasks(tasksData as Task[]);
    if (projectsError) console.error('Error fetching projects:', projectsError);
    else if (projectsData) setProjects(projectsData as Project[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTask = async (taskData: { title: string; projectId: number | null; dueDate: string | null; responsible: string | null }) => {
    const { error } = await supabase.rpc('insert_task', { new_title: taskData.title, new_project_id: taskData.projectId, new_due_date: taskData.dueDate, new_responsible: taskData.responsible });
    if (error) console.error('Error adding task via RPC:', error);
    else await fetchData();
  };

  const handleTaskCompleted = async (taskToUpdate: Task) => {
    const newCompletedStatus = !taskToUpdate.completed;
    const updatedTasks = tasks.map(task => 
      task.id === taskToUpdate.id ? { ...task, completed: newCompletedStatus } : task
    );
    setTasks(updatedTasks);
    if (editingTask && editingTask.id === taskToUpdate.id) {
      setEditingTask({ ...editingTask, completed: newCompletedStatus });
    }
    const { error } = await supabase.from('tasks').update({ completed: newCompletedStatus }).eq('id', taskToUpdate.id);
    if (error) {
      console.error('Error updating task:', error);
      await fetchData();
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    const { error } = await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', taskId);
    if (error) {
      console.error('Error soft-deleting task:', error);
      await fetchData();
    }
  };

  const handleUpdateTask = async (updatedData: any) => {
    if (!editingTask) return;
    const { error } = await supabase.rpc('update_task_details', {
      task_id: editingTask.id,
      new_title: updatedData.title,
      new_description: updatedData.description,
      new_due_date: updatedData.due_date,
      new_project_id: updatedData.project_id,
      new_responsible: updatedData.user_responsible
    });
    if (error) {
      console.error('Error updating task via RPC:', error);
    } else {
      await fetchData();
    }
    setEditingTask(null);
  };
  
  const handleSelectTask = async (task: Task) => {
    const { data: subtasksData, error: subtasksError } = await supabase.from('subtasks').select('*').eq('task_id', task.id).order('created_at');
    if (subtasksError) console.error('Error fetching subtasks:', subtasksError);
    else setSubtasks(subtasksData as Subtask[]);

    const { data: commentsData, error: commentsError } = await supabase.from('comments').select('*').eq('task_id', task.id).order('created_at');
    if (commentsError) console.error('Error fetching comments:', commentsError);
    else setComments(commentsData as Comment[]);

    setEditingTask(task);
  };

  const handleSubtaskAdd = async (subtaskData: { title: string; responsible: string | null; dueDate: string | null; }) => {
    if (!editingTask) return;
    const { data, error } = await supabase.from('subtasks').insert({ title: subtaskData.title, task_id: editingTask.id, user_responsible: subtaskData.responsible, due_date: subtaskData.dueDate }).select().single();
    if (error) console.error('Error adding subtask:', error);
    else if (data) setSubtasks([...subtasks, data as Subtask]);
  };

  const handleSubtaskToggle = async (subtaskId: number, newStatus: boolean) => {
    setSubtasks(subtasks.map(st => st.id === subtaskId ? { ...st, is_completed: newStatus } : st));
    const { error } = await supabase.from('subtasks').update({ is_completed: newStatus }).eq('id', subtaskId);
    if (error) {
      console.error('Error updating subtask:', error);
      if (editingTask) await handleSelectTask(editingTask);
    }
  };
  
  const handleCommentAdd = async (content: string) => {
    if (!editingTask) return;
    const { data, error } = await supabase.from('comments').insert({ content: content, task_id: editingTask.id, user_name: 'Domingo' }).select().single();
    if (error) console.error('Error adding comment:', error);
    else if (data) setComments([...comments, data as Comment]);
  };

  return (
    <AuthGuard>
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mis Tareas</h1>
        
        <AddTaskForm onAddTask={handleAddTask} projects={projects} />

        {loading ? (
          <p>Cargando tareas...</p>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onUpdate={handleTaskCompleted} 
                onDelete={handleDeleteTask}
                onSelect={handleSelectTask}
              />
            ))}
          </div>
        )}
      </main>

      <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)}>
        {editingTask && (
          <EditTaskForm
            task={editingTask}
            projects={projects}
            subtasks={subtasks}
            comments={comments}
            onSave={handleUpdateTask}
            onCancel={() => setEditingTask(null)}
            onSubtaskAdd={handleSubtaskAdd}
            onSubtaskToggle={handleSubtaskToggle}
            onCommentAdd={handleCommentAdd}
            onToggleComplete={handleTaskCompleted}
          />
        )}
      </Modal>
    </AuthGuard>
  );
}