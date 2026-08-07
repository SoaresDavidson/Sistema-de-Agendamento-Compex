const ClinicData = {
  clientes: [
    {id:'c1',nome:'Ana Paula Ribeiro',telefone:'(85) 98841-2030',email:'ana.ribeiro@email.com',nascimento:'12/03/1987'},
    {id:'c2',nome:'Bruno Henrique Lima',telefone:'(85) 99620-1147',email:'bruno.lima@email.com',nascimento:'25/09/1992'},
    {id:'c3',nome:'Carla Mendes Nogueira',telefone:'(85) 99175-8820',email:'carla.nogueira@email.com',nascimento:'07/06/1978'},
    {id:'c4',nome:'Daniel Oliveira Costa',telefone:'(85) 98712-4406',email:'daniel.costa@email.com',nascimento:'18/11/1984'},
    {id:'c5',nome:'Elisa Martins Rocha',telefone:'(85) 99461-0953',email:'elisa.rocha@email.com',nascimento:'30/01/1998'},
    {id:'c6',nome:'Fábio Sousa Almeida',telefone:'(85) 99222-7314',email:'',nascimento:'14/08/1969'},
    {id:'c7',nome:'Gabriela Freitas Melo',telefone:'(85) 98903-5571',email:'gabriela.melo@email.com',nascimento:'22/04/1995'},
    {id:'c8',nome:'Helena Barros Cavalcante',telefone:'(85) 99730-6182',email:'helena.cavalcante@email.com',nascimento:'03/12/1956'}
  ],
  especialidades:['Cardiologia','Dermatologia','Endocrinologia','Ginecologia','Ortopedia','Clínica médica'],
  medicos:[
    {id:'m1',nome:'Dra. Mariana Alves',especialidades:['Cardiologia','Clínica médica']},
    {id:'m2',nome:'Dr. Rafael Monteiro',especialidades:['Dermatologia']},
    {id:'m3',nome:'Dra. Lúcia Fernandes',especialidades:['Endocrinologia','Clínica médica']},
    {id:'m4',nome:'Dr. Caio Vasconcelos',especialidades:['Ortopedia']},
    {id:'m5',nome:'Dra. Patrícia Gomes',especialidades:['Ginecologia']}
  ],
  agendamentos:[
    {id:'a1',cliente:'Ana Paula Ribeiro',medico:'Dra. Mariana Alves',especialidade:'Cardiologia',data:'10/08/2026',hora:'08:00–09:00',status:'AGENDADO'},
    {id:'a2',cliente:'Bruno Henrique Lima',medico:'Dr. Rafael Monteiro',especialidade:'Dermatologia',data:'10/08/2026',hora:'09:00–10:00',status:'AGENDADO'},
    {id:'a3',cliente:'Carla Mendes Nogueira',medico:'Dra. Lúcia Fernandes',especialidade:'Endocrinologia',data:'10/08/2026',hora:'10:00–11:00',status:'AGENDADO'},
    {id:'a4',cliente:'Daniel Oliveira Costa',medico:'Dr. Caio Vasconcelos',especialidade:'Ortopedia',data:'11/08/2026',hora:'14:00–15:00',status:'AGENDADO'},
    {id:'a5',cliente:'Elisa Martins Rocha',medico:'Dra. Patrícia Gomes',especialidade:'Ginecologia',data:'05/08/2026',hora:'11:00–12:00',status:'CONCLUIDO'},
    {id:'a6',cliente:'Fábio Sousa Almeida',medico:'Dra. Mariana Alves',especialidade:'Clínica médica',data:'04/08/2026',hora:'15:00–16:00',status:'CONCLUIDO'},
    {id:'a7',cliente:'Gabriela Freitas Melo',medico:'Dr. Rafael Monteiro',especialidade:'Dermatologia',data:'12/08/2026',hora:'08:00–09:00',status:'CANCELADO'},
    {id:'a8',cliente:'Helena Barros Cavalcante',medico:'Dra. Lúcia Fernandes',especialidade:'Endocrinologia',data:'13/08/2026',hora:'16:00–17:00',status:'CANCELADO'}
  ],
  horarios:[
    {id:'h1',medico:'Dra. Mariana Alves',especialidade:'Cardiologia',data:'10/08/2026',hora:'08:00–09:00',situacao:'OCUPADO'},
    {id:'h2',medico:'Dra. Mariana Alves',especialidade:'Cardiologia',data:'10/08/2026',hora:'09:00–10:00',situacao:'DISPONIVEL'},
    {id:'h3',medico:'Dr. Rafael Monteiro',especialidade:'Dermatologia',data:'10/08/2026',hora:'09:00–10:00',situacao:'OCUPADO'},
    {id:'h4',medico:'Dra. Lúcia Fernandes',especialidade:'Endocrinologia',data:'10/08/2026',hora:'10:00–11:00',situacao:'OCUPADO'},
    {id:'h5',medico:'Dr. Caio Vasconcelos',especialidade:'Ortopedia',data:'10/08/2026',hora:'10:00–11:00',situacao:'DISPONIVEL'},
    {id:'h6',medico:'Dra. Patrícia Gomes',especialidade:'Ginecologia',data:'10/08/2026',hora:'13:00–14:00',situacao:'INATIVO'},
    {id:'h7',medico:'Dra. Mariana Alves',especialidade:'Clínica médica',data:'05/08/2026',hora:'15:00–16:00',situacao:'PASSADO'},
    {id:'h8',medico:'Dr. Rafael Monteiro',especialidade:'Dermatologia',data:'11/08/2026',hora:'08:00–09:00',situacao:'DISPONIVEL'},
    {id:'h9',medico:'Dra. Lúcia Fernandes',especialidade:'Endocrinologia',data:'11/08/2026',hora:'09:00–10:00',situacao:'DISPONIVEL'},
    {id:'h10',medico:'Dr. Caio Vasconcelos',especialidade:'Ortopedia',data:'11/08/2026',hora:'14:00–15:00',situacao:'OCUPADO'}
  ]
};

const icons = {
  overview:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z"/></svg>',
  calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  people:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M17 11a4 4 0 0 1 4 4v5"/></svg>',
  doctor:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="7" r="4"/><path d="M5 21v-3a7 7 0 0 1 14 0v3M9 14l3 3 3-3"/></svg>',
  tag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m20 13-7 7-9-9V4h7l9 9Z"/><circle cx="8" cy="8" r="1"/></svg>'
};

function shell(active,title,crumb){
  const nav=[['overview.html','overview','Visão geral'],['agendamentos.html','calendar','Agendamentos'],['horarios.html','clock','Horários'],['clientes.html','people','Clientes'],['medicos.html','doctor','Médicos'],['especialidades.html','tag','Especialidades']];
  return `<a class="skip-link" href="#conteudo">Pular para o conteúdo</a><div class="app-shell"><aside class="sidebar" data-od-id="navegacao-lateral"><a class="brand" href="overview.html"><span class="brand-mark">CA</span><span>Clínica Aurora</span></a><nav class="nav" aria-label="Navegação principal">${nav.map(([href,key,label])=>`<a href="${href}" class="${active===key?'active':''}" ${active===key?'aria-current="page"':''}>${icons[key]}<span>${label}</span></a>`).join('')}</nav><div class="sidebar-foot">Interface interna<br>Agendamento clínico</div></aside><div class="workspace"><header class="topbar" data-od-id="cabecalho-contextual"><div class="topbar-context"><button class="menu-btn" type="button" aria-label="Abrir menu" data-menu>${icons.overview}</button><div><div class="breadcrumb">Clínica Aurora / <strong>${crumb||title}</strong></div></div></div><div class="today">QUINTA · 06 AGO 2026</div></header><main class="main" id="conteudo" data-od-id="conteudo-principal">`;
}
function closeShell(){return '</main></div></div><div class="toast-region" aria-live="polite" aria-atomic="true"></div>'}
function statusBadge(status){return `<span class="status status-${status.toLowerCase()}">${status}</span>`}
function showToast(title,message='Operação simulada com dados locais.'){const region=document.querySelector('.toast-region');if(!region)return;const el=document.createElement('div');el.className='toast';el.innerHTML=`<span aria-hidden="true">✓</span><div><strong>${title}</strong><p>${message}</p></div>`;region.append(el);setTimeout(()=>el.remove(),3600)}
function openModal(id){document.getElementById(id)?.classList.add('open');document.getElementById(id)?.querySelector('button,input,select,textarea')?.focus()}
function closeModal(id){document.getElementById(id)?.classList.remove('open')}

function initShell(){
  const active=document.body.dataset.screen||'overview';
  const page=document.querySelector('.page-content');
  if(page){
    const dialogs=[...document.querySelectorAll('.modal-backdrop')].map(el=>el.outerHTML).join('');
    document.body.innerHTML=shell(active,document.body.dataset.title||'',document.body.dataset.crumb||'')+page.outerHTML+closeShell()+dialogs;
  }
  document.querySelector('[data-menu]')?.addEventListener('click',()=>document.body.classList.toggle('menu-open'));
  document.addEventListener('click',e=>{const closer=e.target.closest('[data-close-modal]');if(closer)closeModal(closer.dataset.closeModal);if(e.target.classList.contains('modal-backdrop'))e.target.classList.remove('open')});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelector('.modal-backdrop.open')?.classList.remove('open');document.body.classList.remove('menu-open')}});
  document.querySelectorAll('[data-toast]').forEach(btn=>btn.addEventListener('click',()=>showToast(btn.dataset.toast,btn.dataset.toastMessage)));
}

function renderAppointments(){
  const body=document.querySelector('#appointments-body');if(!body)return;
  const q=(document.querySelector('#appointment-search')?.value||'').toLowerCase();
  const status=document.querySelector('#appointment-status')?.value||'';
  const medico=document.querySelector('#appointment-doctor')?.value||'';
  const specialty=document.querySelector('#appointment-specialty')?.value||'';
  const dateStart=document.querySelector('#appointment-date')?.value||'';
  const dateEnd=document.querySelector('#appointment-date-end')?.value||'';
  const iso=pt=>pt.split('/').reverse().join('-');
  const filtered=ClinicData.agendamentos.filter(a=>(!q||a.cliente.toLowerCase().includes(q))&&(!status||a.status===status)&&(!medico||a.medico===medico)&&(!specialty||a.especialidade===specialty)&&(!dateStart||iso(a.data)>=dateStart)&&(!dateEnd||iso(a.data)<=dateEnd)).sort((a,b)=>`${iso(a.data)} ${a.hora.slice(0,5)}`.localeCompare(`${iso(b.data)} ${b.hora.slice(0,5)}`));
  body.innerHTML=filtered.map(a=>`<tr><td><span class="primary-cell">${a.cliente}</span></td><td>${a.medico}</td><td>${a.especialidade}</td><td class="mono">${a.data}</td><td class="mono">${a.hora}</td><td>${statusBadge(a.status)}</td><td><div class="table-actions"><a class="btn btn-ghost btn-sm" href="agendamento-detalhes.html">Detalhes</a>${a.status==='AGENDADO'?`<button class="btn btn-ghost btn-sm" data-cancel="${a.id}">Cancelar</button>`:''}</div></td></tr>`).join('');
  const empty=document.querySelector('#appointments-empty');empty.hidden=filtered.length>0;document.querySelector('#appointments-table').hidden=filtered.length===0;
  document.querySelector('#result-count').textContent=`${filtered.length} resultado${filtered.length===1?'':'s'}`;
  document.querySelectorAll('[data-cancel]').forEach(btn=>btn.addEventListener('click',()=>openModal('cancel-modal')));
}

function initAppointments(){
  const doctor=document.querySelector('#appointment-doctor');if(doctor)doctor.innerHTML='<option value="">Todos os médicos</option>'+ClinicData.medicos.map(m=>`<option>${m.nome}</option>`).join('');
  const specialty=document.querySelector('#appointment-specialty');if(specialty)specialty.innerHTML='<option value="">Todas as especialidades</option>'+ClinicData.especialidades.map(x=>`<option>${x}</option>`).join('');
  ['appointment-search','appointment-status','appointment-doctor','appointment-specialty','appointment-date','appointment-date-end'].forEach(id=>document.getElementById(id)?.addEventListener(id==='appointment-search'?'input':'change',renderAppointments));
  document.querySelector('#clear-appointments')?.addEventListener('click',()=>{['appointment-search','appointment-status','appointment-doctor','appointment-specialty','appointment-date','appointment-date-end'].forEach(id=>document.querySelector(`#${id}`).value='');renderAppointments()});
  document.querySelector('#confirm-cancel')?.addEventListener('click',()=>{const origin=document.querySelector('input[name="cancel-origin"]:checked')?.value||'CLIENTE';closeModal('cancel-modal');showToast('Agendamento cancelado',origin==='CLIENTE'?'O horário permaneceu ativo e voltou a ficar disponível.':'O horário foi desativado por indisponibilidade do médico.')});
  renderAppointments();
}

function renderSchedules(){
  const body=document.querySelector('#schedules-body');if(!body)return;const status=document.querySelector('#schedule-status')?.value||'';const medico=document.querySelector('#schedule-doctor')?.value||'';const esp=document.querySelector('#schedule-specialty')?.value||'';const date=document.querySelector('#schedule-date-filter')?.value||'';
  const iso=pt=>pt.split('/').reverse().join('-');
  const rows=ClinicData.horarios.filter(h=>(!date||iso(h.data)===date)&&(!status||h.situacao===status)&&(!medico||h.medico===medico)&&(!esp||h.especialidade===esp)).sort((a,b)=>`${iso(a.data)} ${a.hora.slice(0,5)}`.localeCompare(`${iso(b.data)} ${b.hora.slice(0,5)}`));
  body.innerHTML=rows.map(h=>{const params=new URLSearchParams({horario:h.id,especialidade:h.especialidade,medico:h.medico,data:iso(h.data),hora:h.hora});const actions=h.situacao==='DISPONIVEL'?`<a class="btn btn-secondary btn-sm" href="novo-agendamento.html?${params}">Marcar horário</a><button class="btn btn-ghost btn-sm" data-deactivate="${h.id}">Desativar</button>`:'<span class="secondary-cell">Sem ação</span>';return `<tr><td class="mono">${h.data}</td><td class="mono">${h.hora}</td><td>${h.medico}</td><td>${h.especialidade}</td><td>${statusBadge(h.situacao)}</td><td><div class="table-actions">${actions}</div></td></tr>`}).join('');
  document.querySelectorAll('[data-deactivate]').forEach(btn=>btn.addEventListener('click',()=>openModal('deactivate-modal')));
}
function initSchedules(){
  const doctor=document.querySelector('#schedule-doctor');if(doctor)doctor.innerHTML='<option value="">Todos os médicos</option>'+ClinicData.medicos.map(m=>`<option>${m.nome}</option>`).join('');
  const spec=document.querySelector('#schedule-specialty');if(spec)spec.innerHTML='<option value="">Todas as especialidades</option>'+ClinicData.especialidades.map(x=>`<option>${x}</option>`).join('');
  ['schedule-date-filter','schedule-status','schedule-doctor','schedule-specialty'].forEach(id=>document.getElementById(id)?.addEventListener('change',renderSchedules));
  document.querySelector('#confirm-deactivate')?.addEventListener('click',()=>{closeModal('deactivate-modal');showToast('Horário desativado','O bloco não aparecerá mais como disponível para novos agendamentos.')});renderSchedules();
}

function initClients(){
  const body=document.querySelector('#clients-body');if(!body)return;
  const render=()=>{const q=document.querySelector('#client-search').value.toLowerCase();const rows=ClinicData.clientes.filter(c=>Object.values(c).some(v=>String(v).toLowerCase().includes(q)));body.innerHTML=rows.map(c=>`<tr><td><span class="primary-cell">${c.nome}</span><span class="secondary-cell">Nascimento: ${c.nascimento}</span></td><td>${c.telefone}</td><td>${c.email||'—'}</td><td><div class="table-actions"><a class="btn btn-ghost btn-sm" href="cliente-form.html?editar=1&cliente=${encodeURIComponent(c.id)}">Editar</a></div></td></tr>`).join('');document.querySelector('#clients-table').hidden=!rows.length;document.querySelector('#clients-empty').hidden=!!rows.length};
  document.querySelector('#client-search').addEventListener('input',render);render();
}

function initDoctors(){
  const body=document.querySelector('#doctors-body');if(!body)return;const filter=document.querySelector('#doctor-specialty');filter.innerHTML='<option value="">Todas as especialidades</option>'+ClinicData.especialidades.map(x=>`<option>${x}</option>`).join('');
  const render=()=>{const q=document.querySelector('#doctor-search').value.toLowerCase(),esp=filter.value;const rows=ClinicData.medicos.filter(m=>(!q||m.nome.toLowerCase().includes(q))&&(!esp||m.especialidades.includes(esp)));body.innerHTML=rows.map(m=>`<tr><td class="primary-cell">${m.nome}</td><td><div class="chips">${m.especialidades.map(e=>`<span class="chip active">${e}</span>`).join('')}</div></td><td><div class="table-actions"><button class="btn btn-ghost btn-sm" data-edit-doctor="${m.id}">Editar</button></div></td></tr>`).join('');document.querySelectorAll('[data-edit-doctor]').forEach(b=>b.addEventListener('click',()=>openModal('doctor-modal')))};filter.addEventListener('change',render);document.querySelector('#doctor-search').addEventListener('input',render);render();
  document.querySelector('#save-doctor')?.addEventListener('click',()=>{closeModal('doctor-modal');showToast('Médico salvo','As especialidades selecionadas foram associadas sem duplicidade.')});
}

function initSpecialties(){
  document.querySelector('#save-specialty')?.addEventListener('click',()=>{const input=document.querySelector('#specialty-name');if(input.value.trim().toLowerCase()==='cardiologia'){document.querySelector('#specialty-field').classList.add('has-error');return}document.querySelector('#specialty-field').classList.remove('has-error');closeModal('specialty-modal');showToast('Especialidade salva')});
  document.querySelectorAll('[data-delete-specialty]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelector('#delete-message').textContent=btn.dataset.blocked==='true'?'Esta especialidade está associada a médicos e não pode ser excluída. Remova as associações antes de tentar novamente.':'A especialidade não possui associações impeditivas e poderá ser excluída.';document.querySelector('#confirm-delete-specialty').disabled=btn.dataset.blocked==='true';openModal('delete-specialty-modal')}));
}

function initClientForm(){
  const form=document.querySelector('#client-form');if(!form)return;const name=document.querySelector('#client-name'),birth=document.querySelector('#client-birth'),dup=document.querySelector('#duplicate-alert');
  const checkDup=()=>{dup.hidden=!(name.value.trim().toLowerCase().includes('ana paula')&&birth.value==='1987-03-12')};name.addEventListener('input',checkDup);birth.addEventListener('change',checkDup);
  form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;if(!dup.hidden&&!document.querySelector('#allow-duplicate').checked){showToast('Revise a possível duplicidade','Confirme que deseja continuar mesmo assim.');return}showToast('Cliente salvo','O cadastro foi validado e incluído nos dados simulados.')});
}

function initNewAppointment(){
  const spec=document.querySelector('#new-specialty'),doctor=document.querySelector('#new-doctor'),clientList=document.querySelector('#client-options');if(!spec)return;
  spec.innerHTML='<option value="">Selecione</option>'+ClinicData.especialidades.map(x=>`<option>${x}</option>`).join('');
  clientList.innerHTML=ClinicData.clientes.slice(0,5).map(c=>`<button type="button" class="select-item" data-client="${c.nome}"><span><strong>${c.nome}</strong><small>${c.telefone} · ${c.nascimento}</small></span><span>Selecionar</span></button>`).join('');
  document.querySelectorAll('[data-client]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-client]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');document.querySelector('#summary-client').textContent=b.dataset.client}));
  spec.addEventListener('change',()=>{const docs=ClinicData.medicos.filter(m=>m.especialidades.includes(spec.value));doctor.innerHTML='<option value="">Selecione</option>'+docs.map(m=>`<option>${m.nome}</option>`).join('');document.querySelector('#summary-specialty').textContent=spec.value||'—'});
  doctor.addEventListener('change',()=>document.querySelector('#summary-doctor').textContent=doctor.value||'—');
  document.querySelectorAll('[data-slot]').forEach(slot=>slot.addEventListener('click',()=>{if(slot.classList.contains('unavailable')){showToast('Horário indisponível','Este bloco já possui um agendamento ativo. Escolha outro horário.');return}document.querySelectorAll('[data-slot]').forEach(s=>s.classList.remove('selected'));slot.classList.add('selected');document.querySelector('#summary-time').textContent=slot.dataset.slot}));
  document.querySelector('#confirm-appointment')?.addEventListener('click',()=>openModal('conflict-modal'));
  document.querySelector('#refresh-slots')?.addEventListener('click',()=>{closeModal('conflict-modal');document.querySelector('[data-slot="09:00–10:00"]')?.classList.add('unavailable');showToast('Horários atualizados','O bloco em conflito foi removido da seleção.')});
  document.querySelector('#simulate-success')?.addEventListener('click',()=>showToast('Agendamento confirmado','O horário foi verificado novamente e reservado para o cliente selecionado.'));
  const params=new URLSearchParams(location.search);const linkedSchedule=params.get('horario');
  if(linkedSchedule){
    const specialty=params.get('especialidade')||'';const linkedDoctor=params.get('medico')||'';const date=params.get('data')||'';const time=params.get('hora')||'';
    spec.value=specialty;spec.dispatchEvent(new Event('change'));doctor.value=linkedDoctor;doctor.dispatchEvent(new Event('change'));
    document.querySelector('#new-date').value=date;document.querySelector('#summary-date').textContent=date?date.split('-').reverse().join('/'):'—';
    const selected=[...document.querySelectorAll('[data-slot]')].find(slot=>slot.dataset.slot===time);if(selected){selected.classList.remove('unavailable');selected.classList.add('selected');selected.querySelector('small').textContent='Horário selecionado';document.querySelector('#summary-time').textContent=time}
    document.querySelector('[data-step="client"]').className='step active';document.querySelector('[data-step="agenda"]').className='step done';document.querySelector('[data-step="time"]').className='step done';
    const notice=document.querySelector('#schedule-prefill-notice');if(notice)notice.hidden=false;
  }
}

function initScheduleForm(){
  const tabs=document.querySelectorAll('[data-mode]');if(!tabs.length)return;tabs.forEach(t=>t.addEventListener('click',()=>{tabs.forEach(x=>x.classList.remove('active'));t.classList.add('active');document.querySelector('#individual-panel').hidden=t.dataset.mode!=='individual';document.querySelector('#batch-panel').hidden=t.dataset.mode!=='batch'}));
  document.querySelector('#validate-individual')?.addEventListener('click',()=>{const start=document.querySelector('#start-time').value,end=document.querySelector('#end-time').value,date=document.querySelector('#schedule-date').value;const alert=document.querySelector('#individual-alert');if(!date||date<'2026-08-06'){alert.className='notice danger';alert.innerHTML='<div><strong>Data inválida</strong><p>Não é permitido cadastrar um horário no passado.</p></div>';alert.hidden=false}else if(start>=end){alert.className='notice danger';alert.innerHTML='<div><strong>Intervalo inválido</strong><p>O início deve ser anterior ao fim.</p></div>';alert.hidden=false}else if(start==='14:30'){alert.className='notice danger';alert.innerHTML='<div><strong>Sobreposição encontrada</strong><p>Este médico já possui o horário 14:00–15:00. Médicos diferentes podem manter o mesmo período.</p></div>';alert.hidden=false}else{alert.className='notice success';alert.innerHTML='<div><strong>Horário válido</strong><p>Nenhuma sobreposição foi encontrada para este médico.</p></div>';alert.hidden=false}});
  document.querySelector('#generate-preview')?.addEventListener('click',()=>{document.querySelector('#batch-preview').hidden=false;showToast('Prévia gerada','12 blocos válidos e 2 conflitos foram encontrados. Nenhum dado foi salvo.')});
  document.querySelector('#confirm-batch')?.addEventListener('click',()=>showToast('Horários criados','12 blocos individuais foram criados; os 2 conflitos não foram incluídos.'));
}

document.addEventListener('DOMContentLoaded',()=>{
  initShell();
  ({appointments:initAppointments,schedules:initSchedules,clients:initClients,doctors:initDoctors,specialties:initSpecialties,clientForm:initClientForm,newAppointment:initNewAppointment,scheduleForm:initScheduleForm}[document.body.dataset.behavior]||(()=>{}))();
  document.querySelectorAll('[data-open-modal]').forEach(btn=>btn.addEventListener('click',()=>openModal(btn.dataset.openModal)));
});
