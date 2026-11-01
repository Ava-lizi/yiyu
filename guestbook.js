(() => {
 'use strict';
 const $=s=>document.querySelector(s),trigger=$('#open-contact');if(!trigger)return;
 const endpoint='https://lin-a-quiet-space.linlizi051023.chatgpt.site/api/guestbook/messages';
 const serviceOrigin=new URL(endpoint).origin,formEndpoint=serviceOrigin+'/api/guestbook/form';
 function uuid(){if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')return crypto.randomUUID();const bytes=new Uint8Array(16);if(typeof crypto!=='undefined'&&typeof crypto.getRandomValues==='function')crypto.getRandomValues(bytes);else for(let i=0;i<16;i++)bytes[i]=Math.floor(Math.random()*256);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const s=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return s.slice(0,8)+'-'+s.slice(8,12)+'-'+s.slice(12,16)+'-'+s.slice(16,20)+'-'+s.slice(20);}
 function fail(message,transport=false){const error=Error(message);error.transport=transport;return error;}
 async function postJSON(payload){
  if(typeof fetch!=='function')throw fail('需要使用兼容发送。',true);
  const controller=typeof AbortController==='function'?new AbortController():null;let timer;
  try{
   const options={method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)};if(controller)options.signal=controller.signal;
   const response=fetch(endpoint,options).then(async r=>{
    if(!(r.headers.get('Content-Type')||'').includes('application/json'))throw fail('未收到留言服务的有效回复。',true);
    const data=await r.json();if(!r.ok||data.ok!==true)throw fail(data.message||'留言尚未确认送达。',r.status>=500);
    if(data.id!==payload.id)throw fail('送达回执不匹配。',true);return data;
   });
   return await Promise.race([response,new Promise((_,reject)=>{timer=setTimeout(()=>{if(controller)controller.abort();reject(fail('留言连接超时。',true));},10000);})]);
  }catch(error){if(error.transport===undefined)error.transport=true;throw error;}finally{clearTimeout(timer);}
 }
 function postForm(payload){return new Promise((resolve,reject)=>{
  const frame=document.createElement('iframe'),native=document.createElement('form');let timer;
  frame.name='yiyu-receipt-'+payload.id;frame.hidden=true;frame.title='留言送达回执';frame.setAttribute('sandbox','allow-scripts allow-same-origin');
  native.method='POST';native.action=formEndpoint;native.target=frame.name;native.acceptCharset='UTF-8';native.hidden=true;
  for(const [name,value]of Object.entries(payload)){const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;native.append(input);}
  function cleanup(){clearTimeout(timer);window.removeEventListener('message',receive);native.remove();frame.remove();}
  function receive(event){
   if(event.origin!==serviceOrigin||event.source!==frame.contentWindow||!event.data||event.data.type!=='yiyu-guestbook-receipt'||event.data.id!==payload.id)return;
   const data=event.data;cleanup();if(data.ok===true&&data.status>=200&&data.status<300)resolve(data);else{const error=fail(data.message||'留言尚未确认送达。');error.status=data.status;reject(error);}
  }
  window.addEventListener('message',receive);document.body.append(frame,native);
  timer=setTimeout(()=>{cleanup();reject(fail('仍未收到送达确认，内容已保留。',true));},20000);
  try{HTMLFormElement.prototype.submit.call(native);}catch(error){cleanup();reject(fail('无法建立留言连接，内容已保留。',true));}
 });}
 document.body.insertAdjacentHTML('beforeend',`<dialog id="contact-dialog" aria-labelledby="contact-title"><div class="dialog-title-row"><div><p class="overline">A NOTE, JUST FOR ME</p><h2 id="contact-title">留一句话给我。</h2><p>一个想法，或一句简单的问候，都可以。</p></div><button class="close-dialog" id="close-contact" aria-label="关闭留言表单">×</button></div><div id="contact-form-area"><form class="contact-form" id="contact-form"><fieldset class="contact-modes"><legend>想用什么方式留言？</legend><div class="contact-mode-options"><label><input type="radio" name="mode" value="anonymous" checked><span>匿名留言</span></label><label><input type="radio" name="mode" value="named"><span>实名留言</span></label></div></fieldset><div class="contact-fields"><label class="field full" id="guest-name-field" hidden>你的姓名<input name="name" autocomplete="name" maxlength="40" placeholder="让这句问候，有一个名字" disabled></label><label class="field full">你的留言<textarea name="message" required maxlength="2000" placeholder="写下想说的话…"></textarea><span class="contact-counter"><span id="contact-length">0</span> / 2000</span></label></div><label class="contact-honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><p class="contact-status" id="contact-status" role="status" aria-live="polite"></p><div class="form-actions"><span class="form-note">这封留言，只有我能看到。</span><button class="primary" type="submit" id="send-contact">发送留言 <span aria-hidden="true">↗</span></button></div><p class="contact-privacy" id="contact-privacy">匿名留言不需要姓名或邮箱，也不需要登录。</p></form></div><div class="contact-success" id="contact-success" hidden><span class="success-mark" aria-hidden="true">✓</span><h3>留言已送达。</h3><p>谢谢你留下这些话。<br>我会在自己的留言箱里读到。</p><button class="quiet" id="finish-contact">回到首页</button></div></dialog>`);
 const dialog=$('#contact-dialog'),form=$('#contact-form'),button=$('#send-contact'),status=$('#contact-status');let sending=false,completed=false,requestKey='',requestId='';
 const setStatus=(text,error=false)=>{status.textContent=text;status.classList.toggle('is-error',error);};
 const alternate=document.createElement('a');alternate.href=serviceOrigin+'/message';alternate.target='_blank';alternate.rel='noopener';alternate.className='contact-open-site';alternate.textContent='在独立留言页继续 ↗';alternate.hidden=true;status.after(alternate);
 if(new URLSearchParams(location.search).get('message_debug')==='1'){
  const check=document.createElement('button');check.type='button';check.className='quiet';check.textContent='检查留言连接';form.prepend(check);
  check.onclick=async()=>{check.disabled=true;setStatus('正在检查留言连接，不会保存测试内容…');const probe={id:uuid(),mode:'anonymous',name:'',message:'',website:''};
   try{await postJSON(probe);setStatus('留言连接可用。');}
   catch(error){if(!error.transport)setStatus('留言连接可用，可以填写内容发送。');else{try{await postForm(probe);setStatus('兼容留言连接可用。');}catch(e){if(e.status===400)setStatus('兼容留言连接可用，可以填写内容发送。');else{setStatus('当前浏览器无法连接留言服务，可打开独立留言页检查。',true);alternate.hidden=false;}}}}finally{check.disabled=false;}
  };
 }
 function modeChanged(){const named=form.elements.mode.value==='named';$('#guest-name-field').hidden=!named;form.elements.name.disabled=!named;form.elements.name.required=named;$('#contact-privacy').textContent=named?'填写的姓名仅随这条留言发送给我，不会公开展示。':'匿名留言不需要姓名或邮箱，也不需要登录。';}
 form.querySelectorAll('[name="mode"]').forEach(input=>input.onchange=modeChanged);
 form.elements.message.oninput=()=>$('#contact-length').textContent=form.elements.message.value.length;
 trigger.onclick=()=>{
  if(completed){form.reset();modeChanged();$('#contact-length').textContent='0';$('#contact-form-area').hidden=false;$('#contact-success').hidden=true;setStatus('');completed=false;}
  dialog.showModal();document.body.style.overflow='hidden';
 };
 function close(){if(sending){setStatus('留言正在发送，请稍候。');return;}dialog.close();}
 $('#close-contact').onclick=close;$('#finish-contact').onclick=close;
 dialog.addEventListener('cancel',e=>{if(sending){e.preventDefault();setStatus('留言正在发送，请稍候。');}});
 dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.style.overflow='';trigger.focus({preventScroll:true});});
 if(new URLSearchParams(location.search).get('contact')==='1')trigger.click();
 form.onsubmit=async e=>{
  e.preventDefault();if(sending)return;
  if(location.protocol==='file:'){setStatus('请从网站地址打开页面后留言。',true);return;}
  const mode=form.elements.mode.value,name=mode==='named'?form.elements.name.value.trim():'',message=form.elements.message.value.trim();
  if(!message||(mode==='named'&&!name)){setStatus(mode==='named'&&!name?'请填写姓名。':'写一点内容再发送吧。',true);return;}
  if(typeof form.reportValidity==='function'&&!form.reportValidity())return;
  const key=JSON.stringify({mode,name,message});if(key!==requestKey){requestKey=key;requestId=uuid();}
  const payload={id:requestId,mode,name,message,website:form.elements.website.value};
  sending=true;button.disabled=true;button.textContent='正在送达…';dialog.setAttribute('aria-busy','true');setStatus('正在保存留言…');
  form.querySelectorAll('input,textarea').forEach(input=>input.disabled=true);
  try {
   try{await postJSON(payload);}catch(error){if(!error.transport)throw error;setStatus('正在使用兼容方式送达留言…');await postForm(payload);}
   let receipt=$('#guestbook-receipt');if(!receipt){receipt=document.createElement('p');receipt.id='guestbook-receipt';receipt.className='contact-privacy';$('#contact-success').append(receipt);}receipt.textContent='送达编号：'+requestId;
   completed=true;requestKey='';requestId='';$('#contact-form-area').hidden=true;$('#contact-success').hidden=false;$('#finish-contact').focus();
  } catch(error){setStatus(error.message||'未收到留言送达确认，内容仍在，请稍后重试。',true);alternate.hidden=error.transport!==true;}
  finally{sending=false;button.disabled=false;button.innerHTML='发送留言 <span aria-hidden="true">↗</span>';dialog.removeAttribute('aria-busy');form.querySelectorAll('input,textarea').forEach(input=>input.disabled=false);modeChanged();}
 };
})();
