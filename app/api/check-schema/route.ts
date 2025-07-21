import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get table schema information
    const { data: tableInfo, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'photos' })
      .select('*');

    if (schemaError) {
      // Fallback: Try to get column info by querying the table with LIMIT 0
      const { error: sampleError } = await supabase
        .from('photos')
        .select('*')
        .limit(0);

      if (sampleError) {
        return NextResponse.json({
          success: false,
          error: 'Cannot check table schema',
          details: sampleError.message
        }, { status: 500 });
      }

      // Try to get schema from information_schema
      const { data: schemaData, error: infoError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'photos')
        .eq('table_schema', 'public');

      return NextResponse.json({
        success: true,
        message: 'Schema info retrieved',
        schema: schemaData || 'Could not get detailed schema',
        sampleQuery: 'SELECT * FROM photos LIMIT 0 worked',
        infoSchemaError: infoError?.message
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Table schema retrieved',
      schema: tableInfo
    });

  } catch (error) {
    console.error('Schema check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Schema check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}