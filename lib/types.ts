export type TeamMember = {
    user_id: string;
    email: string;
    role: string;
  };
  
  export type ProjectMember = {
    user_id: string;
    email: string;
  };
  
  export type Collaborator = {
    user_id: string;
    email: string;
  };
  
  export type Project = {
    id: number;
    name: string;
    description: string | null;
  };
  
  // Se elimina el tipo 'Subtask'
  export type Comment = {
    id: number;
    created_at: string;
    content: string;
    user_name: string | null;
    task_id: number;
  };
  
  export type Task = {
    id: number;
    title: string;
    description: string | null;
    due_date: string | null;
    completed: boolean;
    completed_at: string | null;
    assignee_user_id: string | null;
    status: string;
    projects: { id: number; name: string; } | null;
    assignee: { email: string; } | null;
    collaborators?: Collaborator[];
  };

  export interface TaskUpdatePayload {
    title?: string;
    description?: string | null;
    due_date?: string | null;
    project_id?: number | null;
    assignee_user_id?: string | null;
  }

  export interface CollaboratorRecord {
    user_id: string;}
