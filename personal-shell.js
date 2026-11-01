// 首页、经历页与工作台共用的导航和日期。
(() => {
 const $=s=>document.querySelector(s);
 const icons={home:'<path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',journey:'<path d="M6 4v16M6 5h11M6 12h8M6 19h11"/><circle cx="6" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="6" cy="19" r="2"/>',project:'<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M8 6V3h8v3M3 12h18M9 12v3h6v-3"/>',code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16"/>',writing:'<path d="M14 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9M8 15l1-4L19 1l4 4-10 10-5 1zM7 20h9"/>',photos:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 16 5-5 5 5 3-3 5 5"/>',plus:'<path d="M12 5v14M5 12h14"/>'};
 const icon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[n]||icons.journey}</svg>`;
 const page=document.body.dataset.page;
 const workbenchView=document.body.dataset.view||new URLSearchParams(location.search).get('view');
 const activeNav=page==='workbench'?(['code','photos','writing'].includes(workbenchView)?workbenchView:'code'):page;
 const nav=[['home','index.html','回家'],['journey','journey.html','经历'],['project','projects.html','项目'],['code','code.html','代码'],['writing','writing.html','文字'],['photos','photos.html','影像']];
 $('#personal-sidebar').innerHTML=`<a class="rail-brand" href="index.html" aria-label="回到 Lin 的首页">L<span class="sr-only">in</span></a><nav class="rail-nav" aria-label="我的空间">${nav.map(([key,url,label])=>`<a class="rail-link ${key===activeNav?'current':''}" href="${url}" ${key===activeNav?'aria-current="page"':''}>${icon(key)}<span>${label}</span></a>`).join('')}</nav><span class="rail-bottom">A SPACE TO BECOME.</span>`;
 document.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));
 function localDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
 $('#today-date').textContent=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'long',day:'numeric',weekday:'long'}).format(new Date());
 window.PersonalSpace={icon,localDate};
})();
