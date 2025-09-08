'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Task, Comment, Project, ProjectMember, TeamMember, Collaborator } from '@/lib/types'
import Modal from '@/components/Modal'
import EditTaskForm from '@/components/EditTaskForm'
import KanbanColumn from '@/components/KanbanColumn'
import AuthGuard from '@/components/AuthGuard'
import { DndContext, DragEndEvent, DragOverlay, rectIntersection, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { useAuth } from '@/context/AuthContext'
import ProjectMembers from '@/components/ProjectMembers'
import CreateButton from '@/components/CreateButton'
import AddTaskForm from '@/components/AddTaskForm'
import InviteProjectMembersModal from '@/components/InviteProjectMembersModal'
import TaskCard from '@/components/TaskCard'

const KANBAN_COLUMNS = ['Por Hacer', 'En Progreso', 'Hecho'];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- CORRECCIÓN: AÑADIMOS LA DEFINICIÓN DE 'SENSORS' ---
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const fetchData = useCallback(async () => {
    if (!projectId || !user) return;
    setLoading(true);
    
    const [projectRes, membersRes, tasksRes, allProjectsRes, teamMembersRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.rpc('get_project_members', { p_project_id: projectId }),
      supabase.from('tasks').select('*, projects(id, name)').eq('project_id', projectId).is('deleted_at', null),
      supabase.from('projects').select('*'),
      supabase.rpc('get_team_members')
    ]);
    
    const { data: projectData, error: projectError } = projectRes;
    const { data: membersData, error: membersError } = membersRes;
    const { data: tasksData, error: tasksError } = tasksRes;
    const { data: allProjectsData, error: allProjectsError } = allProjectsRes;
    const { data: teamMembersData, error: teamMembersError } = teamMembersRes;

    if (projectError || membersError || tasksError || allProjectsError || teamMembersError || !membersData || !teamMembersData) {
        console.error({ projectError, membersError, tasksError, allProjectsError, teamMembersError });
        setLoading(false);
        setProject(null);
        return;
    }

    setTeamMembers(teamMembersData);
    const membersMap = new Map(teamMembersData.map((member: TeamMember) => [member.user_id, member.email]));
    // --- CORRECCIÓN DE TIPOS EXPLÍCITA ---
    const enrichedTasks: Task[] = (tasksData || []).map((task: any) => {
        const assigneeEmail = task.assignee_user_id ? membersMap.get(task.assignee_user_id) : undefined;
        return {
          ...task,
          assignee: assigneeEmail ? { email: assigneeEmail } : null
        };
    });

    setProject(projectData);
    setProjectMembers(membersData);
    setTasks(enrichedTasks);
    setAllProjects(allProjectsData);
    setLoading(false);
  }, [user, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddTask = async (taskData: { title: string; description: string; projectId: number | null; dueDate: string | null; assigneeId: string | null; }) => {
    if (!user) return;
    const { data: teamData } = await supabase.from('team_members').select('team_id').eq('user_id', user.id).single();
    if (!teamData) { console.error('No se pudo encontrar el equipo para crear la tarea'); return; }
    const { error } = await supabase.rpc('create_task', { p_title: taskData.title, p_description: taskData.description, p_project_id: taskData.projectId, p_due_date: taskData.dueDate, p_assignee_id: taskData.assigneeId, p_team_id: teamData.team_id });
    if (error) { alert('Error al crear la tarea: ' + error.message); } 
    else { await fetchData(); setIsCreateTaskModalOpen(false); }
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

  const handleUpdateTask = async (updatedData: any) => {
    if (!editingTask) return;
    setIsSaving(true); 

    const { error } = await supabase.rpc('update_task', {
      p_task_id: editingTask.id,
      p_new_title: updatedData.title,
      p_new_description: updatedData.description,
      p_new_due_date: updatedData.due_date,
      p_new_project_id: updatedData.project_id,
      p_new_assignee_id: updatedData.assignee_user_id
    });

    if (error) {
      console.error('Error updating task via RPC:', error);
      alert('Error al guardar los cambios.');
    }
    
    await fetchData(); 
    setIsSaving(false); 
  };
  
  const handleDragStart = (event: DragEndEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === Number(active.id));
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = Number(active.id);
    const overId = String(over.id);
    if (activeId !== Number(over.id)) {
      const activeTask = tasks.find(t => t.id === activeId);
      if (activeTask && KANBAN_COLUMNS.includes(overId)) {
        setTasks(prevTasks => prevTasks.map(t => t.id === activeId ? { ...t, status: overId } : t));
        const { error } = await supabase.from('tasks').update({ status: overId }).eq('id', activeTask.id);
        if (error) { console.error("Error updating task status:", error); await fetchData(); }
      }
    }
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
        const fetchedCollaborators = collaboratorsRes.data.map((collab: any) => ({
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

  if (loading) return <div className="flex justify-center items-center min-h-screen"><p>Cargando proyecto...</p></div>;
  if (!project) return <div className="flex justify-center items-center min-h-screen"><p>Proyecto no encontrado o no tienes permiso para verlo.</p></div>;

  return (
    <AuthGuard>
      <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="bg-gray-50 min-h-screen font-sans">
          <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
              <Link href="/" className="text-sm text-blue-600 hover:underline">&larr; Volver al Dashboard</Link>
              <div className="flex justify-between items-start mt-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                    <p className="text-gray-600 mt-1">{project.description}</p>
                </div>
                <div onClick={() => setIsInviteModalOpen(true)} className="cursor-pointer">
                    <ProjectMembers members={projectMembers} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {KANBAN_COLUMNS.map(status => (
                <KanbanColumn 
                  key={status} 
                  id={status} 
                  title={status} 
                  tasks={tasks.filter(t => t.status === status)}
                  onUpdate={handleTaskCompleted}
                  onDelete={handleDeleteTask}
                  onSelect={handleSelectTask}
                />
              ))}
            </div>
          </main>
          <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)}>
            {editingTask && (
              <EditTaskForm
                task={editingTask}
                projects={allProjects}
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
          <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)}>
            <InviteProjectMembersModal
              projectId={projectId}
              onClose={() => setIsInviteModalOpen(false)}
              onMembersAdded={async () => {
                setIsInviteModalOpen(false);
                await fetchData();
              }}
            />
          </Modal>
          <Modal isOpen={isCreateTaskModalOpen} onClose={() => setIsCreateTaskModalOpen(false)}>
            <AddTaskForm
              projects={project ? [project] : []}
              onAddTask={(taskData) => handleAddTask({ ...taskData, projectId: projectId })}
              onCancel={() => setIsCreateTaskModalOpen(false)}
            />
          </Modal>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} onUpdate={()=>{}} onDelete={()=>{}} onSelect={()=>{}} /> : null}
          </DragOverlay>
          <CreateButton
            onNewTask={() => setIsCreateTaskModalOpen(true)}
            onNewProject={() => router.push('/projects')}
          />
        </div>
      </DndContext>
    </AuthGuard>
  );
}