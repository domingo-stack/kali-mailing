'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AddTaskForm from '../components/AddTaskForm'
import Modal from '../components/Modal'
import EditTaskForm from '../components/EditTaskForm'

// Tipos de datos actualizados
type Project = {
  id: number;
  name: string;
};

type Task = {
  id: number;
  title: string;
  due_date: string | null;
  completed: boolean;
  user_responsible: string | null; // <-- Añadido
  projects: {
    id: number;
    name: string;
  } | null;
};

// Componente TaskCard actualizado para mostrar el avatar
const TaskCard = ({ task, onUpdate, onDelete, onSelect }: { task: Task, onUpdate: (task: Task) => void, onDelete: (taskId: number) => void, onSelect: (task: Task) => void }) => {
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
    <div onClick={() => onSelect(task)} className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4 transition-all hover:shadow-md cursor-pointer ${completedClass}`}>
      <div 
        onClick={handleToggle}
        className={`w-6 h-6 rounded-full flex-shrink-0 cursor-pointer transition-all ring-2 ring-gray-300 hover:ring-blue-500 ${task.completed ? 'bg-blue-500' : 'bg-white'}`}
      ></div>
      <div className="flex-grow">
        <p className="font-semibold text-gray-800">{task.title}</p>
        <div className="flex items-center text-sm text-gray-500 mt-1 space-x-4">
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{projectName}</span>
          <span className="text-gray-500">{task.due_date || 'Sin Fecha'}</span>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
        {userInitial}
      </div>
      <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};


// Componente principal de la página
export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*, projects ( id, name )')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*');

    if (tasksError) console.error('Error fetching tasks:', tasksError);
    else if (tasksData) setTasks(tasksData as Task[]);

    if (projectsError) console.error('Error fetching projects:', projectsError);
    else if (projectsData) setProjects(projectsData as Project[]);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

 // Reemplaza la vieja función handleAddTask con esta
const handleAddTask = async (taskData: { title: string; projectId: number | null; dueDate: string | null; responsible: string | null }) => {
  // Usamos la llamada RPC en lugar de .insert()
  const { error } = await supabase.rpc('insert_task', {
    new_title: taskData.title,
    new_project_id: taskData.projectId,
    new_due_date: taskData.dueDate,
    new_responsible: taskData.responsible
  });

  if (error) {
    console.error('Error adding task via RPC:', error);
  } else {
    await fetchData(); // Usamos la función que ya teníamos para refrescar todo
  }
};

  const handleTaskCompleted = async (taskToUpdate: Task) => {
    setTasks(tasks.map(task => task.id === taskToUpdate.id ? taskToUpdate : task));
    
    const { error } = await supabase
      .from('tasks')
      .update({ completed: taskToUpdate.completed })
      .eq('id', taskToUpdate.id);

    if (error) {
      console.error('Error updating task:', error);
      await fetchData();
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));

    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error soft-deleting task:', error);
      await fetchData();
    }
  };

// Reemplaza la vieja función handleUpdateTask con esta
const handleUpdateTask = async (updatedData: {
  title: string;
  due_date: string | null;
  project_id: number | null;
  user_responsible: string | null;
}) => {
if (!editingTask) return;

// Llamamos a nuestra nueva función RPC en lugar de .update()
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
  // Si tiene éxito, refrescamos los datos para ver el cambio
  await fetchData();
}

setEditingTask(null); // Cerramos el modal
};

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
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
                onSelect={setEditingTask}
              />
            ))}
          </div>
        )}
      </main>

      <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)}>
        {editingTask && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Editar Tarea</h2>
            <EditTaskForm
              task={editingTask}
              projects={projects}
              onSave={handleUpdateTask}
              onCancel={() => setEditingTask(null)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}