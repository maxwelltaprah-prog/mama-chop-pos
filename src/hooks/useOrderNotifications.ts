import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function useOrderNotifications() {
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for notification sound
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRQNYJL/9oSxdFApOHWp7+Jzbz0gKEpwkKiYgWVaU1pta3JgSDgiHikzOjs7O0I/Nzs8MTAsLS4vLy8uKywvMi8pKi0tLCknKCgpKyorKSoqLC0rKiknJScnKisqKyssLDAsLC0tLS0vLS0rLC0uLi0tLC4uLCoqKywuLCsrKywrLCwrKSwqKysqKioqKikpKiopKSgpKCkoKCgoKCgoJiYnJycoKCcnJycoKCcnJygoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKA==');
    audioRef.current.volume = 0.5;

    const channel = supabase
      .channel('customer-orders')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders',
          filter: 'order_type=eq.customer'
        },
        (payload) => {
          const newOrder = payload.new as any;
          
          // Play notification sound
          audioRef.current?.play().catch(() => {
            // Ignore audio play errors (user hasn't interacted with page)
          });
          
          // Show toast notification
          toast.info('🛎️ New Customer Order!', {
            description: `Order ${newOrder.order_number || 'New'} - ${newOrder.customer_name || 'Guest'}`,
            duration: 10000,
            action: {
              label: 'View Orders',
              onClick: () => {
                // Navigate to orders - will be handled by the component
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
}
