import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401)

    const token = authHeader.slice('Bearer '.length)
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: callerData, error: callerError } = await callerClient.auth.getUser(token)
    if (callerError || !callerData.user) return json({ error: 'Invalid session' }, 401)

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: platformAdmin, error: platformAdminError } = await admin
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', callerData.user.id)
      .maybeSingle()
    if (platformAdminError || !platformAdmin) return json({ error: 'Only platform Super Admin can run this action' }, 403)

    const body = await req.json()
    const companyId = typeof body.company_id === 'string' ? body.company_id : ''
    if (!companyId) return json({ error: 'company_id is required' }, 400)

    const { data: company, error: companyError } = await admin
      .from('companies')
      .select('id, status')
      .eq('id', companyId)
      .maybeSingle()
    if (companyError) throw companyError
    if (!company || company.status !== 'active') {
      return json({ error: 'Company must be approved and active before email confirmation' }, 409)
    }

    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, approval_status')
      .eq('company_id', companyId)
      .eq('approval_status', 'approved')
    if (profilesError) throw profilesError

    const results: Array<{ user_id: string; status: string; detail?: string }> = []
    for (const profile of profiles ?? []) {
      const { data: authUser, error: getUserError } = await admin.auth.admin.getUserById(profile.id)
      if (getUserError || !authUser.user) {
        results.push({ user_id: profile.id, status: 'failed', detail: getUserError?.message ?? 'Auth user not found' })
        continue
      }
      if (authUser.user.email_confirmed_at) {
        results.push({ user_id: profile.id, status: 'already_confirmed' })
        continue
      }
      const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, {
        email_confirm: true,
      })
      results.push(updateError
        ? { user_id: profile.id, status: 'failed', detail: updateError.message }
        : { user_id: profile.id, status: 'confirmed' })
    }

    const failed = results.filter((item) => item.status === 'failed').length
    return json({
      success: failed === 0,
      company_id: companyId,
      processed: results.length,
      confirmed: results.filter((item) => item.status === 'confirmed').length,
      already_confirmed: results.filter((item) => item.status === 'already_confirmed').length,
      failed,
      results,
    }, failed ? 207 : 200)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected server error' }, 500)
  }
})
