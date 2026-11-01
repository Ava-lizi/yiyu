// Public page events only; compatible with older mobile webviews.
(() => {
 'use strict';
 if(location.hostname!=='ava-lizi.github.io'||!location.pathname.startsWith('/yiyu/'))return;
 const page=document.body.dataset.page;
 if(!['home','journey','project','code','writing','photos'].includes(page))return;
 const debug=new URLSearchParams(location.search).get('visit_debug')==='1';let panel,status,retryButton,pixel=null,started=false,sending=false;
 if(debug){
  panel=document.createElement('aside');panel.setAttribute('aria-label','本次访问连接检查');panel.style.cssText='position:fixed;bottom:16px;right:16px;left:16px;max-width:360px;margin-left:auto;background:#fbfcf8;color:#415449;border:1px solid #dce5d5;border-radius:12px;padding:16px;z-index:9999;font:14px/20px system-ui;box-shadow:0 8px 24px #0001';
  const title=document.createElement('strong');title.textContent='本次访问连接检查';status=document.createElement('p');status.setAttribute('role','status');status.style.cssText='margin:12px 0;white-space:pre-wrap';retryButton=document.createElement('button');retryButton.type='button';retryButton.textContent='重新检查';retryButton.style.cssText='padding:8px 12px;background:#dce6df;color:#415449;border-radius:8px;font:14px/20px system-ui';retryButton.onclick=()=>send();panel.append(title,status,retryButton);document.body.appendChild(panel);
 }
 let receiptCode='';const note=text=>{if(status)status.textContent=text+(receiptCode?'\n本次请求编号：'+receiptCode:'');};
 if(navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true){note('浏览器启用了不跟踪设置，本次访问不会记入统计。');if(retryButton)retryButton.disabled=true;return;}
 function uuid(){
  if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')return crypto.randomUUID();
  const bytes=new Uint8Array(16);if(typeof crypto!=='undefined'&&typeof crypto.getRandomValues==='function')crypto.getRandomValues(bytes);else for(let i=0;i<16;i++)bytes[i]=Math.floor(Math.random()*256);
  bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
 }
 let referrer='';try{const url=new URL(document.referrer);if(['http:','https:'].includes(url.protocol))referrer=url.origin;}catch{}
 const event={id:uuid(),page,referrer},payload=JSON.stringify(event),base='https://lkvtnmsfivdrfcflzsyx.supabase.co/functions/v1/yiyu-api/api/visits/';
 receiptCode=event.id;
 function imageFallback(){return new Promise((resolve,reject)=>{
  pixel=new Image();pixel.referrerPolicy='origin';const timer=setTimeout(()=>{pixel=null;reject(Error('连接超时'));},12000);
  pixel.onload=()=>{clearTimeout(timer);pixel=null;resolve();};pixel.onerror=()=>{clearTimeout(timer);pixel=null;reject(Error('无法连接记录服务'));};
  pixel.src=base+'pixel?id='+encodeURIComponent(event.id)+'&page='+encodeURIComponent(page)+'&referrer='+encodeURIComponent(referrer);
 });}
 async function send(){
  if(sending)return;sending=true;if(retryButton)retryButton.disabled=true;note('正在确认本次访问是否送达…');
  const controller=typeof AbortController==='function'?new AbortController():null;let timer;
  try{
   if(typeof fetch!=='function')throw Error('需要兼容连接');
   const options={method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:payload,keepalive:true};if(controller)options.signal=controller.signal;
   const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{if(controller)controller.abort();reject(Error('连接超时'));},8000);});
   const exchange=fetch(base+'events',options).then(response=>{if(!response.ok)throw Error('服务连接失败');return response.json();});const data=await Promise.race([exchange,timeout]);
   if(data.reason==='privacy'){note('浏览器启用了不跟踪设置，本次访问不会记入统计。');return;}
   if(data.reason==='automation'){note('自动化测试访问已跳过，不会混入真实访客。');return;}
   if(data.ok!==true||data.id!==event.id)throw Error('未确认送达');note('已确认：本次访问已记入。\n可在管理员端刷新查看。');
  }catch{clearTimeout(timer);
   try{note('正在使用兼容方式确认…');await imageFallback();note('已确认：本次访问已记入。\n可在管理员端刷新查看。');}
   catch{note('网页已打开，但访问记录服务未连通。\n请把这行提示告诉站主。');}
  }finally{clearTimeout(timer);sending=false;if(retryButton)retryButton.disabled=false;}
 }
 function start(){if(started||document.visibilityState!=='visible')return;started=true;document.removeEventListener('visibilitychange',start);send();}
 if(document.prerendering)document.addEventListener('prerenderingchange',start,{once:true});else{document.addEventListener('visibilitychange',start);start();}
})();
