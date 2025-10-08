'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BellIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

type Notification = {
  id: number;
  created_at: string;
  message: string;
  is_read: boolean;
  link_url: string | null;
};

type NotificationPayload = {
  new: Notification;
};

export default function Notifications() {
  const { user, supabase   } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!user) return;

    // 1. Carga las notificaciones iniciales al montar el componente
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_user_id', user.id) // Solo las notificaciones para el usuario actual
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching notifications', error);
      } else if (data) {
        setNotifications(data);
      }
    };

    fetchNotifications();

    // 2. ¡La magia del tiempo real! Escucha nuevas notificaciones
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_user_id=eq.${user.id}` },
        (payload: NotificationPayload) => {
          // Cuando llega una nueva, la añadimos al principio de la lista
          setNotifications(currentNotifications => [payload.new as Notification, ...currentNotifications]);
        }
      )
      .subscribe();

    // Función de limpieza para cerrar el canal cuando el componente no está visible
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como leída solo si no lo está ya
    if (!notification.is_read) {
        setNotifications(notifications.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notification.id);
    }
    // Si hay un enlace, el componente Link se encargará de la navegación
  };

  const markAllAsRead = async () => {
      setNotifications(notifications.map(n => ({...n, is_read: true})));
      await supabase
        .from('notifications')
        .update({is_read: true})
        .eq('recipient_user_id', user?.id)
        .eq('is_read', false);
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-gray-100">
        <BellIcon className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          // 👇 CAMBIO 1: Punto de notificación usa el color primario (naranja)
          <span 
            className="absolute top-1 right-1 block h-3 w-3 rounded-full border-2 border-white"
            style={{ backgroundColor: '#ff8080' }}
          />
        )}
      </button>
  
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border z-20">
          <div className="p-4 flex justify-between items-center border-b">
            <h3 className="font-semibold" style={{ color: '#383838' }}>Notificaciones</h3>
            {unreadCount > 0 && 
              // 👇 CAMBIO 2: Enlace usa el color primario (naranja)
              <button 
                onClick={markAllAsRead} 
                className="text-sm"
                style={{ color: '#ff8080' }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Marcar todas como leídas
              </button>
            }
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 p-6">No tienes notificaciones.</p>
            ) : (
              notifications.map(notification => (
                <Link 
                  key={notification.id}
                  href={notification.link_url || '#'} 
                  onClick={() => handleNotificationClick(notification)}
                  // 👇 CAMBIO 3: Fondo para no leídas usa un tono del color primario
                  className={`block p-4 border-b last:border-b-0 hover:bg-gray-50`}
                  style={!notification.is_read ? { backgroundColor: '#FFF0F0' } : {}}
                >
                  {/* 👇 CAMBIO 4: Texto principal usa el color de la marca */}
                  <p className="text-sm" style={{ color: '#383838' }}>{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(notification.created_at).toLocaleString()}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}