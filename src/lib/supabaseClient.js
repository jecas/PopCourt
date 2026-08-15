import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Nedostaju VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Kopiraj .env.example u .env.local i popuni vrednosti iz Supabase dashboard-a."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
