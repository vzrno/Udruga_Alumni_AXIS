# Alumni AXIS Split — web stranica

Dvojezična statična stranica (hrvatski + engleski). Bez baze i bez servera:
HTML, CSS i JavaScript. Svaka novost i svako događanje imaju vlastitu adresu,
pa se mogu podijeliti i Google ih indeksira.

---

## 1. Struktura

```
.
├── index.html  o-nama.html  dogadanja.html  novosti.html          ⟵ GENERIRANO
├── poslovi.html  clanstvo.html  kontakt.html  privatnost.html
├── 404.html  sitemap.xml  robots.txt  feed.xml
├── novosti/<slug>.html         stranica po novosti          ⟵ GENERIRANO
├── dogadanja/<slug>.html       stranica po događanju        ⟵ GENERIRANO
├── en/                         cijela engleska verzija      ⟵ GENERIRANO
│   ├── index.html  about.html  events.html  news.html
│   ├── careers.html  membership.html  contact.html  privacy.html
│   ├── news/<slug>.html   events/<slug>.html   feed.xml
│
├── src/                        ⟵ OVDJE SE UREĐUJE
│   ├── partials/
│   │   ├── base.html        okvir dokumenta (head, SEO, hreflang, JSON-LD)
│   │   ├── header.html      navigacija + prebacivanje jezika
│   │   ├── footer.html      footer
│   │   ├── article.html     izgled stranice novosti/događanja
│   │   └── 404.html         dvojezična stranica za nepostojeće adrese
│   ├── pages/hr/  pages/en/  sadržaj pojedinih stranica
│   └── i18n/hr.json  en.json  meni, footer, gumbi, poruke JS-a
│
├── data/                       ⟵ SADRŽAJ
│   ├── events.json   novosti.json  jobs.json
│
├── css/     base.css (stil), fonts.css (@font-face), icons.css (SVG ikone)
├── fonts/   woff2 datoteke (Archivo, IBM Plex Sans)
├── vendor/  bootstrap.min.css, bootstrap.bundle.min.js
├── js/      util.js, main.js, events.js, news.js, careers.js
├── images/  brand/ events/ udruga/  (sve 1400×933, uz svaku i -700 varijanta 700×467)
├── dokumenti/  statut i pristupnice (PDF) — malim slovom, bez razmaka u nazivima
├── .github/workflows/build.yml   provjera na svaki push
└── build.mjs                     generator
```

Datoteke u korijenu, u `en/`, `novosti/` i `dogadanja/` **ne uređuju se ručno** —
generator ih prepisuje (mape `novosti/`, `dogadanja/`, `en/news/` i `en/events/`
briše i stvara iznova pri svakom buildu). Sadržaj se mijenja u `src/` i `data/`.

> **Velika i mala slova su važna.** Windows ne razlikuje `Dokumenti` od
> `dokumenti`, ali GitHub Pages i svaki Linux server razlikuju. Mapa se zove
> `dokumenti` (malo d), slike i PDF-ovi nemaju razmake ni č ć ž š đ u nazivu.
> Izvorne datoteke (stari nazivi, PNG/JPG originali) namjerno nisu u projektu —
> čuvaj ih izvan repozitorija.

---

## 2. Build

Potreban je Node.js 18+.

```bash
node build.mjs
```

Ispis: `45 pages, 2 feeds, sitemap, robots` i `no broken local links`. Ako neki
lokalni link (slika, PDF, CSS) pokazuje na datoteku koja ne postoji, build ju
imenuje i vrati grešku.

Lokalni pregled (zbog `fetch` na `data/*.json` ne radi dvoklikom na datoteku):

```bash
npx serve .          # ili: python3 -m http.server 5173
```

U VS Code-u isto radi ekstenzija **Live Server**.

---

## 3. Dodavanje sadržaja

### Nova novost

U `data/news.json`, na početak polja. **`slug` je obavezan** — od njega nastaje
adresa stranice (`novosti/<slug>.html`), pa ga nakon objave ne mijenjaj, inače
stara poveznica prestane raditi.

```json
{
  "id": 11,
  "slug": { "hr": "radionica-o-umjetnoj-inteligenciji", "en": "workshop-on-artificial-intelligence" },
  "date": "2026-10-05",
  "dateEnd": null,
  "time": "18:00",
  "endTime": "19:30",
  "image": "images/events/naziv-slike.webp",
  "title": { "hr": "Naslov", "en": "Title" },
  "location": { "hr": "Split, Kopilica 5", "en": "Split, Kopilica 5" },
  "tags": { "hr": ["radionica"], "en": ["workshop"] },
  "description": { "hr": "Tekst…\n\nDrugi odlomak.", "en": "Text…\n\nSecond paragraph." },
  "agenda": { "hr": [{ "time": "18:00", "topic": "Uvod" }], "en": [{ "time": "18:00", "topic": "Introduction" }] },
  "board": { "hr": [], "en": [] }
}
```

- `time` je samo početno vrijeme (`"18:00"`); završetak ide u `endTime`, ne kao `"18:00 – 19:30"`.
- `\n\n` u tekstu postaje novi odlomak na stranici.
- `agenda` i `board` mogu se izostaviti; tada se ti dijelovi ne prikazuju.
- Ako je `description` samo web adresa, stranica nudi poveznicu na vanjsku objavu.
- Slug bez č ć ž š đ i bez razmaka. Pravilo: naslov malim slovima, riječi
  spojene crticom, do šest riječi.

Objave o samoj Udruzi (skupštine, članstvo u ASUS-u, odluke) nemaju fotografiju,
pa koriste brendiranu sliku sa značkom: `images/udruga/znacka-tamna.webp`
(crna podloga) ili `znacka-krem.webp` (krem podloga). Obje su u standardnoj
dimenziji i imaju `-700` varijantu.

### Novo događanje

Isto, u `data/events.json` (`dogadanja/<slug>.html`). Dodatno: `endTime`,
`highlights` i `url` za vanjsku prijavu. Događanje je „Nadolazeće“ dok mu ne
prođe datum i vrijeme završetka; naslovnica prikazuje tri najbliža, a
`dogadanja.html` cijelu arhivu.

### Novi oglas za posao

U `data/jobs.json`; `type` je `"job"` ili `"education"`, `deadline` je neobavezan
(`"2026-10-31"`). Oglas s prošlim rokom sam nestaje sa stranice; oglase bez roka
povremeno obriši ručno.

### Nova slika

Sve sadržajne slike imaju **istu dimenziju: 1400 × 933 px (omjer 3:2)**, uz
kopiju od 700 × 467 px za mobitele (`<naziv>-700.webp`). Naziv bez razmaka i
dijakritika, format WebP.

Najjednostavnije: stavi original (PNG/JPG, bilo koje veličine) u `images/events/`
ili `images/udruga/` i pokreni

```bash
python3 tools/slika.py images/events/moja-slika.jpg
```

Skripta obreže sliku na 3:2 iz sredine, spremi obje veličine u WebP i obriše
original. Ako je original uži od 900 px (npr. plakat ili screenshot), umjesto
mutnog povećavanja stavlja ga na zamućenu pozadinu — tako su riješene slike
CIET-a, Tjedna struke i Science Comes to Town, koje su bile 300–600 px.

---

## 4. Prijevodi

| Što mijenjaš | Gdje |
| --- | --- |
| meni, footer, gumbi, poruke JS-a | `src/i18n/hr.json`, `src/i18n/en.json` |
| tekst stranice | `src/pages/hr/*.html`, `src/pages/en/*.html` |
| naslov i opis za Google | `<!--{ ... }-->` na vrhu svake stranice |
| novosti, događanja, poslovi | `data/*.json` |

Nova stranica: datoteka u `src/pages/hr/` **i** `src/pages/en/`, pa red u polje
`PAGES` u `build.mjs`:

```js
{ id: "projekti", hr: "projekti.html", en: "en/projects.html" },
```

Time ulazi u meni, footer, sitemap i dobiva `hreflang` oznake. `nav: false`
drži stranicu izvan menija (tako je riješena stranica o privatnosti).

---

## 5. Prije objave — tri obavezne stvari

1. **Adresa stranice.** U `build.mjs` je postavljena `https://alumniaxis-st.hr`.
   Ako se domena ikad promijeni, promijeni tu jednu konstantu i pokreni build —
   od nje zavise `canonical`, `hreflang`, `sitemap.xml`, RSS, JSON-LD i slika za
   dijeljenje.

2. **Obrasci (Netlify Forms).** Pristupnica (`name="pristupnica"`) i kontakt
   obrazac (`name="kontakt"`) šalju se preko Netlifyja — stranica mora biti
   hostana na Netlifyju. Jednokratno u Netlifyju:
   - **Forms → Enable form detection**, zatim novi deploy (bilo koji `git push`
     ili *Deploys → Trigger deploy*); tek tada Netlify „vidi“ obrasce;
   - **Project configuration → Notifications → Emails and webhooks → Form
     submission notifications → Add notification → Email notification**,
     adresa `alumniaxis.st@gmail.com`, obrazac *Any form* (ili posebno za svaki).
   Sve predaje vide se i u kartici **Forms** (izvoz u CSV).
   Nakon slanja posjetitelj ide na `hvala.html` / `en/thank-you.html`
   (`?obrazac=pristupnica` ili `?obrazac=kontakt` bira koji se tekst prikazuje);
   te stranice nisu u sitemapu i imaju `noindex`. Naslov obavijesnog maila
   postavlja skriveno polje `subject` (npr. „Nova pristupnica · Ana Horvat“).
   `netlify.toml` postavlja sigurnosna zaglavlja i predmemoriju za fonte i slike.
   Pravila za izmjene obrazaca: `data-netlify="true"`, skriveno polje
   `form-name` i polje `bot-field` moraju ostati; novo polje mora postojati u
   HTML-u (Netlify ga ne prima ako ga nije vidio pri deployu). Polja u skrivenim
   odjeljcima (`data-group`) šalju se samo kad je odabran odgovarajući status.
   Lokalno (`python -m http.server`) slanje javlja grešku — to je očekivano,
   radi tek na Netlifyju.

3. **Google Search Console.** Prijavi `sitemap.xml` i provjeri da su prepoznate
   obje jezične verzije (*International Targeting*). Nakon toga u *Rich Results
   Test* provjeri jednu stranicu događanja — treba prepoznati `Event`.

---

## 6a. Zamjena postojeće (žive) stranice

1. Napravi kopiju stare mape (ili se osloni na Git povijest).
2. U repozitoriju obriši **sve osim** `.git/` i, ako postoji, `CNAME`
   (datoteka s domenom za GitHub Pages — bez nje domena prestaje raditi).
3. Kopiraj sadržaj zipa u mapu.
4. `node build.mjs` — mora ispisati `no broken local links`.
5. `git add -A && git commit -m "Nova verzija stranice" && git push`.
   Ako stranica ide na hosting preko FTP-a: prenesi cijelu mapu osim `src/`,
   `tools/`, `.github/` i `package.json` (nisu potrebni na serveru, ali ne smetaju).
6. U Google Search Console: **Sitemaps → dodaj `sitemap.xml`** i, po želji,
   *URL Inspection → Request indexing* za naslovnicu.

> **404 stranica** koristi putanje od korijena domene (`/css/…`). Radi na vlastitoj
> domeni i lokalnom serveru; ako je stranica privremeno na
> `korisnik.github.io/repozitorij/`, 404 će biti bez stila dok se ne spoji domena.

Sve adrese koje je Google mogao indeksirati ostaju iste (`novosti.html`,
`clanstvo.html`, pojedine objave…). Jedina promijenjena adresa je CIET objava;
stara adresa sada preusmjerava na novu (popis `REDIRECTS` u `build.mjs`).

## 6b. Git na Windowsu i velika/mala slova

Windows ne razlikuje `Dokumenti` od `dokumenti`, a Git na Windowsu
(`core.ignorecase=true`) zato **ne primijeti** kad se mapi promijeni samo
veličina slova. Posljedica: na GitHubu ostane stara `Dokumenti/`, stranice traže
`dokumenti/…`, i na Linux serveru (GitHub Pages, CI) svi PDF-ovi su 404.

Preimenovanje treba napraviti kroz Git, u dva koraka:

```bash
git rm -r --cached Dokumenti
git add dokumenti
git commit -m "Preimenuj Dokumenti u dokumenti"
git push
```

Provjera: `git ls-files | findstr /i dokumenti` (Windows) mora ispisati samo
`dokumenti/…` s malim d.

`build.mjs` ovakav slučaj prepoznaje i u ispisu piše da datoteka "postoji kao
Dokumenti/…" — to je znak za gornje naredbe.

## 6. Objava na GitHub Pages

Generirane stranice su u korijenu, pa nema builda na serveru:

1. `Settings` → `Pages`
2. *Source*: **Deploy from a branch**
3. *Branch*: `main`, folder: `/ (root)`

Nakon promjena: `node build.mjs`, pa `git add -A && git commit && git push`.
GitHub Action (`.github/workflows/build.yml`) na svaki push ponovno pokrene
build i **javi grešku ako generirane datoteke ne odgovaraju izvorima** — tako
ne može završiti na webu stranica koja je u međuvremenu mijenjana ručno.

> `.nojekyll` mora ostati, inače GitHub preskače neke datoteke.

---

## 7. Kako je riješena dvojezičnost

- Hrvatski je na korijenu, engleski u `/en/`; svaka stranica ima `canonical`,
  `hreflang` za oba jezika i `x-default` na hrvatski.
- Prebacivač jezika vodi na **isti sadržaj** u drugom jeziku, i na detaljnim
  stranicama (`novosti/<hr-slug>.html` ↔ `en/news/<en-slug>.html`).
- Podaci su dvojezični u istoj datoteci (`{"hr": …, "en": …}`), pa se novost
  unosi jednom.
- Datumi se ispisuju po jeziku: *6. studenoga 2026.* / *6 November 2026*.

## 8. SEO i dijeljenje

- JSON-LD: `Organization` (naslovnica, O nama, Kontakt), `WebSite`,
  `NewsArticle` za novosti, `Event` za događanja, `BreadcrumbList` na detaljnim
  stranicama.
- Open Graph i Twitter oznake sa slikom same objave, pa poveznica na Facebooku
  prikazuje pravi naslov i fotografiju.
- RSS: `feed.xml` i `en/feed.xml` (20 najnovijih objava), povezani iz `<head>`
  i iz footera.
- `sitemap.xml` sadrži sve stranice u oba jezika, s `xhtml:link` alternativama.

## 9. Privatnost i pristupačnost

- Bootstrap, fontovi i ikone učitavaju se **s vlastitog servera** (`vendor/`,
  `fonts/`, `css/icons.css`), pa posjet stranici ne šalje podatke Googleu ni
  drugim servisima. Ikone su SVG maske — samo deset korištenih, oko 6 KB.
- Karta (Google Maps) na stranici Kontakt učitava se tek kad je posjetitelj sam
  otvori klikom, uz napomenu zašto. Adresa za ugrađenu kartu mora biti
  `maps.google.com/maps?…&output=embed`; kratke poveznice `maps.app.goo.gl`
  ne mogu se prikazati u okviru, pa služe samo za gumb "Otvori u Google Mapsu".
- Stranica `privatnost.html` / `en/privacy.html` opisuje obradu podataka;
  **provjeri rokove i primatelje prije objave** i po potrebi ju daj na pregled
  osobi za zaštitu podataka na Sveučilištu.
- Animacije pri skrolanju i prijelazi isključuju se ako posjetitelj u sustavu
  ima uključeno smanjeno kretanje (`prefers-reduced-motion`).
- Vidljiv fokus, `aria-live` za dinamičke liste, `aria-pressed` na filterima,
  preskakanje na sadržaj, ispravna hijerarhija naslova.

---

## 10. Vizualni sustav (v3)

- **Naslovnica:** naslov lijevo i fotografija desno u okviru 3:2 (na mobitelu
  jedno ispod drugog), ispod tri "vrijednosti" (događanja, poslovi, zajednica),
  zatim događanja, novosti i crvena traka s pozivom.
- **Kartice** bez okvira: fotografija 3:2 sa zaobljenim rubovima, datum kao
  "čip" u kutu slike, naslov koji se podcrta pri prelasku mišem, tekstualna
  poveznica sa strelicom umjesto gumba. Oglasi za posao (bez slike) zadržavaju
  lagani okvir.
- **O nama:** kronologija Udruge i Upravni odbor s inicijalima.
- **Header** sa zamućenom pozadinom, sjenom pri skrolanju i crvenim gumbom
  "Postani član"; **footer** s logotipom, uredno poravnatim stupcima i
  poveznicama na RSS i privatnost.
- Boje su uzete iz značke Udruge (crvena sova, crni prsten, krem podloga):
  crvena `#c02020` za gumbe i poveznice, crna `#151312` za tekst i footer,
  krem `#faf4ec` za pozadinske trake i `#fcecdc` za sitne akcente (datum na
  slici, inicijali). Sve su tokeni u `:root` na vrhu `css/base.css`.
- Značka se pojavljuje u headeru, footeru, na stranici O nama i kao vodeni žig
  na crvenoj traci naslovnice; favicon i slika za dijeljenje također su iz nje.
- Hero fotografiju mijenjaš u `src/pages/hr/home.html` i `en/home.html`
  (trenutno `images/udruga/globalna-suradnja.webp`); slika se prikazuje cijela,
  u omjeru 3:2, pa je dovoljna standardna 1400 × 933.
- Ikone u `css/icons.css` su SVG maske. Unutar `url("…")` SVG smije imati samo
  **jednostruke** navodnike (`xmlns='…'`); dvostruki prekidaju pravilo i ikona
  postane obojeni kvadrat.

## 11. Predlozi za dalje

- **Fotografije.** U `images/events/` je još nekoliko neiskorištenih slika
  (`networking-night`, `karijera-nakon-studija`, `panel-karijere`,
  `fiskalizacija-2-0`). Neke su niske rezolucije (300–600 px) pa na kartici
  izgledaju mekano — vrijedi ih zamijeniti originalima.
- **Arhiva događanja.** U `events.json` su samo dva zapisa; prošle panel
  rasprave i terenske nastave iz novosti mogu se prepisati i u događanja.
- **Galerija** s više fotografija po događanju.
- **„Dodaj u kalendar“** (.ics) na stranici događanja.
- **Newsletter** (Mailchimp ili Buttondown, besplatni planovi).
- **Mentorski program** — stranica na kojoj se studenti prijavljuju za
  mentorstvo s alumnijima.
- **Plausible ili Matomo** ako želiš statistiku posjeta bez kolačića.
