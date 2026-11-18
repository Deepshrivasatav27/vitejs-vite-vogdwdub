import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const header = req.headers.get('Authorization')
    if (!header?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401)
    const token = header.slice(7)
    const caller = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } })
    const { data: auth, error: authError } = await caller.auth.getUser(token)
    if (authError || !auth.user) return json({ error: 'Invalid session' }, 401)

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: actor, error: actorError } = await admin.from('profiles')
      .select('id, company_id, role, approval_status').eq('id', auth.user.id).maybeSingle()
    if (actorError) throw actorError
    if (!actor?.company_id || actor.approval_status !== 'approved' || !['master_admin', 'company_admin', 'admin'].includes(String(actor.role))) {
      return json({ error: 'Only an approved company Master Admin / Admin can manage team members' }, 403)
    }
    const { data: company, error: companyError } = await admin.from('companies').select('id,status').eq('id', actor.company_id).maybeSingle()
    if (companyError) throw companyError
    if (!company || company.status !== 'active') return json({ error: 'Company is not active' }, 403)

    const body = await req.json()
    const action = String(body.action || '')
    if (action === 'create') {
      const fullName = String(body.full_name || '').trim()
      const email = String(body.email || '').trim().toLowerCase()
      const phone = String(body.phone || '').trim()
      const password = String(body.password || '')
      const role = body.role === 'manager' ? 'manager' : 'agent'
      if (!fullName || !email || !phone || password.length < 8) return json({ error: 'Name, email, mobile and a password of at least 8 characters are required' }, 400)
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email, password, email_confirm: false,
        user_metadata: { full_name: fullName, phone, role, company_id: actor.company_id },
      })
      if (createError) return json({ error: createError.message }, 400)
      const { error: profileError } = await admin.from('profiles').insert({
        id: created.user.id, company_id: actor.company_id, full_name: fullName,
        role, approval_status: 'pending',
      })
      if (profileError) {
        await admin.auth.admin.deleteUser(created.user.id)
        throw profileError
      }
      return json({ success: true, user_id: created.user.id, status: 'pending', message: 'Team member created and awaits approval' }, 201)
    }

    if (action === 'approve' || action === 'reject') {
      const userId = String(body.user_id || '')
      if (!userId) return json({ error: 'user_id is required' }, 400)
      const { data: target, error: targetError } = await admin.from('profiles')
        .select('id,company_id,role').eq('id', userId).eq('company_id', actor.company_id).maybeSingle()
      if (targetError) throw targetError
      if (!target || !['agent', 'manager'].includes(String(target.role))) return json({ error: 'Team member not found in this company' }, 404)
      const nextStatus = action === 'approve' ? 'approved' : 'rejected'
      const { error: updateError } = await admin.from('profiles').update({ approval_status: nextStatus }).eq('id', userId).eq('company_id', actor.company_id)
      if (updateError) throw updateError
      if (action === 'approve') {
        const { error: confirmError } = await admin.auth.admin.updateUserById(userId, { email_confirm: true })
        if (confirmError) return json({ success: false, profile_status: 'approved', error: `Profile approved but email confirmation failed: ${confirmError.message}` }, 207)
      }
      return json({ success: true, status: nextStatus, email_confirmed: action === 'approve' })
    }
    return json({ error: 'Unsupported action' }, 400)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected server error' }, 500)
  }
})
