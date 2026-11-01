// Public viewer: reads a published snapshot; no editor, credentials or storage writes.
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const page = document.body.dataset.page;
  let records = [], filter = new URLSearchParams(location.search).get('category') || '全部';
  if (!['全部','学习','创作','项目'].includes(filter)) filter = '全部';
  const icon = window.PersonalSpace.icon;
  const empty = text => `<div class="collection-empty"><h2>${esc(text)}</h2><p>新的记录，会在整理好之后出现在这里。</p></div>`;
  const dataURL = value => {
    // Every asset is emitted by the build, relative to this repository's base path.
    if (!/^published-assets\/[a-f0-9]+\.[a-z0-9]+$/.test(value || '')) throw new Error('文件地址无效');
    return value;
  };
  function dialog() {
    let d = $('#public-detail');
    if (!d) {
      document.body.insertAdjacentHTML('beforeend', '<dialog id="public-detail" aria-labelledby="public-title"><button class="dialog-close-box" id="close-public-detail" aria-label="关闭阅读">×</button><div id="public-detail-content"></div></dialog>');
      d = $('#public-detail');
      $('#close-public-detail').onclick = () => d.close();
      d.addEventListener('close', () => { document.body.style.overflow = ''; });
    }
    return d;
  }
  function showRecord(r) {
    const d = dialog();
    $('#public-detail-content').innerHTML = `<h2 id="public-title">${esc(r.title)}</h2><p class="detail-meta">${esc(r.date)} · ${esc(r.category)} · ${esc(r.state)}</p>${[['做了什么，学到了什么',r.body],['遇到的问题',r.blocker],['下一步',r.next]].filter(x => x[1]).map(([title,body]) => `<section class="record-section"><h3>${title}</h3><p>${esc(body)}</p></section>`).join('')}`;
    d.showModal(); document.body.style.overflow = 'hidden';
  }
  function journey() {
    const all = records.filter(r => r.type === 'journey').sort((a,b) => String(b.date).localeCompare(String(a.date)) || b.created-a.created);
    if (page === 'home') {
      const r = all[0];
      $('#recent-record').innerHTML = r ? `<div class="recent-card"><span class="recent-marker">${icon('journey')}</span><div><h3>${esc(r.title)}</h3><p>${esc(r.category)} · ${esc(r.date)}</p></div><button class="quiet recent-link" id="read-latest">读一读 ↗</button></div>` : empty('还没有公开的经历。');
      if (r) $('#read-latest').onclick = () => showRecord(r);
      return;
    }
    const query = $('#journey-search').value.trim().toLocaleLowerCase();
    const shown = all.filter(r => (filter === '全部' || r.category === filter) && (!query || [r.title,r.body,r.topic,r.blocker,r.next].some(v => String(v || '').toLocaleLowerCase().includes(query))));
    document.querySelectorAll('[data-category]').forEach(b => {
      b.classList.toggle('active', b.dataset.category === filter);
      b.setAttribute('aria-pressed', String(b.dataset.category === filter));
      b.onclick = () => { filter = b.dataset.category; journey(); };
    });
    $('#journey-search').oninput = journey;
    $('#journey-list').innerHTML = shown.length ? shown.map((r,i) => `<article class="timeline-item"><time class="timeline-date" datetime="${esc(r.date)}">${esc(r.date)}</time><button class="timeline-card" data-read-record="${i}"><span class="timeline-top"><span class="timeline-tag">${esc(r.category)}</span><span class="timeline-state">${esc(r.state)}</span></span><h2>${esc(r.title)}</h2><p>${esc((r.body || '').slice(0,180))}</p></button></article>`).join('') : empty(all.length ? '没有找到这段经历。' : '还没有公开的经历。');
    document.querySelectorAll('[data-read-record]').forEach(b => b.onclick = () => showRecord(shown[Number(b.dataset.readRecord)]));
  }
  function collections() {
    const type = {project:'personal-project',code:'code-project',writing:'writing'}[page];
    let shown = records.filter(r => r.type === type || (page === 'code' && r.type === 'code'));
    const project = new URLSearchParams(location.search).get('project');
    if (project) shown = shown.filter(r => r.projectId === project);
    shown.sort((a,b) => b.created-a.created);
    const label = {project:'项目',code:'代码项目',writing:'文字'}[page];
    const host = $('#box-content');
    const listing = () => {
      host.innerHTML = `<p class="box-count">${shown.length} 份${label}</p>` + (shown.length ? `<div class="collection-grid">${shown.map((r,i) => `<button class="collection-card" data-read-box="${i}"><span class="collection-icon">${icon(page)}</span><h2>${esc(r.title)}</h2><p>${esc((r.description || r.body || r.filename || '').slice(0,120))}</p><span class="collection-meta">阅读 ↗</span></button>`).join('')}</div>` : empty(`还没有公开的${label}。`));
      document.querySelectorAll('[data-read-box]').forEach(b => b.onclick = () => detail(shown[Number(b.dataset.readBox)]));
    };
    const detail = r => {
      host.innerHTML = `<button class="quiet back-collection" id="back-public">← 返回${label}</button><div class="box-detail-head"><div><h2>${esc(r.title)}</h2><p>${esc(r.description || '')}</p></div></div><div id="public-body"></div>`;
      $('#back-public').onclick = listing;
      const body = $('#public-body');
      if (page === 'project') {
        const hasCode = records.some(x => x.type === 'code-project' && x.projectId === r.id);
        body.innerHTML = `<span class="project-state">${esc(r.state || '进行中')}</span>${r.next ? `<div class="project-next"><strong>下一步</strong><p>${esc(r.next)}</p></div>` : ''}<div class="box-actions">${hasCode ? `<a class="primary" href="code.html?project=${encodeURIComponent(r.id)}">查看项目代码 ↗</a>` : ''}<a class="quiet" href="journey.html?category=项目">回看项目经历 ↗</a></div>`;
      } else if (page === 'writing') {
        body.innerHTML = r.attachment ? `<p class="box-note">${esc(r.filename || r.title)}</p><a class="primary" href="${dataURL(r.attachment.url)}" download="${esc(r.filename || r.title)}">下载文档 ↓</a>` : `<article class="writing-reader">${esc(r.body || '')}</article>`;
      } else if (r.type === 'code') {
        body.innerHTML = `<div class="source-preview"><pre>${esc(r.body)}</pre></div>`;
      } else {
        const files = r.files || [];
        body.innerHTML = files.length ? `<div class="file-workspace"><nav class="source-files" aria-label="项目文件">${files.map((f,i) => `<button data-read-file="${i}">${esc(f.path)}</button>`).join('')}</nav><div class="source-preview" id="read-file"></div></div>` : empty('这个项目暂未公开源码。');
        let sequence = 0;
        const preview = async index => {
          const current = ++sequence, f = files[index], url = dataURL(f.url);
          document.querySelectorAll('[data-read-file]').forEach(b => b.classList.toggle('selected', Number(b.dataset.readFile) === index));
          $('#read-file').innerHTML = `<h3>${esc(f.path)}</h3><div id="public-file-body">正在打开文件…</div><p class="box-note"><a class="quiet" href="${url}" download="${esc(f.path.split('/').pop())}">下载原文件 ↓</a></p>`;
          if (/^image\/(jpeg|png|webp|gif)$/.test(f.mime)) {
            $('#public-file-body').innerHTML = `<img src="${url}" alt="${esc(f.path)}">`; return;
          }
          if (/\.(js|jsx|ts|tsx|py|html|css|json|md|txt|csv|yml|yaml|toml|xml|sql|sh|c|cpp|h|java|go|rs|vue|svelte|gitignore)$/i.test(f.path) || /^text\//.test(f.mime)) {
            try {
              const response = await fetch(url); if (!response.ok) throw new Error();
              const blob = await response.blob(), text = await blob.slice(0,512000).text();
              if (current !== sequence || !$('#public-file-body')) return;
              $('#public-file-body').innerHTML = `<pre>${esc(text)}</pre>${blob.size > 512000 ? '<p class="box-note">预览前 500 KB，下载可查看完整文件。</p>' : ''}`;
            } catch { if (current === sequence && $('#public-file-body')) $('#public-file-body').textContent = '文件读取失败，可以尝试下载原文件。'; }
          } else $('#public-file-body').textContent = '下载后可用对应应用打开。';
        };
        document.querySelectorAll('[data-read-file]').forEach(b => b.onclick = () => preview(Number(b.dataset.readFile)));
        if (files.length) preview(0);
      }
    };
    listing();
  }
  function photos() {
    const shown = records.filter(r => r.type === 'photos');
    $('#workspace').innerHTML = shown.length ? `<div class="studio-gallery">${shown.map((r,i) => `<article class="studio-photo"><button class="studio-photo-open" data-read-photo="${i}" aria-label="查看 ${esc(r.title)}"><img src="${dataURL(r.attachment.url)}" alt="${esc(r.title)}" loading="lazy"></button><div class="studio-photo-meta"><h2>${esc(r.title)}</h2></div></article>`).join('')}</div>` : empty('还没有公开的影像。');
    const d = $('#studio-lightbox'); let index = 0, focus;
    const show = () => {
      const r = shown[index]; $('#studio-full-photo').src = dataURL(r.attachment.url); $('#studio-full-photo').alt = r.title;
      $('#studio-photo-title').textContent = r.title; $('#studio-photo-count').textContent = `${index+1} / ${shown.length}`;
    };
    const move = offset => { if (!shown.length) return; index = (index+offset+shown.length)%shown.length; show(); };
    document.querySelectorAll('[data-read-photo]').forEach(b => b.onclick = () => { index = Number(b.dataset.readPhoto); focus = b; show(); d.showModal(); document.body.style.overflow = 'hidden'; });
    $('#studio-lightbox .dialog-close').onclick = () => d.close();
    $('#studio-lightbox .prev').onclick = () => move(-1); $('#studio-lightbox .next').onclick = () => move(1);
    d.onkeydown = e => { if (['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); } };
    d.onclose = () => { document.body.style.overflow = ''; focus?.focus(); };
  }
  async function load() {
    try {
      const response = await fetch('published-content.json', {cache:'no-cache'});
      if (!response.ok) throw new Error(); const data = await response.json();
      if (data.version !== 1 || !Array.isArray(data.records)) throw new Error(); records = data.records;
      if (page === 'home' || page === 'journey') journey(); else if (page === 'photos') photos(); else collections();
    } catch {
      const host = $('#recent-record') || $('#journey-list') || $('#box-content') || $('#workspace');
      host.innerHTML = '<div class="collection-empty"><h2>内容暂时没有打开。</h2><p>请检查网络后重试。</p><button class="quiet" id="retry-public">重新加载</button></div>';
      $('#retry-public').onclick = load;
    }
  }
  load();
})();
