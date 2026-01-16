import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SettingsMap {
  restaurant_name: string;
  location: string;
  phone: string;
  email: string;
  hours_weekday_open: string;
  hours_weekday_close: string;
  hours_saturday_open: string;
  hours_saturday_close: string;
  hours_sunday_open: string;
  hours_sunday_close: string;
  auto_print_receipts: string;
  include_tax_breakdown: string;
  qr_code_on_receipt: string;
  new_order_alerts: string;
  low_stock_warnings: string;
  daily_summary_email: string;
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('setting_key, setting_value');
      
      if (error) throw error;
      
      // Convert to object
      const settings: Partial<SettingsMap> = {};
      (data || []).forEach(row => {
        settings[row.setting_key as keyof SettingsMap] = row.setting_value || '';
      });
      
      return settings as SettingsMap;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<SettingsMap>) => {
      const promises = Object.entries(updates).map(([key, value]) =>
        supabase
          .from('restaurant_settings')
          .update({ setting_value: value })
          .eq('setting_key', key)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error(errors[0].error?.message || 'Failed to update settings');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved successfully!');
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });
}
