// components/ActivityFeed.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Tipo actualizado para incluir el ID
type ActivityEvent = {
  event_type: string;
  event_title: string;
  event_date: string;
  user_email: string;
  project_name: string | null;
  related_id: number;
};

// ... (El componente ActivityIcon no cambia)
const ActivityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'tarea_completada':
      // Usamos el color secundario (azul) para tareas completadas
      return <div style={{ backgroundColor: '#EBF0F7' }} className="rounded-full p-1.5"><svg className="h-5 w-5" style={{ color: '#3c527a' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>;
    case 'comentario_nuevo':
      // Usamos el color secundario (azul) para comentarios
      return <div style={{ backgroundColor: '#EBF0F7' }} className="rounded-full p-1.5"><svg className="h-5 w-5" style={{ color: '#3c527a' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12s4.477-10 10-10 10 4.477 10 10z" /></svg></div>;
    case 'proyecto_creado':
      // Usamos el color primario (naranja) para eventos importantes como crear proyectos
      return <div style={{ backgroundColor: '#FFF0F0' }} className="rounded-full p-1.5"><svg className="h-5 w-5" style={{ color: '#ff8080' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg></div>;
    default:
      return null;
  }
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { supabase } = useAuth();
  
  useEffect(() => {
    async function fetchActivity() {
      setLoading(true);
      // Llamamos a la función sin parámetros, usará el límite de 15 por defecto
      const { data, error } = await supabase.rpc('get_weekly_activity');
      if (error) {
        console.error('Error fetching weekly activity:', error);
      } else {
        setActivities(data);
      }
      setLoading(false);
    }
    fetchActivity();
  }, []);
  
  const formatMessage = (activity: ActivityEvent) => {
    const user = <span className="font-semibold">{activity.user_email}</span>;
    // 👇 CAMBIO 2: Títulos usan el color primario (naranja)
    const title = <span className="font-semibold" style={{ color: '#ff8080' }}>{'"'}{activity.event_title}{'"'}</span>;
    switch (activity.event_type) {
      case 'tarea_completada': return <>{user} completó la tarea {title}</>;
      case 'comentario_nuevo': return <>{user} comentó en una tarea: {title}</>;
      case 'proyecto_creado': return <>{user} creó el proyecto {title}</>;
      default: return activity.event_title;
    }
  }

  // Nueva función para manejar el clic en una actividad
  const handleActivityClick = (activity: ActivityEvent) => {
    // Si es un proyecto, te lleva a la página de proyectos
    if (activity.event_type === 'proyecto_creado') {
      router.push(`/projects/${activity.related_id}`);
    } else {
      // Si es una tarea o comentario, necesitaríamos abrir el modal de la tarea.
      // Esto es más complejo y lo dejamos para después. Por ahora, un console.log.
      console.log('Navegar a la tarea con ID:', activity.related_id);
      alert(`Funcionalidad futura: Abrir modal de la tarea ID: ${activity.related_id}`);
    }
  };

  return (
    // 👇 CAMBIO 1: Añadimos la clase contenedora para nuestra nueva regla de CSS
    <div className="mt-10 activity-feed-container">
      <h2 
        className="text-xl font-bold mb-4" 
        style={{ color: '#383838' }}
      >
        Actividad Reciente
      </h2>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {loading ? (
          <p className="text-gray-500">Cargando actividad...</p>
        ) : activities.length > 0 ? (
          <ul className="space-y-4">
            {activities.map((activity, index) => (
              <li key={index} onClick={() => handleActivityClick(activity)} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md">
                <ActivityIcon type={activity.event_type} />
                <div className="flex-grow">
                  <p 
                    className="text-sm" 
                    style={{ color: '#383838' }}
                  >
                    {formatMessage(activity)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(activity.event_date).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' })}
                    {activity.project_name && ` en ${activity.project_name}`}
                  </p>
                </div>
              </li>
            ))}
            <div className="pt-2 text-center">
              {/* 👇 CAMBIO 2: Aseguramos que este link también use el estilo correcto */}
              <Link 
                href="/activity" 
                className="text-sm font-semibold"
                style={{ color: '#ff8080' }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                  Ver toda la actividad (Próximamente)
              </Link>
            </div>
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-4">No ha habido actividad reciente en el equipo.</p>
        )}
      </div>
    </div>
  );
}