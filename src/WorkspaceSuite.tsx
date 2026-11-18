import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import './WorkspaceSuite.css';

type Role = 'super_admin'|'master_admin'|'admin'|'manager'|'agent';
type ModuleDef = {group:string; name:string; desc:string; actions:string[]};
const modules:ModuleDef[] = [
{group:'Workspace',name:'Dashboard',desc:'Business overview, KPIs, activity and quick actions.',actions:['Total leads','New enquiries','Assigned leads','Pending follow-ups','Site visits','Bookings','Conversion rate','Recent activity']},
{group:'Sales CRM',name:'Lead Management',desc:'Lead creation, search, filters, customer profile and timeline.',actions:['Add lead','Edit lead','Lead details','Hot / Warm / Cold priority','Status pipeline','Customer profile','Remarks and notes','Attachments','Global search']},
{group:'Sales CRM',name:'Lead Assignment & Transfer',desc:'Assignment, reassignment, bulk operations and ownership history.',actions:['Assign lead','Bulk assign','Transfer lead','Transfer reason','Previous owner','New owner','Changed by','Timestamp']},
{group:'Sales CRM',name:'Duplicate Detection & Merge',desc:'Find duplicate customers and review field conflicts before merging.',actions:['Detect by mobile','Compare records','Select surviving Lead ID','Review conflicting fields','Preserve activity history','Merge preview']},
{group:'Sales CRM',name:'Calling Center',desc:'Manual call logs and provider integration settings.',actions:['Call customer','Incoming / outgoing','Call status','Feedback','Duration','Call history','Next follow-up','Call reports']},
{group:'Sales CRM',name:'WhatsApp Center',desc:'Customer messaging, approved templates and provider setup.',actions:['Open WhatsApp','Prefilled message','Template library','30 templates','Categories','Hindi / English','Dynamic variables','Opt-out / Do Not Contact','WhatsApp API settings']},
{group:'Communication',name:'Internal Chat',desc:'Company messaging interface; connect to the existing chat backend.',actions:['One-to-one chat','Group chat','Channels','Lead-linked discussion','Sent / delivered / seen','Online / last seen','Unread count','Message search','Attachments','Reply / forward','Voice messages','Notifications']},
{group:'Sales CRM',name:'Follow-up Manager',desc:'Calendar and task management for customer follow-ups.',actions:['Create follow-up','Date and time','Assigned agent','Pending / completed / overdue','Reminder','Completion notes','Follow-up history','Calendar view']},
{group:'Sales CRM',name:'Site Visit Manager',desc:'Schedule, confirm, reschedule and report property visits.',actions:['Schedule visit','Customer and lead','Project / property','Assigned agent','Confirmation','Reminder','Completed / cancelled','Feedback','Visit history','Calendar']},
{group:'Real Estate',name:'Projects',desc:'Manage projects and project-level sales information.',actions:['Add project','Edit project','Location','Property type','Project status','Description','Images and documents','Project-wise leads']},
{group:'Real Estate',name:'Properties & Inventory',desc:'Unit-level inventory, pricing and availability.',actions:['Unit number','BHK','Area (sq ft)','Price','Availability','Available / blocked / sold','Inventory filters','Unit details']},
{group:'Real Estate',name:'Booking Management',desc:'Track customer bookings, amounts, receipts and documents.',actions:['Booking details','Customer','Project and unit','Booking amount','Booking date','Payment status','Receipt','Booking history']},
{group:'Operations',name:'Import / Export',desc:'Bulk data import and controlled exports.',actions:['CSV import','Excel import','Portal exports','Phone contacts (supported devices)','Column mapping','Validation preview','Duplicate preview','Import history','Filtered export','Selected export','Custom columns','CSV / Excel']},
{group:'Analytics',name:'Reports & Analytics',desc:'Sales funnel, agent performance, sources, visits and revenue.',actions:['Agent performance','Team performance','Calling reports','Follow-up reports','Site visit reports','Source conversion','Project conversion','Booking value','Response time','Date / agent / project filters','PDF report']},
{group:'Operations',name:'Team & Attendance',desc:'Team directory, activity and attendance tracking.',actions:['Team members','Agent activity','Attendance','Team productivity','Agent leaderboard','Ownership transfer']},
{group:'Operations',name:'Notifications',desc:'Central notification center and event preferences.',actions:['New lead','Lead assigned','Lead transferred','Follow-up due','Overdue follow-up','Site visit','Chat message','Booking','Payment','Subscription expiry','Read / unread']},
{group:'Administration',name:'Company Settings',desc:'Company profile, workspace preferences and access controls.',actions:['Company profile','Logo','Brand colors','Team settings','Lead sources','Project settings','Notification preferences','Data export preferences']},
{group:'Platform Control',name:'API & Integration Manager',desc:'Configure each external provider independently.',actions:['99acres','Magicbricks','Housing.com','WhatsApp Business API','Razorpay','SMS provider','Calling provider','Google Sheets','Custom API / webhook','Endpoint','Credential fields','Webhook URL','Enable / disable','Connection test','Last sync','Error logs','Retry']},
{group:'Platform Control',name:'UPI & Payment Settings',desc:'Central payment instructions and QR configuration.',actions:['UPI ID','Payee name','QR image','Payment instructions','Show to companies','Gateway settings','Transaction history','Pending / success / failed / refunded']},
{group:'Platform Control',name:'Plans & Subscriptions',desc:'Free and paid plans with configurable entitlements.',actions:['Free','Monthly','Quarterly','Yearly','Custom','Price','Duration','Expiry','Agent limits','Lead limits','Storage limits','Feature access','Trial','Renewal','Suspend company']},
{group:'Platform Control',name:'Feature Manager',desc:'Control module availability by plan, company and role.',actions:['Enable / disable module','Plan-wise access','Company-wise access','Role-wise visibility','Feature status']},
{group:'Platform Control',name:'Role & Permission Manager',desc:'Configure granular access for all platform roles.',actions:['Super Admin','Master Admin','Admin','Manager','Agent','View','Create','Edit','Archive','Export','Assign / transfer','Settings access']},
{group:'Platform Control',name:'Lead Source Manager',desc:'Manage sources and external source mappings.',actions:['Add source','Edit source','Enable / disable','Provider mapping','Source reporting']},
{group:'Platform Control',name:'Custom Field Manager',desc:'Create dynamic fields for leads, customers and projects.',actions:['Lead fields','Customer fields','Project fields','Field type','Required / optional','Role visibility','Field ordering']},
{group:'Platform Control',name:'Workflow Builder',desc:'Configure trigger-based business automation.',actions:['Auto assignment','Follow-up reminders','Overdue alerts','Status automation','Site visit reminders','Booking notifications','Custom triggers','Actions']},
{group:'Platform Control',name:'Template Manager',desc:'Manage approved and personal message templates.',actions:['30 WhatsApp templates','Categories','Languages','Variables','Preview','Enable / disable','Shared templates','Personal templates']},
{group:'Platform Control',name:'Branding Manager',desc:'Platform and company appearance controls.',actions:['Logo','Primary color','Sidebar color','Accent color','Company name','Contact details','Footer branding']},
{group:'Platform Control',name:'Public Pages',desc:'Edit and publish public About and Privacy pages.',actions:['About CODEVEX','Privacy Policy','Title','Content','Preview','Publish / unpublish','Public URL','Footer / login links']},
{group:'Platform Control',name:'Audit & Activity Logs',desc:'Review user, company, platform and integration events.',actions:['Login history','Company activity','Lead changes','Lead transfers','API activity','Payment activity','Admin actions','Error logs','Date / user / action filters']},
{group:'Operations',name:'Documents & Data Recovery',desc:'Manage records, attachments, archive and recovery.',actions:['Document library','Attachments','Archive','Restore','Backup status','Data recovery','Retention rules','Export controls']},
];
const roleLabels:Record<Role,string>={super_admin:'Super Admin',master_admin:'Master Admin',admin:'Admin',manager:'Manager',agent:'Agent'};
const roleGroups:Record<Role,string[]> = {
 super_admin:['Workspace','Sales CRM','Communication','Real Estate','Operations','Analytics','Administration','Platform Control'],
 master_admin:['Workspace','Sales CRM','Communication','Real Estate','Operations','Analytics','Administration'],
 admin:['Workspace','Sales CRM','Communication','Real Estate','Operations','Analytics'],
 manager:['Workspace','Sales CRM','Communication','Real Estate','Operations','Analytics'],
 agent:['Workspace','Sales CRM','Communication','Real Estate','Operations']
};
const defaultSources=['99acres','Magicbricks','Housing.com','Facebook','Instagram','Google','Website','Direct Call','Referral','Walk-in','Other'];
const defaultTemplates=['New Enquiry','Site Visit','Post Visit','Follow-up','Sales & Negotiation','Booking & Payment','Customer Relationship'];
const storeKey='codevex-workspace-suite-v1';
function readStore(){try{return JSON.parse(localStorage.getItem(storeKey)||'{}')}catch{return {}}}
export default function WorkspaceSuite(){
 const [role,setRole]=useState<Role>('agent');
 const [profileName,setProfileName]=useState('Team Member');
 const [active,setActive]=useState('Dashboard');
 const [query,setQuery]=useState('');
 const [notice,setNotice]=useState('');
 const [formName,setFormName]=useState('');
 const [formValue,setFormValue]=useState('');
 const [records,setRecords]=useState<Record<string,{name:string;value:string;created:string}[]>>(readStore().records||{});
 const [settings,setSettings]=useState<Record<string,string>>(readStore().settings||{});
 const [sourceList,setSourceList]=useState<string[]>(readStore().sources||defaultSources);
 const [templateList,setTemplateList]=useState<string[]>(readStore().templates||defaultTemplates.flatMap(x=>[`${x} – Hindi`,`${x} – English`]));
 const [secretDraft,setSecretDraft]=useState<Record<string,string>>({});
 const [mobileNav,setMobileNav]=useState(false);
 useEffect(()=>{let alive=true;(async()=>{const {data}=await supabase.auth.getUser();if(!data.user)return;const {data:p}=await supabase.from('profiles').select('role,full_name').eq('id',data.user.id).maybeSingle();if(!alive||!p)return;setProfileName(p.full_name||'Team Member');const raw=String(p.role||'agent').toLowerCase().replace(/[\s-]/g,'_');
 const aliases:Record<string,Role>={superadmin:'super_admin',platform_admin:'super_admin',masteradmin:'master_admin',company_admin:'master_admin',company_owner:'master_admin',sales_admin:'admin',team_manager:'manager'};
 const r=aliases[raw]||raw;
 if(['super_admin','master_admin','admin','manager','agent'].includes(r))setRole(r as Role);})();return()=>{alive=false}},[]);
 useEffect(()=>{localStorage.setItem(storeKey,JSON.stringify({records,settings,sources:sourceList,templates:templateList}))},[records,settings,sourceList,templateList]);
 const allowed=roleGroups[role];
 const visible=useMemo(()=>modules.filter(m=>allowed.includes(m.group)),[allowed]);
 const current=modules.find(m=>m.name===active)||modules[0];
 const grouped=useMemo(()=>Array.from(new Set(visible.map(m=>m.group))),[visible]);
 const addRecord=()=>{if(!formName.trim())return;setRecords(p=>({...p,[active]:[{name:formName.trim(),value:formValue,created:new Date().toLocaleString()},...(p[active]||[])]}));setFormName('');setFormValue('');setNotice(`${active} item saved in this browser workspace.`)};
 const saveSetting=(k:string,v:string)=>{setSettings(p=>({...p,[k]:v}));setNotice('Setting saved in this browser draft.')};
 return <div className="cvx-suite">
  <aside className={`cvx-suite-side ${mobileNav?'open':''}`}>
   <div className="cvx-suite-brand"><span> C </span><div><b>CODEVEX</b><small>{roleLabels[role]} Workspace</small></div></div>
   <div className="cvx-role-switch"><label>Signed-in role</label><strong>{roleLabels[role]}</strong><small>Navigation is based on the signed-in profile role.</small></div>
   {grouped.map(g=><section key={g}><small className="cvx-nav-group">{g}</small>{visible.filter(m=>m.group===g).map(m=><button key={m.name} className={active===m.name?'active':''} onClick={()=>{setActive(m.name);setMobileNav(false)}}>{m.name}</button>)}</section>)}
  </aside>
  <main className="cvx-suite-main">
   <header className="cvx-suite-top"><button className="cvx-menu" onClick={()=>setMobileNav(!mobileNav)}>☰</button><div><small>CODEVEX / {roleLabels[role]}</small><h2>{active}</h2></div><div className="cvx-user">{profileName}</div></header>
   {notice&&<div className="cvx-notice" role="status">{notice}<button onClick={()=>setNotice('')}>×</button></div>}
   <div className="cvx-suite-content">
    <section className="cvx-welcome"><div><span className="cvx-eyebrow">{roleLabels[role]} PANEL</span><h1>{active==='Dashboard'?`Welcome, ${profileName}`:active}</h1><p>{current.desc}</p></div><span className="cvx-pill">Frontend workspace</span></section>
    {active==='Dashboard'?<div className="cvx-kpis">{['Total Leads','New Enquiries','Assigned Leads','Follow-ups Due','Site Visits','Bookings','Team Members','Conversion'].map((x,i)=><article key={x}><small>{x}</small><strong>{i===0?(records['Lead Management']||[]).length:'—'}</strong><span>Connect data in backend phase</span></article>)}</div>:null}
    {active==='Internal Chat'?<section className="cvx-record-panel"><h3>Existing chat service connection required</h3><p>This screen will use the chat backend already built for CODEVEX. No local/mock messages are created here.</p><div className="cvx-empty">Chat tables, channel membership rules, message fields, storage bucket and realtime event names are not present in the supplied schema export. The integration contract must be mapped before enabling conversations.</div><p>Planned interface: direct messages, groups, channels, lead-linked threads, delivery/read state, presence, search and attachments—only where the existing backend supports them.</p></section>:null}
    {active==='API & Integration Manager'?<div className="cvx-provider-grid">{['99acres','Magicbricks','Housing.com','WhatsApp Business API','Razorpay','SMS Provider','Calling Provider','Google Sheets','Custom API / Webhook'].map(provider=><article key={provider}><h3>{provider}</h3><label>Endpoint / API URL<input value={settings[provider+'_url']||''} onChange={e=>saveSetting(provider+'_url',e.target.value)} placeholder="https://…" /></label><label>API key / secret<input type="password" autoComplete="new-password" value={secretDraft[provider]||''} onChange={e=>setSecretDraft(p=>({...p,[provider]:e.target.value}))} placeholder="Enter only during secure backend setup" /></label><label>Webhook URL<input value={settings[provider+'_webhook']||''} onChange={e=>saveSetting(provider+'_webhook',e.target.value)} placeholder="Webhook URL" /></label><label className="cvx-check"><input type="checkbox" checked={settings[provider+'_enabled']==='yes'} onChange={e=>saveSetting(provider+'_enabled',e.target.checked?'yes':'no')}/> Enabled</label><small>Endpoint and webhook are browser-side drafts. Secret is held only in this page's memory and is not saved. Secure vault storage and connection tests require backend.</small></article>)}</div>:null}
    {active==='UPI & Payment Settings'?<div className="cvx-form-grid">{[['UPI ID','upi_id'],['Payee name','upi_payee'],['QR image URL','upi_qr'],['Payment instructions','upi_instructions'],['Razorpay Key ID','razorpay_key_id']].map(([label,key])=><label key={key}>{label}<input value={settings[key]||''} onChange={e=>saveSetting(key,e.target.value)} placeholder={label}/></label>)}<label className="cvx-check"><input type="checkbox" checked={settings.upi_show!=='no'} onChange={e=>saveSetting('upi_show',e.target.checked?'yes':'no')}/> Show payment details to companies</label></div>:null}
    {active==='Internal Chat'?null:active==='API & Integration Manager'||active==='UPI & Payment Settings'?null:<>
      <div className="cvx-module-toolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Search ${active.toLowerCase()}…`}/><button onClick={()=>setNotice(`${active}: export action is ready for backend wiring.`)}>Export</button><button onClick={()=>setNotice(`${active}: import preview is ready for backend wiring.`)}>Import</button></div>
      <div className="cvx-action-grid">{current.actions.map((x,i)=><article key={x}><span>{String(i+1).padStart(2,'0')}</span><b>{x}</b><small>Available in {active}</small></article>)}</div>
      <section className="cvx-record-panel"><div><h3>{active} workspace</h3><p>Manage configuration and records for this module.</p></div><div className="cvx-record-form"><input value={formName} onChange={e=>setFormName(e.target.value)} placeholder="Name / title"/><input value={formValue} onChange={e=>setFormValue(e.target.value)} placeholder="Details / notes"/><button onClick={addRecord}>Add item</button></div><div className="cvx-record-list">{(records[active]||[]).filter(r=>`${r.name} ${r.value}`.toLowerCase().includes(query.toLowerCase())).map((r,i)=><article key={`${r.created}-${i}`}><b>{r.name}</b><p>{r.value}</p><small>{r.created}</small></article>)}{!(records[active]||[]).length&&<div className="cvx-empty">No local draft records yet. Backend connection will load live records in the next phase.</div>}</div></section>
    </>}
    {active==='Template Manager'?<section className="cvx-record-panel"><h3>WhatsApp template categories</h3><div className="cvx-chip-list">{defaultTemplates.map(t=><span key={t}>{t}</span>)}</div><p>{templateList.length} template entries configured in this frontend draft. Dynamic variables: {'{name}, {project}, {price}, {date}, {time}, {location}, {agent_name}, {brochure_link}, {payment_amount}'}.</p><button onClick={()=>setTemplateList(p=>[...p,`Custom Template ${p.length+1}`])}>Add template</button></section>:null}
    {active==='Lead Source Manager'?<section className="cvx-record-panel"><h3>Lead sources</h3><div className="cvx-chip-list">{sourceList.map(s=><span key={s}>{s}</span>)}</div><div className="cvx-record-form"><input value={formName} onChange={e=>setFormName(e.target.value)} placeholder="New lead source"/><button onClick={()=>{if(formName.trim()){setSourceList(p=>[...p,formName.trim()]);setFormName('')}}}>Add source</button></div></section>:null}
   </div>
  </main>
 </div>
}
