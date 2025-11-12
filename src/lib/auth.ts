import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function getServerSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

export async function getServerUser() {
  const supabase = await createServerSupabaseClient();

  // Use getUser() for secure authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Simple user creation with upsert
  const isAdminEmail = user.email?.includes('admin') ||
                      user.email?.includes('recruitment') ||
                      user.email?.endsWith('@rakamin.com');

  const userRole = isAdminEmail ? 'admin' : 'candidate';

  const { data: userData, error: userError } = await supabase
    .from("users")
    .upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      role: userRole,
      email_confirmed_at: user.email_confirmed_at,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    })
    .select()
    .single();

  return userError ? null : userData;
}

export async function requireAuth() {
  const supabase = await createServerSupabaseClient();

  // Use getUser() for secure authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized: Authentication required");
  }

  // Use the same simplified logic as getServerUser
  const userData = await getServerUser();

  if (!userData) {
    throw new Error("Unauthorized: Failed to get user data");
  }

  return userData;
}