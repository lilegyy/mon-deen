(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const letters = window.DEEN_ARABIC;
  const data = window.DEEN_READING;
  let writingMode='letters', letterId=letters[0].id, position=0, wordIndex=0, nameId='allah', hideGuide=false;
  let soundId=letters[0].id, soundFilter='all', chapterId=1;
  let observer=null, strokes=[], currentStroke=null, paint=null, refresh=null;
  const formLabels=['Isolée','Début de mot','Milieu de mot','Fin de mot'];
  const allNames=[{id:'allah',arabic:'الله',transliteration:'Allāh',meaning:'Allah'},...window.DEEN_NAMES];
  const forms = l => l.joins ? l.forms : [l.forms[0],l.forms[0],l.forms[1],l.forms[1]];
  function selected() {
    if(writingMode==='words') {const w=data.words[wordIndex];return {text:w[0],title:w[0],meaning:w[1],help:'Copie le mot de droite à gauche. Observe les liaisons et les coupures à l’intérieur du mot.'};}
    if(writingMode==='names') {const n=allNames.find(n=>n.id===nameId)||allNames[0];return {text:n.arabic,title:n.transliteration,meaning:n.meaning,help:'Observe les liaisons dans le nom entier. Le modèle est sans voyelles : cet exercice porte sur l’écriture.'};}
    const l=letters.find(l=>l.id===letterId);
    return {text:forms(l)[position],title:`${l.name} · ${formLabels[position]}`,meaning:l.writing,help:l.joins?'Les traits de liaison montrent comment la lettre rejoint ses voisines. Ils ne sont pas des lettres supplémentaires.':'Cette lettre coupe la liaison vers la gauche. Au milieu ou à la fin, le modèle suppose que la lettre précédente se lie à elle ; sinon, elle garde sa forme isolée.'};
  }
  const switchLinks = active => `<nav class="workshop-switch" aria-label="Ateliers d’arabe"><a href="#arabic" ${active==='writing'?'aria-current="page"':''}>✎ Écrire à l’écran</a><a href="#reading" ${active==='reading'?'aria-current="page"':''}>ع Lire & prononcer</a></nav>`;
  function letterTiles(attr,id,items=letters) {
    return items.map(l=>`<button class="letter-tile ${l.id===id?'active':''}" ${attr}="${esc(l.id)}" aria-pressed="${l.id===id}" aria-label="${esc(l.name)}"><span lang="ar" dir="rtl">${l.letter}</span><small>${esc(l.name)}</small></button>`).join('');
  }
  function selectors() {
    if(writingMode==='letters') {
      const l=letters.find(l=>l.id===letterId);
      return `<div class="alphabet-grid" dir="rtl">${letterTiles('data-w-letter',letterId)}</div><fieldset class="form-picker"><legend>Choisir la forme à repasser</legend>${forms(l).map((f,i)=>`<button class="form-button ${position===i?'active':''}" data-w-form="${i}" aria-pressed="${position===i}"><span class="arabic" lang="ar" dir="rtl">${f}</span><span>${formLabels[i]}</span></button>`).join('')}</fieldset><p class="muted small">La position dans le mot ne suffit pas : la forme dépend aussi des liaisons possibles avec les lettres voisines.</p>`;
    }
    if(writingMode==='words') return `<label class="workshop-select">Mot à recopier<select data-w-word>${data.words.map((w,i)=>`<option value="${i}" ${i===wordIndex?'selected':''}>${w[0]} — ${esc(w[1])}</option>`).join('')}</select></label>`;
    return `<label class="workshop-select">Nom d’Allah à recopier<select data-w-name>${allNames.map(n=>`<option value="${n.id}" ${n.id===nameId?'selected':''}>${n.arabic} — ${esc(n.transliteration)}</option>`).join('')}</select></label><p class="muted small">Allah et les 99 noms de la liste pédagogique du carnet. <a href="#lesson/noms-allah">Comprendre la liste et ses sources →</a></p>`;
  }
  function writing() {
    const model=selected();
    return `<div data-workshop="writing"><section class="page-intro"><span class="eyebrow">LE GESTE · LES FORMES · LES MOTS</span><h1>L’atelier d’écriture</h1><p>Repasse le modèle, puis cache-le et essaie de mémoire.</p></section>${switchLinks('writing')}
      <div class="filter-bar" aria-label="Modèles d’écriture">${[['letters','Lettres & positions'],['words','Mots vocalisés'],['names','Noms d’Allah']].map(([v,label])=>`<button class="filter-chip ${v===writingMode?'active':''}" data-w-mode="${v}" aria-pressed="${v===writingMode}">${label}</button>`).join('')}</div>
      ${selectors()}<section class="writing-studio"><div class="writing-heading"><div><span class="eyebrow">TON MODÈLE</span><h2>${esc(model.title)}</h2></div><a class="text-link" href="#reading/sounds">Travailler les sons →</a></div><p>${esc(model.meaning)}</p><p class="muted small">${esc(model.help)}</p>
      <div class="writing-tools"><button class="btn btn-secondary" data-w-undo>Annuler le dernier trait</button><button class="btn btn-secondary" data-w-clear>Effacer</button><button class="btn btn-secondary" data-w-guide aria-pressed="${hideGuide}">${hideGuide?'Afficher le modèle':'Cacher le modèle'}</button><button class="text-link" data-w-print>Fiche papier ↗</button></div>
      <div class="writing-pad trace-pad"><span id="trace-guide" class="writing-guide arabic" lang="ar" dir="rtl" aria-hidden="true" ${hideGuide?'hidden':''}>${esc(model.text)}</span><canvas id="trace-canvas" aria-label="Zone de tracé : ${esc(model.title)}. Au doigt, au stylet ou à la souris. Une fiche papier est également disponible.">Utilise la fiche papier si le dessin à l’écran n’est pas disponible.</canvas></div>
      <p class="muted small" role="status" id="trace-status">Trace de droite à gauche. Changer de modèle efface le tracé en cours.</p><p class="muted small">Modèles typographiques de style naskh. Entraînement libre, sans correction automatique ni animation de l’ordre des traits.</p></section>
      <section class="writing-print print-sheet"><h1>Mon Deen · ${esc(model.title)}</h1><p>${esc(model.meaning)}</p><p>${esc(model.help)}</p>${[0,1,2,3].map(()=>`<div class="practice-line arabic" lang="ar" dir="rtl">${esc(model.text)}</div>`).join('')}<div class="practice-line">&nbsp;</div><p>Repasse les modèles, puis recopie de mémoire sur la dernière ligne.</p></section></div>`;
  }
  function soundPanel() {
    const l=letters.find(l=>l.id===soundId);
    const filtered=letters.filter(l=>soundFilter==='all'||(soundFilter==='throat'?l.zone==='Gorge':soundFilter==='heavy'?l.heavy:soundFilter==='solar'?l.solar:!l.solar));
    const isAlif=l.letter==='ا';
    return `<section><h2>L’alphabet et les points d’articulation</h2><p>Choisis une lettre pour situer son son, puis compare-la avec ses voisines. Le nom d’une lettre et le son lu avec une voyelle sont deux choses différentes.</p><div class="filter-bar" aria-label="Filtrer les sons">${[['all','Toutes'],['throat','Gorge'],['heavy','Lettres lourdes'],['solar','Solaires'],['lunar','Lunaires']].map(([id,label])=>`<button class="filter-chip ${soundFilter===id?'active':''}" data-r-filter="${id}" aria-pressed="${soundFilter===id}">${label}</button>`).join('')}</div><div class="alphabet-grid" dir="rtl">${letterTiles('data-r-letter',soundId,filtered)}</div>
      <article class="sound-detail"><div class="letter-heading"><div><span class="eyebrow">${esc(l.zone)}</span><h2>${esc(l.name)} · ${esc(l.sound)}</h2><span class="tag">${l.solar?'Solaire':'Lunaire'}</span> <span class="tag">${l.heavy?'Istiʿlāʾ · lourde':'Autre lettre'}</span></div><span class="letter-large arabic" lang="ar" dir="rtl">${l.letter}</span></div><p>${esc(l.pronunciation)}</p>
      ${isAlif?'<p>L’alif prolonge le a. Pour le coup de glotte avec une voyelle, observe la hamza : <span class="arabic inline-arabic" lang="ar" dir="rtl">أَ إِ أُ</span>. Elle mérite un travail distinct.</p>':`<div class="sound-vowels" aria-label="La lettre avec trois voyelles">${[['َ','a bref'],['ِ','i bref'],['ُ','ou bref']].map(([mark,label])=>`<div><span class="arabic" lang="ar" dir="rtl">${l.letter+mark}</span><small>${label}</small></div>`).join('')}</div>`}
      <div class="module-toolbar"><a class="btn btn-secondary" href="https://madinaharabic.com/free-content/reading/lesson-1/part-1" target="_blank" rel="noopener noreferrer">Écouter le nom des lettres ↗</a><a class="text-link" href="https://imamfaisal.com/articulation/" target="_blank" rel="noopener noreferrer">Cours audio d’articulation, en anglais ↗</a></div><p class="muted small">Ces deux écoutes ouvrent une source externe. Pour des récitations intégrées, ouvre « Versets & audio ».</p></article>
      <section class="sound-pairs"><h3>Les paires à ne pas confondre</h3>${[['ح / ه','Gorge moyenne / souffle plus léger : le ḥāʾ n’est pas le h muet du français.'],['ق / ك','Qāf est plus en arrière que kāf.'],['س / ص','Sīn fin / ṣād emphatique : ne monte pas le volume.'],['ت / ط','Même famille de contact, mais ṭāʾ est emphatique.'],['ذ / ظ','Pointe entre les dents ; ẓāʾ est emphatique.'],['ء / ع','Hamza : coupure glottale ; ʿayn : articulation du milieu de la gorge.'],['ض / د','Ḍād implique le bord de la langue et les molaires ; ne le réduis pas à un d plus fort.']].map(([a,b])=>`<div><span class="arabic" lang="ar" dir="rtl">${a}</span><p>${b}</p></div>`).join('')}</section><a class="btn btn-primary" href="#lesson/arabe-sons">Comprendre les points d’articulation →</a></section>`;
  }
  function pathway(completed) {
    return `<section><h2>Des premières lettres aux premiers versets</h2><p>Commence au niveau qui te convient. Les étapes restent accessibles ; le suivi indique les fiches étudiées, pas une validation de ta prononciation.</p><div class="reading-path">${data.ids.map((id,i)=>{const l=window.DEEN_CONTENT.lessons.find(l=>l.id===id);return `<a class="reading-step" href="#lesson/${id}"><span class="curriculum-index ${completed[id]?'completed':''}">${completed[id]?'✓':i+1}</span><div><h3>${esc(l.title)}</h3><p>${esc(l.description)}</p><small>${l.duration} min · ${completed[id]?'Fiche étudiée':'À découvrir'}</small></div><span aria-hidden="true">→</span></a>`;}).join('')}</div></section><aside class="callout"><h3>Ton objectif : déchiffrer sans dépendre du français</h3><p>Travaille quelques minutes : reconnaître les signes, lire un exemple nouveau, écouter, puis recommencer. La traduction n’est pas nécessaire pour ce premier décodage. Pour bien réciter tout le Coran, poursuis avec une correction orale, les arrêts et les cas particuliers de ta transmission.</p></aside>`;
  }
  function verses() {
    const c=data.chapters.find(c=>c.id===chapterId);
    return `<section><h2>Lire avec une récitation de référence</h2><label class="workshop-select">Passage<select data-r-chapter>${data.chapters.map(c=>`<option value="${c.id}" ${chapterId===c.id?'selected':''}>${esc(c.name)} · ${c.verses.length} versets</option>`).join('')}</select></label><p>Écoute un verset, suis les signes, puis relis seul. Répète l’audio avec le bouton de lecture ou active la boucle. Les sons sont ceux du récitateur, sans voix de synthèse.</p><p class="muted small">Maḥmūd Khalīl al-Ḥuṣarī · Ḥafṣ · audio diffusé depuis <a href="https://everyayah.com/recitations_ayat.html" target="_blank" rel="noopener noreferrer">EveryAyah</a>, connexion nécessaire. <a href="https://quran.com/${c.id}" target="_blank" rel="noopener noreferrer">Comparer au texte de référence ↗</a></p><div class="verse-list">${c.verses.map(([text,hint],i)=>{const key=`${String(c.id).padStart(3,'0')}${String(i+1).padStart(3,'0')}`;return `<article class="verse-card"><div class="verse-heading"><h3>${esc(c.name)} · ${c.id}:${i+1}</h3><label><input type="checkbox" data-r-loop="audio-${key}"> Répéter en boucle</label></div><p class="verse-text arabic" lang="ar" dir="rtl">${text}</p><audio id="audio-${key}" controls preload="none" aria-label="Écouter ${esc(c.name)}, verset ${i+1}" src="${data.audioBase}${key}.mp3"></audio><p class="audio-error" role="status" hidden>Audio indisponible : vérifie ta connexion ou <a href="https://quran.com/${c.id}/${i+1}" target="_blank" rel="noopener noreferrer">écoute sur Quran.com</a>.</p><details><summary>Les points à repérer</summary><p>${hint}</p></details></article>`;}).join('')}</div><a class="text-link" href="#lesson/${c.id===1?'lecture-fatiha':'lecture-ikhlas'}">Lire la leçon d’accompagnement →</a></section>`;
  }
  function reading(completed) {
    const tab=location.hash.split('/')[1]||'path';
    return `<div data-workshop="reading"><section class="page-intro"><span class="eyebrow">DÉCHIFFRER · ÉCOUTER · LIRE</span><h1>Lire le Coran</h1><p>Des lettres aux versets, même avant de comprendre le vocabulaire.</p></section>${switchLinks('reading')}<p class="reading-scope">Repère : Ḥafṣ d’après ʿĀṣim. Une transmission de lecture, distincte des écoles de fiqh. L’écoute et la correction orale accompagnent les exercices.</p><nav class="reading-tabs" aria-label="Lecture et prononciation">${[['path','Mon parcours · 14 étapes'],['sounds','Sons & alphabet'],['verses','Versets & audio']].map(([id,label])=>`<a href="#reading/${id}" ${tab===id?'aria-current="page"':''}>${label}</a>`).join('')}</nav>${tab==='sounds'?soundPanel():tab==='verses'?verses():pathway(completed)}</div>`;
  }
  function practice(lesson) {
    return `<section class="reading-practice"><span class="eyebrow">À LIRE À VOIX HAUTE</span><h2>Essaie avant de révéler l’aide</h2><p>Les fragments isolés servent à l’exercice ; ils ne sont pas tous des versets. u se lit « ou » ; les aides latines ne remplacent pas l’écoute.</p><div class="practice-grid">${lesson.practice.map(([ar,latin,hint])=>`<article><p class="arabic practice-arabic" lang="ar" dir="rtl">${ar}</p><details><summary>Voir le repère de lecture</summary><p><strong>${esc(latin)}</strong></p><p>${esc(hint)}</p></details></article>`).join('')}</div><a class="text-link" href="#reading/verses">Écouter et suivre les premiers versets →</a></section>`;
  }
  function cleanup() {
    observer?.disconnect();observer=null; paint=null;
    document.querySelectorAll('[data-workshop] audio').forEach(a=>a.pause());
  }
  function mount(render) {
    refresh=render;
    const root=document.querySelector('[data-workshop]');if(!root)return;
    root.querySelectorAll('audio').forEach(a=>{
      a.addEventListener('play',()=>root.querySelectorAll('audio').forEach(other=>{if(other!==a)other.pause();}));
      a.addEventListener('error',()=>{a.closest('.verse-card').querySelector('.audio-error').hidden=false;});
    });
    const canvas=root.querySelector('#trace-canvas');if(!canvas)return;
    strokes=[];currentStroke=null;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const guide=root.querySelector('#trace-guide');
    function resize() {
      if(!canvas.isConnected)return;
      const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,3);
      canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      let size=Math.min(rect.height*.65,180);
      ctx.font=`${size}px "Noto Naskh Arabic"`;
      const width=ctx.measureText(selected().text).width;
      size=Math.min(size,size*(rect.width-36)/Math.max(width,1));guide.style.fontSize=`${size}px`;
      draw();
    }
    function draw() {
      const rect=canvas.getBoundingClientRect();ctx.clearRect(0,0,rect.width,rect.height);
      ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#684490';ctx.lineWidth=3.5;ctx.lineCap='round';ctx.lineJoin='round';
      for(const stroke of strokes) {if(!stroke.length)continue;ctx.beginPath();ctx.moveTo(stroke[0][0]*rect.width,stroke[0][1]*rect.height);if(stroke.length===1)ctx.lineTo(stroke[0][0]*rect.width+.1,stroke[0][1]*rect.height+.1);else for(const p of stroke.slice(1))ctx.lineTo(p[0]*rect.width,p[1]*rect.height);ctx.stroke();}
      root.querySelector('[data-w-undo]').disabled=!strokes.length;root.querySelector('[data-w-clear]').disabled=!strokes.length;
    }
    const point=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];};
    canvas.addEventListener('pointerdown',e=>{if(currentStroke||(!e.isPrimary)||e.button!==0)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);currentStroke=[];strokes.push(currentStroke);currentStroke.push(point(e));draw();});
    canvas.addEventListener('pointermove',e=>{if(!currentStroke||!canvas.hasPointerCapture(e.pointerId))return;e.preventDefault();currentStroke.push(point(e));draw();});
    for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,()=>{currentStroke=null;});
    observer=new ResizeObserver(resize);observer.observe(canvas);paint=draw;resize();document.fonts.ready.then(()=>{if(canvas.isConnected)resize();});
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||!b.closest('[data-workshop]'))return;
    let rerender=true;
    if(b.hasAttribute('data-w-mode'))writingMode=b.dataset.wMode;
    else if(b.hasAttribute('data-w-letter'))letterId=b.dataset.wLetter;
    else if(b.hasAttribute('data-w-form'))position=Number(b.dataset.wForm);
    else if(b.hasAttribute('data-r-letter'))soundId=b.dataset.rLetter;
    else if(b.hasAttribute('data-r-filter')) {soundFilter=b.dataset.rFilter;const l=letters.find(l=>soundFilter==='all'||(soundFilter==='throat'?l.zone==='Gorge':soundFilter==='heavy'?l.heavy:soundFilter==='solar'?l.solar:!l.solar));soundId=l.id;}
    else {rerender=false;if(b.hasAttribute('data-w-undo')){strokes.pop();currentStroke=null;paint?.();}if(b.hasAttribute('data-w-clear')){strokes=[];currentStroke=null;paint?.();}if(b.hasAttribute('data-w-guide')){hideGuide=!hideGuide;document.querySelector('#trace-guide').hidden=hideGuide;b.textContent=hideGuide?'Afficher le modèle':'Cacher le modèle';b.setAttribute('aria-pressed',hideGuide);}if(b.hasAttribute('data-w-print'))window.print();}
    if(rerender){const attr=[...b.attributes].find(a=>/data-[wr]-/.test(a.name));refresh?.();if(attr)document.querySelector(`button[${attr.name}="${attr.value}"]`)?.focus({preventScroll:true});}
  });
  document.addEventListener('change',e=>{
    if(!e.target.closest('[data-workshop]'))return;
    const el=e.target;
    if(el.hasAttribute('data-w-word'))wordIndex=Number(el.value);
    else if(el.hasAttribute('data-w-name'))nameId=el.value;
    else if(el.hasAttribute('data-r-chapter'))chapterId=Number(el.value);
    else if(el.hasAttribute('data-r-loop')){document.getElementById(el.dataset.rLoop).loop=el.checked;return;}
    else return;
    const attr=[...el.attributes].find(a=>/data-[wr]-/.test(a.name));refresh?.();if(attr)document.querySelector(`[${attr.name}]`)?.focus({preventScroll:true});
  });
  window.DEEN_WORKSHOP={writing,reading,practice,mount,cleanup,forms};
})();
