# Nadogradnja: prerender lista + verzioniranje resursa

Testirano na vašem projektu: `node build.mjs` ispisuje `43 pages` i
`no broken local links`, dvije izgradnje istih izvora daju bajt po bajt
identične datoteke (to traži provjera u `.github/workflows/build.yml`), a novi
JavaScript prošao je smoke testove u jsdom-u: oznake stanja, filtri
nadolazeća/prošla/sva, sortiranje, pretraga novosti, straničenje, filtar
poslova i sve prazne poruke.

## Kako primijeniti

Iz korijena repozitorija:

```bash
git apply nadogradnja.patch
node build.mjs                 # mora ispisati: no broken local links
git add -A
git commit -m "Prerender lista u buildu + verzioniranje CSS-a i JS-a"
```

Ako `git apply` prijavi sukob (jer ste u međuvremenu nešto mijenjali), umjesto
zakrpe prekopirajte datoteke iz ove mape na ista mjesta u projektu i **obrišite
`js/util.js`** — više se ne koristi:

```
build.mjs
css/base.css
js/main.js  js/events.js  js/news.js  js/careers.js
src/pages/hr/home.html  src/pages/en/home.html
README.md
```

Prije oba načina obavezno riješite malo/veliko slovo u mapi s dokumentima,
inače build i dalje pada:

```bash
git mv Dokumenti dokumenti-tmp && git mv dokumenti-tmp dokumenti
git commit -m "Preimenuj Dokumenti u dokumenti"
```

## Što se mijenja

**1. Kartice ispisuje generator, ne preglednik.** `build.mjs` je dobio odjeljak
*prerendered card lists*: `eventCard`, `newsCard`, `jobCard` i `prerenderLists`
upisuju kartice u prazne `<div>`-ove (`events-list`, `news-preview`,
`news-list`, `jobs-list`) te brojače `news-count` i `jobs-count`. Markup i
klase identični su onome što je prije sastavljao JavaScript, pa `css/base.css`
nije trebalo dirati osim jednog novog pravila.

Rezultat po stranici: sadržaj postoji bez JavaScripta i za robote koji ne
izvršavaju skripte, indeksne stranice dobivaju prave interne poveznice na svaku
objavu, a prvi prikaz ne čeka `fetch`. Naslovnica sada šalje dvije skripte
umjesto četiri i ne dohvaća `news.json` (14,8 kB) ni `events.json`; stranica
novosti gubi tri mrežna zahtjeva. HTML naslovnice raste s 4,4 kB na 5,6 kB
gzipano — jedini trošak, i plaća se jednom.

**2. Datum ostaje na pregledniku.** Generator ispisuje `data-date`,
`data-time`, `data-date-end` i `data-time-end`, a `js/events.js` iz njih
izračuna *Uskoro / Danas / Završeno* i redanje „najbliže prvo“. Time izgradnja
ostaje deterministička; da je stanje zapečeno u HTML, CI bi pao prvog dana kad
nekom događanju prođe datum.

**3. Verzioniranje resursa.** Svaka poveznica na CSS i JS dobiva `?v=<hash>`
izračunan iz sadržaja te datoteke (`stampAssets`). Promijenite `base.css` →
mijenja se samo njegov hash i preglednik preuzme samo njega. Nitko više ne visi
na starom stilu nakon objave. Provjera lokalnih linkova u buildu sada odbacuje
`?v=` prije traženja datoteke, pa su i verzionirane poveznice pokrivene.

**4. `js/` bez uvoza modula.** `js/util.js` je obrisan, a `main.js`, `events.js`,
`news.js` i `careers.js` su samostalni. To nije kozmetika: da bi `?v=` radio,
datoteka ne smije uvoziti drugu datoteku bez verzije. Ukupno je JS-a manje
(18,4 kB umjesto 25,4 kB neminificirano) jer je nestao sav kod za sastavljanje
kartica.

**5. Datumski raspon.** `fmtRange` sada skuplja isti mjesec u
„11.–12. lipnja 2026.“ umjesto „11. lipnja 2026. – 12. lipnja 2026.“, kako je
prije izgledalo samo na karticama. Vidi se i na stranicama događanja.

## Na što pripaziti kod budućih izmjena

- Broj objava po stranici stoji na dva mjesta: `NEWS_PER_PAGE` /
  `JOBS_PER_PAGE` u `build.mjs` i `PER_PAGE` u `js/news.js` / `js/careers.js`.
- U buildu ne ispisujte ništa što ovisi o današnjem datumu.
- Ako ikad vratite modularni `import` u `js/`, verzioniranje prestaje pokrivati
  uvezenu datoteku.

Detaljniji opis je u `README.md`, novi odjeljak **10a. Liste, JavaScript i
predmemorija**.
