(() => {
 'use strict';
 const endpoint='https://lkvtnmsfivdrfcflzsyx.supabase.co/functions/v1/connection-check';
 const title=document.querySelector('#connection-title'),status=document.querySelector('#connection-status'),button=document.querySelector('#retry-connection');let checking=false;
 async function request(options){
  const controller=typeof AbortController==='function'?new AbortController():null;let timer;
  try{
   const init={...options,credentials:'omit',cache:'no-store'};if(controller)init.signal=controller.signal;
   const exchange=fetch(endpoint,init).then(async response=>{
    if(!response.ok||!(response.headers.get('Content-Type')||'').includes('application/json'))throw Error('未取得公开检测响应（'+response.status+'）。');
    const data=await response.json();if(data.ok!==true||data.test_only!==true)throw Error('检测响应不匹配。');return data;
   });
   return await Promise.race([exchange,new Promise((_,reject)=>{timer=setTimeout(()=>{if(controller)controller.abort();reject(Error('连接超时。'));},12000);})]);
  }finally{clearTimeout(timer);}
 }
 async function check(){
  if(checking)return;checking=true;button.disabled=true;button.textContent='检测中…';title.textContent='正在检查这台设备的连接…';status.textContent='正在连接新的公开测试服务，不需要登录。';
  try{
   if(typeof fetch!=='function')throw Error('此浏览器无法自动检测，可点「直接查看检测结果」。');
   const health=await request({method:'GET'});if(health.service!=='yiyu-connection-check')throw Error('检测服务不匹配。');
   status.textContent='公开服务已连通，正在检查测试请求能否往返…';
   const nonce='check_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2),result=await request({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'connection-check',nonce})});
   if(result.nonce!==nonce)throw Error('测试编号未匹配，暂不能确认连接。');
   title.textContent='连接正常。';status.textContent='这台设备已成功完成连接与发送测试。这次检测没有保存留言或访客记录。';
  }catch(error){title.textContent='连接还没有通过。';status.textContent=(error.message||'暂时无法访问测试服务。')+' 当前设备暂未连通后台；请保留留言原文，并把这行提示告诉站主。';}
  finally{checking=false;button.disabled=false;button.textContent='重新检测';}
 }
 button.onclick=check;check();
})();
