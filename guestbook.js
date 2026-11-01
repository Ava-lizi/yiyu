(() => {
 'use strict';
 const $=s=>document.querySelector(s),trigger=$('#open-contact');if(!trigger)return;
 const endpoint='https://lin-a-quiet-space.linlizi051023.chatgpt.site/api/guestbook/messages';
 document.body.insertAdjacentHTML('beforeend',`<dialog id="contact-dialog" aria-labelledby="contact-title"><div class="dialog-title-row"><div><p class="overline">A NOTE, JUST FOR ME</p><h2 id="contact-title">留一句话给我。</h2><p>一个想法，或一句简单的问候，都可以。</p></div><button class="close-dialog" id="close-contact" aria-label="关闭留言表单">×</button></div><div id="contact-form-area"><form class="contact-form" id="contact-form"><fieldset class="contact-modes"><legend>想用什么方式留言？</legend><div class="contact-mode-options"><label><input type="radio" name="mode" value="anonymous" checked><span>匿名留言</span></label><label><input type="radio" name="mode" value="named"><span>实名留言</span></label></div></fieldset><div class="contact-fields"><label class="field full" id="guest-name-field" hidden>你的姓名<input name="name" autocomplete="name" maxlength="40" placeholder="让这句问候，有一个名字" disabled></label><label class="field full">你的留言<textarea name="message" required maxlength="2000" placeholder="写下想说的话…"></textarea><span class="contact-counter"><span id="contact-length">0</span> / 2000</span></label></div><label class="contact-honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><p class="contact-status" id="contact-status" role="status" aria-live="polite"></p><div class="form-actions"><span class="form-note">这封留言，只有我能看到。</span><button class="primary" type="submit" id="send-contact">发送留言 <span aria-hidden="true">↗</span></button></div><p class="contact-privacy" id="contact-privacy">匿名留言不需要姓名或邮箱，也不需要登录。</p></form></div><div class="contact-success" id="contact-success" hidden><span class="success-mark" aria-hidden="true">✓</span><h3>留言已送达。</h3><p>谢谢你留下这些话。<br>我会在自己的留言箱里读到。</p><button class="quiet" id="finish-contact">回到首页</button></div></dialog>`);
 const dialog=$('#contact-dialog'),form=$('#contact-form'),button=$('#send-contact'),status=$('#contact-status');let sending=false,completed=false,requestKey='',requestId='';
 const setStatus=(text,error=false)=>{status.textContent=text;status.classList.toggle('is-error',error);};
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
  if(!form.reportValidity())return;
  const key=JSON.stringify({mode,name,message});if(key!==requestKey){requestKey=key;requestId=crypto.randomUUID();}
  const payload={id:requestId,mode,name,message,website:form.elements.website.value};
  sending=true;button.disabled=true;button.textContent='正在送达…';dialog.setAttribute('aria-busy','true');setStatus('正在保存留言…');
  form.querySelectorAll('input,textarea').forEach(input=>input.disabled=true);
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
  try {
   const response=await fetch(endpoint,{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
   if(!(response.headers.get('Content-Type')||'').includes('application/json'))throw Error('暂时无法连接留言服务，请稍后再试。');
   const data=await response.json();if(!response.ok||data.ok!==true||data.id!==requestId)throw Error(data.message||'留言尚未确认送达，请稍后重试。');
   completed=true;requestKey='';requestId='';$('#contact-form-area').hidden=true;$('#contact-success').hidden=false;$('#finish-contact').focus();
  } catch(error){setStatus(error.name==='AbortError'?'暂未收到送达确认，可以重新发送；重复提交不会产生多份留言。':error.message==='Failed to fetch'?'暂时无法连接留言服务，内容仍在，请稍后重试。':error.message,true);}
  finally{clearTimeout(timeout);sending=false;button.disabled=false;button.innerHTML='发送留言 <span aria-hidden="true">↗</span>';dialog.removeAttribute('aria-busy');form.querySelectorAll('input,textarea').forEach(input=>input.disabled=false);modeChanged();}
 };
})();
