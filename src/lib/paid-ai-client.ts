/**
 * Attach an existing Supabase user session only to same-origin paid AI calls.
 * No API key or persistent token is added to source or query parameters.
 * When there is no signed-in session the server fails closed.
 */
export async function paidAiHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.auth.getSession();
    if (!error && data.session?.access_token) {
      headers.Authorization = "Bearer " + data.session.access_token;
    }
  } catch {
    // A disconnected cloud project must not block local workout controls.
  }
  return headers;
}
