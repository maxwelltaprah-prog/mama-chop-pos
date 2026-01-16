import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function useOrderNotifications() {
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const clearNotifications = useCallback(() => {
    setUnreadCount(0);
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

  return { unreadCount, clearNotifications };
}