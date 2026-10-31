(() => {
  'use strict';
  const content = window.DEEN_CONTENT;
  const main = document.querySelector('#main');
  if (!content?.lessons?.length) {
    main.innerHTML = '<div class="empty-state"><h1>Les leçons ne sont pas disponibles.</h1><p>Recharge la page pour réessayer.</p></div>';
    return;
  }
  const lessons = content.lessons;
  const allCards = lessons.flatMap(l => l.cards.map((c, i) => ({ ...c, id: `${l.id}-${i}`, lessonId: l.id, lessonTitle: l.title, category: l.category })));
  const KEY = 'mon-deen-progress-v1';
  const empty = () => ({ version: 1, completed: {}, bookmarks: {}, quiz: {}, cards: {}, notes: {}, names: {}, school: 'all', lastLesson: null });
  let state = empty();
  let storageAvailable = true;
  let filter = 'Toutes';
  let cardFilter = 'all';
  let deck = [];
  let cardIndex = 0;
  let cardRevealed = false;
  let deferredInstall = null;
  let nameFilter = 'all';
  let nameQuery = '';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ids = new Set(lessons.map(l => l.id));
  const cardIds = new Set(allCards.map(c => c.id));
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  function sanitize(raw, strict = false) {
    if (!object(raw) || raw.version !== 1 || (strict && raw.app !== 'mon-deen')) throw new Error('Ce fichier n’est pas une sauvegarde Mon Deen compatible.');
    const next = empty();
    for (const key of ['completed', 'bookmarks']) {
      if (object(raw[key])) for (const [id, value] of Object.entries(raw[key])) if (ids.has(id) && typeof value === 'boolean') next[key][id] = value;
    }
    if (object(raw.quiz)) for (const [id, value] of Object.entries(raw.quiz)) {
      const lesson = lessons.find(l => l.id === id);
      if (lesson && Number.isInteger(value) && value >= 0 && value < lesson.quiz.options.length) next.quiz[id] = value;
    }
    if (object(raw.cards)) for (const [id, value] of Object.entries(raw.cards)) {
      if (cardIds.has(id) && object(value) && ['again', 'known'].includes(value.rating) && Number.isFinite(value.due) && value.due >= 0 && value.due < 8640000000000000) next.cards[id] = { rating: value.rating, due: value.due };
    }
    if (object(raw.notes)) for (const [id, value] of Object.entries(raw.notes)) if (ids.has(id) && typeof value === 'string') next.notes[id] = value.slice(0, 4000);
    if (ids.has(raw.lastLesson)) next.lastLesson = raw.lastLesson;
    if (['all','hanafi','maliki','shafii','hanbali'].includes(raw.school)) next.school = raw.school;
    if (object(raw.names)) for (const n of window.DEEN_NAMES) if (typeof raw.names[n.id] === 'boolean') next.names[n.id] = raw.names[n.id];
    return next;
  }
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) state = sanitize(JSON.parse(saved));
  } catch { storageAvailable = false; }
  const done = () => lessons.filter(l => state.completed[l.id]).length;
  const percent = () => Math.round(done() / lessons.length * 100);
  const nextLesson = () => lessons.find(l => !state.completed[l.id]) || lessons[0];
  const dueCards = () => allCards.filter(c => !state.cards[c.id] || state.cards[c.id].due <= Date.now());
  const svg = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 5v15M3 4c4-1 7 0 9 2 2-2 5-3 9-2v14c-4-1-7 0-9 2-2-2-5-3-9-2z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 19C0 9 8 3 21 3c0 13-6 21-16 16Zm0 0L16 8"/></svg>'
  };
  const arrow = svg.arrow;
  function toast(message) {
    let el = document.querySelector('#toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('visible'), 3500);
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; toast('Le navigateur ne permet pas la sauvegarde. Exporte ta progression pour la conserver.'); }
    updateSidebar();
  }
  function updateSidebar() {
    document.querySelectorAll('[data-progress-count]').forEach(el => el.textContent = `${done()} / ${lessons.length}`);
    document.querySelectorAll('[data-progress-bar]').forEach(el => el.style.width = `${percent()}%`);
  }
  function setActive(route) {
    const navRoute = route === 'lesson' ? (window.DEEN_READING.ids.includes(location.hash.split('/')[1]) ? 'reading' : 'learn') : route;
    document.querySelectorAll('a[data-nav]').forEach(a => {
      const active = a.dataset.nav === navRoute;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const labels = { home: 'Mon espace', learn: 'Mon parcours', lesson: 'Mon parcours', names: 'Les 99 noms', arabic: 'L’atelier d’écriture', reading: 'Lire le Coran', cards: 'Mes révisions', progress: 'Ma progression', sources: 'Sources & repères' };
    const breadcrumb = document.querySelector('#breadcrumb');
    if (breadcrumb) breadcrumb.textContent = labels[route] || labels.home;
    document.title = `${labels[route] || labels.home} · Mon Deen`;
    updateSidebar();
  }
  function lessonCard(lesson, index) {
    const completed = state.completed[lesson.id];
    return `<a class="lesson-card" href="#lesson/${esc(lesson.id)}"><div class="lesson-card-top"><span class="lesson-number">${String(index + 1).padStart(2, '0')}</span><span class="tag ${completed ? 'tag-complete' : ''}">${completed ? '✓ Étudiée' : esc(lesson.category)}</span></div><div class="lesson-icon">${[svg.leaf, svg.book, svg.star][index % 3]}</div><h3>${esc(lesson.title)}</h3><p>${esc(lesson.description)}</p><div class="lesson-card-footer"><span>${lesson.duration} min · ${esc(lesson.level || 'Les bases')}</span><span class="card-arrow">${arrow}</span></div></a>`;
  }
  function home() {
    const resume = lessons.find(l => l.id === state.lastLesson && !state.completed[l.id]) || nextLesson();
    return `<section class="page-intro"><span class="eyebrow">UN PAS APRÈS L’AUTRE</span><h1>Apprendre son deen,<br><em>à son rythme.</em></h1><p>Des repères pour comprendre. Des habitudes pour avancer.</p></section>
      <section class="hero"><div class="hero-copy"><span class="eyebrow">${done() === lessons.length ? 'CONTINUER À CULTIVER SON SAVOIR' : 'TON PARCOURS COMMENCE ICI'}</span><h2>${done() === lessons.length ? 'Les bases se cultivent chaque jour.' : 'Un peu de savoir.<br>Chaque jour.'}</h2><p>${done() ? `Tu as étudié ${done()} leçon${done() > 1 ? 's' : ''}. Continue avec « ${esc(resume.title)} ».` : 'Prends quelques minutes pour découvrir les fondements de l’islam et leur place dans ton quotidien.'}</p><a class="btn btn-primary" href="#lesson/${esc(resume.id)}">${done() || state.lastLesson ? 'Reprendre mon parcours' : 'Commencer mon parcours'}${arrow}</a><span class="hero-caption">${lessons.length} leçons · Bases & approfondissement · Sources accessibles</span></div><div class="hero-art" aria-hidden="true"><div class="arch arch-outer"><div class="arch arch-inner"><div class="art-sun"></div><div class="art-book">${svg.book}</div><div class="art-line"></div><span>COMPRENDRE<br>ET GRANDIR</span></div></div><div class="art-spark spark-one">✧</div><div class="art-spark spark-two">✦</div></div></section>
      <section class="stats-grid" aria-label="Ton activité"><div class="stat"><span class="stat-label">Leçons étudiées</span><strong>${done()}<small> / ${lessons.length}</small></strong><div class="progress-bar" role="progressbar" aria-label="Leçons étudiées" aria-valuenow="${done()}" aria-valuemin="0" aria-valuemax="${lessons.length}"><i style="width:${percent()}%"></i></div></div><div class="stat"><span class="stat-label">Cartes à revoir</span><strong>${dueCards().length}<small> cartes</small></strong><a class="text-link" href="#cards">Un moment pour réviser ${arrow}</a></div><div class="stat"><span class="stat-label">Ton intention</span><strong class="stat-words">Comprendre.<br>Mettre en pratique.</strong><span class="muted small">La progression suit ton apprentissage.</span></div></section>
      <div class="arabic-home-links"><a href="#arabic"><span class="eyebrow">ÉCRIRE</span><h2>Le geste et les formes</h2><p>Lettres liées, mots et noms d’Allah à repasser.</p><span>Ouvrir l’atelier →</span></a><a href="#reading"><span class="eyebrow">LIRE LE CORAN</span><h2>Des lettres aux versets</h2><p>14 étapes, sons, exercices et récitations audio.</p><span>Commencer la lecture →</span></a></div>
      <section><div class="section-heading"><div><span class="eyebrow">POSER LES FONDATIONS</span><h2>Les premiers pas</h2></div><a class="text-link" href="#learn">Tout le parcours ${arrow}</a></div><div class="lesson-grid">${[lessons[0],lessons[1],lessons[5],lessons[6],lessons[7],lessons[8]].map(l=>lessonCard(l,lessons.indexOf(l))).join('')}</div></section>
      <aside class="callout home-callout"><span class="callout-symbol">${svg.book}</span><div><span class="eyebrow">NOUVELLE LECTURE GUIDÉE</span><h3>Les Dalā’il al-Khayrāt, expliqués</h3><p>Découvre le recueil, le sens des salawāt, l’organisation des parties et les différents avis à son sujet.</p></div><a class="text-link" href="#lesson/dalail-al-khayrat">Comprendre le contenu ${arrow}</a></aside>
      <aside class="callout home-callout"><span class="callout-symbol">${svg.leaf}</span><div><h3>Apprendre avec des repères</h3><p>Chaque leçon est une synthèse pédagogique accompagnée de références. Tu peux retrouver les textes sources et distinguer l’explication du texte cité.</p></div><a class="text-link" href="#sources">Notre approche ${arrow}</a></aside>`;
  }
  function learn() {
    const categories = ['Toutes', ...new Set(lessons.map(l => l.category)), 'Enregistrées'];
    const selected = lessons.filter(l => filter === 'Toutes' || (filter === 'Enregistrées' ? state.bookmarks[l.id] : l.category === filter));
    return `<section class="page-intro"><span class="eyebrow">APPRENDRE & COMPRENDRE</span><h1>Mon parcours</h1><p>${lessons.length} leçons, de la découverte aux premiers approfondissements.</p></section><div class="callout compact"><p>Commence par la première leçon ou choisis le thème qui t’intéresse. Tu peux revenir sur chaque notion autant de fois que nécessaire.</p></div><div class="filter-bar" aria-label="Filtrer les leçons">${categories.map(c => `<button class="filter-chip ${filter === c ? 'active' : ''}" data-filter="${esc(c)}" aria-pressed="${filter === c}">${esc(c)}</button>`).join('')}</div><div class="lesson-grid">${selected.length ? selected.map(l => lessonCard(l, lessons.indexOf(l))).join('') : '<div class="empty-state"><h2>Ton carnet attend ses premières leçons.</h2><p>Dans une leçon, choisis « Enregistrer » pour la retrouver ici.</p></div>'}</div>`;
  }
  function sourceLinks(sources) {
    return sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} <span aria-label="nouvel onglet">↗</span></a>${s.note ? `<span class="source-note">${esc(s.note)}</span>` : ''}</li>`).join('');
  }
  function quizMarkup(l) {
    const choice = state.quiz[l.id];
    const answered = Number.isInteger(choice);
    return `<div class="quiz" id="quiz"><span class="eyebrow">VÉRIFIER MA COMPRÉHENSION</span><h2>Une question pour retenir</h2><p class="quiz-question">${esc(l.quiz.question)}</p><div class="quiz-options">${l.quiz.options.map((o, i) => `<button class="quiz-option ${answered && i === l.quiz.correct ? 'right' : answered && i === choice ? 'wrong' : ''}" data-answer="${i}" data-lesson="${esc(l.id)}" ${answered ? 'disabled' : ''}><span class="option-letter">${String.fromCharCode(65 + i)}</span><span>${esc(o)}</span>${answered && i === l.quiz.correct ? '<span aria-label="Bonne réponse">✓</span>' : answered && i === choice ? '<span aria-label="Réponse incorrecte">×</span>' : ''}</button>`).join('')}</div>${answered ? `<div class="quiz-feedback" role="status"><strong>${choice === l.quiz.correct ? 'Bien compris.' : 'Une occasion de préciser.'}</strong><p>${esc(l.quiz.explanation)}</p><button class="text-link" data-retry="${esc(l.id)}">Recommencer le quiz</button></div>` : '<p class="muted small">Choisis une réponse pour lire l’explication.</p>'}</div>`;
  }
  function lesson(id) {
    const l = lessons.find(item => item.id === id);
    if (!l) return `<div class="empty-state"><h1>Cette leçon est introuvable.</h1><a class="btn btn-primary" href="#learn">Retour au parcours</a></div>`;
    state.lastLesson = l.id;
    save();
    document.title = `${l.title} · Mon Deen`;
    const index = lessons.indexOf(l);
    const pathIndex = window.DEEN_READING.ids.indexOf(l.id);
    const following = pathIndex >= 0 ? lessons.find(item => item.id === window.DEEN_READING.ids[pathIndex + 1]) : lessons[index + 1];
    return `<a class="text-link back-link" href="${window.DEEN_READING.ids.includes(l.id) ? '#reading' : '#learn'}">← ${window.DEEN_READING.ids.includes(l.id) ? 'Mon parcours de lecture' : 'Toutes les leçons'}</a><section class="page-intro lesson-intro"><span class="eyebrow">LEÇON ${String(index + 1).padStart(2, '0')} · ${esc(l.category)}</span><h1>${esc(l.title)}</h1><p>${esc(l.description)}</p><div class="lesson-meta"><span>${l.duration} min de lecture</span><span>1 quiz · ${l.cards.length} cartes</span><button class="bookmark text-link" data-bookmark="${esc(l.id)}" aria-pressed="${!!state.bookmarks[l.id]}">${state.bookmarks[l.id] ? '★ Enregistrée' : '☆ Enregistrer'}</button></div></section>
      <div class="reading-layout"><article class="lesson-content"><p class="editorial-note">Les explications ci-dessous sont des paraphrases pédagogiques, pas une traduction littérale des textes.</p>${l.sections.map((s, i) => `<section id="section-${i}" class="reading-section"><h2>${esc(s.title)}</h2>${s.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('')}${lessonFeature(l)}${comparisons(l)}<aside class="callout"><span class="eyebrow">UNE PISTE POUR AUJOURD’HUI</span><p>${esc(l.reflection)}</p></aside>${quizMarkup(l)}<section class="personal-notes"><h2>Mon carnet personnel</h2><label for="lesson-notes">Une idée à retenir, une question à approfondir…</label><textarea id="lesson-notes" data-notes="${esc(l.id)}" rows="4" maxlength="4000" placeholder="Écris ici, pour toi.">${esc(state.notes[l.id] || '')}</textarea><p class="muted small" id="notes-status" aria-live="polite">Tes notes restent dans ce navigateur.</p></section><div class="lesson-finish"><button class="btn ${state.completed[l.id] ? 'btn-secondary' : 'btn-primary'}" data-complete="${esc(l.id)}" aria-pressed="${!!state.completed[l.id]}">${state.completed[l.id] ? '✓ Leçon étudiée · annuler' : 'Marquer comme étudiée'}${svg.check}</button>${following ? `<a class="text-link" href="#lesson/${esc(following.id)}">Leçon suivante ${arrow}</a>` : `<a class="text-link" href="${pathIndex >= 0 ? '#reading/verses' : '#cards'}">${pathIndex >= 0 ? 'Lire avec la récitation →' : 'Réviser avec les cartes →'}</a>`}</div></article><aside class="lesson-aside"><section class="aside-box"><span class="eyebrow">L’ESSENTIEL</span><h3>À retenir</h3><ul class="takeaways">${l.takeaways.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section><section class="aside-box"><span class="eyebrow">REVENIR AUX TEXTES</span><h3>Les références</h3><ul class="source-list">${sourceLinks(l.sources)}</ul><p class="muted small">Les liens ouvrent les sources en ligne ; leur consultation nécessite une connexion.</p></section><a class="text-link" href="#cards/${esc(l.id)}">Réviser cette leçon ${arrow}</a></aside></div>`;
  }
  function buildDeck() {
    const lessonId = location.hash.split('/')[1];
    deck = allCards.filter(c => (!lessonId || c.lessonId === lessonId) && (cardFilter === 'all' || !state.cards[c.id] || state.cards[c.id].due <= Date.now()));
    cardIndex = 0;
    cardRevealed = false;
  }
  function cards() {
    const lessonId = location.hash.split('/')[1];
    const selectedLesson = lessons.find(l => l.id === lessonId);
    const c = deck[cardIndex];
    return `<section class="page-intro"><span class="eyebrow">FAIRE VIVRE SON SAVOIR</span><h1>Un moment pour réviser</h1><p>${selectedLesson ? esc(selectedLesson.title) : 'Lis la question, prends un instant, puis découvre la réponse.'}</p></section><div class="filter-bar"><button class="filter-chip ${cardFilter === 'all' ? 'active' : ''}" data-card-filter="all" aria-pressed="${cardFilter === 'all'}">Toutes les cartes</button><button class="filter-chip ${cardFilter === 'due' ? 'active' : ''}" data-card-filter="due" aria-pressed="${cardFilter === 'due'}">À revoir aujourd’hui</button>${selectedLesson ? '<a class="text-link" href="#cards">Toutes les leçons →</a>' : ''}</div><div class="card-stage">${c ? `<div class="card-stage-heading"><span class="tag">${esc(c.category)}</span><span class="muted">${cardIndex + 1} / ${deck.length}</span></div><div class="flashcard ${cardRevealed ? 'revealed' : ''}"><span class="eyebrow">${cardRevealed ? 'LA RÉPONSE' : 'PRENDS LE TEMPS DE RÉFLÉCHIR'}</span><h2>${esc(cardRevealed ? c.a : c.q)}</h2><a class="text-link" href="#lesson/${esc(c.lessonId)}">${esc(c.lessonTitle)} ↗</a>${!cardRevealed ? '<button class="btn btn-primary" data-reveal>Voir la réponse</button>' : ''}</div>${cardRevealed ? '<div class="card-actions"><button class="btn btn-secondary" data-rate="again">À revoir · demain</button><button class="btn btn-primary" data-rate="known">Retenu · dans 3 jours ✓</button></div>' : '<p class="muted card-hint">Révise sans te presser. Il n’y a pas de chronomètre.</p>'}<div class="card-pagination"><button class="text-link" data-card-prev ${cardIndex === 0 ? 'disabled' : ''}>← Précédente</button><button class="text-link" data-card-next>Passer →</button></div>` : `<div class="empty-state"><span class="empty-icon">${svg.leaf}</span><h2>${deck.length ? 'Un pas de plus.' : 'Tu es à jour.'}</h2><p>${deck.length ? 'Tu as parcouru toutes les cartes de cette session.' : 'Aucune carte n’est à revoir dans cette sélection aujourd’hui.'}</p><button class="btn btn-primary" data-card-restart>Revoir toutes les cartes</button><a class="text-link" href="#learn">Retour au parcours →</a></div>`}</div><p class="revision-note muted">« À revoir » programme la carte pour demain ; « Retenu » pour dans trois jours. Tu peux toujours revoir toutes les cartes librement.</p>`;
  }
  function progress() {
    const correct = lessons.filter(l => state.quiz[l.id] === l.quiz.correct).length;
    const known = allCards.filter(c => state.cards[c.id]?.rating === 'known').length;
    return `<section class="page-intro"><span class="eyebrow">CHAQUE PAS COMPTE</span><h1>Ma progression</h1><p>Un repère pour ton apprentissage, à ton rythme.</p></section><section class="stats-grid"><div class="stat"><span class="stat-label">Leçons étudiées</span><strong>${done()}<small> / ${lessons.length}</small></strong><div class="progress-bar"><i style="width:${percent()}%"></i></div></div><div class="stat"><span class="stat-label">Quiz compris</span><strong>${correct}<small> / ${lessons.length}</small></strong><span class="muted small">D’après ta dernière réponse</span></div><div class="stat"><span class="stat-label">Cartes retenues</span><strong>${known}<small> / ${allCards.length}</small></strong><span class="muted small">D’après ta dernière auto-évaluation</span></div></section><div class="progress-layout"><section><div class="section-heading"><h2>Le chemin parcouru</h2></div><div class="curriculum-list">${lessons.map((l, i) => `<a class="curriculum-row" href="#lesson/${esc(l.id)}"><span class="curriculum-index ${state.completed[l.id] ? 'completed' : ''}">${state.completed[l.id] ? '✓' : String(i + 1).padStart(2, '0')}</span><span><strong>${esc(l.title)}</strong><small>${state.completed[l.id] ? 'Étudiée' : 'À découvrir'} · ${l.duration} min${state.quiz[l.id] === l.quiz.correct ? ' · Quiz compris' : ''}</small></span>${arrow}</a>`).join('')}</div></section><aside class="settings-card"><span class="eyebrow">TON CARNET, AVEC TOI</span><h2>Sauvegarder mes progrès</h2>${schoolSelector()}<p>Leçons, cartes, notes et favoris restent dans ce navigateur. Exporte une copie pour les conserver ou les transférer sur un autre appareil.</p><button class="btn btn-primary" data-export>Exporter ma progression ↓</button><label class="btn btn-secondary import-label" for="import-file">Restaurer une copie ↑</label><input class="visually-hidden" type="file" id="import-file" accept="application/json,.json"><p class="muted small">La restauration fusionne les données. Pour un même élément, la copie importée remplace la valeur actuelle.</p><p class="storage-status">${storageAvailable ? '● Sauvegarde locale disponible' : 'La sauvegarde locale est indisponible. Exporte une copie avant de fermer la page.'}</p></aside></div><aside class="callout"><p>Ces indicateurs décrivent uniquement tes leçons et tes révisions. Ils ne mesurent ni la foi ni la valeur d’une personne.</p></aside>`;
  }
  function sources() {
    const seen = new Set();
    const sources = lessons.flatMap(l => l.sources).filter(s => !seen.has(s.url) && seen.add(s.url));
    return `<section class="page-intro"><span class="eyebrow">APPRENDRE AVEC DES REPÈRES</span><h1>Sources & repères</h1><p>Comprendre d’où viennent les notions que tu apprends.</p></section><div class="callout"><span class="eyebrow">NOTRE APPROCHE</span><h2>Un parcours d’introduction</h2><p>${esc(content.note)}</p><p>Chaque leçon relie ses explications aux références concernées. Les fiches résument les idées avec des mots simples : elles ne reproduisent pas une traduction intégrale du Coran ou des hadiths.</p><p>Les tableaux de pratique indiquent les avis des écoles et leurs variantes. Les notices historiques et les prises de position internes aux courants sont distinguées.</p></div><section><div class="section-heading"><h2>La bibliothèque des références</h2><span class="muted">${sources.length} références</span></div><div class="sources-grid">${sources.map(s => `<article class="source-card"><span class="eyebrow">${esc(s.type || (s.url.includes('quran.com') ? 'Coran' : s.url.includes('sunnah.com') ? 'Hadith' : 'Étude & enseignement'))}</span><h3><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></h3><p>${esc(s.note || 'Référence utilisée dans les leçons du parcours.')}</p></article>`).join('')}</div></section><section><div class="section-heading"><h2>Les mots pour comprendre</h2></div><dl class="glossary">${(content.glossary || []).map(g => `<div><dt>${esc(g.term)}</dt><dd>${esc(g.definition)}</dd></div>`).join('')}</dl></section><p class="muted small">Les sources externes peuvent proposer différentes traductions et des explications en anglais. Elles nécessitent une connexion Internet.</p>`;
  }
  function schoolSelector() {
    return `<div class="school-choice"><label for="school-choice">Afficher les avis</label><select id="school-choice" data-school><option value="all" ${state.school==='all'?'selected':''}>Comparer les quatre écoles</option>${window.DEEN_SCHOOLS.map(s=>`<option value="${s.id}" ${state.school===s.id?'selected':''}>École ${esc(s.name.toLowerCase())}</option>`).join('')}</select><p class="muted small">Aucune école n’est choisie par défaut. Ce filtre personnalise les tableaux de pratique.</p></div>`;
  }
  function comparisons(l) {
    if (!l.comparisons) return '';
    const schools = window.DEEN_SCHOOLS.filter(s=>state.school==='all'||state.school===s.id);
    return `<section class="comparisons"><span class="eyebrow">COMPRENDRE LES DIFFÉRENCES</span><h2>Les avis des écoles</h2>${schoolSelector()}<p class="muted small">Repères usuels et simplifiés. Les variantes signalées font partie de l’histoire de chaque école.</p>${l.comparisons.map(row=>`<section class="comparison-topic"><h3>${esc(row.topic)}</h3><div class="school-opinions ${schools.length===1?'single':''}">${schools.map(s=>`<div><span class="eyebrow">${esc(s.name)}</span><p>${esc(row[s.id])}</p></div>`).join('')}</div><details class="comparison-sources"><summary>Références de cette comparaison</summary><ul class="source-list">${sourceLinks(row.sources.map(key=>window.DEEN_REFERENCES[key]))}</ul></details></section>`).join('')}</section>`;
  }
  function lessonFeature(l) {
    if (l.practice) return window.DEEN_WORKSHOP.practice(l);
    if (l.id === 'arabe-sons') return '<a class="btn btn-primary" href="#reading/sounds">Explorer les sons et les lettres →</a>';
    if (l.id === 'arabe-article') return '<a class="btn btn-primary" href="#reading">Continuer le parcours de lecture →</a>';
    if (l.feature==='names') return `<aside class="feature-link"><div><span class="eyebrow">ATELIER DE MÉMORISATION</span><h3>99 noms, un sens à la fois</h3><p>Arabe, translittération, sens et suivi personnel.</p></div><a class="btn btn-primary" href="#names">Explorer les noms ${arrow}</a></aside>`;
    if (l.feature==='alphabet') return `<aside class="feature-link"><div><span class="eyebrow">ATELIER D’ÉCRITURE</span><h3>Les lettres prennent forme</h3><p>Lettres isolées et liées, mots et noms d’Allah à repasser.</p></div><a class="btn btn-primary" href="#arabic">Ouvrir l’atelier d’écriture ${arrow}</a></aside>`;
    if (l.feature==='schools') return `<div class="school-profiles">${window.DEEN_SCHOOLS.map(s=>`<section class="school-profile"><span class="eyebrow">ÉCOLE ${esc(s.name)}</span><h3>${esc(s.imam)}</h3><span class="tag">${esc(s.dates)}</span><h4>Son berceau</h4><p>${esc(s.origin)}</p><h4>Son développement</h4><p>${esc(s.method)}</p><h4>Ses régions d’implantation</h4><p>${esc(s.regions)}</p><a class="text-link" href="${esc(s.source.url)}" target="_blank" rel="noopener noreferrer">Histoire & bibliographie ↗</a></section>`).join('')}</div>`;
    if (l.feature==='prayer') return `<section class="prayer-reference"><h2>Les cinq prières</h2><div class="prayer-grid">${[['Fajr','الفجر','Aube','2'],['Ẓuhr','الظهر','Après le zénith','4'],['ʿAṣr','العصر','Après-midi','4'],['Maghrib','المغرب','Coucher du soleil','3'],['ʿIshāʾ','العشاء','Nuit','4']].map(p=>`<div><span class="arabic" lang="ar" dir="rtl">${p[1]}</span><strong>${p[0]}</strong><span>${p[2]}</span><b>${p[3]} <small>rakʿāt</small></b></div>`).join('')}</div><p class="muted small">Unités obligatoires habituelles du résident. Ces moments sont des repères, pas des horaires calculés.</p><h3>Quelques mots à reconnaître</h3><dl class="phrase-list">${[['اللَّهُ أَكْبَرُ','Allāhu akbar','Allah est plus grand.'],['سُبْحَانَ رَبِّيَ الْعَظِيمِ','Subḥāna rabbiyal-ʿaẓīm','Gloire et pureté à mon Seigneur, l’Immense.'],['سُبْحَانَ رَبِّيَ الْأَعْلَى','Subḥāna rabbiyal-aʿlā','Gloire et pureté à mon Seigneur, le Très Haut.'],['السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ','As-salāmu ʿalaykum wa raḥmatullāh','Que la paix et la miséricorde d’Allah soient sur vous.']].map(p=>`<div><dt class="arabic" lang="ar" dir="rtl">${p[0]}</dt><dd><strong>${p[1]}</strong><span>${p[2]}</span></dd></div>`).join('')}</dl><p class="muted small">Sens français indicatifs. Les récitations complètes, leur nombre et leur statut s’apprennent dans le parcours de l’école retenue.</p></section>`;
    return '';
  }
  const normalizeText = s => String(s).normalize('NFD').replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g,'').toLowerCase();
  function nameCards() {
    const q=normalizeText(nameQuery);
    const filtered=window.DEEN_NAMES.filter(n=>(nameFilter==='all'||(nameFilter==='known'?state.names[n.id]:!state.names[n.id])) && normalizeText(`${n.arabic} ${n.transliteration} ${n.meaning} ${n.number}`).includes(q));
    return filtered.length ? filtered.map(n=>`<article class="name-card ${state.names[n.id]?'is-known':''}"><div class="name-card-top"><span class="lesson-number">${String(n.number).padStart(2,'0')}</span><button class="name-mark" data-name-mark="${n.id}" aria-pressed="${!!state.names[n.id]}" aria-label="${state.names[n.id]?'Marquer à revoir':'Marquer retenu'} : ${esc(n.transliteration)}">${state.names[n.id]?'✓':'+'}</button></div><h2 class="arabic" lang="ar" dir="rtl">${n.arabic}</h2><h3>${esc(n.transliteration)}</h3><p>${esc(n.meaning)}</p></article>`).join('') : '<div class="empty-state"><h2>Aucun nom dans cette sélection.</h2><p>Essaie un autre mot ou affiche tous les noms.</p></div>';
  }
  function names() {
    const known=window.DEEN_NAMES.filter(n=>state.names[n.id]).length;
    return `<section class="page-intro"><span class="eyebrow">CONNAÎTRE · COMPRENDRE · RETENIR</span><h1>Les plus beaux noms</h1><p>Un atelier pour explorer 99 noms, leur écriture et leur sens.</p></section><div class="module-toolbar"><a class="btn btn-primary" href="#cards/noms-allah">Réviser les 99 cartes ${arrow}</a><a class="text-link" href="#lesson/noms-allah">Lire la leçon et ses sources ↗</a><span class="tag" id="names-count">${known} / 99 retenus</span></div><aside class="callout compact"><p><strong>Une liste pédagogique courante.</strong> Le hadith authentique mentionne 99 noms sans les énumérer ici. Les listes détaillées et certains noms font l’objet de discussions. Les sens proposés sont des repères, pas des définitions exhaustives. <a class="text-link" href="#lesson/noms-allah">Comprendre cette distinction</a></p></aside><div class="names-controls"><label class="search-field"><span aria-hidden="true">⌕</span><input type="search" id="names-search" placeholder="Un nom, un sens, un numéro…" value="${esc(nameQuery)}" aria-label="Rechercher parmi les 99 noms"></label><div class="filter-bar">${[['all','Tous'],['todo','À apprendre'],['known','Retenus']].map(([id,label])=>`<button class="filter-chip ${nameFilter===id?'active':''}" data-name-filter="${id}" aria-pressed="${nameFilter===id}">${label}</button>`).join('')}</div></div><div class="names-grid" id="names-grid">${nameCards()}</div><p class="muted small">Le bouton + marque un nom comme retenu dans ton carnet. Tu peux toujours revenir dessus. La progression reste personnelle.</p>`;
  }
  function arabic() { return window.DEEN_WORKSHOP.writing(); }
  function reading() { return window.DEEN_WORKSHOP.reading(state.completed); }
  function render({ focus = true, resetDeck = false } = {}) {
    window.DEEN_WORKSHOP.cleanup();
    const parts = location.hash.replace(/^#/, '').split('/');
    const route = parts[0] || 'home';
    setActive(route);
    if (route === 'cards' && resetDeck) buildDeck();
    const views = { home, learn, cards, progress, sources, names, arabic, reading };
    main.innerHTML = route === 'lesson' ? lesson(parts[1]) : (views[route] || home)();
    if (route === 'arabic' || route === 'reading') window.DEEN_WORKSHOP.mount(() => render({focus:false}));
    if (focus) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
  }
  function search(query) {
    const target = document.querySelector('#search-results');
    const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const q = normalize(query.trim());
    if (!q) { target.innerHTML = '<p class="muted search-hint">Recherche une notion : intention, prière, Coran, comportement…</p>'; return; }
    const found = lessons.filter(l => normalize([l.title, l.description, ...l.sections.flatMap(s => [s.title, ...s.paragraphs]), ...l.takeaways].join(' ')).includes(q));
    target.innerHTML = found.length ? `<p class="muted small">${found.length} leçon${found.length > 1 ? 's' : ''}</p>${found.map(l => `<a class="search-result" href="#lesson/${esc(l.id)}"><span class="eyebrow">${esc(l.category)}</span><strong>${esc(l.title)}</strong><span>${esc(l.description)}</span></a>`).join('')}` : '<div class="empty-state"><h3>Aucune leçon trouvée</h3><p>Essaie un autre mot ou consulte le parcours.</p></div>';
  }
  function openSearch() {
    const dialog = document.querySelector('#search-dialog');
    const input = document.querySelector('#search-input');
    input.value = '';
    search('');
    if (!dialog.open) dialog.showModal();
    input.focus();
  }
  function exportProgress() {
    const blob = new Blob([JSON.stringify({ app: 'mon-deen', exportedAt: new Date().toISOString(), ...state }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `mon-deen-progression-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Ta copie de sauvegarde a été préparée.');
  }
  document.addEventListener('click', e => {
    const button = e.target.closest('button, a, [data-close]');
    if (!button) return;
    if (button.matches('[data-close]')) button.closest('dialog')?.close();
    if (button.matches('#search-toggle')) openSearch();
    if (button.matches('#theme-toggle')) {
      const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem('mon-deen-theme', theme); } catch {}
      button.setAttribute('aria-label', theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre');
    }
    if (button.matches('[data-filter]')) { filter = button.dataset.filter; render({ focus: false }); }
    if (button.matches('[data-bookmark]')) {
      const id = button.dataset.bookmark; state.bookmarks[id] = !state.bookmarks[id]; save();
      button.textContent = state.bookmarks[id] ? '★ Enregistrée' : '☆ Enregistrer';
      button.setAttribute('aria-pressed', !!state.bookmarks[id]);
      toast(state.bookmarks[id] ? 'Leçon ajoutée à ton carnet.' : 'Leçon retirée de tes favoris.');
    }
    if (button.matches('[data-answer]')) {
      const id = button.dataset.lesson;
      state.quiz[id] = Number(button.dataset.answer); save();
      document.querySelector('#quiz').outerHTML = quizMarkup(lessons.find(l => l.id === id));
      const feedback = document.querySelector('.quiz-feedback'); feedback.tabIndex = -1; feedback.focus({ preventScroll: true });
    }
    if (button.matches('[data-retry]')) {
      const id = button.dataset.retry; delete state.quiz[id]; save();
      document.querySelector('#quiz').outerHTML = quizMarkup(lessons.find(l => l.id === id));
      document.querySelector('[data-answer]').focus({ preventScroll: true });
    }
    if (button.matches('[data-complete]')) {
      const id = button.dataset.complete; state.completed[id] = !state.completed[id]; save();
      button.innerHTML = `${state.completed[id] ? '✓ Leçon étudiée · annuler' : 'Marquer comme étudiée'}${svg.check}`;
      button.classList.toggle('btn-primary', !state.completed[id]); button.classList.toggle('btn-secondary', !!state.completed[id]);
      button.setAttribute('aria-pressed', !!state.completed[id]);
      toast(state.completed[id] ? 'Un pas de plus. Ta progression est enregistrée.' : 'Leçon marquée comme à étudier.');
    }
    if (button.matches('[data-card-filter]')) { cardFilter = button.dataset.cardFilter; buildDeck(); render({ focus: false }); }
    if (button.matches('[data-reveal]')) { cardRevealed = true; render({ focus: false }); document.querySelector('[data-rate]')?.focus({ preventScroll: true }); }
    if (button.matches('[data-rate]') && deck[cardIndex]) {
      state.cards[deck[cardIndex].id] = { rating: button.dataset.rate, due: Date.now() + (button.dataset.rate === 'known' ? 3 : 1) * 86400000 };
      save(); cardIndex++; cardRevealed = false; render({ focus: false }); document.querySelector('[data-reveal], [data-card-restart]')?.focus({ preventScroll: true });
    }
    if (button.matches('[data-card-next]')) { cardIndex++; cardRevealed = false; render({ focus: false }); }
    if (button.matches('[data-card-prev]')) { cardIndex = Math.max(0, cardIndex - 1); cardRevealed = false; render({ focus: false }); }
    if (button.matches('[data-card-restart]')) { cardFilter = 'all'; buildDeck(); render({ focus: false }); }
    if (button.matches('[data-export]')) exportProgress();
    if (button.matches('[data-name-filter]')) {nameFilter=button.dataset.nameFilter; render({focus:false});}
    if (button.matches('[data-name-mark]')) {
      const id=button.dataset.nameMark; state.names[id]=!state.names[id]; save();
      document.querySelector('#names-grid').innerHTML=nameCards();
      document.querySelector('#names-count').textContent=`${window.DEEN_NAMES.filter(n=>state.names[n.id]).length} / 99 retenus`;
      document.querySelector(`[data-name-mark="${id}"]`)?.focus({preventScroll:true});
      toast(state.names[id]?'Nom marqué comme retenu.':'Nom remis dans la liste à apprendre.');
    }
    if (button.closest('#search-results') && button.matches('a')) document.querySelector('#search-dialog').close();
    if (button.matches('[data-action="install"], [data-install]')) install();
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'search-input') search(e.target.value);
    if (e.target.id === 'names-search') {nameQuery=e.target.value;document.querySelector('#names-grid').innerHTML=nameCards();}
    if (e.target.matches('[data-notes]')) {
      state.notes[e.target.dataset.notes] = e.target.value.slice(0, 4000); save();
      document.querySelector('#notes-status').textContent = storageAvailable ? 'Notes enregistrées sur cet appareil.' : 'Notes en mémoire : exporte une copie avant de fermer.';
    }
  });
  document.addEventListener('change', async e => {
    if(e.target.matches('[data-school]')) {state.school=e.target.value;save();render({focus:false});toast(state.school==='all'?'Comparaison des quatre écoles activée.':'Les tableaux affichent l’école sélectionnée.');return;}
    if (e.target.id !== 'import-file') return;
    const file = e.target.files?.[0]; if (!file) return;
    try {
      if (file.size > 1000000) throw new Error('Ce fichier est trop volumineux. Choisis une sauvegarde Mon Deen de moins de 1 Mo.');
      const imported = sanitize(JSON.parse(await file.text()), true);
      for (const key of ['completed', 'bookmarks', 'quiz', 'cards', 'notes', 'names']) state[key] = { ...state[key], ...imported[key] };
      if (imported.lastLesson) state.lastLesson = imported.lastLesson;
      state.school = imported.school;
      save(); render({ focus: false }); toast('Ta progression a été restaurée.');
    } catch (error) { toast(error instanceof SyntaxError ? 'Ce fichier JSON est illisible.' : error.message); }
    e.target.value = '';
  });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
  });
  const searchDialog = document.querySelector('#search-dialog');
  searchDialog.addEventListener('click', e => { if (e.target === searchDialog) { const r = searchDialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) searchDialog.close(); } });
  window.addEventListener('hashchange', () => render({ resetDeck: true }));
  async function install() {
    if (deferredInstall) { await deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; }
    else toast('Sur iPhone : Safari → Partager → Sur l’écran d’accueil. Sur ordinateur : utilise l’option Installer du navigateur.');
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
  let offlineReady = false;
  function updateNetwork() {
    const el = document.querySelector('#network-status');
    if (!el) return;
    el.textContent = !navigator.onLine ? 'Hors connexion' : offlineReady ? 'Prêt hors ligne' : 'Carnet personnel';
    el.title = offlineReady ? 'Les leçons et les cartes sont disponibles hors connexion. Les liens sources nécessitent Internet.' : 'La préparation hors connexion se fait après le chargement complet.';
  }
  window.addEventListener('online', updateNetwork); window.addEventListener('offline', updateNetwork);
  if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) {
    navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(() => { offlineReady = true; updateNetwork(); }).catch(() => { offlineReady = false; updateNetwork(); });
  }
  updateNetwork();
  const themeButton = document.querySelector('#theme-toggle');
  themeButton?.setAttribute('aria-label', document.documentElement.dataset.theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre');
  buildDeck(); render({ focus: false });
})();
