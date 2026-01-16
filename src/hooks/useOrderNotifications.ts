import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// Request browser notification permission
async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// Show browser notification
function showBrowserNotification(order: any) {
  if (Notification.permission !== 'granted') return;
  
  const typeEmoji = order.order_type === 'delivery' ? '🚚' : 
                   order.order_type === 'takeaway' ? '📦' : '🍽️';
  
  const notification = new Notification(`${typeEmoji} New Online Order!`, {
    body: `${order.order_number || 'Processing...'} • ${order.customer_name || 'Guest'} • ${order.order_type?.toUpperCase()}`,
    icon: '/favicon.ico',
    tag: `order-${order.id}`, // Prevents duplicate notifications
    requireInteraction: true, // Keeps notification visible until user interacts
  });
  
  // Focus the tab when notification is clicked
  notification.onclick = () => {
    window.focus();
    notification.close();
    window.dispatchEvent(new CustomEvent('navigate-to-orders'));
  };
}

export function useOrderNotifications() {
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');

  const clearNotifications = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : Notification.permission);
    return granted;
  }, []);

  useEffect(() => {
    // Check initial permission status
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unsupported');
    }
  }, []);

  useEffect(() => {
    // Create audio element for notification sound (a pleasant chime)
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRQNYJL/9oSxdFApOHWp7+Jzbz0gKEpwkKiYgWVaU1pta3JgSDgiHikzOjs7O0I/Nzs8MTAsLS4vLy8uKywvMi8pKi0tLCknKCgpKyorKSoqLC0rKiknJScnKisqKyssLDAsLC0tLS0vLS0rLC0uLi0tLC4uLCoqKywuLCsrKywrLCwrKSwqKysqKioqKikpKiopKSgpKCkoKCgoKCgoJiYnJycoKCcnJycoKCcnJygoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKA==');
    audioRef.current.volume = 0.7;

    // Subscribe to ALL new orders (not just customer type)
    // Filter for orders that weren't created by staff (created_by is null = customer order)
    const channel = supabase
      .channel('new-orders-notification')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders'
        },
        (payload) => {
          const newOrder = payload.new as any;
          
          // Only notify for customer orders (no created_by means customer placed it)
          if (newOrder.created_by) {
            return; // Staff created this order, no notification needed
          }
          
          // Increment unread count
          setUnreadCount(prev => prev + 1);
          
          // Play notification sound
          audioRef.current?.play().catch(() => {
            // Ignore audio play errors (user hasn't interacted with page)
          });
          
          // Show browser push notification (works in background)
          showBrowserNotification(newOrder);
          
          // Determine order type emoji
          const typeEmoji = newOrder.order_type === 'delivery' ? '🚚' : 
                           newOrder.order_type === 'takeaway' ? '📦' : '🍽️';
          
          // Show toast notification with more details
          toast.info(`${typeEmoji} New Online Order!`, {
            description: `${newOrder.order_number || 'Processing...'} • ${newOrder.customer_name || 'Guest'} • ${newOrder.order_type?.toUpperCase()}`,
            duration: 15000,
            action: {
              label: 'View Orders',
              onClick: () => {
                window.dispatchEvent(new CustomEvent('navigate-to-orders'));
              },
            },
          });

          // Invalidate orders query to refresh the list
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { unreadCount, clearNotifications, notificationPermission, requestPermission };
}