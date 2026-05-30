import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface CanvasMetadata {
  id: string;
  template: string;
  filename: string;
  storage_path: string;
  created_at: string;
  expires_at: string;
}
