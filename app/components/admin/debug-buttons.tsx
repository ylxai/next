'use client';

import { Button } from '@/components/ui/button';

// Component for testing event insert
export function TestEventInsert() {
  const handleTestInsert = async () => {
    try {
      const { createClient } = await import('@/app/lib/supabase/client');
      const supabase = createClient();
      
      const testEvent = {
        title: 'Debug Test Event',
        description: 'This is a test event created for debugging purposes',
        event_type: 'other',
        date: '2024-12-25',
        start_time: '10:00',
        end_time: '16:00',
        location: 'Debug Test Location',
        max_participants: 25,
        price: 500000,
        status: 'draft'
      };

      const { data, error } = await supabase
        .from('events')
        .insert([testEvent])
        .select()
        .single();

      if (error) {
        alert(`Insert Error: ${error.message}`);
        console.error('Insert error:', error);
      } else {
        alert(`Insert Success! Event ID: ${data.id}`);
        console.log('Insert success:', data);
        
        // Clean up test event
        await supabase
          .from('events')
          .delete()
          .eq('id', data.id);
      }
    } catch (error) {
      alert(`Unexpected Error: ${error}`);
      console.error('Unexpected error:', error);
    }
  };

  return (
    <Button onClick={handleTestInsert} variant="outline">
      Test Event Insert
    </Button>
  );
}

// Component for testing table structure
export function TestTableStructure() {
  const handleCheckStructure = async () => {
    try {
      const { createClient } = await import('@/app/lib/supabase/client');
      const supabase = createClient();
      
      // Try to get table structure info
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'events');

      if (error) {
        alert(`Structure Check Error: ${error.message}`);
      } else {
        console.log('Events table structure:', data);
        alert('Table structure logged to console');
      }
    } catch (error) {
      alert(`Structure Check Error: ${error}`);
    }
  };

  return (
    <Button onClick={handleCheckStructure} variant="outline">
      Check Table Structure
    </Button>
  );
}

// Component for testing RLS policies
export function TestRLSPolicies() {
  const handleCheckRLS = async () => {
    try {
      const { createClient } = await import('@/app/lib/supabase/client');
      const supabase = createClient();
      
      // Try to query RLS policies
      const { data, error } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'events');

      if (error) {
        alert(`RLS Check Error: ${error.message}`);
      } else {
        console.log('Events RLS policies:', data);
        alert('RLS policies logged to console');
      }
    } catch (error) {
      alert(`RLS Check Error: ${error}`);
    }
  };

  return (
    <Button onClick={handleCheckRLS} variant="outline">
      Check RLS Policies
    </Button>
  );
}