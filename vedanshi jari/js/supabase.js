// js/supabase.js

// 🔹 Supabase CDN must already be loaded BEFORE this file

const SUPABASE_URL = "https://ptydsccvdvcsixpyflcs.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-8pPjY84N5-xL7EtJaRfGg_2Bd9Oxlq";

// Create global Supabase client
window.supabase = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
