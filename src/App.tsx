import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { supabase } from './supabase';
import WorkspaceSuite from './WorkspaceSuite';

type Remark = { id: string; text: string; date: string };
type Lead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  project: string;
  status: string;
  budget: string;
  agent: string;
  requirement: string;
  followDate: string;
  followTime: string;
  lastContact: string;
  remarks: Remark[];
};
type Theme = { primary: string; sidebar: string; accent: string };

const STATUSES = [
  'New',
  'Contacted',
  'Interested',
  'Qualified',
  'Follow-up',
  'Next Month',
  'Site Visit Scheduled',
  'Visit Done',
  'Negotiation',
  'Booked',
  'Not Interested',
  'Closed Won',
  'Closed Lost',
  'On Hold',
];
const SOURCES = [
  '99acres',
  'Magicbricks',
  'Housing.com',
  'Facebook',
  'Instagram',
  'Google',
  'Website',
  'Direct Call',
  'Referral',
  'Walk-in',
  'Other',
];
const PROJECTS = ['Venice Aspire', 'Venice Legacy', 'Other'];
const DEFAULT_THEME: Theme = {
  primary: '#2865e8',
  sidebar: '#101a30',
  accent: '#16a085',
};
const today = () => new Date().toISOString().slice(0, 10);
const read = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const groups = [
  {
    name: 'WORKSPACE',
    items: [
      ['▦', 'Dashboard'],
      ['♙', 'All Leads'],
      ['◈', 'Lead Pipeline'],
      ['☎', 'Calling Center'],
      ['◉', 'WhatsApp Center'],
      ['◷', 'Follow-ups'],
      ['⌖', 'Site Visits'],
    ],
  },
  {
    name: 'MANAGEMENT',
    items: [
      ['⌂', 'Properties'],
      ['▤', 'Projects'],
      ['↗', 'Marketing'],
      ['⇅', 'Import / Export'],
      ['▥', 'Analytics'],
      ['♧', 'Team Members'],
      ['⚙', 'Settings'],
      ['▣', 'Business Suite'],
    ],
  },
];

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [userId, setUserId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [projectOptions, setProjectOptions] = useState<{id:string; name:string}[]>([]);
  const [theme, setTheme] = useState<Theme>(() =>
    read('codevex-theme', DEFAULT_THEME)
  );
  const [page, setPage] = useState('Dashboard');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [tab, setTab] = useState('All');
  const [modal, setModal] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [remark, setRemark] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    source: 'Direct Call',
    project: 'Venice Aspire',
    status: 'New',
    budget: '',
    agent: 'Deep',
    requirement: '2BHK',
    followDate: '',
    followTime: '',
  });

  useEffect(
    () => localStorage.setItem('codevex-theme', JSON.stringify(theme)),
    [theme]
  );

  const chosen = leads.find((x) => x.id === current);

  const loadLeads = async () => {
    setLoadingLeads(true);
    setLoadError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error('Login session not found. Please sign in again.');
      setUserId(authData.user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id, full_name, role, approval_status')
        .eq('id', authData.user.id)
        .single();
      if (profileError) throw profileError;
      if (!profile?.company_id) throw new Error('Your account is not linked to a company. Contact your administrator.');
      if (profile.approval_status !== 'approved') throw new Error('Your account is awaiting approval.');
      setCompanyId(profile.company_id);
      if (profile.full_name) setForm((f) => ({ ...f, agent: profile.full_name }));

      const [{ data: projectRows, error: projectError }, { data: leadRows, error: leadError }, { data: followRows, error: followError }, { data: activityRows, error: activityError }, { data: profileRows }] = await Promise.all([
        supabase.from('projects').select('id, name').eq('company_id', profile.company_id).order('name'),
        supabase.from('leads').select('id, customer_name, mobile, source, project_id, assigned_to, budget, status, remarks, next_follow_up, created_at').eq('company_id', profile.company_id).order('created_at', { ascending: false }),
        supabase.from('follow_ups').select('id, lead_id, assigned_to, due_at, status, notes').eq('company_id', profile.company_id).order('due_at'),
        supabase.from('lead_activities').select('id, lead_id, description, activity_at, activity_type').eq('company_id', profile.company_id).order('activity_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name').eq('company_id', profile.company_id),
      ]);
      if (projectError) throw projectError;
      if (leadError) throw leadError;
      if (followError) throw followError;
      if (activityError) throw activityError;
      const projects = projectRows || [];
      setProjectOptions(projects);
      const projectNames = new Map(projects.map((p: any) => [p.id, p.name]));
      const agentNames = new Map((profileRows || []).map((p: any) => [p.id, p.full_name || 'Team member']));
      const latestFollow = new Map<string, any>();
      (followRows || []).forEach((f: any) => { if (!latestFollow.has(f.lead_id) && f.status !== 'completed') latestFollow.set(f.lead_id, f); });
      const activityMap = new Map<string, Remark[]>();
      (activityRows || []).filter((a: any) => a.activity_type === 'remark').forEach((a: any) => {
        const list = activityMap.get(a.lead_id) || [];
        list.push({ id: a.id, text: a.description || '', date: new Date(a.activity_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) });
        activityMap.set(a.lead_id, list);
      });
      setLeads((leadRows || []).map((row: any) => {
        const f = latestFollow.get(row.id);
        const due = f?.due_at || row.next_follow_up;
        const dueDate = due ? new Date(due) : null;
        return {
          id: row.id, name: row.customer_name, phone: row.mobile || '', source: row.source || 'Other',
          project: projectNames.get(row.project_id) || 'Other', status: row.status || 'New',
          budget: row.budget == null ? '' : `₹${Number(row.budget).toLocaleString('en-IN')}`,
          agent: agentNames.get(row.assigned_to) || 'Unassigned', requirement: '—',
          followDate: dueDate ? dueDate.toISOString().slice(0, 10) : '',
          followTime: dueDate ? dueDate.toTimeString().slice(0, 5) : '',
          lastContact: activityMap.get(row.id)?.[0]?.date || '', remarks: activityMap.get(row.id) || [],
        };
      }));
    } catch (error: any) {
      setLoadError(error?.message || 'Unable to load CRM data.');
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => { void loadLeads(); }, []);

  const filtered = useMemo(
    () =>
      leads.filter((x) => {
        const q = search.toLowerCase();
        return (
          `${x.name} ${x.phone} ${x.source} ${x.project} ${x.agent}`
            .toLowerCase()
            .includes(q) &&
          (filter === 'All' || x.status === filter)
        );
      }),
    [leads, search, filter]
  );

  const follow = leads.filter((x) => x.followDate);
  const overdue = follow.filter((x) => x.followDate < today());
  const dueToday = follow.filter((x) => x.followDate === today());

  const stats = [
    ['Total Leads', leads.length, '♙', '#eaf1ff'],
    [
      'Interested',
      leads.filter((x) =>
        ['Interested', 'Qualified', 'Negotiation'].includes(x.status)
      ).length,
      '✦',
      '#e5f7ed',
    ],
    ['Follow-ups', follow.length, '◷', '#fff3df'],
    [
      'Site Visits',
      leads.filter((x) =>
        ['Site Visit Scheduled', 'Visit Done'].includes(x.status)
      ).length,
      '⌖',
      '#f0eaff',
    ],
  ];

  const update = async (id: string, patch: Partial<Lead>) => {
    const existing = leads.find((x) => x.id === id);
    if (!existing) return;
    setLeads((old) => old.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    try {
      if (patch.status) {
        const { error } = await supabase.from('leads').update({ status: patch.status }).eq('id', id).eq('company_id', companyId);
        if (error) throw error;
      }
      if (patch.followDate !== undefined || patch.followTime !== undefined) {
        const nextDate = patch.followDate ?? existing.followDate;
        const nextTime = patch.followTime ?? existing.followTime;
        if (nextDate) {
          const dueAt = new Date(`${nextDate}T${nextTime || '10:00'}:00`).toISOString();
          const { data: currentFollow } = await supabase.from('follow_ups').select('id').eq('lead_id', id).eq('company_id', companyId).neq('status', 'completed').maybeSingle();
          const result = currentFollow
            ? await supabase.from('follow_ups').update({ due_at: dueAt, assigned_to: userId, status: 'pending' }).eq('id', currentFollow.id)
            : await supabase.from('follow_ups').insert({ company_id: companyId, lead_id: id, assigned_to: userId, due_at: dueAt, status: 'pending' });
          if (result.error) throw result.error;
          await supabase.from('leads').update({ next_follow_up: dueAt }).eq('id', id).eq('company_id', companyId);
        }
      }
    } catch (error: any) {
      setLoadError(error?.message || 'Could not save the change.');
      void loadLeads();
    }
  };
  const navigate = (p: string) => {
    setPage(p);
    setMobile(false);
    setSearch('');
    setFilter('All');
  };

  const addLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !companyId || !userId) return;
    const selectedProject = projectOptions.find((p) => p.name === form.project);
    const amount = Number(form.budget.replace(/[^0-9.]/g, ''));
    const payload = {
      company_id: companyId,
      project_id: selectedProject?.id || null,
      assigned_to: userId,
      customer_name: form.name.trim(),
      mobile: form.phone.trim(),
      source: form.source,
      budget: Number.isFinite(amount) && amount > 0 ? amount : null,
      status: form.status,
      remarks: null,
      next_follow_up: form.followDate ? new Date(`${form.followDate}T${form.followTime || '10:00'}:00`).toISOString() : null,
    };
    const { data, error } = await supabase.from('leads').insert(payload).select('id').single();
    if (error) { setLoadError(error.message); return; }
    if (form.followDate && data?.id) {
      const { error: followError } = await supabase.from('follow_ups').insert({
        company_id: companyId, lead_id: data.id, assigned_to: userId,
        due_at: payload.next_follow_up, status: 'pending', notes: null,
      });
      if (followError) setLoadError(`Lead saved, but follow-up failed: ${followError.message}`);
    }
    setModal(false);
    setForm({ name: '', phone: '', source: 'Direct Call', project: projectOptions[0]?.name || 'Other', status: 'New', budget: '', agent: 'You', requirement: '2BHK', followDate: '', followTime: '' });
    await loadLeads();
  };

  const addRemark = async () => {
    if (!chosen || !remark.trim()) return;
    const stamp = new Date().toISOString();
    const { error } = await supabase.from('lead_activities').insert({
      company_id: companyId, lead_id: chosen.id, user_id: userId,
      activity_type: 'remark', description: remark.trim(), activity_at: stamp,
    });
    if (error) { setLoadError(error.message); return; }
    setRemark('');
    await loadLeads();
  };

  const exportCSV = () => {
    const cols = [
      'Name',
      'Phone',
      'Source',
      'Project',
      'Requirement',
      'Budget',
      'Status',
      'Agent',
      'Follow-up date',
      'Follow-up time',
      'Last contact',
      'Remarks',
    ];
    const rows = leads.map((x) => [
      x.name,
      x.phone,
      x.source,
      x.project,
      x.requirement,
      x.budget,
      x.status,
      x.agent,
      x.followDate,
      x.followTime,
      x.lastContact,
      x.remarks.map((r) => r.text).join(' | '),
    ]);
    const csv = [cols, ...rows]
      .map((r) =>
        r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'codevex-leads.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const heading = (title: string, sub: string, add = false) => (
    <div className="welcome">
      <div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      <div className="actions">
        <button className="btn" onClick={exportCSV}>
          ↓ Export
        </button>
        {add && (
          <button className="btn primary" onClick={() => setModal(true)}>
            ＋ Add New Lead
          </button>
        )}
      </div>
    </div>
  );

  const table = (data: Lead[], withFilters = false) => (
    <section className="card tablecard">
      <div className="tablehead">
        <div>
          <h3>Lead Records</h3>
          <small>{data.length} records</small>
        </div>
        {withFilters && (
          <>
            <input
              placeholder="Search name, phone, source..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option>All</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </>
        )}
      </div>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>CUSTOMER</th>
              <th>SOURCE</th>
              <th>PROJECT</th>
              <th>BUDGET</th>
              <th>STATUS</th>
              <th>FOLLOW-UP</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((l) => (
              <tr key={l.id}>
                <td>
                  <b>{l.name}</b>
                  <small>{l.phone}</small>
                </td>
                <td>{l.source}</td>
                <td>{l.project}</td>
                <td>{l.budget || '—'}</td>
                <td>
                  <select
                    className="statusselect"
                    value={l.status}
                    onChange={(e) => update(l.id, { status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>
                  {l.followDate ? `${l.followDate} ${l.followTime}` : '—'}
                </td>
                <td>
                  <button className="btn" onClick={() => setCurrent(l.id)}>
                    Details
                  </button>
                </td>
              </tr>
            ))}
            {!data.length && (
              <tr>
                <td colSpan={7} className="empty">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div
      className="app"
      style={
        {
          '--primary': theme.primary,
          '--sidebar': theme.sidebar,
          '--accent': theme.accent,
        } as React.CSSProperties
      }
    >
      <aside className={`sidebar ${mobile ? 'mobile' : ''}`}>
        <div className="brand">
          <div className="logo">C</div>
          <div>
            <b>CODEVEX</b>
            <small>REAL ESTATE CRM</small>
          </div>
        </div>
        {groups.map((g) => (
          <div key={g.name}>
            <div className="group">{g.name}</div>
            {g.items.map(([ic, label]) => (
              <button
                key={label}
                className={`nav ${page === label ? 'active' : ''}`}
                onClick={() => navigate(label)}
              >
                <span>{ic}</span>
                {label}
              </button>
            ))}
          </div>
        ))}
        <div className="sidefoot">
          CODEVEX CRM · V2
          <br />
          Smart Real Estate Management
        </div>
      </aside>

      <main className="main">
        <header className="top">
          <div className="crumb">
            <button className="hamb" onClick={() => setMobile(!mobile)}>
              ☰
            </button>{' '}
            Workspace / <b>{page}</b>
          </div>
          <div className="avatar">DR</div>
        </header>
        <div className="content">
          {loadError && <section className="card" style={{ border: '1px solid #dc6b6b', color: '#b42318', marginBottom: 14 }}><b>CRM notice:</b> {loadError} <button className="btn" onClick={() => setLoadError('')}>Dismiss</button></section>}
          {loadingLeads && <section className="card" style={{ marginBottom: 14 }}>Loading company leads from Supabase…</section>}
          {page === 'Business Suite' ? <WorkspaceSuite /> : page === 'Settings' ? (
            <>
              {heading(
                'Settings & Appearance',
                'Customize your CRM colours without coding.'
              )}
              <section className="card">
                <h3>Choose your colours</h3>
                <p className="muted">
                  Changes save automatically in this browser.
                </p>
                <div className="colors">
                  {[
                    ['Primary colour', 'primary'],
                    ['Sidebar colour', 'sidebar'],
                    ['Accent colour', 'accent'],
                  ].map(([label, key]) => (
                    <label key={key}>
                      {label}
                      <input
                        type="color"
                        value={theme[key as keyof Theme]}
                        onChange={(e) =>
                          setTheme({ ...theme, [key]: e.target.value })
                        }
                      />
                    </label>
                  ))}
                </div>
                <div className="presets">
                  {[
                    { n: 'Classic Blue', t: DEFAULT_THEME },
                    {
                      n: 'Emerald',
                      t: {
                        primary: '#07866f',
                        sidebar: '#102b2b',
                        accent: '#0b9b72',
                      },
                    },
                    {
                      n: 'Royal Purple',
                      t: {
                        primary: '#7046df',
                        sidebar: '#211638',
                        accent: '#a16be8',
                      },
                    },
                    {
                      n: 'Rose',
                      t: {
                        primary: '#d63368',
                        sidebar: '#351426',
                        accent: '#d63368',
                      },
                    },
                    {
                      n: 'Charcoal',
                      t: {
                        primary: '#4b5563',
                        sidebar: '#111827',
                        accent: '#0f9f8f',
                      },
                    },
                  ].map((p) => (
                    <button
                      className="btn"
                      key={p.n}
                      onClick={() => setTheme(p.t)}
                    >
                      {p.n}
                    </button>
                  ))}
                  <button
                    className="btn"
                    onClick={() => setTheme(DEFAULT_THEME)}
                  >
                    Reset
                  </button>
                </div>
                <p className="muted">
                  Note: colours are saved per browser/device. Shared agent
                  settings need login and cloud database.
                </p>
              </section>
            </>
          ) : page === 'Dashboard' ? (
            <>
              {heading(
                'Good afternoon, Deep 👋',
                'Your real estate business at a glance.',
                true
              )}
              <div className="stats">
                {stats.map(([t, v, ic, bg]) => (
                  <section className="card stat" key={String(t)}>
                    <div>
                      {t}
                      <i style={{ background: String(bg) }}>{ic}</i>
                    </div>
                    <strong>{v}</strong>
                    <small>
                      {t === 'Total Leads'
                        ? 'All enquiries'
                        : t === 'Interested'
                        ? 'Potential buyers'
                        : t === 'Follow-ups'
                        ? 'Scheduled reminders'
                        : 'Visit pipeline'}
                    </small>
                  </section>
                ))}
              </div>
              <div className="panels">
                <section className="card">
                  <h3>Lead Activity</h3>
                  <div className="chart">
                    {[35, 58, 43, 76, 54, 91, 68].map((v, i) => (
                      <div key={i}>
                        <i style={{ height: `${v}%` }} />
                        <small>
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                        </small>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="card">
                  <h3>Lead Sources</h3>
                  {SOURCES.slice(0, 6).map((s) => (
                    <div className="source" key={s}>
                      <span>{s}</span>
                      <i>
                        <b
                          style={{
                            width: `${
                              leads.length
                                ? (leads.filter((l) => l.source === s).length /
                                    leads.length) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </i>
                      <small>
                        {leads.filter((l) => l.source === s).length}
                      </small>
                    </div>
                  ))}
                </section>
              </div>
              {table(leads.slice(0, 5))}
              <div className="lower">
                <section className="card">
                  <h3>Upcoming Follow-ups</h3>
                  {follow.slice(0, 5).map((l) => (
                    <p className="task" key={l.id}>
                      <span>
                        <b>{l.name}</b>
                        <small>
                          {l.followDate} {l.followTime}
                        </small>
                      </span>
                      <button className="btn" onClick={() => setCurrent(l.id)}>
                        Open
                      </button>
                    </p>
                  ))}
                  {!follow.length && (
                    <p className="muted">No follow-ups scheduled.</p>
                  )}
                </section>
                <section className="card">
                  <h3>Quick Actions</h3>
                  <div className="presets">
                    <button
                      className="btn primary"
                      onClick={() => setModal(true)}
                    >
                      ＋ Add Lead
                    </button>
                    <button
                      className="btn"
                      onClick={() => navigate('Calling Center')}
                    >
                      ☎ Calling
                    </button>
                    <button
                      className="btn"
                      onClick={() => navigate('Site Visits')}
                    >
                      ⌖ Site Visit
                    </button>
                    <button className="btn" onClick={exportCSV}>
                      ↓ Export
                    </button>
                  </div>
                </section>
              </div>
            </>
          ) : page === 'All Leads' ? (
            <>
              {heading(
                'All Leads',
                'Search, update and manage customer enquiries.',
                true
              )}
              {table(filtered, true)}
            </>
          ) : page === 'Lead Pipeline' ? (
            <>
              {heading(
                'Lead Pipeline',
                'Track customers through each sales stage.',
                true
              )}
              <div className="stats">
                {[
                  'New',
                  'Contacted',
                  'Qualified',
                  'Interested',
                  'Negotiation',
                  'Booked',
                ].map((s) => (
                  <section className="card stat" key={s}>
                    {s}
                    <strong>
                      {leads.filter((l) => l.status === s).length}
                    </strong>
                  </section>
                ))}
              </div>
              {table(leads)}
            </>
          ) : page === 'Follow-ups' ? (
            <>
              {heading(
                'Follow-ups',
                `${overdue.length} overdue · ${dueToday.length} due today`,
                true
              )}
              <div className="tabs">
                {['Missed', 'Today', 'Tomorrow', 'All'].map((t) => (
                  <button
                    className={`btn ${tab === t ? 'primary' : ''}`}
                    key={t}
                    onClick={() => setTab(t)}
                  >
                    {t}{' '}
                    {t === 'Missed'
                      ? overdue.length
                      : t === 'Today'
                      ? dueToday.length
                      : t === 'Tomorrow'
                      ? follow.filter(
                          (l) =>
                            l.followDate ===
                            new Date(Date.now() + 86400000)
                              .toISOString()
                              .slice(0, 10)
                        ).length
                      : follow.length}
                  </button>
                ))}
              </div>
              <section className="card">
                {follow
                  .filter(
                    (l) =>
                      tab === 'All' ||
                      (tab === 'Missed' && l.followDate < today()) ||
                      (tab === 'Today' && l.followDate === today()) ||
                      (tab === 'Tomorrow' &&
                        l.followDate ===
                          new Date(Date.now() + 86400000)
                            .toISOString()
                            .slice(0, 10))
                  )
                  .map((l) => (
                    <div className="task" key={l.id}>
                      <span>
                        <b>{l.name}</b>
                        <small>
                          {l.phone} · {l.project} · {l.followDate}{' '}
                          {l.followTime}
                        </small>
                      </span>
                      <div className="presets">
                        <a className="btn" href={`tel:${l.phone}`}>
                          ☎ Call
                        </a>
                        <button
                          className="btn"
                          onClick={() => setCurrent(l.id)}
                        >
                          Reschedule
                        </button>
                        <button
                          className="btn primary"
                          onClick={() =>
                            update(l.id, { followDate: '', followTime: '' })
                          }
                        >
                          Completed
                        </button>
                      </div>
                    </div>
                  ))}
                {!follow.length && (
                  <p className="empty">
                    No follow-ups scheduled. Open a lead to add one.
                  </p>
                )}
              </section>
            </>
          ) : page === 'Site Visits' ? (
            <>
              {heading(
                'Site Visits',
                'Scheduled and completed customer visits.',
                true
              )}
              {table(
                leads.filter((l) =>
                  ['Site Visit Scheduled', 'Visit Done'].includes(l.status)
                )
              )}
            </>
          ) : page === 'Calling Center' || page === 'WhatsApp Center' ? (
            <>
              {heading(page, 'Contact customers from their lead records.')}
              {table(leads)}
            </>
          ) : page === 'Import / Export' ? (
            <>
              {heading(page, 'Download lead data for Excel or Google Sheets.')}
              <section className="card">
                <h3>Export all leads</h3>
                <p className="muted">
                  Includes contact details, status, follow-up schedule and
                  remark history.
                </p>
                <button className="btn primary" onClick={exportCSV}>
                  ↓ Download CSV
                </button>
                <p className="muted">
                  CSV import is not enabled in this version.
                </p>
              </section>
            </>
          ) : page === 'Analytics' ? (
            <>
              {heading(page, 'Live totals based on the current lead records.')}
              <div className="stats">
                {stats.map(([t, v]) => (
                  <section className="card stat" key={String(t)}>
                    {t}
                    <strong>{v}</strong>
                  </section>
                ))}
              </div>
              {table(leads)}
            </>
          ) : (
            <>
              {heading(page, `${page} workspace`)}
              <section className="card empty">
                {page} module is ready for configuration. Lead tracking,
                follow-ups, remarks and theme settings are active.
              </section>
            </>
          )}
        </div>
      </main>

      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <form
            className="dialog"
            onSubmit={addLead}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Add New Lead</h2>
            <div className="formgrid">
              <Field label="Customer name *">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="Phone number *">
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <Field label="Lead source">
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                >
                  {SOURCES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Project">
                <select
                  value={form.project}
                  onChange={(e) =>
                    setForm({ ...form, project: e.target.value })
                  }
                >
                  {(projectOptions.length ? projectOptions.map((p) => p.name) : PROJECTS).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Requirement">
                <select
                  value={form.requirement}
                  onChange={(e) =>
                    setForm({ ...form, requirement: e.target.value })
                  }
                >
                  {[
                    '1BHK',
                    '2BHK',
                    '3BHK',
                    '4BHK',
                    'Plot',
                    'Villa',
                    'Other',
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Budget">
                <input
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="₹50 Lakh"
                />
              </Field>
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Agent">
                <input
                  value={form.agent}
                  onChange={(e) => setForm({ ...form, agent: e.target.value })}
                />
              </Field>
              <Field label="Follow-up date">
                <input
                  type="date"
                  min={today()}
                  value={form.followDate}
                  onChange={(e) =>
                    setForm({ ...form, followDate: e.target.value })
                  }
                />
              </Field>
              <Field label="Follow-up time">
                <input
                  type="time"
                  value={form.followTime}
                  onChange={(e) =>
                    setForm({ ...form, followTime: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="dialogactions">
              <button
                type="button"
                className="btn"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button className="btn primary">Save Lead</button>
            </div>
          </form>
        </div>
      )}

      {chosen && (
        <div className="overlay" onClick={() => setCurrent(null)}>
          <section className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialogtitle">
              <h2>{chosen.name}</h2>
              <button className="btn" onClick={() => setCurrent(null)}>
                ✕
              </button>
            </div>
            <div className="detailgrid">
              <p>
                <b>Phone</b>
                <br />
                {chosen.phone}
              </p>
              <p>
                <b>Source</b>
                <br />
                {chosen.source}
              </p>
              <p>
                <b>Project</b>
                <br />
                {chosen.project}
              </p>
              <p>
                <b>Requirement / Budget</b>
                <br />
                {chosen.requirement} · {chosen.budget || '—'}
              </p>
              <p>
                <b>Agent</b>
                <br />
                {chosen.agent}
              </p>
              <p>
                <b>Last contact</b>
                <br />
                {chosen.lastContact || 'Not logged'}
              </p>
            </div>
            <Field label="Update status">
              <select
                value={chosen.status}
                onChange={(e) => update(chosen.id, { status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <h3>Schedule next follow-up</h3>
            <div className="formgrid">
              <Field label="Date">
                <input
                  type="date"
                  min={today()}
                  value={chosen.followDate}
                  onChange={(e) =>
                    update(chosen.id, { followDate: e.target.value })
                  }
                />
              </Field>
              <Field label="Time">
                <input
                  type="time"
                  value={chosen.followTime}
                  onChange={(e) =>
                    update(chosen.id, { followTime: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="presets space">
              <a className="btn primary" href={`tel:${chosen.phone}`}>
                ☎ Call customer
              </a>
              <a
                className="btn"
                target="_blank"
                rel="noreferrer"
                href={`https://wa.me/91${chosen.phone
                  .replace(/\D/g, '')
                  .slice(-10)}`}
              >
                ◉ WhatsApp
              </a>
            </div>
            <h3>Conversation remark</h3>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Customer se kya baat hui? Next call par kya yaad rakhna hai?"
            />
            <div className="dialogactions">
              <button className="btn primary" onClick={addRemark}>
                Save remark
              </button>
            </div>
            <h3>Remark history ({chosen.remarks.length})</h3>
            {chosen.remarks.map((r) => (
              <div className="remark" key={r.id}>
                {r.text}
                <small>{r.date}</small>
              </div>
            ))}
            {!chosen.remarks.length && (
              <p className="muted">No remarks added yet.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
