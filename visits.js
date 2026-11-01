// Public page events only. The administrator workspace never runs this file.
(() => {
 'use strict';
 if(location.hostname!=='ava-lizi.github.io'||!location.pathname.startsWith('/yiyu/')||navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true)return;
 const page=document.body.dataset.page;
 if(!['home','journey','project','code','writing','photos'].includes(page))return;
 let referrer='';try{const url=new URL(document.referrer);if(['http:','https:'].includes(url.protocol))referrer=url.origin;}catch{}
 const payload=JSON.stringify({id:crypto.randomUUID(),page,referrer});
 async function send(retry=true){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{const response=await fetch('https://lin-a-quiet-space.linlizi051023.chatgpt.site/api/visits/events',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:payload,keepalive:true,signal:controller.signal});if(response.status>=500&&retry)setTimeout(()=>send(false),3000);}
  catch{if(retry)setTimeout(()=>send(false),3000);}finally{clearTimeout(timer);}
 }
 function start(){if(document.visibilityState!=='visible')return;document.removeEventListener('visibilitychange',start);if('requestIdleCallback' in window)requestIdleCallback(()=>send(),{timeout:1500});else setTimeout(()=>send(),500);}
 if(document.prerendering)document.addEventListener('prerenderingchange',start,{once:true});else{document.addEventListener('visibilitychange',start);start();}
})();
