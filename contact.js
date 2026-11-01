(() => {
 const trigger=document.querySelector('#open-contact');if(!trigger)return;
 const $=s=>document.querySelector(s);
 document.body.insertAdjacentHTML('beforeend',`<dialog id="contact-dialog" aria-labelledby="contact-title"><div class="dialog-title-row"><div><h2 id="contact-title">给 Lin 留句话。</h2><p>线上邮件服务正在准备中，接入后即可在这里给我留言。</p></div><button class="close-dialog" id="close-contact" aria-label="关闭联系表单">×</button></div><div id="contact-form-area"><form class="contact-form" id="contact-form"><div class="contact-fields"><label class="field">怎么称呼你<input name="name" autocomplete="name" required maxlength="80" placeholder="你的名字"></label><label class="field">你的邮箱<input name="email" type="email" autocomplete="email" required maxlength="254" placeholder="方便我回复你"></label><label class="field full">想聊什么<input name="subject" required maxlength="120" placeholder="给这条消息一个主题"></label><label class="field full">你的消息<textarea name="message" required maxlength="5000" placeholder="写下想说的话…"></textarea><span class="contact-counter"><span id="contact-length">0</span> / 5000</span></label></div><label class="contact-honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><p class="contact-status" id="contact-status" role="status" aria-live="polite"></p><div class="form-actions"><span class="form-note">消息将直接发送到我的邮箱。</span><button class="primary" type="submit" id="send-contact">发送消息 <span aria-hidden="true">↗</span></button></div><p class="contact-privacy">你填写的邮箱仅用于回复这条消息。</p></form></div><div class="contact-success" id="contact-success" hidden><span class="success-mark" aria-hidden="true">✓</span><h3>消息已交给邮件服务。</h3><p>谢谢你写下这些话。<br>我会在邮箱里查看你的消息。</p><button class="quiet" id="finish-contact">回到首页</button></div></dialog>`);
 const dialog=$('#contact-dialog'),form=$('#contact-form'),button=$('#send-contact'),status=$('#contact-status');let sending=false,ready=false,loading=false;
 function setStatus(text,error=false){status.textContent=text;status.classList.toggle('is-error',error);}
 function localHelp(text){setStatus(text,true);if(location.protocol==='file:'||['localhost','127.0.0.1','[::1]'].includes(location.hostname)){const link=document.createElement('a');link.href='http://127.0.0.1:5173/?contact=1#contact';link.textContent='打开可发送消息的网站 ↗';link.className='contact-open-site';status.append(document.createElement('br'),link);}}

 async function check(){
  loading=true;button.disabled=true;ready=false;
  if(location.protocol==='file:'){localHelp('你正在从本地文件打开页面，请使用网站地址后再发送消息。');loading=false;return;}
  setStatus('正在连接…');
  try{const r=await fetch('contact-status.json',{cache:'no-store'});if(!r.ok||!(r.headers.get('content-type')||'').includes('application/json')){localHelp('当前预览没有连接到消息服务，请使用网站地址。');return;}const data=await r.json();ready=data.ready===true;setStatus(ready?'':'线上邮件服务尚未接入，暂时无法发送。',!ready);}
  catch{localHelp('暂时无法连接消息服务，请确认网站已经启动后重试。');}
  finally{loading=false;button.disabled=!ready;}
 }

 trigger.onclick=()=>{dialog.showModal();document.body.style.overflow='hidden';if(!sending&&!$('#contact-form-area').hidden)check();};
 if(new URLSearchParams(location.search).get('contact')==='1')trigger.click();
 function close(){if(sending){setStatus('消息正在发送，请稍候。');return;}dialog.close();}
 $('#close-contact').onclick=close;$('#finish-contact').onclick=close;dialog.addEventListener('cancel',e=>{if(sending){e.preventDefault();setStatus('消息正在发送，请稍候。');}});dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.style.overflow='';trigger.focus({preventScroll:true});});
 form.elements.message.oninput=()=>$('#contact-length').textContent=form.elements.message.value.length;
 form.onsubmit=async e=>{e.preventDefault();if(sending||loading)return;if(!ready){await check();if(!ready)return;}if(!form.reportValidity())return;
  const payload=Object.fromEntries(new FormData(form));for(const key of ['name','email','subject','message']){payload[key]=payload[key].trim();if(!payload[key]){setStatus('请完整填写名字、邮箱、主题和消息。',true);return;}}
  sending=true;button.disabled=true;button.textContent='发送中…';setStatus('正在发送，请稍候。');dialog.setAttribute('aria-busy','true');
  try{const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await r.json();if(!r.ok||data.ok!==true)throw new Error(data.message||'发送失败，请稍后再试。');$('#contact-form-area').hidden=true;$('#contact-success').hidden=false;form.reset();$('#contact-length').textContent='0';$('#finish-contact').focus();}
  catch(error){setStatus(error.message==='Failed to fetch'?'连接中断，未能确认发送结果。请稍后再试。':error.message,true);}
  finally{sending=false;button.disabled=false;button.innerHTML='发送消息 <span aria-hidden="true">↗</span>';dialog.removeAttribute('aria-busy');}
 };
})();
