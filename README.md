# Mon Deen

[Ouvrir Mon Deen](https://lilegyy.github.io/mon-deen/)

Version du 31 octobre 2026 : carnet personnel en français pour découvrir les bases de l’islam. Le projet Révise STL reste dans son dossier d’origine.

## Dans l’application

- Vingt-sept leçons sourcées : fondements, noms d’Allah, pratique, écoles, salafiyya, Dalā’il al-Khayrāt et lecture de l’arabe.
- Atelier de 99 noms avec sens français, translittération et suivi.
- Atelier d’écriture : 28 lettres, modèles isolés / début / milieu / fin, 10 mots vocalisés et les noms d’Allah à repasser. Annuler un trait, effacer, cacher le modèle et imprimer une fiche.
- Espace distinct « Lire le Coran » : 14 étapes, 45 exercices avec aides à révéler, alphabet et points d’articulation, voyelles, sukūn, shadda, liaisons et premières règles de tajwid.
- Al-Fātiḥa et al-Ikhlāṣ : 11 versets avec récitation d’al-Ḥuṣarī diffusée depuis EveryAyah, répétition en boucle et repères de lecture. Connexion nécessaire pour l’audio. Cadre pédagogique : Ḥafṣ d’après ʿĀṣim, sans lien avec le choix d’une école juridique.
- Comparaison des quatre écoles dans les fiches de pratique, avec filtre mémorisé ; aucune école choisie par défaut.
- Thème violet, lavande et ivoire.
- Une lecture guidée des Dalā’il al-Khayrāt : auteur, contenu, vocabulaire, rythme de lecture, avis attribués et distinction des sources.
- Un quiz corrigé par leçon et 181 cartes mémoire.
- Recherche, favoris, notes personnelles, suivi des leçons étudiées.
- Révision des cartes demain ou dans trois jours, avec révision libre toujours disponible.
- Sauvegarde dans le navigateur, export et restauration JSON.
- Affichage PC et téléphone, mode sombre, installation et cache hors connexion.

Les leçons sont des reformulations pédagogiques, pas des traductions littérales des textes. Les références sont consultables dans chaque leçon et dans Sources & repères. Les comparaisons exposent des positions usuelles et signalent les variantes sans prétendre recenser toutes les divergences. La fiche sur la salafiyya distingue points de vue internes et recherche historique. La liste de 99 noms est identifiée comme une liste pédagogique répandue, dont l’énumération n’est pas unanimement authentifiée.

## Ouvrir localement

Depuis ce dossier, lancer `python -m http.server 8767 --bind 127.0.0.1 --directory dist`, puis ouvrir http://127.0.0.1:8767. Un double-clic sur index.html permet de consulter l’application, mais l’installation et le fonctionnement hors connexion demandent HTTP local ou HTTPS.

## Publier sur GitHub Pages

Le code est conservé dans la branche `main`. GitHub Pages publie la branche `gh-pages`, qui contient directement le contenu de `dist/`. Les chemins sont relatifs. Aucun compte, serveur de données ou compilation n’est requis pour utiliser l’application. Le fichier `.nojekyll` conserve la publication statique telle quelle.

Pour une mise à jour : enregistrer les changements dans `main`, pousser cette branche, puis exécuter `git subtree push --prefix dist origin gh-pages`. La configuration locale de l’autre hébergement est exclue du dépôt.

## Ajouter une leçon

Les six leçons initiales sont dans `dist/content.js`. Les premiers parcours et références sont dans `dist/curriculum.js`, la fiche Dalā’il al-Khayrāt dans `dist/dalail.js`, les 99 noms dans `dist/names.js` et les 28 lettres dans `dist/arabic.js`. Chaque leçon possède un identifiant stable, un titre, une catégorie, une durée de lecture estimée, une description, des sections, des points essentiels, un exercice de réflexion, des sources, un quiz et des cartes. Les compteurs s’adaptent au nombre de leçons.

Conserver les identifiants existants et l’ordre des cartes déjà publiées pour préserver les progrès. Vérifier les sources de chaque nouveau contenu. Les suggestions d’organisation personnelle doivent rester distinctes des prescriptions religieuses. Les divergences doivent être attribuées et expliquées lorsqu’elles sont abordées.

Après une modification, incrémenter `VERSION` dans `dist/sw.js`. Ajouter les nouveaux fichiers nécessaires au cache `ASSETS`. Fermer les anciennes fenêtres pour permettre l’activation d’une mise à jour.

## Données et hors connexion

La progression est propre au navigateur et à l’adresse du site. Elle n’est pas synchronisée automatiquement. Exporter avant de changer d’appareil ou d’hébergement. La restauration fusionne les éléments ; pour un identifiant déjà présent, la valeur importée remplace celle du navigateur.

L’indication « Prêt hors ligne » confirme l’activation du cache de l’application. Les liens externes vers les sources demandent Internet. Les conditions de conservation du cache dépendent du navigateur. La progression ne mesure que l’activité d’apprentissage.

Les polices locales DM Sans et Noto Naskh Arabic, avec leurs licences sont conservées dans `dist/assets/fonts/`.

Le parcours de lecture vise le déchiffrage avant même la compréhension du vocabulaire. Les écoutes des noms des lettres et les cours détaillés d’articulation restent des liens externes. Les récitations de deux sourates sont intégrées par verset. L’application ne reconnaît pas l’écriture ni la voix et ne certifie pas la récitation : l’apprentissage complet du Coran demande de pratiquer les passages inconnus, les arrêts et les cas particuliers avec correction orale.

Les données du parcours de lecture sont dans `dist/reading.js`, ses ateliers dans `dist/arabic-workshop.js` et leur présentation dans `dist/workshop.css`. Les anciens identifiants de leçons et de cartes sont conservés pour préserver les progrès. Les tracés sont temporaires et s’effacent lors d’un changement de modèle ou d’une navigation.

## Vérifications

Contrôles effectués : intégrité des 15 leçons, 99 noms et 28 lettres ; navigation, recherche, quiz corrigé, cartes mémoire, choix d’école et retour à la comparaison, noms retenus conservés après rechargement, export JSON, mode sombre. Affichage vérifié à 390 px et sur ordinateur, sans débordement horizontal. Les sons sont accessibles par liens externes ; les modèles d’écriture sont typographiques, sans animation certifiée de l’ordre des traits. Aucun essai sur un iPhone physique ni relecture intégrale par un enseignant n’a été effectué.

Ajout du 31 octobre : `npm ci` puis `npm test` vérifient sans navigateur les 112 sélections de forme, les 10 mots, les 99 noms et Allah, le tracé et son annulation, les 14 étapes, les 45 exercices, les quiz, les commandes audio et la préservation d’une ancienne sauvegarde. Les 11 adresses audio répondent avec un fichier MP3. Ces tests utilisent un contexte de dessin simulé ; ils ne valident ni le rendu visuel, ni la qualité phonétique, ni les gestes sur un téléphone réel. La nouvelle interface n’a pas fait l’objet d’une vérification visuelle dans un navigateur.
