// Original location diagrams: traditional makharij, not an anatomical animation.
// References: ImamFaisal.com/articulation/ and al-Jazariyyah, chapter 2.
(() => {
  const points = {
    cavity: ['Cavité de la bouche et de la gorge', 235,145,'Pour le ā long : le son se prolonge dans la cavité, sans fermeture en un point précis.'],
    lips: ['Les deux lèvres', 358,166,'Observe la rencontre des lèvres.'],
    teeth: ['Pointe de la langue · base des incisives', 321,139,'La pointe rejoint la base des dents du haut.'],
    interdental: ['Pointe de la langue · bord des incisives', 333,158,'La pointe arrive légèrement au bord des dents, sans la sortir excessivement.'],
    middle: ['Milieu de la langue · palais', 248,129,'Le milieu de la langue se rapproche du palais.'],
    throatMiddle: ['Milieu de la gorge', 140,243,'Le resserrement se situe dans la gorge, sans forcer.'],
    throatUpper: ['Haut de la gorge · vers la bouche', 146,199,'Repère la zone la plus proche de la bouche parmi les trois zones de la gorge.'],
    tap: ['Pointe de la langue · gencives supérieures', 303,131,'Un battement bref de la pointe ; évite de multiplier les roulements.'],
    hiss: ['Pointe · près des incisives inférieures', 323,181,'Un passage étroit laisse sortir le sifflement entre les dents.'],
    side: ['Bord de la langue · molaires supérieures', 220,143,'Le contact se fait sur un côté de la langue : observe aussi la vue du dessus.'],
    lipTeeth: ['Lèvre inférieure · incisives supérieures', 342,159,'Les dents du haut rejoignent l’intérieur de la lèvre du bas.'],
    backQ: ['Fond de la langue · palais postérieur', 181,151,'Qāf se forme plus en arrière que kāf.'],
    backK: ['Arrière de la langue · plus en avant', 205,135,'Kāf est un peu plus en avant que qāf.'],
    rim: ['Bord antérieur et pointe · gencives', 292,132,'L’avant du bord de la langue rejoint les gencives du haut.'],
    nasalTip: ['Pointe de la langue · gencives supérieures', 309,136,'La pointe prend appui ; une résonance passe aussi par le nez.'],
    throatDeep: ['Fond de la gorge · vers le larynx', 140,286,'C’est la zone la plus profonde, du côté du larynx.'],
    round: ['Lèvres arrondies', 358,166,'Pour le w consonne : arrondis les lèvres sans les fermer complètement.']
  };
  const mapping = ['cavity','lips','teeth','interdental','middle','throatMiddle','throatUpper','teeth','interdental','tap','hiss','hiss','middle','hiss','side','teeth','interdental','throatMiddle','throatUpper','lipTeeth','backQ','backK','rim','lips','nasalTip','throatDeep','round','middle'];
  const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function topView(side) {
    return `<svg class="mouth-top" viewBox="0 0 320 230" role="img" aria-label="Vue du dessus : ${side?'bord latéral de la langue près des molaires':'bord antérieur de la langue près des gencives'}"><text x="160" y="22" text-anchor="middle">Vue du dessus · avant en haut</text><path class="anatomy-outline" d="M65 200V110C65 20 255 20 255 110V200"/><path class="tongue-fill" d="M102 204V120C102 62 218 62 218 120V204Z"/><g class="teeth-fill">${[100,128,156,184].map(x=>`<rect x="${x}" y="50" width="24" height="19" rx="5"/>`).join('')}${[91,123,155].map(y=>`<rect x="69" y="${y}" width="25" height="26" rx="5"/><rect x="226" y="${y}" width="25" height="26" rx="5"/>`).join('')}</g><path class="contact-line" d="${side?'M101 113V183':'M110 107C113 72 207 72 210 107'}"/>${side?'<path class="contact-alternative" d="M219 113V183"/>':''}<text x="160" y="157" text-anchor="middle">Langue</text><text x="160" y="224" text-anchor="middle">${side?'Un bord ou les deux, selon l’articulation':'Contact sur le bord avant'}</text></svg>`;
  }
  function diagram(letter) {
    const i=window.DEEN_ARABIC.indexOf(letter),key=mapping[i],p=points[key];
    const [label,x,y,tip]=p, nasal='من'.includes(letter.letter), throat=key.startsWith('throat');
    const marker=key==='cavity'?'<path class="cavity-highlight" d="M140 287V220Q144 144 212 137H320"/>':`<circle class="contact-halo" cx="${x}" cy="${y}" r="19"/><circle class="contact-dot" cx="${x}" cy="${y}" r="7"/>`;
    const title=`${letter.name} : ${label}`;
    return `<section class="articulation-panel" data-articulation="${key}"><div class="articulation-heading"><span class="eyebrow">OÙ SE FORME LE SON ?</span><h3>${label}</h3></div><div class="articulation-layout"><figure class="mouth-figure"><svg class="mouth-profile" viewBox="0 0 480 350" role="img" aria-labelledby="mouth-title mouth-desc"><title id="mouth-title">${escape(title)}</title><desc id="mouth-desc">Vue de profil, bouche vers la droite. Le repère violet situe la zone : ${escape(label)}.${nasal?' Le repère en pointillés montre aussi la résonance nasale.':''} Les organes sont dessinés dans une position de référence, pas dans la posture exacte de cette lettre.</desc>
      <path class="head-fill" d="M111 310V159C89 93 141 37 217 36C277 32 309 52 320 89L357 112Q364 120 342 124L345 145Q361 149 363 157L349 165Q365 174 350 185L337 190Q336 222 292 231L261 244V310Z"/>
      <path class="cavity-fill" d="M128 309V199Q133 134 184 115Q249 88 323 128L330 151L350 160L331 180Q284 208 205 212L159 229V309Z"/>
      <path class="nose-cavity" d="M175 95Q249 53 310 99L327 116Q266 88 192 117Z"/>
      <path class="anatomy-outline" d="M180 118Q252 92 321 128M180 118Q166 137 171 155"/>
      <path class="tongue-fill" d="M160 229C164 187 178 161 219 164C261 165 291 173 323 177Q310 206 231 211L177 237Z"/>
      <path class="teeth-fill" d="M321 129L334 134L331 155L320 153ZM322 181L333 179L333 198L319 202Z"/>
      <path class="lip-outline" d="M345 145Q361 149 363 157L349 165Q365 174 350 185"/>
      <g class="anatomy-labels"><path d="M230 78V49H266"/><text x="272" y="53">Nez</text><path d="M256 112L280 75H347"/><text x="353" y="80">Palais</text><path d="M332 137L378 119H405"/><text x="409" y="124">Dents</text><path d="M359 171H393"/><text x="398" y="176">Lèvres</text><path d="M252 188L282 262H326"/><text x="333" y="268">Langue</text><path d="M130 253H49"/><text x="16" y="245">Gorge</text></g>
      ${throat?['throatUpper','throatMiddle','throatDeep'].filter(k=>k!==key).map(k=>`<circle class="throat-reference" cx="${points[k][1]}" cy="${points[k][2]}" r="5"/>`).join(''):''}${marker}${nasal?'<ellipse class="nasal-highlight" cx="257" cy="93" rx="50" ry="18"/>':''}
      <text class="diagram-orientation" x="240" y="336" text-anchor="middle">Profil · la bouche s’ouvre vers la droite →</text></svg><figcaption><span class="legend-dot" aria-hidden="true"></span>Zone à repérer${nasal?' · pointillés : résonance dans le nez':''}</figcaption></figure>
      <div class="articulation-notes"><p class="articulation-tip">${tip}</p>${key==='side'||key==='rim'?topView(key==='side'):''}${throat?`<ol class="throat-levels"><li ${key==='throatUpper'?'aria-current="true"':''}>Vers la bouche <span lang="ar" dir="rtl">خ غ</span></li><li ${key==='throatMiddle'?'aria-current="true"':''}>Milieu <span lang="ar" dir="rtl">ح ع</span></li><li ${key==='throatDeep'?'aria-current="true"':''}>Vers le larynx <span lang="ar" dir="rtl">ء ه</span></li></ol>`:''}${letter.heavy?'<p><strong>Lettre lourde :</strong> l’arrière de la langue se relève aussi. Le point violet indique son lieu principal, pas tous les mouvements.</p>':''}${nasal?'<p><strong>Et le nez :</strong> il participe à la résonance nasale (ghunna). Il ne remplace pas le contact de la langue ou des lèvres.</p>':''}${letter.letter==='ا'?'<p><strong>Alif ≠ hamza :</strong> ce schéma concerne le ā de prolongation. La hamza ء vient du fond de la gorge ; le nom « alif » commence lui-même par une hamza.</p>':''}${'وي'.includes(letter.letter)?'<p><strong>Ici, la consonne.</strong> Quand cette lettre prolonge une voyelle (ou / i long), le repère devient la cavité, comme pour l’alif de prolongation.</p>':''}<p class="muted small">Schéma de localisation simplifié. La langue est dessinée au repos pour te repérer ; sa position exacte change quand tu prononces.</p></div></div><details class="articulation-sources"><summary>Sources des repères</summary><p>Repères traditionnels des makhārij : <a href="https://imamfaisal.com/articulation/" target="_blank" rel="noopener noreferrer">cours d’Imam Faisal</a> et <a href="https://muslimlearn.com/jazariyyah/chapter-02.html" target="_blank" rel="noopener noreferrer">chapitre des points d’articulation d’al-Jazariyyah</a>. Schémas originaux réalisés pour Mon Deen.</p></details></section>`;
  }
  window.DEEN_ARTICULATION={diagram,mapping};
})();
