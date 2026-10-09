(() => {
  const doc = document.documentElement;
  const body = document.body;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const mq = (q) => window.matchMedia(q).matches;
  const reduce = mq('(prefers-reduced-motion: reduce)');
  const fine = mq('(hover: hover) and (pointer: fine)');
  const saveData = !!(navigator.connection && navigator.connection.saveData);

  /* ---------- vídeos: carregam perto da tela, tocam só quando visíveis ---------- */
  const load = (v) => {
    if (v.dataset.loaded) return;
    v.src = v.dataset.src;
    v.preload = 'auto';
    v.dataset.loaded = '1';
  };
  const play = (v) => {
    if (reduce || saveData) return;
    load(v);
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  };
  const autoVideos = $$('video[data-src]').filter((v) => !v.dataset.artist && !v.hasAttribute('data-hero') && !v.closest('.hero'));
  const vio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) play(v);
      else if (!v.paused) v.pause();
    });
  }, { rootMargin: '150px 0px' });
  autoVideos.forEach((v) => vio.observe(v));

  // hero: só as colunas visíveis (no celular, só a do meio)
  const heroVideos = $$('.hero video').filter((v) => v.offsetParent !== null || v.getClientRects().length);
  heroVideos.forEach(load);
  const heroIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      heroVideos.forEach((v) => {
        if (e.isIntersecting && doc.classList.contains('lit')) play(v);
        else v.pause();
      });
    });
  });
  heroIO.observe($('#hero'));

  /* ---------- intro: a lâmpada acende, o logo pisca, entra a home ---------- */
  const intro = $('#intro');
  let lit = false;
  const light = () => {
    if (lit) return;
    lit = true;
    doc.classList.add('lit');
    body.classList.remove('locked');
    heroVideos.forEach(play);
    removeIntroListeners();
  };
  const onAny = () => light();
  const onKey = (e) => { if (['Enter', ' ', 'Escape', 'ArrowDown', 'PageDown'].includes(e.key)) light(); };
  const removeIntroListeners = () => {
    intro.removeEventListener('click', onAny);
    window.removeEventListener('wheel', onAny);
    window.removeEventListener('touchmove', onAny);
    window.removeEventListener('keydown', onKey);
  };
  if (reduce) {
    light();
  } else {
    intro.classList.add('play');
    intro.addEventListener('click', onAny);
    window.addEventListener('wheel', onAny, { passive: true });
    window.addEventListener('touchmove', onAny, { passive: true });
    window.addEventListener('keydown', onKey);
    setTimeout(light, 3400);
  }

  /* ---------- header + menu ---------- */
  const hd = $('#hd');
  const burger = $('#burger');
  const toggleMenu = (open) => {
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  burger.addEventListener('click', () => toggleMenu(!body.classList.contains('menu-open')));
  $$('#nav a').forEach((a) => a.addEventListener('click', () => toggleMenu(false)));

  /* ---------- manifesto: palavras acendem com a rolagem ---------- */
  const mani = $('#manifesto');
  const maniText = $('#maniText');
  const hotWords = /^(luz|sempre|histórias?|permanecem)/i;
  const words = maniText.textContent.trim().split(/\s+/);
  maniText.innerHTML = words.map((w) => `<span class="w${hotWords.test(w) ? ' h' : ''}">${w}</span>`).join(' ');
  const wordEls = $$('.w', maniText);
  let litCount = -1;

  /* ---------- scroll único (rAF) ---------- */
  const reels = $$('.reel');
  const lightZones = $$('.day, .contato');
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    hd.classList.toggle('solid', y > 40);
    hd.classList.toggle('on-day', lightZones.some((z) => { const r = z.getBoundingClientRect(); return r.top <= 32 && r.bottom > 32; }));
    hd.classList.toggle('hide', y > vh && y > lastY && !body.classList.contains('menu-open'));
    lastY = y;

    if (fine && !reduce && y < vh * 1.2) {
      reels.forEach((r, i) => r.style.setProperty('--py', `${y * [0.18, 0.08, 0.26][i]}px`));
    }

    if (!reduce) {
      const r = mani.getBoundingClientRect();
      const total = r.height - vh;
      if (r.top < vh && r.bottom > 0) {
        const p = Math.min(1, Math.max(0, -r.top / (total * 0.82)));
        const n = Math.round(p * wordEls.length);
        if (n !== litCount) {
          litCount = n;
          wordEls.forEach((el, i) => {
            el.classList.toggle('on', i < n);
            el.classList.toggle('hot', i < n && el.classList.contains('h'));
          });
        }
      }
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- brilho que segue o cursor ---------- */
  if (fine && !reduce) {
    const glow = $('.glow');
    let gx = 0, gy = 0, pending = false;
    window.addEventListener('pointermove', (e) => {
      gx = e.clientX; gy = e.clientY;
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => { glow.style.transform = `translate3d(${gx}px,${gy}px,0)`; pending = false; });
      }
    }, { passive: true });
  }

  /* ---------- reveals ---------- */
  const revealEls = $$('.sec-head, .case-body > *, .stats, .nums-grid li, .side-in, .more-card, .steps li, .logos, .ttime-copy > *, .ct-form, .faces figure, .conex-lead, .marcas-lead');
  revealEls.forEach((el) => el.classList.add('rv'));
  const rio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach((el) => rio.observe(el));

  /* ---------- contadores ---------- */
  const fmt = (n) => n.toLocaleString('pt-BR').replace(/\./g, n >= 1900 && n <= 2100 ? '' : '.');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      cio.unobserve(el);
      if (reduce) return;
      const to = +el.dataset.count;
      const from = +(el.dataset.from || 0);
      const pre = el.dataset.pre || '';
      const suf = el.dataset.suf || '';
      const t0 = performance.now();
      const dur = 1500;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
        el.textContent = pre + fmt(v) + suf;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => cio.observe(el));

  /* ---------- grupo: no toque, o lado em foco acende ---------- */
  if (!fine) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('act', e.isIntersecting));
    }, { threshold: 0.55 });
    $$('.side').forEach((s) => sio.observe(s));
  }

  /* ---------- ken burns só quando visível ---------- */
  const kio = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('playing', e.isIntersecting));
  });
  $$('.kb').forEach((k) => kio.observe(k));

  /* ---------- palco: artistas ---------- */
  const palco = $('#palco');
  const bgVids = $$('.palco-bg video');
  const btns = $$('#artists button');
  let palcoOn = false;
  let current = 'bell';
  const setArtist = (id) => {
    current = id;
    btns.forEach((b) => b.classList.toggle('on', b.dataset.artist === id));
    bgVids.forEach((v) => {
      const on = v.dataset.artist === id;
      v.classList.toggle('on', on);
      if (on && palcoOn) play(v);
      else if (!v.paused) v.pause();
    });
  };
  new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      palcoOn = e.isIntersecting;
      setArtist(current);
    });
  }, { rootMargin: '100px 0px' }).observe(palco);

  btns.forEach((b) => {
    if (fine) {
      b.addEventListener('pointerenter', () => setArtist(b.dataset.artist));
      b.addEventListener('focus', () => setArtist(b.dataset.artist));
    }
    b.addEventListener('click', () => openPlayer(b.dataset.src, $('.a-name', b).textContent));
  });
  if (!fine) {
    const aio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setArtist(e.target.dataset.artist); });
    }, { rootMargin: '-40% 0px -40% 0px' });
    btns.forEach((b) => aio.observe(b));
  }

  /* ---------- player com som ---------- */
  const dlg = $('#player');
  const pv = $('video', dlg);
  const openPlayer = (src, name) => {
    bgVids.forEach((v) => v.pause());
    pv.src = src;
    $('.player-cap', dlg).textContent = name;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    const p = pv.play(); if (p && p.catch) p.catch(() => {});
  };
  const closePlayer = () => {
    pv.pause();
    pv.removeAttribute('src');
    pv.load();
    if (dlg.open) dlg.close();
    setArtist(current);
  };
  $('.player-x', dlg).addEventListener('click', closePlayer);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closePlayer(); });
  dlg.addEventListener('close', () => { if (pv.getAttribute('src')) closePlayer(); });

  /* ---------- galerias: arrastar com o mouse ---------- */
  if (fine) {
    $$('.gallery').forEach((g) => {
      let down = false, sx = 0, sl = 0, moved = false;
      g.addEventListener('pointerdown', (e) => { down = true; moved = false; sx = e.clientX; sl = g.scrollLeft; g.style.scrollSnapType = 'none'; g.style.cursor = 'grabbing'; });
      window.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 3) moved = true; g.scrollLeft = sl - dx; });
      window.addEventListener('pointerup', () => { if (!down) return; down = false; g.style.scrollSnapType = ''; g.style.cursor = ''; });
      g.addEventListener('dragstart', (e) => e.preventDefault());
      g.addEventListener('click', (e) => { if (moved) e.preventDefault(); }, true);
      g.style.cursor = 'grab';
    });
  }

  /* ---------- formulário → WhatsApp ---------- */
  const form = $('#form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const nome = (d.get('nome') || '').trim();
    const err = $('#formErr');
    if (!nome) { err.hidden = false; form.nome.focus(); return; }
    err.hidden = true;
    const empresa = (d.get('empresa') || '').trim();
    const msg = (d.get('msg') || '').trim();
    let text = `Olá, Tico! Sou ${nome}${empresa ? `, da ${empresa}` : ''}. Vim pelo site e quero conversar sobre ${d.get('tipo')}.`;
    if (msg) text += `\n\n${msg}`;
    window.open(`https://wa.me/5511993531280?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
})();
