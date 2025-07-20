import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { RequestCookie, ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'; 
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  
  return createPagesServerClient(
    [
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        }
      }
    ] as any
  );
} 