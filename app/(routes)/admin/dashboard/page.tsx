import { createClient } from '@/app/lib/supabase/server';

export default async function Dashboard() {
  const supabase = await createClient();
  
  // Fetch counts from database
  const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
  const { count: clientsCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'client');
  const { count: photosCount } = await supabase.from('photos').select('*', { count: 'exact', head: true });
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-2">Total Events</h2>
          <p className="text-3xl font-bold">{eventsCount || 0}</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-2">Clients</h2>
          <p className="text-3xl font-bold">{clientsCount || 0}</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-2">Photos</h2>
          <p className="text-3xl font-bold">{photosCount || 0}</p>
        </div>
      </div>
    </div>
  );
}
