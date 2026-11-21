'use strict';
const tg=window.Telegram?.WebApp;try{tg?.ready();tg?.expand();tg?.setHeaderColor('#eaf5ff');tg?.setBackgroundColor('#f4f6f8')}catch{}
const API=(window.SBEWO_API_URL||'').replace(/\/$/,'');
const USERNAME=(window.SBEWO_BOT_USERNAME||'').replace(/^@/,'');
const initData=tg?.initData||'';
const S51_PRO_KYU='sbewo-pro-kyu.png';
let s51Plan='12m';
let s91TariffMode='personal';

// Official Remix Icon glyphs are used when their webfont is available.
// Inline SVG fallbacks keep the interface readable in offline/restricted WebViews.
try{document.fonts?.load('24px remixicon').then(fonts=>{if(fonts?.length)document.documentElement.classList.add('remix-ready')}).catch(()=>{})}catch{}
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const path={home:'<path d="m3 10 9-7 9 7v10H4z"/><path d="M9 21v-8h6v8"/>',history:'<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2"/>',archive:'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9M10 13h4"/>',settings:'<path d="M10.325 4.317a1.724 1.724 0 0 1 3.35 0 1.724 1.724 0 0 0 2.573 1.066 1.724 1.724 0 0 1 2.898 1.676 1.724 1.724 0 0 0 1.285 2.46 1.724 1.724 0 0 1 0 3.35 1.724 1.724 0 0 0-1.285 2.572 1.724 1.724 0 0 1-2.898 1.677 1.724 1.724 0 0 0-2.573 1.065 1.724 1.724 0 0 1-3.35 0 1.724 1.724 0 0 0-2.572-1.065 1.724 1.724 0 0 1-2.899-1.677 1.724 1.724 0 0 0-1.065-2.572 1.724 1.724 0 0 1 0-3.35 1.724 1.724 0 0 0 1.065-2.46 1.724 1.724 0 0 1 2.899-1.676 1.724 1.724 0 0 0 2.572-1.066Z"/><path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"/>',trash:'<path d="M4 7h16M10 4h4M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',edit:'<path d="M4 20l4-.8L20 7a2 2 0 0 0-3-3L5 16z"/>',image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8" r="1"/><path d="m3 17 5-5 3 3 3-4 7 7"/>',audio:'<path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 6v12M22 11v2"/>',group:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 4 5v1"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',shield:'<path d="M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',chevron:'<path d="m9 5 7 7-7 7"/>',back:'<path d="m15 5-7 7 7 7"/>',check:'<path d="m4 12 5 5L20 6"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',star:'<path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z"/>',info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/>',help:'<circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 1 1 4 3c-1 .4-1 1-1 2M12 18h.01"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',folder:'<path d="M3 6h7l2 3h9v12H3z"/>',send:'<path d="m22 2-8 20-4-8-8-4zM10 14 22 2"/>',video:'<rect x="2" y="5" width="15" height="14" rx="3"/><path d="m17 10 5-3v10l-5-3"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',filter:'<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',crown:'<path d="M2 7l5 4 5-7 5 7 5-4-2 12H4z"/>',refresh:'<path d="M20 7v5h-5M4 17v-5h5M5.5 9A8 8 0 0 1 20 12M18.5 15A8 8 0 0 1 4 12"/>',note:'<path d="M5 3h14v18H5zM9 8h6M9 12h6"/>',person:'<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',alert:'<path d="M12 3 2 21h20zM12 9v5M12 18h.01"/>',layers:'<path d="m12 2 10 6-10 6L2 8zM2 12l10 6 10-6M2 16l10 6 10-6"/>'};
const ico=(k,cls='')=>`<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${path[k]||path.info}</svg>`;
const KYU_IMAGES={
  'archive':'./kyu-archive.webp',
  'deleted':'./kyu-deleted.webp',
  'edited':'./kyu-edited.webp',
  'empty':'./kyu-empty.webp',
  'groups':'./kyu-groups.webp',
  'help':'./kyu-help.webp',
  'home':'./kyu-home.webp',
  'media':'./kyu-media.webp',
  'notifications':'./kyu-notifications.webp',
  'premium':'./kyu-premium.webp',
  'settings':'./kyu-settings.webp',
  'welcome':'./kyu-welcome.webp'
};
// Mascot assets are separate cacheable files, not megabytes of inline base64.
// Prewarm a small number of likely next-page images after the initial paint.
const sAssetWarmQueue=[
 './kyu-settings-tariffs.png','./kyu-pricing-peek.png',
 ...Object.values(KYU_IMAGES),
 './kyu-status-paid.png','./kyu-status-expired.png',
 './kyu-status-trial-3.png','./kyu-status-trial-2.png','./kyu-status-trial-1.png',
 './kyu-trash.png'
];
const sAssetWarmCache=new Map();
function sWarmMascot(url){
 if(sAssetWarmCache.has(url))return sAssetWarmCache.get(url);
 const img=new Image();
 const promise=new Promise(resolve=>{
  img.onload=()=>{if(typeof img.decode==='function')img.decode().catch(()=>{}).finally(resolve);else resolve()};
  img.onerror=resolve;
 });
 sAssetWarmCache.set(url,promise);
 img.decoding='async';img.src=url;
 return promise;
}
function sWarmMascotsInBackground(){
 const queue=[...new Set(sAssetWarmQueue)];
 const step=()=>{const asset=queue.shift();if(!asset)return;
  sWarmMascot(asset).finally(()=>{
   if('requestIdleCallback' in window)window.requestIdleCallback(step,{timeout:2500});
   else setTimeout(step,100);
  });
 };
 if('requestIdleCallback' in window)window.requestIdleCallback(step,{timeout:2500});
 else setTimeout(step,250);
}
window.addEventListener('load',sWarmMascotsInBackground,{once:true});
const kyu=(k,cls='')=>`<img class="${cls}" src="${KYU_IMAGES[k]||KYU_IMAGES.empty}" alt="Кью — помощник Sbewo" loading="eager" decoding="async">`;
const pref=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch{return null}};
let page=(pref('sbewo-v8-onboarded')==='yes'||pref('sbewo-v6-onboarded')==='yes')?'home':'welcome',previous='home',onboard=0,flt='all',mediaFilter='all',query='',selectedChat='',selectedKey='',demo=false,busy=false,error='',theme=pref('sbewo-v5-theme')||'light';
let s65PreviewState=pref('sbewo-status-preview')||'';
let notify={delete:false,edit:false,group:false,own_delete:false,own_edit:false,bot_started:false};
let excludedChats=JSON.parse(pref('sbewo-hidden-chats')||'[]');
let db={connected:false,connections:0,items:[],limits:{media_download:false,group_deletions:false,push_notifications:false,payments:false},retention_days:30};
const now=Math.floor(Date.now()/1000),demoMessages=[{key:'d1',chat:'Анна',sender:'Анна',text:'Давай позже, не жди',kind:'text',deleted:true,edited:false,time:now-4700,updated:now-1000,versions:[{text:'Давай позже, не жди',time:now-4700}]},{key:'d2',chat:'Анна',sender:'Анна',text:'Встречаемся в 20:00',kind:'text',deleted:false,edited:true,time:now-4000,updated:now-900,versions:[{text:'Встречаемся в 19:00',time:now-4000},{text:'Встречаемся в 20:00',time:now-900}]},{key:'d3',chat:'Брат',sender:'Брат',text:'Фото было отправлено',kind:'photo',deleted:false,edited:false,time:now-3200,updated:now-3200,versions:[]}];
const isIntro=()=>['welcome','intro2','intro3'].includes(page);
const isMain=()=>['home','services','settings'].includes(page);
const parent=()=>isMain()?page:(['history','archive','deleted','edited','revision','eventdetail','media','chats','chat','groups'].includes(page)?'services':'settings');
const fmt=t=>new Date((Number(t)||now)*1000).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
const visible=()=>db.items.filter(x=>!excludedChats.includes(x.chat));
const records=()=>visible().filter(x=>x.deleted||x.edited||x.rescued_once).slice().sort((a,b)=>(b.updated||0)-(a.updated||0));
const mediaRecords=()=>visible().filter(x=>x.kind&&x.kind!=='text');
const s38ChatKey=m=>m?.chat_id!=null&&String(m.chat_id).trim()?`id:${m.chat_id}`:`name:${m?.chat||'Чат без названия'}`;
const s38ChatItems=key=>visible().filter(m=>s38ChatKey(m)===key);
const s38ChatName=(key,items=s38ChatItems(key))=>{
 const id=String(key).startsWith('id:')?String(key).slice(3):'';
 if(id&&db.aliases?.[id])return db.aliases[id];
 const named=items.filter(m=>m.chat&&m.chat!=='Личный чат'&&m.chat!=='Чат без названия')
  .sort((a,b)=>(Number(b.time)||0)-(Number(a.time)||0));
 return named[0]?.chat||items[0]?.chat||'Чат без названия';
};
const connections=()=>{const groups=new Map();visible().forEach(m=>{const key=s38ChatKey(m);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m)});return [...groups.entries()]};
const cleanName=(name)=>{const n=String(name||'').trim();return n&&n!=='.'&&n!=='-'?n:'Чат без названия'};
const avatar=(name)=>`<span class="avatar">${esc(cleanName(name)==='Чат без названия'?'✦':cleanName(name)[0].toUpperCase())}</span>`;

const tabbar=()=>`<nav class="tabbar tabbar-three" aria-label="Главное меню">${[['home','Меню','home'],['services','Сервисы','layers'],['settings','Профиль','person']].map(([k,label,icon])=>`<button data-go="${k}" class="${parent()===k?'active':''}" aria-label="${label}">${ico(icon)}<span>${label}</span></button>`).join('')}</nav>`;

const header=(title)=>`<div class="topbar"><button class="back" data-back="1">${ico('back')} Назад</button><strong>${esc(title)}</strong><span class="placeholder"></span></div>`;
const btn=(label,target)=>`<button class="primary" data-go="${target}">${label} ${ico('chevron')}</button>`;
const row=(icon,title,sub,target,color='')=>`<button class="link-row ${color}" data-go="${target}"><span class="bubble">${ico(icon)}</span><span class="grow"><strong>${title}</strong><small>${sub}</small></span>${ico('chevron','chev')}</button>`;
const noData=(k,title,detail,action='')=>`<div class="empty">${kyu(k)}<strong>${title}</strong><p>${detail}</p>${action}</div>`;
const chips=(entries,active,action='flt')=>`<div class="chips">${entries.map(([v,l])=>`<button data-${action}="${v}" class="${active===v?'active':''}">${l}</button>`).join('')}</div>`;
const searchBox=(ph)=>`<input id="search" class="search" placeholder="${ph}" value="${esc(query)}" aria-label="Поиск">`;
const item=(m)=>{const kind=m.deleted?'deleted':m.edited?'edited':'media',label=kind==='deleted'?'Удалённое сообщение':kind==='edited'?'Изменённое сообщение':'Сведения о медиа';const revisions=Array.isArray(m.versions)?m.versions:[];const old=revisions[0]?.text, current=revisions[revisions.length-1]?.text;return `<button class="event event-${kind}" data-message="${esc(m.key)}">${avatar(m.chat)}<span class="grow"><span class="event-top"><strong>${esc(cleanName(m.chat))}</strong><time>${fmt(m.updated||m.time)}</time></span><span class="pill ${kind==='edited'?'edit':kind==='media'?'media':''}">${ico(kind==='deleted'?'trash':kind==='edited'?'edit':'image')} ${label}</span>${m.edited&&revisions.length>1?`<p class="change-preview">Было: ${esc(old||'Не сохранено')}<br>Стало: <b>${esc(current||m.text||'Текст недоступен')}</b></p>`:m.kind!=='text'?`<p>${esc(m.text||'Сведения о вложении (файл не сохранён)')}</p>`:`<p>${esc(m.text||'Текст сообщения недоступен')}</p>`}</span></button>`};

function welcome(){
 return `<section class="simple-welcome">
  <div class="welcome-brand"><span class="mark">${ico('layers')}</span><strong>Sbewo</strong></div>
  <div class="welcome-mascot">${kyu('welcome')}</div>
  <h1>Привет, я Кью! 👋</h1>
  <p>Помогу не пропустить удалённые сообщения и изменения в доступных чатах.</p>
  <div class="welcome-bottom"><div class="mini-explainer">${ico('shield')} Без входа в аккаунт и без пароля</div>
  <button class="primary" data-go="connection">Начать ${ico('chevron')}</button>
  <button class="text-button" data-demo="1">Сначала посмотреть пример</button></div>
 </section>`;
}

function home(){
 const all=records(),deleted=all.filter(x=>x.deleted).length,edited=all.filter(x=>x.edited).length,media=mediaRecords().length;
 const recent=all.slice(0,4);
 return `<section class="m12-home">
 <header class="m12-top"><div class="m12-identity"><span class="brand-symbol">${ico('layers')}</span><span>Sbewo</span></div><button class="m12-top-action" data-go="notifications" aria-label="Уведомления">${ico('bell')}</button></header>
 <section class="m12-greeting"><div class="m12-greeting-copy"><span class="m12-overline">${db.connected?'● Кью на связи':'○ Не подключено'}</span><h1>${db.connected?'Всё под контролем':'Привет! Я Кью 👋'}</h1><p>${db.connected?'Новые доступные события из твоих чатов появятся ниже.':'Подключи Sbewo, чтобы отслеживать новые удаления и правки.'}</p>${!db.connected?`<button class="m12-connect" data-go="connection">Подключить ${ico('chevron')}</button>`:''}</div>${kyu('home','m12-home-kyu')}</section>
 <div class="m12-heading"><h2>Обзор</h2><span class="m12-muted">По доступным событиям</span></div>
 <div class="m12-metrics"><button data-event-filter="deleted"><span class="m12-metric-icon delete">${ico('trash')}</span><strong>${deleted}</strong><small>Удалили</small></button><button data-event-filter="edited"><span class="m12-metric-icon edit">${ico('edit')}</span><strong>${edited}</strong><small>Изменили</small></button><button data-archive-filter="media"><span class="m12-metric-icon media">${ico('image')}</span><strong>${media}</strong><small>Медиа</small></button></div>
 <div class="m12-heading m12-recent-heading"><h2>Последние события</h2><button data-go="history">Все события ${ico('chevron')}</button></div>
 ${recent.length?`<div class="m12-event-list">${recent.map(item).join('')}</div>`:`<div class="m12-empty-inline">${kyu('empty')}<div><strong>Пока ничего нового</strong><p>${db.connected?'Когда появятся доступные изменения, Кью покажет их здесь.':'После подключения здесь будут события.'}</p></div></div>`}
 ${!initData?`<button class="demo-link" data-demo="1">${ico('star')} Открыть демонстрационные данные</button>`:''}
 </section>`;
}

function history(){
 let xs=records();if(flt==='deleted')xs=xs.filter(x=>x.deleted);if(flt==='edited')xs=xs.filter(x=>x.edited);if(flt==='media')xs=xs.filter(x=>x.kind&&x.kind!=='text');
 if(query)xs=xs.filter(x=>(x.chat+' '+(x.text||'')).toLowerCase().includes(query.toLowerCase()));
 return `${chips([['all','Все'],['deleted','Удалили'],['edited','Изменили'],['media','Медиа']],flt)}${searchBox('Поиск по сообщениям и чатам')}
 <div class="m12-list-heading"><span>${xs.length} событий</span><button data-refresh="1" aria-label="Обновить">${ico('refresh')}</button></div>
 ${xs.length?`<div class="m12-event-list">${xs.map(item).join('')}</div>`:noData('empty','Здесь пока пусто','Новые доступные события появятся после подключения.')}`;
}

let servicesMode='events'; // Events and saved records share one bottom-navigation destination.
function services(){
 const events=servicesMode==='events';
 return `<section class="m12-services"><header class="m12-page-header"><div><h1>Сервисы</h1><p>История изменений и сохранённые записи</p></div></header>
 <div class="m12-service-tabs" role="tablist" aria-label="Выбери раздел"><button role="tab" aria-selected="${events}" data-service-mode="events" class="${events?'active':''}">События</button><button role="tab" aria-selected="${!events}" data-service-mode="saved" class="${!events?'active':''}">Сохранено</button></div>
 <div class="m12-service-content">${events?history():archive()}</div></section>`;
}
function archive(){return `<div class="m12-archive">${chips([['all','Чаты'],['media','Медиа'],['star','Избранное']],flt)}
 ${searchBox(flt==='all'?'Поиск чата':'Поиск сохранённого')}
 ${flt==='media'?mediaList():flt==='star'?starList():chatList()}
 <p class="m12-archive-note">Сохраняются только данные, доступные подключённому боту. Сами медиафайлы пока не скачиваются.</p></div>`;}

function chatList(){let xs=connections().filter(([ch])=>s38ChatName(ch).toLowerCase().includes(query.toLowerCase()));return xs.length?xs.map(([name,items])=>`<button class="row-chat" data-chat="${esc(name)}">${avatar(name)}<span class="grow"><strong>${esc(name)}</strong><small>${items.length} сохранённых записей</small></span>${ico('chevron','chev')}</button>`).join(''):noData('archive','Архив пуст','Новые доступные сообщения появятся здесь.')}
function starList(){let xs=visible().filter(x=>x.starred&&[x.chat,x.text].join(' ').toLowerCase().includes(query.toLowerCase()));return xs.length?xs.map(item).join(''):noData('archive','Нет избранного','Отмечай важные сообщения звёздочкой в деталях.')}
function mediaList(){
 const xs=mediaRecords().filter(x=>mediaFilter==='all'||x.kind===mediaFilter).filter(x=>(x.chat+x.text).toLowerCase().includes(query.toLowerCase()));
 return `${chips([['all','Все'],['photo','Фото'],['video','Видео'],['voice','Голосовые']],mediaFilter,'media-filter')}<div class="page-caption">${xs.length?'Полученные события':'Сегодня'}</div>
 ${xs.length?`<div class="media-grid">${xs.map(x=>`<button class="media-tile" data-message="${esc(x.key)}"><span>${ico(x.kind==='voice'?'audio':x.kind==='video'?'video':'image')}</span><strong>${esc(x.chat)}</strong><small>${fmt(x.updated||x.time)}</small></button>`).join('')}</div>`:noData('media','Медиаархив пуст','Сами файлы пока не сохраняются — только сведения о вложениях.')}
 <p class="subtle-note">Сервер сейчас сохраняет только доступные сведения о медиа, не сами файлы.</p>`;
}

function media(){return `${header('Медиа')}${mediaList()}`;}

function chats(){return `${header('Чаты')}<h1 class="page-head">Чаты</h1>${searchBox('Найти чат')}${chatList()}`}
function chat(){const xs=visible().filter(x=>x.chat===selectedChat);return `${header('Чат')}<div class="detail-header">${avatar(selectedChat)}<span><strong>${esc(selectedChat)}</strong><small>${xs.length} сохранённых сообщений</small></span></div>${xs.length?xs.map(item).join(''):noData('archive','Пусто','Нет сохранённых сообщений.')}`}
function deleted(){const xs=visible().filter(x=>x.deleted);return `${header('Удалённые сообщения')}<div class="top-illustration"><h1>Удалённые</h1>${kyu('deleted')}</div>${xs.length?xs.map(item).join(''):noData('empty','Удалений пока нет','Показываем лишь тексты, которые бот получил до удаления.')}`}
function edited(){const xs=visible().filter(x=>x.edited);return `${header('Изменённые сообщения')}<div class="top-illustration"><h1>Изменённые</h1>${kyu('edited')}</div>${xs.length?xs.map(item).join(''):noData('empty','Нет изменений','Здесь появится доступная история правок.')}`}
function eventDetail(){
 const m=db.items.find(x=>String(x.key)===String(selectedKey));if(!m)return `${header('Что произошло')}${noData('empty','Событие недоступно','Запись не найдена.')}`;
 const rev=Array.isArray(m.versions)?m.versions:[];
 const before=m.edited&&rev.length>1?rev[0].text:m.text;
 const after=m.edited&&rev.length>1?rev[rev.length-1].text:m.text;
 return `${header('Что произошло')}<h2 class="detail-section-name">Событие</h2><div class="person-card">${avatar(m.sender||m.chat)}<span><strong>${esc(m.sender||m.chat)}</strong><small>${esc(m.chat)} · ${fmt(m.updated||m.time)}</small></span></div>
 <div class="detail-event-label">${ico(m.deleted?'trash':m.edited?'edit':'image')} ${m.deleted?'Удалённое сообщение':m.edited?'Изменённое сообщение':'Запись о медиа'}</div>
 <div class="version-card"><small>${m.edited?'1-я версия':'Доступный текст'}</small><p>${esc(before||'Текст недоступен')}</p></div>
 ${m.edited&&rev.length>1?`<div class="version-arrow">↓</div><div class="version-card current"><small>${rev.length}-я версия (текущая)</small><p>${esc(after||'Текст недоступен')}</p></div>`:''}
 <div class="detail-tools">${m.edited?`<button class="secondary" data-go="revision">${ico('history')} История правок</button>`:''}<button class="secondary" data-go="star-action">${ico('star')} ${m.starred?'Из избранного':'В избранное'}</button><button class="secondary" data-go="note-action">${ico('note')} Заметка</button></div>`;
}

function revision(){
 const m=db.items.find(x=>String(x.key)===String(selectedKey));if(!m)return `${header('История правок')}${noData('empty','Нет сообщения','')}`;
 const rev=Array.isArray(m.versions)?m.versions:[];
 return `${header('История правок')}<div class="person-card">${avatar(m.chat)}<span><strong>${esc(m.chat)}</strong><small>Сохранено версий: ${rev.length}</small></span></div>
 ${rev.length?`<div class="revision-list">${rev.map((v,i)=>`<div class="revision ${i===rev.length-1?'current':''}"><div class="revision-heading"><strong>${i+1}-я версия ${i===rev.length-1?'(текущая)':''}</strong><time>${fmt(v.time)}</time></div><p>${esc(v.text||'Текст недоступен')}</p></div>`).join('')}</div>`:noData('edited','Истории правок пока нет','Мы показываем только действительно сохранённые версии.')}`;
}

function groups(){
 return `${header('Группы')}<section class="compact-hero"><div><h1>Группы</h1><p>Мониторинг в группах,<br>где вы админ.</p></div>${kyu('groups')}</section>
 ${noData('empty','Подключённых групп нет','Мониторинг групп ещё не подключён. Для этого необходим отдельный серверный обработчик и права бота.')}`;
}

function connection(){return `${header('Подключение')}<div class="top-illustration"><h1>Подключить Sbewo</h1>${kyu('settings')}</div><div class="card group-card">${row('person','Личные чаты','Подключённый Telegram Business бот','help')}${row('group','Группы','Недоступно в этой версии','groups')}</div><div class="notice">Мы не просим номер, код подтверждения и пароль. Telegram передаёт только новые события из чатов, к которым ты разрешишь боту доступ.</div><div class="card" style="padding:15px;font-size:12px;line-height:1.8"><strong>Как подключить:</strong><br>1. Открой Telegram → Настройки → Telegram для бизнеса → Чат-боты.<br>2. Выбери бота Sbewo и разреши доступ к нужным чатам.<br>3. Вернись сюда и проверь подключение.<br><span style="font-size:10px;color:var(--muted)">Доступность функции зависит от аккаунта Telegram.</span></div>${USERNAME?`<button class="secondary" style="width:100%;margin:12px 0" data-bot="1">Открыть @${esc(USERNAME)}</button>`:''}<button class="primary" style="margin-top:12px" data-refresh="1">${ico('refresh')} Проверить подключение</button><div class="empty-meta">${db.connected?`Подключено: ${db.connections}`:'Пока нет активного подключения'}</div>`}
const setting=(icon,title,target,sub='',color='')=>row(icon,title,sub,target,color);
function settings(){const count=db.items.length;return `<section class="m12-profile">
 <header class="m12-page-header"><h1>Профиль</h1><p>Управление Sbewo и твоими данными</p></header>
 <button class="m12-connection" data-go="connection"><span class="m12-state-dot ${db.connected?'online':''}"></span><span><strong>${db.connected?'Sbewo подключён':'Подключение к Telegram'}</strong><small>${db.connected?'Кью получает разрешённые события':'Подключи бота для отслеживания событий'}</small></span>${ico('chevron','chev')}</button>
 <h2 class="m12-group-title">Управление</h2><div class="m12-settings-group">${setting('bell','Уведомления','notifications','Удаления и изменения')}${setting('filter','Скрытые чаты','filters','Настроить отображение')}${setting('archive','Хранилище','storage',`${count} записей · ${db.retention_days} дней`)}</div>
 <h2 class="m12-group-title">Информация</h2><div class="m12-settings-group">${setting('lock','Безопасность и данные','privacy','Что получает бот')}${setting('help','Помощь','help','Частые вопросы')}${setting('info','О приложении','about','Sbewo Mini App')}</div>
 <button class="m12-theme" data-go="toggle-theme">${ico('settings')} ${theme==='dark'?'Включить светлую тему':'Включить тёмную тему'} ${ico('chevron')}</button>
 <button class="m12-pro-link" data-go="pro">${ico('crown')}<span><strong>Sbewo Pro</strong><small>Возможности в разработке</small></span>${ico('chevron')}</button>
 </section>`;}

function s102NotificationIcon(icon){
 const k=icon==='trash'?'trash':icon==='edit'?'edit':icon==='group'?'group':'person';
 return ico(k);
}
function s102NotificationRow(key,icon,label,description,tone){
 const active=!!notify[key];
 return `<div class="s102-notify-row"><span class="s102-iconbox s102-iconbox--${tone}" aria-hidden="true">${s102NotificationIcon(icon)}</span><span class="s102-notify-copy"><strong>${esc(label)}</strong><small>${esc(description)}</small></span><button class="s102-switch ${active?'active':''}" type="button" data-notify="${key}" role="switch" aria-checked="${active}" aria-label="${esc(label)}"><span class="s102-knob" aria-hidden="true"></span></button></div>`;
}
function notifications(){
 const others=[
  ['delete','trash','Удалённые сообщения','Когда собеседник удаляет сообщения','blue'],
  ['edit','edit','Изменённые сообщения','Когда собеседник редактирует сообщения','violet'],
  ['group','group','Сообщения в группах','Новые, изменённые и удалённые сообщения в группах','cyan']
 ];
 const own=[
  ['own_delete','trash','Мои удаления','Когда ты удаляешь сообщения','rose'],
  ['own_edit','edit','Мои изменения','Когда ты редактируешь сообщения','amber']
 ];
 const group=(title,icon,items)=>`<section class="s102-group"><h2 class="s102-group-title">${ico(icon)}<span>${esc(title)}</span></h2><div class="s102-notify-list">${items.map(a=>s102NotificationRow(...a)).join('')}</div></section>`;
 return `<section class="s102-notifications-page"><div class="s102-heading"><h1>Выбирай, что получать</h1><p>Настрой уведомления под себя</p></div>${group('Действия собеседников','group',others)}${group('Мои действия','person',own)}<div class="s102-notify-note"><span class="s102-notify-note-icon">${ico('info')}</span><span>Уведомления приходят в личный чат с ботом только после команды /start. Они не включаются автоматически.${notify.bot_started?' Бот уже запущен.':''}</span></div>${USERNAME?`<button class="s102-open-bot" data-bot="1">${ico('send')}<span>Открыть @${esc(USERNAME)}</span></button>`:''}</section>`;
}
function filters(){const chats=[...new Set(db.items.map(x=>x.chat))].sort();return `${header('Фильтры')}<div class="top-illustration"><h1>Скрытые чаты</h1>${kyu('settings')}</div><div class="notice">Выбранные чаты скрываются только на этом устройстве. Запись на сервере продолжается. Для прекращения сбора данных отмени доступ к этим чатам в Telegram Business.</div>${chats.length?chats.map(name=>`<button class="link-row" data-exclude="${esc(name)}"><span class="bubble">${ico(excludedChats.includes(name)?'lock':'person')}</span><span class="grow"><strong>${esc(name)}</strong><small>${excludedChats.includes(name)?'Скрыт':'Отображается'}</small></span><span class="filter-mark">${excludedChats.includes(name)?'Показать':'Скрыть'}</span></button>`).join(''):noData('empty','Пока нет чатов','Чаты появятся после получения сообщений.')}`;}
function storage(){return `${header('Хранилище')}<div class="top-illustration"><h1>Хранилище</h1>${kyu('archive')}</div><div class="card group-card">${row('archive','Записей',String(db.items.length),'chats')}${row('history','Срок хранения',`${db.retention_days} дней (серверный лимит)`,'privacy')}</div><button class="secondary" style="width:100%;color:#e05269" data-clear="1">Удалить мой архив</button><div class="notice warn">Очистка необратима. Подключение Telegram Business при этом остаётся активным, пока его не отключить в Telegram.</div>`}
function privacy(){return `${header('Безопасность и данные')}<div class="top-illustration"><h1>Твои данные</h1>${kyu('settings')}</div><div class="card" style="padding:16px;line-height:1.7;font-size:12px">Sbewo проверяет подпись данных Telegram Mini App. Доступные тексты сообщений и заметки хранятся в базе в зашифрованном виде. История событий ограничена разрешениями подключённого бота. Сохранённые записи можно очистить в настройках.</div><div class="notice">До подключения бот не знает ранее удалённые сообщения. Фото и видео пока не скачиваются. Для максимальной конфиденциальности ограничь доступ бота нужными чатами.</div>`}
function pro(){
 const plans=[
  {id:'1m',period:'1 месяц',price:'299 ₽',per:'299 ₽ / месяц',save:'',benefit:''},
  {id:'6m',period:'6 месяцев',price:'1 190 ₽',per:'198 ₽ / месяц',save:'Экономия 34%',benefit:''},
  {id:'12m',period:'12 месяцев',price:'1 790 ₽',per:'149 ₽ / месяц',save:'Экономия 50%',benefit:'Максимальная выгода'}
 ];
 const chosen=plans.find(p=>p.id===s51Plan)||plans[2];
 const features=[
  ['trash','Удалённые сообщения'],['edit','История правок'],
  ['image','Фото, стикеры и файлы'],['layers','Архив событий'],
  ['bell','Уведомления'],['send','Экспорт истории чата']
 ];
 const groupMode=s91TariffMode==='groups';
 return `${s13Header()}<section class="s91-pricing-page" aria-label="Тарифы и подписка">
 <div class="s91-plan-switch" role="tablist" aria-label="Вид подписки">
  <button type="button" role="tab" aria-selected="${!groupMode}" data-s91-mode="personal" class="${!groupMode?'active':''}">${ico('person')} Личный</button>
  <button type="button" role="tab" aria-selected="${groupMode}" data-s91-mode="groups" class="${groupMode?'active':''}">${ico('group')} Группы</button>
 </div>
 ${groupMode?`<div class="s91-groups-placeholder"><img src="./kyu-pricing-peek.png" alt="Кью ждёт групповые тарифы"/><h2>Тарифы для групп скоро появятся</h2><p>Мониторинг групп пока в разработке. Подписку для личных чатов можно выбрать на соседней вкладке.</p><button type="button" data-s91-mode="personal">Посмотреть личные тарифы</button></div>`:`
 <div class="s91-pricing-columns">
  <div class="s91-plan-column" role="radiogroup" aria-label="Период подписки">
   ${plans.map(plan=>`<button type="button" role="radio" aria-checked="${plan.id===s51Plan}" class="s91-plan ${plan.id===s51Plan?'selected':''}" data-s51-plan="${plan.id}">${plan.benefit?`<span class="s91-benefit">${ico('crown')} ${plan.benefit}</span>`:''}<span class="s91-plan-title">${plan.period}</span><strong>${plan.price}</strong><span class="s91-per">${plan.per}</span>${plan.save?`<span class="s91-save">${plan.save}</span>`:''}<span class="s91-plan-radio">${plan.id===s51Plan?ico('check'):''}</span></button>`).join('')}
  </div>
  <div class="s91-feature-column"><h2>Что входит<br>в подписку?</h2><div class="s91-peek"><img src="./kyu-pricing-peek.png" alt="Кью — маскот Sbewo" loading="eager" decoding="async"/></div><div class="s91-feature-list">${features.map(([icon,label])=>`<div class="s91-feature"><span class="s91-feature-icon">${ico(icon)}</span><span class="s91-feature-name">${label}</span><span class="s91-feature-check">${ico('check')}</span></div>`).join('')}</div></div>
 </div>
 <button type="button" class="s91-checkout" data-s51-checkout="1"><span>Подключить за ${chosen.price}</span><span class="s91-checkout-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 12h16m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button>
 <p class="s91-payment-note">${ico('shield')} Безопасная оплата через Telegram</p>
 <p class="s91-setup-note">Оплата пока не подключена. Выбор тарифа доступен для предварительного просмотра.</p>
 `}</section>`;
}
const faqs=[['Как работает Sbewo?','Бот получает разрешённые новые Telegram Business события и сохраняет информацию в личный архив.'],['Можно увидеть старые удаления?','Нет. Доступны лишь события после подключения и только если бот получал исходное сообщение.'],['Что сохраняется?','Доступные тексты новых сообщений, события редактирования и удаления, типы вложений и заметки. Сами медиафайлы пока не скачиваются.'],['Нужно входить в аккаунт?','Нет, номер, пароль и код Telegram не требуются.'],['Работает ли в группах?','Пока нет: нужен отдельный режим с учётом ограничений Bot API и прав бота.'],['Как удалить данные?','Настройки → Хранилище → Удалить мой архив. Для прекращения получения событий также отключи бота в Telegram Business.']];
let faqOpen=-1;function help(){return `${header('Помощь')}<section class="compact-hero"><h1>Помощь</h1>${kyu('help')}</section><div class="faq-stack">${faqs.map(([q,a],i)=>`<button type="button" class="faq" aria-expanded="${faqOpen===i}" data-faq="${i}"><span>${ico(['info','image','shield','lock','group','help'][i]||'help')}</span><strong>${esc(q)}</strong>${ico('chevron')}${faqOpen===i?`<p>${esc(a)}</p>`:''}</button>`).join('')}</div>`;}

function about(){return `${header('О приложении')}<div class="intro" style="height:auto;min-height:380px;border-radius:20px"><span class="mark" style="width:52px;height:52px;border-radius:13px">${ico('layers')}</span><h1>Sbewo</h1>${kyu('welcome','')}<p>Личный архив доступных событий Telegram.</p><p>Версия 1.0 · Новый проект</p></div>`}
function render(){let html={welcome,intro2:welcome,intro3:welcome,home,services,history,archive,media,chats,chat,deleted,edited,eventdetail:eventDetail,revision,groups,connection,settings,notifications,filters,storage,privacy,pro,help,about}[page];if(!html){page='home';html=home}let intro=isIntro();let root=$('#app');root.className=`app ${intro?'onboarding':''} ${theme==='dark'?'theme-dark':''}`;root.innerHTML=`<main id="main" class="main">${!intro&&error?`<div class="error-msg" role="alert">${esc(error)}</div>`:''}${!intro&&demo?'<div class="empty-meta">ДЕМО-РЕЖИМ · вымышленные примеры</div>':''}${!intro?'<div id="api-state"></div>':''}${html()}</main>${intro||['eventdetail','revision','help','connection','deleted','edited','chat','chats','filters','storage','privacy','about'].includes(page)?'':tabbar()}`;bind();try{tg?.BackButton?.[intro||isMain()?'hide':'show']()}catch{}}
async function call(endpoint,payload={}){if(!API)throw Error('Бэкенд ещё не подключён: добавь URL Render в config.js');if(!initData)throw Error('Для настоящих данных открой Mini App внутри Telegram');let res=await fetch(`${API}${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({init_data:initData,...payload})});if(!res.ok){let txt='Сервер недоступен';try{txt=(await res.json()).detail||txt}catch{}throw Error(String(txt))}return res.json()}
async function refresh(){if(demo)return;busy=true;try{const payload=await call('/api/overview');db={...db,...payload};notify=payload.notifications||notify;error=''}catch(e){error=e.message}finally{busy=false;render()}}
function goto(to){
 if(to==='history'||to==='deleted'||to==='edited'){
   servicesMode='events';
   if(to!=='history')flt=to==='deleted'?'deleted':'edited';
   to='services';
 }else if(to==='archive'||to==='media'||to==='chats'){
   servicesMode='saved';
   if(to==='media')flt='media';else if(to==='chats')flt='all';
   to='services';
 }
 if(to==='intro2'||to==='intro3')to='welcome';if(to==='star-action'){starAction();return}if(to==='note-action'){noteAction();return}if(to==='toggle-theme'){theme=theme==='dark'?'light':'dark';pref('sbewo-v5-theme',theme);render();return}if(isIntro()&&to==='connection'){pref('sbewo-v8-onboarded','yes');pref('sbewo-v6-onboarded','yes');}previous=page;page=to;query='';if(to!=='services')flt='all';mediaFilter='all';render();$('#main').scrollTop=0;if(to==='home'&&!demo&&initData&&!db.connected)refresh()}
function back(){if(page==='eventdetail')goto(['services','chat','home'].includes(previous)?previous:'services');else if(page==='revision')goto('eventdetail');else if(page==='chat'){servicesMode='saved';goto('services');}else if(page==='connection'&&isIntro(previous))goto('home');else goto(parent())}
function bind(){document.querySelectorAll('[data-service-mode]').forEach(el=>el.onclick=()=>{servicesMode=el.dataset.serviceMode;flt='all';query='';render()});document.querySelectorAll('[data-event-filter]').forEach(el=>el.onclick=()=>{servicesMode='events';goto('services');flt=el.dataset.eventFilter;render()});document.querySelectorAll('[data-archive-filter]').forEach(el=>el.onclick=()=>{servicesMode='saved';goto('services');flt=el.dataset.archiveFilter;render()});document.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>{if(el.dataset.go==='services'&&page!=='services')flt='all';goto(el.dataset.go)});document.querySelectorAll('[data-back]').forEach(el=>el.onclick=back);document.querySelectorAll('[data-flt]').forEach(el=>el.onclick=()=>{flt=el.dataset.flt;render()});document.querySelectorAll('[data-media-filter]').forEach(el=>el.onclick=()=>{mediaFilter=el.dataset.mediaFilter;render()});document.querySelectorAll('[data-message]').forEach(el=>el.onclick=()=>{selectedKey=el.dataset.message;goto('eventdetail')});document.querySelectorAll('[data-chat]').forEach(el=>el.onclick=()=>{selectedChat=el.dataset.chat;goto('chat')});const inp=$('#search');if(inp)inp.oninput=ev=>{const pos=ev.target.selectionStart;query=ev.target.value;render();const field=$('#search');field?.focus();try{field?.setSelectionRange(pos,pos)}catch{}};document.querySelectorAll('[data-faq]').forEach(el=>el.onclick=()=>{faqOpen=faqOpen===Number(el.dataset.faq)?-1:Number(el.dataset.faq);render()});const demoBtn=$('[data-demo]');if(demoBtn)demoBtn.onclick=demoStart;const reload=$('[data-refresh]');if(reload)reload.onclick=refresh;const clear=$('[data-clear]');if(clear)clear.onclick=async()=>{if(!confirm('Удалить ВСЕ сохранённые записи?'))return;try{if(!demo)await call('/api/clear');db.items=[];error='';render()}catch(e){error=e.message;render()}};document.querySelectorAll('[data-exclude]').forEach(el=>el.onclick=()=>{const name=el.dataset.exclude;excludedChats=excludedChats.includes(name)?excludedChats.filter(x=>x!==name):[...excludedChats,name];pref('sbewo-hidden-chats',JSON.stringify(excludedChats));render()});document.querySelectorAll('[data-notify]').forEach(el=>el.onclick=async()=>{if(el.disabled)return;el.disabled=true;el.setAttribute('aria-busy','true');const key=el.dataset.notify;const next={...notify,[key]:!notify[key]};try{if(!demo){const saved=await call('/api/notifications',{notify_delete:next.delete,notify_edit:next.edit,notify_group:next.group,notify_own_delete:next.own_delete,notify_own_edit:next.own_edit});notify=saved}else notify=next;error=''}catch(e){error=e.message}render()});const bot=$('[data-bot]');if(bot)bot.onclick=()=>{const url=`https://t.me/${USERNAME}`;try{tg?.openTelegramLink?.(url)}catch{location.href=url}}}
async function starAction(){const m=db.items.find(x=>String(x.key)===String(selectedKey));if(!m)return;try{if(!demo){let result=await call('/api/star',{message_key:m.key});m.starred=result.starred}else m.starred=!m.starred;error='';render()}catch(e){error=e.message;render()}}
async function noteAction(){const m=db.items.find(x=>String(x.key)===String(selectedKey));if(!m)return;const val=prompt('Заметка к сообщению',m.note||'');if(val===null)return;try{if(!demo)await call('/api/note',{message_key:m.key,note:val.slice(0,600)});m.note=val.slice(0,600);error='';render()}catch(e){error=e.message;render()}}
function demoStart(){pref('sbewo-v8-onboarded','yes');demo=true;notify={delete:false,edit:false,bot_started:true};db={...db,connected:true,connections:1,items:demoMessages.map(m=>({...m}))};error='';page='home';render()}
// Explicit demo only; it is NEVER enabled automatically in Telegram.
window.SbewoDev={demo:demoStart,resetIntro:()=>{pref('sbewo-v6-onboarded','no');pref('sbewo-v8-onboarded','no');page='welcome';render()},goto};
try{tg?.BackButton?.onClick(()=>back())}catch{}
/* Sbewo Telegram Blue 13.0: original 27-state navigation. Uses existing server API and mascot assets. */
let s13Step=0, s13Accepted=false, s13Scope='personal', s13ArchiveTab='chats', s13ChatTab='messages', s13EventScope='personal', s13Return='home', s13Confirm=false;
const s13Main=new Set(['home','chats','settings']);
const s13Icon=(name)=>ico(name);
const s13Btn=(label,route,extra='')=>`<button class="s13-btn ${extra}" data-go="${route}">${label}</button>`;
const s13White=(title,body,cls='')=>`<section class="s13-panel ${cls}">${title?`<h2>${title}</h2>`:''}${body}</section>`;
// Telegram already provides the native top bar. No duplicate in-app header.
const s13Header=()=>'';
const s16NavIcon=ic=>({
 'ri-home-5-line':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><path d="M2.8 10.3 12 2.6l9.2 7.7v10.6H2.8V10.3Z"/><path d="M9.1 20.9v-8.2h5.8v8.2"/></svg>',
 'ri-archive-line':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.4" y="4.5" width="17.2" height="4.6" rx="1"/><path d="M5.3 9.3v10h13.4v-10M10 13.8h4"/></svg>',
'ri-team-line':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  'ri-chat-3-line':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 11.4c0 4.7-3.9 8.3-8.8 8.3-1.6 0-3.2-.4-4.5-1.2l-4.4 1 1.2-4a7.9 7.9 0 0 1-1.1-4.1c0-4.6 3.9-8.3 8.8-8.3s8.8 3.7 8.8 8.3Z"/></svg>'
}[ic]||'');
const s13Bottom=()=>`<nav class="s13-bottom s21-bottom" aria-label="Разделы">${[['home','Главная','ri-home-5-line'],['chats','Чаты','ri-team-line'],['settings','Настройки','ri-settings-4-line']].map(([p,t,ic])=>`<button type="button" class="${page===p?'active':''}" data-go="${p}" aria-label="${t}" ${page===p?'aria-current="page"':''}><i class="${ic}" aria-hidden="true">${ic==='ri-settings-4-line'?ico('settings'):s16NavIcon(ic)}</i><span>${t}</span></button>`).join('')}</nav>`;
const s13Face=(key='welcome',klass='')=>kyu(key,`s13-kyu ${klass}`);
const s13Empty=(title,detail,img='empty',action='')=>`<div class="s13-empty">${s13Face(img)}<h2>${title}</h2><p>${detail}</p>${action}</div>`;
const s84GroupsEmpty=()=>`<section class="s84-groups-empty" aria-label="Группы скоро появятся">${s13Face('empty','s84-groups-mascot')}<h2>Пока нет групп</h2><p>Скоро здесь появится поддержка групп.<br>Следи за обновлениями Sbewo!</p></section>`;
const s13ScopeGlyph=type=>type==='groups'?s13Icon('group'):type==='personal'?s13Icon('person'):'';
const s13Tab=(arr,active,attr)=>`<div class="s13-segment" role="group" aria-label="Выбор раздела">${arr.map(([v,t,iconKey])=>`<button type="button" aria-pressed="${active===v}" class="${active===v?'active':''}${iconKey?' has-ic':''}" data-${attr}="${v}">${iconKey?`<span class="s13-tab-label"><span class="s13-tab-ic" aria-hidden="true">${s13ScopeGlyph(iconKey)}</span><span>${t}</span></span>`:t}</button>`).join('')}</div>`;
const s13ListRow=(ic,title,sub,route,extra='')=>`<button class="s13-list-row" data-go="${route}"><span class="s13-row-ic">${s13Icon(ic)}</span><span class="s13-row-copy"><strong>${title}</strong>${sub?`<small>${sub}</small>`:''}</span>${extra||s13Icon('chevron')}</button>`;
const s13Human=(chat)=>cleanName(chat||'Чат без названия');
const s13Time=(m)=>fmt(m.updated||m.time);

let s19NoteEditor=false;let s19MediaPreview=null;let s19MediaError='';let s19ChatAvatars={};let s19ChatQuery='';let s19ChatFilter='all';let s19ChatView='events';let s19FullArchive=false;let s19AvatarLoading=false;
const s19Kinds={photo:'Фото',video:'Видео',voice:'Голосовое',video_note:'Кружок',animation:'GIF',audio:'Аудио',document:'Файл',sticker:'Стикер',text:'Сообщение'};
function s19ChatAvatar(key,items=[]){const name=s38ChatName(key,items);const id=items.find(x=>x.chat_id)?.chat_id||(String(key).startsWith("id:")?String(key).slice(3):null);const src=id&&s19ChatAvatars[String(id)];return src?`<span class="s19-avatar-wrap"><img class="s19-avatar" alt="" src="${src}" onerror="this.hidden=true;this.nextElementSibling.hidden=false" /><span hidden>${avatar(name)}</span></span>`:avatar(name);}
let s41AvatarLastCheck=0;
// Reload photos from Telegram, including contacts who acquired a profile picture after
// their chat was first archived. The server limits each request to 12 chat IDs.
async function s19LoadAvatars(force=false){
 if(demo||s19AvatarLoading||!initData||!API)return;
 const now=Date.now();
 if(now-s41AvatarLastCheck<(force?20000:60000))return;
 const recent=[...db.items].sort((a,b)=>Number(b.updated||b.time||0)-Number(a.updated||a.time||0));
 const ids=[...new Set(recent.map(x=>Number(x.chat_id)).filter(x=>Number.isSafeInteger(x)&&x>0))].slice(0,48);
 if(!ids.length)return;
 s19AvatarLoading=true;
 s41AvatarLastCheck=now;
 try{
  const next={};
  // Check all recent chats, not just the first 12 returned by the archive.
  for(let i=0;i<ids.length;i+=12){
   const data=await call('/api/chat-avatars',{chat_ids:ids.slice(i,i+12)});
   Object.assign(next,data.avatars||{});
  }
  const changed=JSON.stringify(next)!==JSON.stringify(s19ChatAvatars);
  s19ChatAvatars=next;
  if(changed&&['chats','chat'].includes(page))render();
 }catch(e){console.debug('Avatar refresh unavailable',e)}
 finally{s19AvatarLoading=false}
}
const s19EventOnly=m=>m.deleted||m.edited||m.rescued_once;
function s19ChatCard(name,items){const changed=items.filter(s19EventOnly),last=changed[0]||items[0];return `<button class="s19-chat-card" data-chat="${esc(name)}">${s19ChatAvatar(name,items)}<span class="s19-chat-info"><strong>${esc(s13Human(s38ChatName(name,items)))}</strong><small>${changed.length} событий · ${last?.deleted?'Удаление':last?.edited?'Правка':last?.rescued_once?'Сохранено фото':'Архив'}</small><em>${esc((last?.text||s19Kinds[last?.kind]||'').slice(0,65))}</em></span>${s13Icon('chevron')}</button>`;}
function s19ChatEvent(m){const original=m.versions?.[0]?.text||'',changed=m.versions?.at(-1)?.text||m.text||'';let desc=m.deleted?m.text||s19Kinds[m.kind]||'Удалённое сообщение':m.rescued_once?'Медиа сохранено после ответа':original&&original!==changed?original+' → '+changed:changed;return `<button class="s19-event-card" data-message="${esc(m.key)}"><span class="s19-event-icon ${m.deleted?'red':'blue'}">${ico(m.deleted?'trash':m.rescued_once?'image':'edit')}</span><span class="s19-event-body"><strong>${m.deleted?'Удалено':m.rescued_once?'Сохранено':'Изменено'} · ${esc(s19Kinds[m.kind]||'Сообщение')}</strong><small>${esc(desc||'Текст недоступен')}</small>${m.note?`<em>Заметка: ${esc(m.note)}</em>`:''}</span>${m.starred?`<span class="s19-star">★</span>`:''}<time>${fmt(m.updated||m.time)}</time></button>`;}

const s13Event=(m)=>{const isDeleted=!!m.deleted,ver=Array.isArray(m.versions)?m.versions:[],from=ver[0]?.text||'',to=ver.at(-1)?.text||m.text||'',title=s13Human(m.chat);return `<button class="s13-event" data-message="${esc(m.key)}"><span class="s13-event-time">${s13Time(m)}</span><span class="s13-event-main"><span class="s13-event-title">${esc(title)}</span><span class="s13-status ${isDeleted?'red':'blue'}">${isDeleted?'Удалено':m.rescued_once?'Сохранено':'Изменено'}</span><span class="s13-event-preview">${isDeleted?esc(m.text||s19Kinds[m.kind]||'Текст не сохранён'):m.rescued_once?'Фото сохранено после ответа':esc(from&&from!==to?from+' → '+to:to)}</span></span>${s13Icon('chevron')}</button>`;};
function s13Welcome(){
 const slides=[
 ['Добро пожаловать в Sbewo','Познакомься с Кью — помощником, который замечает доступные изменения в подключённых чатах.','welcome'],
 ['Что было удалено','Если бот успел получить сообщение, Кью покажет, что из него удалили.','deleted'],
 ['Что изменилось','Сравни сохранённые версии и узнай, что исправили.','edited'],
 ['Фото, голосовые и кружочки','Если ответить на неоткрытое исчезающее медиа, Sbewo попробует сохранить файл, если Telegram его передаст.','media'],
 ['Ты выбираешь чаты','Telegram Business позволяет управлять чатами, к которым получает доступ бот.','settings'],
 ['С чего начнём?','Подключи личные чаты, чтобы отслеживать новые события.','archive']
 ];
 const [title,detail,img]=slides[s13Step];let foot='';
 if(s13Step===0) foot=`${s13White('',`<label class="s13-check"><input type="checkbox" id="accept-terms" ${s13Accepted?'checked':''}> <span>Я ознакомился с описанием доступа и обработки данных</span></label><button data-go="access" class="s13-inline-link">Подробнее об условиях доступа</button>`)}`;
 if(s13Step===5) foot=`<div class="s13-option-grid"><button data-action="start-personal" class="selected">${s13Icon('chat')} Личная переписка</button></div>`;
 return `${s13Header(s13Step===5?'close':'back')}<div class="s13-onboard"><div class="s13-progress">${slides.map((_,i)=>`<span class="${i<=s13Step?'active':''}"></span>`).join('')}</div><div class="s13-onboard-visual">${s13Face(img)}</div><h1>${title}</h1><p>${detail}</p>${foot}<div class="s13-onboard-actions"><button class="s13-btn" data-action="next-onboarding" ${s13Step===0&&!s13Accepted?'disabled':''}>${s13Step===5?'Перейти к подключению':'Далее'}</button><button class="s13-subtle" data-action="skip-onboarding">${s13Step===0?'Посмотреть приложение':'Позже'}</button></div></div>`;
}
function s98ProfileAvatarState(){
 // Exactly the same state as the status card, including temporary card previews.
 const state=s60CardState();
 const variants={
  paid:{tone:'paid',label:'Подписка активна',icon:ico('crown')},
  'trial-3':{tone:'trial-3',label:'Пробный период · 3 дня',icon:s65BadgeIcon('clock')},
  'trial-2':{tone:'trial-2',label:'Пробный период · осталось 2 дня',icon:s65BadgeIcon('clock')},
  'trial-1':{tone:'trial-1',label:'Пробный период · остался 1 день',icon:s65BadgeIcon('alert')},
  disconnected:{tone:'inactive',label:'Не подключён',icon:ico('lock')},
  expired:{tone:'expired',label:'Доступ закончился',icon:ico('lock')},
  unverified:{tone:'inactive',label:'Статус подписки не подтверждён',icon:ico('lock')}
 };
 return variants[state]||variants.unverified;
}
function s14ProfileBlock(){
 const u=tg?.initDataUnsafe?.user||{};
 const name=[u.first_name,u.last_name].filter(Boolean).join(' ')||'Мой профиль';
 const handle=u.username?'@'+u.username:'Аккаунт Telegram';
 const photo=typeof u.photo_url==='string'&&/^https:\/\//i.test(u.photo_url)?`<img class="s14-user-photo" src="${esc(u.photo_url)}" alt="Аватар Telegram" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden>${avatar(name)}</span>`:avatar(name);
 const status=s98ProfileAvatarState();
 return `<button class="s25-profile s98-status-profile" data-go="pro" aria-label="Профиль и настройки пользователя"><span class="s25-profile-identity"><span class="s98-avatar-ring s98-avatar-ring--${status.tone}" aria-label="${esc(status.label)}"><span class="s98-avatar-photo">${photo}</span><span class="s98-avatar-medal" aria-hidden="true">${status.icon}</span></span><span class="s14-profile-info"><strong>${esc(name)}</strong><small>${esc(handle)}</small></span></span><span class="s25-profile-arrow" aria-hidden="true">${s13Icon('chevron')}</span></button>`;
}
function s25Count(n,forms){const value=Math.max(0,Math.floor(Number(n)||0));const mod10=value%10,mod100=value%100;return `${value} ${mod10===1&&mod100!==11?forms[0]:mod10>=2&&mod10<=4&&(mod100<12||mod100>14)?forms[1]:forms[2]}`;}
function s60CardState(){
 if(s65PreviewState)return s65PreviewState;
 if(!db.connected)return 'disconnected';
 const access=db.access||{};
 if(access.status==='paid'&&access.paid_until)return 'paid';
 if(access.status==='trial'){
   const d=Number(access.days_left);
   if(d>=3)return 'trial-3';
   if(d===2)return 'trial-2';
   if(d===1)return 'trial-1';
 }
 if(access.status==='expired')return 'expired';
 return 'unverified';
}
function s60Date(value){
 if(!value)return '';
 const d=new Date(value);
 return Number.isFinite(d.getTime())?d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}):'';
}
function s65BadgeDot(kind='solid'){
 return `<span class="s65-dot s65-dot-${kind}" aria-hidden="true"></span>`;
}
function s65BadgeIcon(kind){
 const icons={
  gift:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9h16v11H4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 9v11M4 13h16M7.5 9c-1.5 0-2.5-.9-2.5-2.2C5 5.5 6 4.5 7.4 4.5 9.3 4.5 10.4 6.1 12 9M16.5 9c1.5 0 2.5-.9 2.5-2.2 0-1.3-1-2.3-2.4-2.3C14.7 4.5 13.6 6.1 12 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="2"/><path d="M12 7.5v5l3 1.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  alert:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8.2v4.7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M12 16.9h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="2"/></svg>'
 };
 return icons[kind]||'';
}
function s65PreviewPanel(){
 const options=[['disconnected','Не подключен'],['trial-3','3 дня'],['trial-2','2 дня'],['trial-1','1 день'],['paid','Подписка'],['expired','Закончился'],['','Авто']];
 return `<div class="s65-preview-panel"><div class="s65-preview-label">Тест карточек</div><div class="s65-preview-row">${options.map(([value,label])=>`<button class="${s65PreviewState===value?'active':''}" data-s65-preview="${value}">${label}</button>`).join('')}</div></div>`;
}
function s14HomeConnectCard(){
 const state=s60CardState();
 const a=db.access||{};
 const paidDate=s60Date(a.paid_until)||'20 янв 2027';
 const arrow='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 const configs={
  disconnected:{badge:'Не подключен',badgeHtml:s65BadgeDot('outline'),title:'Подключи Sbewo',desc:'Начни отслеживать<br>изменения и удалённые<br>сообщения в Telegram.',primary:'Подключить бесплатный период',pgo:'connect-personal',mascot:'./kyu-status-disconnected.png'},
  'trial-3':{badge:'Пробный период',badgeHtml:s65BadgeIcon('gift'),title:'3 дня работы',desc:'Бесплатный доступ ко всем<br>функциям Sbewo.',primary:'Подробнее',pgo:'pro',secondary:'Управление',sgo:'settings',mascot:'./kyu-status-trial-3.png'},
  'trial-2':{badge:'Осталось 2 дня',badgeHtml:s65BadgeIcon('clock'),title:'Осталось 2 дня',desc:'Твоё пробное использование<br>заканчивается. Успей<br>оформить подписку!',primary:'Продлить',pgo:'pro',secondary:'Управление',sgo:'settings',mascot:'./kyu-status-trial-2.png'},
  'trial-1':{badge:'Остался 1 день',badgeHtml:s65BadgeIcon('alert'),title:'Остался 1 день!',desc:'Пробный период заканчивается<br>завтра. Не потеряй доступ<br>к функциям Sbewo!',primary:'Продлить',pgo:'pro',secondary:'Управление',sgo:'settings',mascot:'./kyu-status-trial-1.png'},
  paid:{badge:'Подписка активна',badgeHtml:s65BadgeDot('green'),title:'Sbewo работает',desc:`Твоя подписка активна.<br>${a.auto_renew?'Следующий платёж':'Доступ до'}: <strong>${esc(paidDate)}</strong>`,html:true,primary:'Продлить',pgo:'pro',secondary:'Управление',sgo:'pro',mascot:'./kyu-status-paid.png'},
  expired:{badge:'Доступ закончился',badgeHtml:s65BadgeIcon('alert'),title:'Доступ закончился',desc:'Пробный период завершён.<br>Выбери тариф, чтобы снова<br>получить доступ к Sbewo.',primary:'Выбрать тариф',pgo:'pro',secondary:'Управление',sgo:'settings',mascot:'./kyu-status-expired.png'},
  unverified:{badge:'Подписка активна',badgeHtml:s65BadgeDot('green'),title:'Sbewo работает',desc:'Новые события из выбранных чатов<br>появятся здесь сразу после<br>изменений.',primary:'События',scroll:true,secondary:'Управление',sgo:'settings',mascot:'./kyu-status-paid.png'}
 };
 const c=configs[state]||configs.disconnected;
 const primaryAttr=c.scroll?'data-s37-scroll="events"':`data-go="${c.pgo}"`;
 const secondaryAttr=c.scrollSecondary?'data-s37-scroll="events"':`data-go="${c.sgo}"`;
 return `<section class="s65-card s65-card--${state}" aria-label="${esc(c.badge)}"><div class="s65-card-badge">${c.badgeHtml}<span>${esc(c.badge)}</span></div><div class="s65-card-copy"><h2>${esc(c.title)}</h2><p>${c.html?c.desc:c.desc}</p></div><div class="s65-card-mascot" aria-hidden="true"><img src="${c.mascot}" alt="" loading="eager" decoding="async"></div><div class="s65-card-actions ${c.secondary?'':'s65-card-actions-single'}"><button class="s65-card-primary" ${primaryAttr}>${esc(c.primary)} ${arrow}</button>${c.secondary?`<button class="s65-card-secondary" ${secondaryAttr}>${esc(c.secondary)}</button>`:''}</div></section>`;
}
// Group event cards by the actual event date (edited/deleted timestamp), not today's date.
// Use local calendar days: midnight boundaries must not be calculated in UTC.
const s39EventTimestamp=m=>Number(m.updated||m.time);
function s39EventDayKey(m){
 const t=s39EventTimestamp(m);
 if(!Number.isFinite(t)||t<=0)return 'unknown';
 const d=new Date(t*1000);
 if(Number.isNaN(d.getTime()))return 'unknown';
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function s39EventDateLabel(key){
 if(key==='unknown')return 'Дата неизвестна';
 const [year,month,day]=key.split('-').map(Number);
 const d=new Date(year,month-1,day);
 const today=new Date();
 const todayKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
 if(key===todayKey)return 'Сегодня';
 const yesterday=new Date(today.getFullYear(),today.getMonth(),today.getDate()-1);
 const yesterdayKey=`${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
 if(key===yesterdayKey)return 'Вчера';
 return d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',...(year!==today.getFullYear()?{year:'numeric'}:{})});
}
function s39DatedEvents(items,renderItem){
 let lastDay=null;
 return items.map(m=>{
  const day=s39EventDayKey(m);
  const heading=day!==lastDay?`<div class="s39-day-heading"><span class="s39-day-pill">${s13Icon('calendar')} ${s39EventDateLabel(day)}</span></div>`:'';
  lastDay=day;
  return heading+renderItem(m);
 }).join('');
}
// Telegram private chats have positive peer IDs; group/supergroup IDs are negative.
// Do not infer chat type from the display name: changing names must not move events.
const s40IsGroupEvent=m=>{
 const id=Number(m?.chat_id);
 if(m?.chat_id!=null&&String(m.chat_id).trim()&&Number.isSafeInteger(id)&&id!==0)return id<0;
 return false; // Legacy entries without peer ID are treated as private, not guessed by name.
};
function s13Home(){let xs=records().filter(m=>s13EventScope==='groups'?s40IsGroupEvent(m):!s40IsGroupEvent(m));if(flt==='deleted')xs=xs.filter(x=>x.deleted);if(flt==='edited')xs=xs.filter(x=>x.edited);return `<section class="s13-mainpage s14-home">${s14ProfileBlock()}${s14HomeConnectCard()}${s65PreviewPanel()}${s13Tab([['personal','Личные','personal'],['groups','Группы','groups']],s13EventScope,'s13-scope')}${xs.length?`<div class="s13-stack s14-event-stack">${s39DatedEvents(xs,s13Event)}</div>`:(s13EventScope==='groups'?s84GroupsEmpty():s13Empty('Пока тихо',db.connected?'Кью покажет здесь новые доступные удаления и правки.':'После подключения здесь появятся доступные события.','empty',db.connected?'':s13Btn('Подключить Sbewo','connect-personal')))}</section>`;}
function s13Archive(){return `${s13Header('close')}<section class="s13-mainpage s14-root-page"><div class="s14-compact-intro"><div><h2>Сохранённые переписки</h2><p>Ищи по чатам, медиа и избранному без лишних переходов.</p></div>${s13Face('archive')}</div>${s13Tab([['chats','Чаты'],['media','Медиа'],['favorites','Избранное']],s13ArchiveTab,'s13-archive')}<input id="search" class="s13-search" placeholder="Найти в архиве" value="${esc(query)}" />${s13ArchiveTab==='chats'?s13ChatList():s13ArchiveTab==='media'?mediaList():starList()}<p class="s13-footnote">Данные появляются после подключения. Полученные и сохранённые файлы можно открыть из карточки события.</p></section>`;}
function s13ChatList(){const xs=connections().filter(([name,items])=>s38ChatName(name,items).toLowerCase().includes(query.toLowerCase()));return xs.length?`<div class="s13-stack">${xs.map(([name,items])=>`<button class="s13-chat-row" data-chat="${esc(name)}">${avatar(s38ChatName(name,items))}<span><strong>${esc(s13Human(s38ChatName(name,items)))}</strong><small>${items.length} сохранённых записей</small></span>${s13Icon('chevron')}</button>`).join('')}</div>`:s13Empty('Архив пуст','Когда Sbewo получит разрешённые события, они появятся здесь.','archive');}
function s13Chats(){
 const grouped=connections().map(([name,items])=>[name,items.filter(x=>s19FullArchive||s19EventOnly(x))]).filter(([,items])=>items.length);
 const groups=s19ChatFilter==='groups';
 const filtered=grouped.filter(([name,items])=>
   items.some(x=>s40IsGroupEvent(x)===groups)
   &&(!s19ChatQuery||s38ChatName(name,items).toLowerCase().includes(s19ChatQuery.toLowerCase())
       ||items.some(x=>(x.text||'').toLowerCase().includes(s19ChatQuery.toLowerCase())))
 ).map(([name,items])=>[name,items.filter(x=>s40IsGroupEvent(x)===groups)]);
 return `<section class="s13-mainpage s19-page"><div class="s19-search"><span>${ico('search')}</span><input id="s19-chat-search" type="search" aria-label="Поиск переписки или сообщения" placeholder="Найти переписку или сообщение" value="${esc(s19ChatQuery)}" /></div><div class="s19-chips s60-conversation-tabs"><button type="button" aria-pressed="${!groups}" data-s19-filter="all" class="${!groups?'active':''}">${s13Icon('person')} Личные</button><button type="button" aria-pressed="${groups}" data-s19-filter="groups" class="${groups?'active':''}">${s13Icon('group')} Группы</button></div>${filtered.length?`<div class="s19-chat-list">${filtered.map(([name,items])=>s19ChatCard(name,items)).join('')}</div>`:groups?s84GroupsEmpty():s13Empty('Здесь пока тихо','Переписка появится после первого доступного удаления или изменения.','empty')}${groups?'':s19FullArchive?'<p class="s19-footnote">Полный архив включён. Обычные сообщения доступны в личных переписках.</p>':'<p class="s19-footnote">Показываем только события. Обычная переписка по умолчанию не попадает в архив.</p>'}</section>`;
}
let s82ConnectionCheck='';
function s13ConnectionPersonal(){return `${s13Header()}<section class="s13-detail-page"><div class="s13-centered-hero">${s13Face('welcome')}<h1>Подключить личные чаты</h1></div>${s13White('',`<div class="s13-numbered"><b>1</b>Открой Telegram → Настройки → Telegram Business</div><div class="s13-numbered"><b>2</b>Найди раздел «Чат-боты» и добавь Sbewo</div><div class="s13-numbered"><b>3</b>Выбери чаты, к которым бот получит доступ</div>`)}${USERNAME?`<button class="s13-btn" data-bot="1">Открыть @${esc(USERNAME)}</button>`:''}<button class="s13-btn" data-action="check-connection">Проверить подключение</button>${s82ConnectionCheck?`<p class="s13-footnote" role="status">${esc(s82ConnectionCheck)}</p>`:''}<p class="s13-footnote">Telegram Business может требовать соответствующую подписку. Подключение не даёт доступ к сообщениям до предоставления разрешений.</p></section>`;}
function s19FileSize(n){return Number(n)>=1048576?(Number(n)/1048576).toFixed(1)+' МБ':Math.max(1,Math.ceil(Number(n)/1024))+' КБ'}
// The edited-message detail opens directly on every revision (no intermediate detail card).
function s53DetailActions(m){return `<div class="s52-actions"><button class="s52-star ${m.starred?'is-starred':''}" data-go="star-action" aria-label="${m.starred?'Убрать из избранного':'Добавить в избранное'}" aria-pressed="${!!m.starred}" title="Избранное">${ico('star')}</button><button class="s52-note-button" data-go="note-action">${ico('note')} ${m.note?'Изменить заметку':'Добавить заметку'}</button></div>`;}
function s52EditedDetail(m){
 const chatKey=s38ChatKey(m);
 const name=s38ChatName(chatKey,[m]);
 const username=s49ChatHandle(chatKey,[m]);
 const source=Array.isArray(m.versions)?m.versions:[];
 const versions=source.filter(v=>v&&typeof v.text==='string');
 const timeline=versions.length?versions:[{text:m.text||'Текст версии недоступен',time:m.updated||m.time}];
 const rows=timeline.map((v,i)=>{
  const label=i===0&&timeline.length>1?'Было':'Стало';
  return `<div class="s52-revision"><time>${esc(fmt(v.time||m.time))}</time><div class="s52-revision-body"><strong>${label}</strong><p>${esc(v.text||'Пустое сообщение')}</p></div></div>`;
 }).join('');
 return `<section class="s13-detail-page s19-page s52-edited-detail">
  <div class="s19-chat-detailhead s52-profile">${s19ChatAvatar(chatKey,[m])}<div><h1>${esc(name)}</h1>${username?`<p class="s52-username">@${esc(username)}</p>`:''}<p class="s52-subline">История изменений сообщения</p></div></div>
  <div class="s52-history s56-edited-card" aria-label="Сохранённая история изменений"><div class="s56-status-head s56-edit-head"><span class="s56-status-icon">${ico('edit')}</span><div><strong>Сообщение изменено</strong><small>${esc(fmt(m.updated||m.time))}</small></div></div><div class="s56-history-rows">${rows}</div></div>
  ${s53DetailActions(m)}
  ${s19NoteEditor?`<div class="s19-note-editor"><label for="s19-note-input">Заметка к событию</label><textarea id="s19-note-input" maxlength="600" rows="3" placeholder="Например: важная правка">${esc(m.note||'')}</textarea><div><button data-s19-note-cancel="1">Отмена</button><button data-s19-note-save="1">Сохранить</button></div></div>`:m.note?`<div class="s19-saved-note"><strong>Моя заметка</strong><p>${esc(m.note)}</p></div>`:''}
  <button class="s19-open-chat s52-open-chat" data-s52-open-chat="1">Открыть чат ${ico('chevron')}</button>
 </section>`;
}
function s13EventDetail(){
 const m=db.items.find(x=>String(x.key)===String(selectedKey));
 if(!m)return `${s13Header()}${s13Empty('Событие не найдено','Возможно, запись была удалена.')}`;
 const deleted=!!m.deleted;
 if(!deleted&&m.edited)return s52EditedDetail(m);
 const chatKey=s38ChatKey(m),chatName=s38ChatName(chatKey,[m]),username=s49ChatHandle(chatKey,[m]);
 const content=m.text||(m.kind!=='text'?s19Kinds[m.kind]+(m.has_media?' · сохранено':' · файл недоступен'):'Текст не сохранён');
 return `<section class="s13-detail-page s19-page s56-deleted-detail">
 <div class="s19-chat-detailhead s56-profile">${s19ChatAvatar(chatKey,[m])}<div><h1>${esc(chatName)}</h1>${username?`<p class="s56-username">@${esc(username)}</p>`:''}<p class="s56-profile-subline">${deleted?'Удалённое сообщение':m.rescued_once?'Сохранённое медиа':'Сообщение'}</p></div></div>
 <div class="s56-deleted-card ${m.rescued_once&&!deleted?'s64-captured-card':''}"><div class="s56-status-head ${m.rescued_once&&!deleted?'s64-capture-head':'s56-delete-head'}"><span class="s56-status-icon">${ico(m.rescued_once&&!deleted?'image':'trash')}</span><div><strong>${deleted?'Сообщение удалено':m.rescued_once?'Медиа сохранено':'Сообщение'}</strong><small>${esc(fmt(m.updated||m.time))}</small></div></div>
 <div class="s56-saved-copy"><div class="s56-saved-label">${ico('archive')} <span>${deleted?'Сохранено до удаления':'Сохранено после ответа'}</span></div><p>${esc(content)}</p></div>
 <div class="s56-event-meta">${ico('history')} <span>Получено ${esc(fmt(m.time))} · ${deleted?'удалено':'сохранено'} ${esc(fmt(m.updated||m.time))}</span></div></div>
 ${m.kind!=='text'?`<div class="s19-media-area">${m.has_media?`${m.kind==='document'?`<p class="s19-document-info">${esc(m.file_name||'Документ')}${m.file_size!=null?` · ${s19FileSize(m.file_size)}`:''}</p>`:''}<button class="s19-media-button" data-s19-media="${esc(m.key)}">${ico('image')} ${m.kind==='sticker'?'Показать сохранённый стикер':m.kind==='photo'?'Показать сохранённое фото':m.kind==='document'?'Подготовить файл к скачиванию':'Открыть сохранённый файл'}</button>`:'<p class="s19-media-missing">Медиафайл недоступен: Telegram не передал файл или его размер превышает лимит.</p>'}${s19MediaError&&s19MediaPreview?.key===m.key?`<p class="s19-media-missing">${esc(s19MediaError)}</p>`:''}${s19MediaPreview?.key===String(m.key)&&s19MediaPreview.data?`<div class="s19-media-preview">${m.kind!=='document'&&s19MediaPreview.mime.startsWith('image/')?`<img src="${s19MediaPreview.data}" alt="Сохранённое изображение" />`:m.kind!=='document'&&s19MediaPreview.mime.startsWith('audio/')?`<audio controls src="${s19MediaPreview.data}"></audio>`:m.kind!=='document'&&s19MediaPreview.mime.startsWith('video/')?`<video controls playsinline src="${s19MediaPreview.data}"></video>`:`<button class="s19-media-button" data-s19-download="${esc(m.key)}">${ico('download')} Скачать ${m.kind==='document'?'документ':'файл'}</button>`}</div>`:''}</div>`:''}${s53DetailActions(m)}${s19NoteEditor?`<div class="s19-note-editor"><label for="s19-note-input">Заметка к событию</label><textarea id="s19-note-input" maxlength="600" rows="3" placeholder="Например: уточнить время встречи">${esc(m.note||'')}</textarea><div><button data-s19-note-cancel="1">Отмена</button><button data-s19-note-save="1">Сохранить</button></div></div>`:m.note?`<div class="s19-saved-note"><strong>Моя заметка</strong><p>${esc(m.note)}</p></div>`:''}<button class="s19-open-chat s56-open-chat" data-s52-open-chat="1">Открыть чат ${ico('chevron')}</button>
 </section>`;
}
function s13Revision(){const m=db.items.find(x=>String(x.key)===String(selectedKey));const vs=Array.isArray(m?.versions)?m.versions:[];return `${s13Header()}<section class="s13-detail-page"><h1>История правок</h1><div class="s13-person">${avatar(m?.chat||'Чат')}<div><strong>${esc(s13Human(m?.chat))}</strong><small>${vs.length} сохранённых версий</small></div></div>${vs.length?s13White('',`<div class="s13-timeline">${vs.map((v,i)=>`<div class="s13-timeline-item"><time>${fmt(v.time)}</time><div><span>${i===0&&vs.length>1?'Было':'Стало'}</span><p>${esc(v.text||'Текст недоступен')}</p></div></div>`).join('')}</div>`):s13Empty('Нет версий','История появится после сохранения правок.','edited')}${s13Btn('Открыть архив чата','chat')}</section>`;}
let s49ProfileUsernames={};let s49LoadingProfiles=new Set();
const s49ChatHandle=(key,items=[])=>{
 const id=String(key).startsWith('id:')?String(key).slice(3):String(items.find(x=>x.chat_id)?.chat_id||'');
 const recent=items.find(m=>typeof m.chat_username==='string'&&m.chat_username.trim());
 return String(s49ProfileUsernames[id]||recent?.chat_username||'').replace(/^@/,'').trim();
};
async function s49LoadChatUsername(){
 if(demo||!API||!initData||page!=='chat')return;
 const id=String(selectedChat).startsWith('id:')?Number(String(selectedChat).slice(3)):0;
 if(!Number.isSafeInteger(id)||id<=0||s49LoadingProfiles.has(id))return;
 s49LoadingProfiles.add(id);
 try{const data=await call('/api/chat-profile',{chat_id:id});
  if(data.username){const name=String(data.username).replace(/^@/,'');if(s49ProfileUsernames[id]!==name){s49ProfileUsernames[id]=name;if(page==='chat'&&String(selectedChat)===`id:${id}`)render();}}
 }catch(e){console.debug('Chat username not available',e)}finally{s49LoadingProfiles.delete(id)}
}
let s50FilterOpen=false, s50SavingArchive=false, s50Exporting=false;
const s50Filters=[['events','Все события','layers'],['deleted','Удалённые','trash'],['edited','Изменённые','edit'],['media','Медиафайлы','image'],['favorites','Избранное','star']];
function s13Chat(){
 const id=String(s19SelectedChatId());const full=!!s19FullArchive||(db.chat_full_archives||[]).map(String).includes(id);
 const all=s38ChatItems(selectedChat).filter(x=>full||s19EventOnly(x));
 const xs=all.filter(m=>s19ChatView==='favorites'?m.starred:s19ChatView==='media'?m.kind!=='text':s19ChatView==='edited'?m.edited:s19ChatView==='deleted'?m.deleted:true);
 const selected=s50Filters.find(x=>x[0]===s19ChatView)||s50Filters[0];
 return `<section class="s13-detail-page s19-page s50-chat-page">
 <div class="s19-chat-detailhead s50-chat-header">${s19ChatAvatar(selectedChat,all)}<div class="s49-chat-identity"><h1>${esc(s13Human(s38ChatName(selectedChat,all)))}</h1>${s49ChatHandle(selectedChat,all)?`<span class="s49-chat-username">@${esc(s49ChatHandle(selectedChat,all))}</span>`:''}<p>${all.length} сохранённых записей</p></div></div>
 <div class="s50-toolbar"><div class="s50-filter-zone"><button type="button" class="s50-filter-trigger" data-s50-filter-toggle="1" aria-expanded="${s50FilterOpen}">${ico('filter')} <span>${selected[1]}</span> ${ico('chevron')}</button>${s50FilterOpen?`<div class="s50-filter-menu" role="group" aria-label="Фильтр событий">${s50Filters.map(([v,t,ic])=>`<button type="button" aria-pressed="${s19ChatView===v}" data-s50-filter="${v}" class="${s19ChatView===v?'active':''}">${ico(ic)} ${t}${s19ChatView===v?ico('check'):''}</button>`).join('')}</div>`:''}</div><button class="s50-clear-btn" data-go="chat-clear">${ico('trash')} Очистить</button></div>
 <div class="s50-archive-control"><div class="s50-archive-description"><strong>Сохранять всю историю чата</strong><small>Новые сообщения и медиа — в пределах срока хранения.</small><small class="s61-history-hint"><span class="s61-history-hint-icon" aria-hidden="true">i</span><span class="s61-history-hint-text">Только с момента подключения Sbewo. Старую переписку не восстановить.</span></small></div><button type="button" role="switch" aria-checked="${full}" aria-label="Сохранять всю историю чата" class="s50-toggle ${full?'on':''}" data-s50-archive="1" ${s50SavingArchive||s19FullArchive?'disabled':''}><span></span></button></div>
 <button type="button" class="s50-export" data-s50-export="1" ${s50Exporting?'disabled':''}>${ico('download')} ${s50Exporting?'Подготавливаем архив…':'Скачать сохранённую историю'} </button>
 ${xs.length?`<div class="s19-events">${s39DatedEvents(xs,s19ChatEvent)}</div>`:s13Empty('Нет событий','Новые доступные записи появятся здесь.','empty')}</section>`;}
const s48ClearChoices=[
 ['all','layers','Все события','Удалить весь архив этого чата'],
 ['deleted','trash','Удалённые сообщения','Только события удаления'],
 ['edited','edit','Изменённые сообщения','Только события изменений'],
 ['media','image','Медиафайлы','Фото, видео, файлы и др.']
];
function s48ClearPage(){
 const count=s38ChatItems(selectedChat).length;
 return `<section class="s48-clean-page">
  <div class="s48-clean-hero"><img src="./kyu-trash.png" alt="Кью открывает мусорку"/><h1>Очистка архива</h1><p>Выберите, какие события удалить из архива.<br>Действие необратимо.</p></div>
  <div class="s48-clear-options">${s48ClearChoices.map(([id,ic,title,description])=>`<button type="button" class="s48-clear-choice ${s48ClearSelection.has(id)?'checked':''}" data-clear-choice="${id}" aria-pressed="${s48ClearSelection.has(id)}"><span class="s48-choice-icon ${id}">${ico(ic)}</span><span class="s48-choice-copy"><strong>${title}</strong><small>${description}</small></span><span class="s48-checkbox">${s48ClearSelection.has(id)?ico('check'):''}</span></button>`).join('')}</div>
  <button class="s48-clear-submit" type="button" data-clear-submit="1" ${!s48ClearSelection.size||!count||s48Clearing?'disabled':''}>${ico('trash')} ${s48Clearing?'Очищаем…':'Очистить архив'}</button>
  <p class="s48-clear-note">Удаляются только выбранные записи этого чата. Остальные переписки не затрагиваются.</p>
 </section>`;
}
function s19SelectedChatId(name=selectedChat){return String(name).startsWith('id:')?String(name).slice(3):(s38ChatItems(name)[0]?.chat_id||'');}
function s19CurrentAlias(name=selectedChat){const id=s19SelectedChatId(name);return id&&s19ChatAliasCache[String(id)]||'';}
let s19ChatAliasCache={};
let s48ClearSelection=new Set();let s48Clearing=false;
function s13ChatManage(){const count=s38ChatItems(selectedChat).length;return `${s13Header()}<section class="s13-detail-page"><div class="s13-centered-hero">${s13Face('settings')}<h1>${esc(s13Human(s38ChatName(selectedChat)))}</h1><p>${count} сохранённых записей</p></div>${s13White('',s13ListRow('bell','Уведомления','Общие настройки событий','notifications')+s13ListRow('archive','Открыть архив','Просмотреть доступные записи','chat')+s13ListRow('filter','Скрыть чат','Только на этом устройстве','filters'))}<div class="s19-alias-editor"><label for="s19-contact-alias">Имя контакта в Sbewo</label><input id="s19-contact-alias" type="text" maxlength="160" placeholder="Например, Мой друг" value="${esc(s19CurrentAlias(selectedChat))}"><p>Собственные имена из телефонной книги Telegram недоступны боту. Здесь можно задать имя вручную; оставь поле пустым, чтобы показывать имя из Telegram.</p><button class="s13-btn" data-s19-save-alias="1">Сохранить имя</button></div>${s13Btn('Управлять доступом в Telegram','connect-personal')}</section>`;}
function s13Profile(){const user=tg?.initDataUnsafe?.user;return `${s13Header()}<section class="s13-detail-page"><div class="s13-centered-hero s13-profile-hero">${s13Face('welcome')}<h1>${esc(user?.first_name||'Мой профиль')}</h1><p>${user?.username?'@'+esc(user.username):'Telegram Mini App'}</p></div>${s13White('',s13ListRow('star','Возможности Sbewo','Обзор доступных функций','catalog')+s13ListRow('bell','Уведомления','Удалённые и изменённые сообщения','notifications')+s13ListRow('archive','Данные и доступ','Управление архивом и приватностью','privacy')+s13ListRow('help','Помощь','Частые вопросы','help'))}</section>`;}
function s13Catalog(){return `${s13Header()}<section class="s13-detail-page"><h1>Возможности Sbewo</h1>${s13White('',s13ListRow('archive','Архив переписки','Просмотр сохранённых записей','archive'))}<p class="s13-footnote">Недоступные возможности не предлагаются как действующие сервисы.</p></section>`;}
function s13Privacy(){return `${s13Header()}<section class="s13-detail-page"><h1>Данные и доступ</h1>${s13White('',s13ListRow('archive','Управление архивом',`${db.items.length} доступных записей`,'storage')+s13ListRow('info','Что сохраняется','Подробности доступа','access'))}<button class="s13-danger" data-go="confirm-clear">${s13Icon('trash')} Удалить мой архив</button><p class="s13-footnote">Удаление архива необратимо. Перед удалением попросим подтверждение.</p></section>`;}
function s13ConfirmClear(){return `${s13Header()}<section class="s13-detail-page"><div class="s13-centered-hero">${s13Face('archive')}<h1>Данные и доступ</h1></div><div class="s13-sheet"><div class="s13-sheet-handle"></div><div class="s13-danger-icon">${s13Icon('trash')}</div><h2>Удалить весь архив?</h2><p>Сохранённые сообщения и версии будут удалены с сервера. Восстановить их не получится.</p><button class="s13-btn danger" data-action="clear-archive">Удалить архив</button>${s13Btn('Отмена','privacy','secondary')}</div></section>`;}
function s13Access(){return `${s13Header()}<section class="s13-detail-page"><div class="s13-centered-hero">${s13Face('welcome')}<h1>Условия доступа</h1></div>${s13White('','<p>Бот видит только новые сообщения в разрешённых чатах Telegram Business. Старая история недоступна.</p>')}<p class="s13-footnote">Юридические документы должны быть опубликованы по действительным ссылкам до публичного запуска. Sbewo не получает старую историю чатов через Telegram Business API.</p></section>`;}
function s13Help(){return `${s13Header()}<section class="s13-detail-page"><div class="s13-centered-hero">${s13Face('help')}<h1>Помощь</h1></div>${faqs.map(([q,a],i)=>`<button type="button" class="s13-faq" aria-expanded="${faqOpen===i}" data-faq="${i}"><strong>${esc(q)}</strong>${s13Icon('chevron')}${faqOpen===i?`<p>${esc(a)}</p>`:''}</button>`).join('')}<p class="s13-footnote">Если что-то не работает, проверь подключение Telegram Business и ответ сервера.</p></section>`;}
function s78SettingsRow(icon,title,subtitle,target,tone='blue',tag=''){
 const fallback={archive:'archive',connections:'group',bell:'bell',shield:'shield',support:'help',partners:'group',telegram:'send'};
 const iconClasses={archive:'ri-archive-2-line',connections:'ri-equalizer-3-line',bell:'ri-notification-3-line',shield:'ri-shield-check-line',support:'ri-customer-service-2-line',partners:'ri-group-line',telegram:'ri-telegram-2-line'};
 const ic=`<i class="${iconClasses[icon]}" aria-hidden="true">${ico(fallback[icon])}</i>`;
 return `<button type="button" class="s78-row" data-go="${target}" aria-label="${esc(title)}"><span class="s78-row-icon s78-tone-${tone}">${ic}</span><span class="s78-row-text"><strong>${esc(title)}</strong><small>${esc(subtitle)}</small></span><span class="s78-chevron">${ico('chevron')}</span></button>`;
}
function s19Settings(){return `<section class="s13-mainpage s19-page s19-settings-page s78-settings-page"><div class="s52-sub-card s77-tariffs-card" aria-label="Тарифы и подписка Sbewo"><div class="s52-sub-copy"><span class="s52-sub-label"><span class="s52-sub-star" aria-hidden="true">♛</span> Тарифы</span><h2>Тарифы<br>и подписка</h2><p>Выбери подходящий тариф, сравни планы и управляй подпиской в одном месте.</p><button data-go="pro" class="s52-sub-cta" aria-label="Открыть тарифы и подписку">Тарифы и подписка <span aria-hidden="true">→</span></button></div><div class="s52-sub-visual" aria-hidden="true"><img src="./kyu-settings-tariffs.png" alt="" loading="eager" decoding="async"></div></div>
<div class="s78-settings-groups">
<section class="s78-settings-group" aria-label="Управление приложением">
${s78SettingsRow('archive','Сохранение переписки','Настройка хранения сообщений','chat-saving','blue')}
${s78SettingsRow('bell','Уведомления','Сообщения об удалениях и правках','notifications','pink')}
</section>
<section class="s78-settings-group" aria-label="Безопасность и помощь">
${s78SettingsRow('shield','Безопасность и данные','Архив, доступы и конфиденциальность','privacy','green')}
${s78SettingsRow('support','Поддержка','Помощь и ответы на вопросы','help','violet')}
</section>
<section class="s78-settings-group" aria-label="Сообщество Sbewo">
${s78SettingsRow('partners','Партнёрская программа','Приглашай друзей и получай бонусы','partner-program','amber')}
${s78SettingsRow('telegram','Наш Telegram-канал','Новости, обновления и полезные советы','telegram-channel','sky')}
</section>
</div></section>`;}
function s78ChatSaving(){return `${s13Header()}<section class="s13-detail-page s78-saving-page"><h1>Сохранение переписки</h1><div class="s19-settings-group"><div class="s19-toggle-row"><span>${ico('archive')}<span><strong>Полная переписка</strong><small>Сохранять также обычные сообщения</small></span></span><button role="switch" aria-label="Сохранять полную переписку" aria-checked="${s19FullArchive}" class="s19-switch ${s19FullArchive?'active':''}" data-s19-archive="toggle"><i></i></button></div><p class="s19-setting-info">Сохраняются только новые сообщения с момента подключения Sbewo, в пределах срока хранения сервера. Старую переписку бот получить не может.</p></div></section>`;}
function s78Partner(){return `${s13Header()}<section class="s13-detail-page s78-info-page"><span class="s78-info-icon s78-tone-amber">${ico('group')}</span><h1>Партнёрская программа</h1><p>Программа приглашений и бонусов готовится. Пока начисление бонусов и реферальные ссылки недоступны.</p></section>`;}
function s78TelegramChannel(){return `${s13Header()}<section class="s13-detail-page s78-info-page"><span class="s78-info-icon s78-tone-sky">${ico('send')}</span><h1>Наш Telegram-канал</h1><p>Ссылка на официальный канал Sbewo появится здесь после его подключения. Пока переход не настроен.</p></section>`;}

const s13Pages={welcome:s13Welcome,home:s13Home,archive:s13Archive,'archive-view':s13Archive,chats:s13Chats,'connect-personal':s13ConnectionPersonal,eventdetail:s13EventDetail,revision:s13Revision,chat:s13Chat,'chat-clear':s48ClearPage,settings:s19Settings,'chat-saving':s78ChatSaving,'partner-program':s78Partner,'telegram-channel':s78TelegramChannel,catalog:s13Catalog,privacy:s13Privacy,'confirm-clear':s13ConfirmClear,access:s13Access,help:s13Help};
noteAction=async function(){s19NoteEditor=!s19NoteEditor;render()};
const s19BaseRefresh=refresh;
refresh=async function(){await s19BaseRefresh();s19ChatAliasCache=db.aliases||{};s19FullArchive=!!db.full_archive;await s19LoadAvatars();};
const s13OriginalBind=bind;
bind=function(){s13OriginalBind();document.querySelectorAll('[data-s37-scroll="events"]').forEach(b=>b.onclick=()=>{const el=document.querySelector('.s14-home .s13-segment');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});});
document.querySelectorAll('[data-message]').forEach(b=>{const original=b.onclick;b.onclick=()=>{const m=db.items.find(x=>String(x.key)===String(b.dataset.message));if(m)selectedChat=s38ChatKey(m);if(original)original();};});
 const s52Open=$('[data-s52-open-chat]');if(s52Open)s52Open.onclick=()=>{const m=db.items.find(x=>String(x.key)===String(selectedKey));if(m){selectedChat=s38ChatKey(m);goto('chat')}};
 const filterToggle=$('[data-s50-filter-toggle]');if(filterToggle)filterToggle.onclick=()=>{s50FilterOpen=!s50FilterOpen;render()};
 document.querySelectorAll('[data-s50-filter]').forEach(b=>b.onclick=()=>{s19ChatView=b.dataset.s50Filter;s50FilterOpen=false;render()});
 const archiveToggle=$('[data-s50-archive]');if(archiveToggle)archiveToggle.onclick=async()=>{
  const id=Number(s19SelectedChatId());if(!Number.isSafeInteger(id)||id<=0||s50SavingArchive)return;
  const newEnabled=!(db.chat_full_archives||[]).map(String).includes(String(id));
  s50SavingArchive=true;render();
  try{if(!demo)await call('/api/chat-archive-mode',{chat_id:id,enabled:newEnabled});
   else{const modes=new Set((db.chat_full_archives||[]).map(String));if(newEnabled)modes.add(String(id));else modes.delete(String(id));db.chat_full_archives=[...modes]}
   if(!demo)await refresh();error='';
  }catch(e){error=e.message||'Не удалось обновить архив'}finally{s50SavingArchive=false;render()}
 };
 const exportBtn=$('[data-s50-export]');if(exportBtn)exportBtn.onclick=async()=>{
  const id=Number(s19SelectedChatId());if(!Number.isSafeInteger(id)||id<=0||s50Exporting)return;
  s50Exporting=true;render();
  try{if(demo)throw Error('Скачивание доступно только для подключённого аккаунта');
   const data=await call('/api/chat-export-link',{chat_id:id});
   const url=new URL(data.url,API+'/').href;
   if(tg?.openLink)tg.openLink(url,{try_instant_view:false});else window.open(url,'_blank','noopener,noreferrer');
   error='';
  }catch(e){error=e.message||'Не удалось скачать историю'}finally{s50Exporting=false;render()}
 };
 document.querySelectorAll('[data-s91-mode]').forEach(b=>b.onclick=()=>{s91TariffMode=b.dataset.s91Mode;render()}); document.querySelectorAll('[data-s51-plan]').forEach(b=>b.onclick=()=>{
  const next=b.dataset.s51Plan;
  if(next===s51Plan)return;
  s51Plan=next;
  // Update the tariff selection in place: avoid replacing the entire page,
  // which resets the scroll position and causes a visible jump on iOS.
  const plans={'1m':'299 ₽','6m':'1 190 ₽','12m':'1 790 ₽'};
  document.querySelectorAll('[data-s51-plan]').forEach(el=>{
   const active=el.dataset.s51Plan===next;
   el.classList.toggle('selected',active);
   el.setAttribute('aria-checked',String(active));
   const radio=el.querySelector('.s91-plan-radio');
   if(radio)radio.innerHTML=active?ico('check'):'';
  });
  const label=document.querySelector('.s91-checkout > span:first-child');
  if(label)label.textContent=`Подключить за ${plans[next]||'1 790 ₽'}`;
 });
 const checkoutBtn=$('[data-s51-checkout]');if(checkoutBtn)checkoutBtn.onclick=()=>{const planMap={'1m':'1 месяц · 299 ₽','6m':'6 месяцев · 1 190 ₽','12m':'12 месяцев · 1 790 ₽'};try{tg?.showAlert?.(`Выбран тариф: ${planMap[s51Plan]||'Подписка Sbewo'}. Подключение оплаты добавим следующим этапом.`)}catch{alert(`Выбран тариф: ${planMap[s51Plan]||'Подписка Sbewo'}. Подключение оплаты добавим следующим этапом.`)}};
document.querySelectorAll('[data-clear-choice]').forEach(btn=>btn.onclick=()=>{
 const id=btn.dataset.clearChoice;
 if(id==='all')s48ClearSelection=s48ClearSelection.has('all')?new Set():new Set(['all']);
 else {s48ClearSelection.delete('all');if(s48ClearSelection.has(id))s48ClearSelection.delete(id);else s48ClearSelection.add(id)}
 render();
});
const s48Submit=$('[data-clear-submit]');if(s48Submit)s48Submit.onclick=async()=>{
 const id=Number(s19SelectedChatId());
 if(!Number.isSafeInteger(id)||!id){error='Не удалось определить Telegram ID чата';render();return}
 if(!s48ClearSelection.size||s48Clearing)return;
 const categories=[...s48ClearSelection];
 const ask='Удалить выбранные записи из этого чата без возможности восстановления?';
 const confirmed=await new Promise(resolve=>{
   if(tg?.showConfirm){try{tg.showConfirm(ask,resolve)}catch{resolve(window.confirm(ask))}}
   else resolve(window.confirm(ask));
 });
 if(!confirmed)return;
 s48Clearing=true;render();
 try{
   if(demo){const items=s38ChatItems(selectedChat);const keys=new Set(items.filter(x=>categories.includes('all')||(categories.includes('deleted')&&x.deleted)||(categories.includes('edited')&&x.edited)||(categories.includes('media')&&x.kind!=='text')).map(x=>String(x.key)));db.items=db.items.filter(x=>!keys.has(String(x.key)))}
   else await call('/api/clear-chat',{chat_id:id,categories});
   s48ClearSelection.clear();error='';
   if(!demo)await refresh();
   goto('chat');
 }catch(e){error=e?.message||'Не удалось очистить архив';render()}
 finally{s48Clearing=false;}
};
const aliasSave=$('[data-s19-save-alias]');if(aliasSave)aliasSave.onclick=async()=>{const id=s19SelectedChatId();if(!id)return;const alias=$('#s19-contact-alias')?.value||'';aliasSave.disabled=true;try{if(demo){s19ChatAliasCache[String(id)]=alias;db.items.filter(x=>String(x.chat_id)===String(id)).forEach(x=>x.chat=alias||x.chat);render();return}await call('/api/chat-alias',{chat_id:Number(id),alias});await refresh();selectedChat=`id:${id}`;render()}catch(e){error=e.message;render()}};
const search=$('#s19-chat-search');if(search){search.oninput=e=>{s19ChatQuery=e.target.value;const pos=e.target.selectionStart;render();const next=$('#s19-chat-search');next?.focus();try{next?.setSelectionRange(pos,pos)}catch{}}}
document.querySelectorAll('[data-s19-filter]').forEach(b=>b.onclick=()=>{s19ChatFilter=b.dataset.s19Filter;render()});
document.querySelectorAll('[data-s19-view]').forEach(b=>b.onclick=()=>{s19ChatView=b.dataset.s19View;render()});
document.querySelectorAll('[data-s19-note-cancel]').forEach(b=>b.onclick=()=>{s19NoteEditor=false;render()});
document.querySelectorAll('[data-s19-note-save]').forEach(b=>b.onclick=async()=>{const m=db.items.find(x=>String(x.key)===String(selectedKey));if(!m)return;const val=$('#s19-note-input')?.value.slice(0,600)||'';b.disabled=true;try{if(!demo)await call('/api/note',{message_key:m.key,note:val});m.note=val;s19NoteEditor=false;error='';render()}catch(e){error=e.message;render()}});
document.querySelectorAll('[data-s19-download]').forEach(b=>b.onclick=()=>{
 const d=s19MediaPreview;
 if(!d||String(d.key)!==String(b.dataset.s19Download)||!d.url)return;
 // A real user click opens the binary HTTP response; no large Base64 or Blob in WebView.
 try{if(tg?.openLink)tg.openLink(d.url,{try_instant_view:false});else window.open(d.url,'_blank','noopener,noreferrer')}
 catch(e){window.open(d.url,'_blank','noopener,noreferrer')}
});
document.querySelectorAll('[data-s19-media]').forEach(b=>b.onclick=async()=>{
 const key=String(b.dataset.s19Media);
 b.disabled=true;b.textContent='Подготавливаем файл…';
 try{
  // This endpoint sends metadata and a short-lived link, not the binary/base64 body.
  const data=await call('/api/media-link',{message_key:key});
  const url=new URL(data.url,API+'/').href;
  const mime=String(data.mime||'application/octet-stream');
  s19MediaPreview={key,url,data:url,mime,file_name:data.file_name,bytes:data.bytes};
  s19MediaError='';render();
 }catch(e){s19MediaError=e.message||'Не удалось подготовить файл';s19MediaPreview={key};render()}
});
document.querySelectorAll('[data-s19-archive]').forEach(b=>b.onclick=async()=>{const next=!s19FullArchive;b.disabled=true;try{if(!demo){const data=await call('/api/archive-settings',{full_archive:next});s19FullArchive=!!data.full_archive;await refresh()}else{s19FullArchive=next;render()}}catch(e){error=e.message;render()}});
document.querySelectorAll('[data-s13-scope]').forEach(b=>b.onclick=()=>{s13EventScope=b.dataset.s13Scope;render()});document.querySelectorAll('[data-s13-archive]').forEach(b=>b.onclick=()=>{s13ArchiveTab=b.dataset.s13Archive;query='';render()});document.querySelectorAll('[data-s13-chat-tab]').forEach(b=>b.onclick=()=>{s13ChatTab=b.dataset.s13ChatTab;render()});document.querySelectorAll('[data-s65-preview]').forEach(b=>b.onclick=()=>{s65PreviewState=b.dataset.s65Preview||'';pref('sbewo-status-preview',s65PreviewState);render()});document.querySelectorAll('[data-action]').forEach(b=>b.onclick=async()=>{switch(b.dataset.action){case 'next-onboarding':if(s13Step===0&&!s13Accepted)return;if(s13Step===5){goto('connect-personal');return}s13Step++;render();break;case 'skip-onboarding':pref('sbewo-v8-onboarded','yes');page='home';render();break;case 'start-personal':goto('connect-personal');break;case 'check-connection':try{await refresh();s82ConnectionCheck=db.connected?'Sbewo подключён. Доступ подтверждён.':'Пока не подключён. Проверь разрешения Telegram Business.';}catch(e){s82ConnectionCheck='Не удалось проверить подключение.';}render();break;case 'clear-archive':if(!s13Confirm){s13Confirm=true;b.textContent='Подтвердить удаление';return}try{if(!demo)await call('/api/clear');db.items=[];s13Confirm=false;goto('archive')}catch(e){error=e.message;render()}break;}});const terms=$('#accept-terms');if(terms)terms.onchange=()=>{s13Accepted=terms.checked;render()};};
const s13OldGoto=goto;
goto=function(to){if(to==='back'){back();return}if(['connect-list','connect-group','connection-check'].includes(to))to='connect-personal';if(to==='star-action'){starAction();return}if(to==='note-action'){noteAction();return}if(to==='history'||to==='deleted'||to==='edited'){flt=to==='deleted'?'deleted':to==='edited'?'edited':'all';to='home'}if(to==='archive')to='chats';if(to==='media'){s19ChatView='media';to='chats'}if(to==='services')to='catalog';if(to==='connection')to='connect-personal';if(to==='notifications'||to==='storage'||to==='filters'||to==='about'||to==='pro'){ /* Existing functional secondary pages */ }if(to==='chat'){s19ChatView='events';s50FilterOpen=false;}if(to==='chat-clear'){s48ClearSelection.clear();s48Clearing=false;}if(to==='settings')s13Return=page;if(to==='eventdetail'){s13Return=page;s19MediaPreview=null;s19MediaError='';s19NoteEditor=false;}if(to==='welcome')s13Step=0;if(to==='home'||to==='archive'||to==='chats'){if(to==='home')flt='all';if(to==='archive')query=''}previous=page;page=to;error='';render();const main=$('#main');if(main)main.scrollTop=0;};
back=function(){if(page==='welcome'){if(s13Step>0){s13Step--;render()}else goto('home');return}const mappings={eventdetail:s13Return,revision:'eventdetail',chat:'chats','archive-view':'home','chat-manage':'chats','chat-clear':'chat','chat-saving':'settings','partner-program':'settings','telegram-channel':'settings','connect-personal':'home',catalog:'settings',access:'settings',privacy:'settings','confirm-clear':'privacy',help:'settings',notifications:'settings',storage:'privacy',filters:'settings'};goto(mappings[page]||'home');};
render=function(){let intro=page==='welcome';let selected=s13Pages[page];const oldPages={notifications,storage,filters,about,pro};if(!selected&&!oldPages[page]){page='home';selected=s13Home}const root=$('#app');root.className=`app s13-app ${intro?'s13-intro':''} ${s13Main.has(page)?'s13-has-bottom':'s13-no-bottom'}`;root.innerHTML=`<main id="main" class="main s13-main">${error?`<div class="error-msg" role="alert">${esc(error)}</div>`:''}${demo?'<div class="s13-demo">ДЕМО · вымышленные данные</div>':''}${selected?selected():oldPages[page]()}</main>${s13Main.has(page)?s13Bottom():''}`;bind();s95FitPricing();try{tg?.BackButton?.[intro||s13Main.has(page)?'hide':'show']()}catch{}};
window.SbewoDev={demo:demoStart,resetIntro:()=>{pref('sbewo-v6-onboarded','no');pref('sbewo-v8-onboarded','no');page='welcome';s13Step=0;render()},goto};
// Pricing page fits in the available Telegram viewport without scrolling.
// Use measured content dimensions (not an assumed iPhone screen height), because
// Telegram's WebView header/safe areas differ across devices.
function s95FitPricing(){
 const main=document.querySelector('.s13-no-bottom > .s13-main');
 const card=main?.querySelector('.s91-pricing-page');
 if(!card)return;
 // Reset the previous fit before measuring: old zoom+width:calc(100% / zoom)
 // produced horizontal overflow and shifted the entire interface off screen.
 card.style.removeProperty('width');
 card.style.removeProperty('transform');
 card.style.zoom='1';
 main.scrollTop=0;
 main.scrollLeft=0;
 const available=main.clientHeight-2;
 const contentHeight=()=>Math.ceil(card.getBoundingClientRect().bottom-main.getBoundingClientRect().top);
 if(contentHeight()>available){
   let low=.60,high=1;
   for(let i=0;i<14;i++){
     const mid=(low+high)/2;
     card.style.zoom=String(mid);
     if(contentHeight()<=available)low=mid;
     else high=mid;
   }
   card.style.zoom=String(low);
 }
 // Zoom shrinks the box, but must never expand the outer width.
 card.style.width='100%';
 main.scrollTop=0;
 main.scrollLeft=0;
}
// Prevent iOS WebView bounce/drag on the tariff screen only.
// Buttons remain clickable because only a moving touch gesture is cancelled.
document.addEventListener('touchmove',function(event){
 if(document.querySelector('.s13-no-bottom > .s13-main > .s91-pricing-page')){
   event.preventDefault();
 }
},{passive:false,capture:true});
window.addEventListener('resize',()=>{if(document.querySelector('.s91-pricing-page'))s95FitPricing()},{passive:true});
try{tg?.onEvent?.('viewportChanged',()=>{if(document.querySelector('.s91-pricing-page'))s95FitPricing()})}catch{}
// Re-entry after onboarding goes to the Events page.
if(page==='services')page='home';

// Recheck avatars when entering the chat list and periodically while it is visible.
// A hidden or unavailable Telegram photo still falls back to the name initial.
const s41OldGoto=goto;
goto=function(to){
 s41OldGoto(to);
 if(page==='chats'||page==='chat')void s19LoadAvatars(true);
 if(page==='chat')void s49LoadChatUsername();
};
setInterval(()=>{
 if(!document.hidden&&['chats','chat'].includes(page))void s19LoadAvatars();
},90000);
render();if(initData&&!isIntro())refresh();
