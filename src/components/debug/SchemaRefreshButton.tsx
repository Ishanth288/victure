/**
 * Debug component for manually refreshing Supabase schema cache
 * Use this when encountering "Could not find a relationship" errors
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { refreshSupabaseSchema, clearAllCaches } from '@/utils/schemaRefresh';
import { toast } from 'sonner';

export function SchemaRefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleFullRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSupabaseSchema();
      toast.success('Schema refreshed successfully! Please reload the page.');
    } catch (error) {
      console.error('Schema refresh failed:', error);
      toast.error('Schema refresh failed. Check console for details.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleQuickClear = () => {
    clearAllCaches();
    toast.success('Caches cleared! Refresh the page to see changes.');
  };

  return (
    <div className="flex gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex-1">
        <h3 className="font-medium text-yellow-800">Schema Debug Tools</h3>
        <p className="text-sm text-yellow-600">
          Use these tools if you see "Could not find a relationship" errors
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleQuickClear}
          className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Clear Cache
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFullRefresh}
          disabled={isRefreshing}
          className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Full Refresh'}
        </Button>
      </div>
    </div>
  );
}

// Export a simple function version for console use
(window as any).refreshSchema = refreshSupabaseSchema;
(window as any).clearCaches = clearAllCaches;
console.log('🔧 Debug functions available: refreshSchema(), clearCaches()');