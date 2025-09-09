'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Task, Comment, Project, TeamMember, Collaborator } from '@/lib/types'
import AddTaskForm from '@/components/AddTaskForm'
import Modal from '@/components/Modal'
import EditTaskForm from '@/components/EditTaskForm'
import TaskCard from '@/components/TaskCard'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/context/AuthContext'
import CreateButton from '@/components/CreateButton'
import AddProjectForm from '@/components/AddProjectForm'
import MyProjects from '@/components/MyProjects'
import ActivityFeed from '@/components/ActivityFeed'
import InviteProjectMembersModal from '@/components/InviteProjectMembersModal'
import { User } from '@supabase/supabase-js'
import { TaskUpdatePayload } from '@/lib/types';
import { CollaboratorRecord } from '@/lib/types'; // O la ruta correcta a tu archivo

type FilterType = 'alDia' | 'atrasadas' | 'finalizadas';

// Definimos el tipo Project con los nuevos datos de miembros
type ProjectWithMembers = Project & { members: { user_id: string; email: string; }[] };

export default function MyTasksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<ProjectWithMembers[]>([]); // Usamos el nuevo tipo
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('alDia');
  const [createModalContent, setCreateModalContent] = useState<'task' | 'project' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [invitingToProject, setInvitingToProject] = useState<Project | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [tasksResponse, membersResponse, projectsResponse] = await Promise.all([
      supabase.rpc('get_my_assigned_tasks_with_projects'),
      supabase.rpc('get_team_members'),
      supabase.rpc('get_projects_with_members')
    ]);

    const { data: allMyTasks, error: tasksError } = tasksResponse;
    const { data: membersData, error: membersError } = membersResponse;
    const { data: projectsData, error: projectsError } = projectsResponse;

    if (tasksError || membersError || projectsError) {
      console.error({ tasksError, membersError, projectsError });
      setLoading(false);
      return;
    }
    
    setTeamMembers(membersData || []);
    setProjects(projectsData as ProjectWithMembers[] || []);

    let tasksToDisplay: Task[] = allMyTasks || [];
    const today = new Date().toISOString().split('T')[0];

    if (activeFilter === 'alDia') {
      tasksToDisplay = tasksToDisplay.filter(task => !task.completed && task.due_date && task.due_date >= today);
    } else if (activeFilter === 'atrasadas') {
      tasksToDisplay = tasksToDisplay.filter(task => !task.completed && task.due_date && task.due_date < today);
    } else if (activeFilter === 'finalizadas') {
      tasksToDisplay = tasksToDisplay.filter(task => task.completed);
    }
    
    const membersMap = new Map(
      (membersData || [])
        .filter((member: TeamMember) => member.user_id && member.email)
        .map((member: TeamMember) => [member.user_id!, member.email!])
        
    );
    const enrichedTasks: Task[] = tasksToDisplay.map((task: Task) => {
      const assigneeEmail = task.assignee_user_id ? membersMap.get(task.assignee_user_id) : undefined;
      return {
        ...task,
        assignee: typeof assigneeEmail === 'string' ? { email: assigneeEmail } : null,
      };
    });
    setTasks(enrichedTasks);
    setLoading(false);
  }, [user, activeFilter]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const closeCreateModal = () => setCreateModalContent(null);

  const handleAddTask = async (taskData: { title: string; description: string; projectId: number | null; dueDate: string | null; assigneeId: string | null; }) => {
    if (!user) return;
    const { data: teamData } = await supabase.from('team_members').select('team_id').eq('user_id', user.id).single();
    if (!teamData) { console.error('No se pudo encontrar el equipo para crear la tarea'); return; }
    const { error } = await supabase.rpc('create_task', { p_title: taskData.title, p_description: taskData.description, p_project_id: taskData.projectId, p_due_date: taskData.dueDate, p_assignee_id: taskData.assigneeId, p_team_id: teamData.team_id });
    if (error) { alert('Error al crear la tarea: ' + error.message); } 
    else { await fetchData(); closeCreateModal(); }
  };

  const handleAddProject = async (projectData: { name: string; description: string | null }) => {
    if (!user) return;
    const { data: teamData } = await supabase.from('team_members').select('team_id').eq('user_id', user.id).single();
    if (teamData) {
        const { error } = await supabase.rpc('create_project', { 
            p_name: projectData.name, 
            p_description: projectData.description, 
            p_team_id: teamData.team_id 
        });
        if (error) { alert('Error al crear el proyecto: ' + error.message); } 
        else { await fetchData(); closeCreateModal(); }
    } else {
        alert('No se pudo encontrar el equipo del usuario.');
    }
  };

  const handleTaskCompleted = async (taskToUpdate: Task) => {
    const newTasks = tasks.map(task => task.id === taskToUpdate.id ? { ...task, completed: !task.completed } : task);
    setTasks(newTasks);
    if (editingTask && editingTask.id === taskToUpdate.id) { setEditingTask({ ...editingTask, completed: !editingTask.completed }); }
    const { error } = await supabase.from('tasks').update({ completed: !taskToUpdate.completed, completed_at: !taskToUpdate.completed ? new Date().toISOString() : null }).eq('id', taskToUpdate.id);
    if (error) { console.error('Error updating task:', error); await fetchData(); }
  };

  const handleDeleteTask = async (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    const { error } = await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', taskId);
    if (error) { console.error('Error soft-deleting task:', error); await fetchData(); }
  };

  const handleUpdateTask = async (updatedData: TaskUpdatePayload) => {
    if (!editingTask) return;
    setIsSaving(true); 
  
    const { error } = await supabase.rpc('update_task', {
      p_task_id: editingTask.id,
      p_new_title: updatedData.title,
      p_new_description: updatedData.description,
      p_new_due_date: updatedData.due_date,
      p_new_project_id: updatedData.project_id, // Ahora esto es válido
      p_new_assignee_id: updatedData.assignee_user_id
    });
  
    if (error) {
      console.error('Error updating task via RPC:', error);
      alert('Error al guardar los cambios.');
    }
    
    await fetchData(); 
    setIsSaving(false); 
  };
  
  const handleSelectTask = async (task: Task) => {
    const [collaboratorsRes, commentsRes] = await Promise.all([
      supabase
        .from('task_collaborators')
        .select('user_id') 
        .eq('task_id', task.id),
      supabase
        .from('comments')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at')
    ]);
  
    if (collaboratorsRes.error) {
      console.error('Error fetching collaborators:', collaboratorsRes.error);
    } else {
      const membersMap = new Map(teamMembers.map(m => [m.user_id, m.email]));
      const fetchedCollaborators = collaboratorsRes.data.map((collab: CollaboratorRecord) => ({
        user_id: collab.user_id,
        email: membersMap.get(collab.user_id) || 'Email no encontrado'
      }));
      setCollaborators(fetchedCollaborators);
    }
  
    if (commentsRes.error) console.error('Error fetching comments:', commentsRes.error);
    else setComments(commentsRes.data as Comment[]);
    setEditingTask(task);
  };
  
  const handleCommentAdd = async (content: string) => {
    if (!editingTask || !user) return;

    const mentionRegex = /@([\w.-]+@[\w.-]+)/g;
    const mentionedEmails = [...content.matchAll(mentionRegex)].map(match => match[1]);

    const membersMap = new Map(teamMembers.map(m => [m.email, m.user_id]));
    const mentionedUserIds = mentionedEmails
        .map(email => membersMap.get(email))
        .filter((id): id is string => id !== undefined); 

    const { data, error } = await supabase.rpc('add_comment_and_notify', {
        p_task_id: editingTask.id,
        p_content: content,
        p_mentioned_user_ids: mentionedUserIds
    });

    if (error) {
        console.error('Error adding comment:', error);
        alert('Error al añadir comentario: ' + error.message);
    } else if (data) {
        setComments([...comments, data as Comment]);
    }
  };

  const handleCollaboratorAdd = async (userId: string) => {
    if (!editingTask) return;

    const { error } = await supabase.rpc('add_collaborator_and_notify', {
        p_task_id: editingTask.id,
        p_user_id: userId
    });

    if (error) {
        alert('Error al añadir colaborador: ' + error.message);
    } else {
        const newCollaborator = teamMembers.find(tm => tm.user_id === userId);
        if (newCollaborator) {
             setCollaborators([...collaborators, { user_id: newCollaborator.user_id, email: newCollaborator.email }]);
        }
    }
  };

  const handleCollaboratorRemove = async (userId: string) => {
    if (!editingTask) return;
    const { error } = await supabase
        .from('task_collaborators')
        .delete()
        .match({ task_id: editingTask.id, user_id: userId });
    
    if (error) {
        alert('Error al eliminar colaborador: ' + error.message);
    } else {
        setCollaborators(collaborators.filter(c => c.user_id !== userId));
    }
  };

  return (
    <AuthGuard>
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi Dashboard</h1>
        <div className="my-6 border-b border-gray-200">
          <div className="flex space-x-2">
            <button onClick={() => setActiveFilter('alDia')} className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeFilter === 'alDia' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Al día</button>
            <button onClick={() => setActiveFilter('atrasadas')} className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeFilter === 'atrasadas' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>Atrasadas</button>
            <button onClick={() => setActiveFilter('finalizadas')} className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeFilter === 'finalizadas' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>Finalizadas</button>
          </div>
        </div>
        {loading ? <p>Cargando datos del dashboard...</p> : (
          <div className="space-y-3">
            {tasks.length > 0 ? tasks.map(task => (<TaskCard key={task.id} task={task} onUpdate={handleTaskCompleted} onDelete={handleDeleteTask} onSelect={handleSelectTask} />)) : (<p className="text-center text-gray-500 py-8">No hay tareas en esta categoría.</p>)}
          </div>
        )}
        <MyProjects projects={projects} onInviteClick={(project) => setInvitingToProject(project)} />
        <ActivityFeed />
      </main>
      <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)}>
        {editingTask && (
          <EditTaskForm 
            task={editingTask} 
            projects={projects} 
            comments={comments} 
            collaborators={collaborators}
            currentUser={user}
            isSaving={isSaving}
            onSave={handleUpdateTask} 
            onCancel={() => setEditingTask(null)} 
            onCommentAdd={handleCommentAdd} 
            onToggleComplete={handleTaskCompleted} 
            onCollaboratorAdd={handleCollaboratorAdd}
            onCollaboratorRemove={handleCollaboratorRemove}
          />
        )}
      </Modal>
      <Modal isOpen={!!createModalContent} onClose={closeCreateModal}>
        {createModalContent === 'task' && (<AddTaskForm onAddTask={handleAddTask} projects={projects} onCancel={closeCreateModal} />)}
        {createModalContent === 'project' && (<AddProjectForm onAddProject={handleAddProject} onCancel={closeCreateModal} />)}
      </Modal>
      <Modal isOpen={!!invitingToProject} onClose={() => setInvitingToProject(null)}>
        {invitingToProject && (
          <InviteProjectMembersModal
            projectId={invitingToProject.id}
            onClose={() => setInvitingToProject(null)}
            onMembersAdded={() => {
              fetchData();
              setInvitingToProject(null);
            }}
          />
        )}
      </Modal>
      <CreateButton 
        onNewTask={() => setCreateModalContent('task')} 
        onNewProject={() => setCreateModalContent('project')} 
      />
    </AuthGuard>
  );
}