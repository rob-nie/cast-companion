// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://herakmngwqfrflcfxmiz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcmFrbW5nd3FmcmZsY2Z4bWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMjQzNTEsImV4cCI6MjA1OTcwMDM1MX0.bcQek1LP6--xHNz32tXCxwMpHlGPmuMrg627jirtzvw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);