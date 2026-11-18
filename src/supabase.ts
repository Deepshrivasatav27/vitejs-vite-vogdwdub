import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oeldzgfppiabrfdhybrz.supabase.co'

const SUPABASE_ANON_KEY = 'sb_publishable_YXpWDPDgYuIJifJ9gE0jgw_nyNUNgP5'

export const supabase = createClient(
  SUPABASE_URL,
    SUPABASE_ANON_KEY
    )