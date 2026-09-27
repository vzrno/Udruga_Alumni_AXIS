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
├── 404.html  sitemap.xml  robots.txt  feed.xml  _redirects      ⟵ GENERIRANO
├── novosti/<slug>.html         stranica po novosti          ⟵ GENERIRANO
├── dogadanja/<slug>.html .ics  stranica i kalendar po događanju ⟵ GENERIRANO
├── en/                         cijela engleska verzija      ⟵ GENERIRANO
│   ├── index.html  about.html  events.html  news.html
│   ├── careers.html  membership.html  contact.html  privacy.html
│   ├── news/<slug>.html   events/<slug>.html .ics   feed.xml
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
│   ├── events.json   news.json   jobs.json
│
├── css/     base.css (stil), fonts.css (@font-face), icons.css (SVG ikone)
├── fonts/   woff2 datoteke (Archivo, IBM Plex Sans)
├── vendor/  bootstrap.min.css, bootstrap.bundle.min.js, pdf417.mjs (HUB-3 barkod)
├── js/      boot.js (postavke stranice), format.js (datumi i kartice, dijeli ga
│            i build), util.js, main.js, events.js, news.js, careers.js,
│            hub3.js (barkod), print.js (ispis pristupnice)
├── images/  brand/ events/ udruga/  (sve 1400×933, uz svaku i -700 varijanta 700×467)
├── dokumenti/  statut i pristupnice (PDF) — malim slovom, bez razmaka u nazivima
├── netlify.toml                  sigurnosna zaglavlja i predmemorija
├── .github/workflows/build.yml   provjera na svaki push
└── build.mjs                     generator
```

Datoteke u korijenu, u `en/`, `novosti/` i `dogadanja/` **ne uređuju se ručno** —
generator ih prepisuje (mape `novosti/`, `dogadanja/`, `en/news/` i `en/events/`
briše i stvara iznova pri svakom buildu). Sadržaj se mijenja u `src/` i `data/`.

> **Velika i mala slova su važna.** Windows ne razlikuje `Dokumenti` od
> `dokumenti`, ali Netlify i svaki Linux server razlikuju. Mapa se zove
> `dokumenti` (malo d), slike i PDF-ovi nemaju razmake ni č ć ž š đ u nazivu.
> Izvorne datoteke (stari nazivi, PNG/JPG originali) namjerno nisu u projektu —
> čuvaj ih izvan repozitorija.

---

## 2. Build

Potreban je Node.js 18+.

```bash
node build.mjs
```

Ispis: `47 pages, 2 feeds, sitemap, robots` i `no broken local links`. Ako neki
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

Za svako događanje build sam napravi i kalendarsku datoteku
(`dogadanja/<slug>.ics`, `en/events/<slug>.ics`) te na stranici događanja prikaže
gumbe „Dodaj u kalendar” i „Google kalendar”. Ništa ne treba ručno: dovoljni su
`date` i, za događanja s točnim vremenom, `time` i `endTime` (bez `endTime`
računa se trajanje od dva sata; bez `time` događanje je cjelodnevno, do
`dateEnd`). Gumbi se sami sakriju kad događanje završi.

Ako je ista stvar i događanje i novost (npr. konferencija), novosti dodaj
`"hideOnHome": true` da se na naslovnici ne prikaže dvaput; u arhivi novosti ostaje.

### Barkod za uplatu članarine (HUB-3)

Na stranicama Članstvo i Hvala `js/hub3.js` crta HUB-3 (PDF417) barkod koji
bankovne aplikacije čitaju opcijom „Skeniraj i plati”. Poziv na broj je današnji
datum (model HR00), a opis „Clanarina <godina>”, prema Odluci o članarini.
Iznos, primatelj i IBAN su u `PAYMENT` na vrhu `js/hub3.js`; ako se promijene,
promijeni ih i u vidljivim podacima za uplatu na tim stranicama.
Biblioteka je `vendor/pdf417.mjs` (pdf417-generator 1.1.1).

### Novi oglas za posao

U `data/jobs.json`; `type` je `"job"` ili `"education"`, `deadline` je neobavezan
(`"2026-10-31"`). Oglas s prošlim rokom sam nestaje sa stranice dan nakon roka.
Oglas bez roka sam nestaje **60 dana** nakon `publishedAt`. Ako provjeriš da je
još otvoren, upiši današnji datum u `checkedAt` (npr. `"2026-09-27"`) i ostaje
još 60 dana od tog datuma. Broj dana mijenja se u `js/careers.js` (`MAX_AGE_DAYS`).

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
   `netlify.toml` postavlja sigurnosna zaglavlja (uključujući HSTS i
   Content-Security-Policy) i predmemoriju za fonte i slike. CSP dopušta samo
   datoteke s naše domene i Google kartu na stranici Kontakt; inline skripte
   nisu dopuštene (postavke stranice su JSON blok koji čita `js/boot.js`).
   Ako dodaš nešto s drugog weba (video, widget), dopiši njegovu adresu u CSP.
   Uz svaku pristupnicu u mailu stiže i polje `pristupnica_za_ispis` —
   poveznica na `pristupnica-ispis.html`, stranicu koja prikaže pristupnicu u
   obliku službenog obrasca (s blokom „popunjava udruga“) i ispisuje se na jednu
   A4 stranicu, odnosno sprema kao PDF preko *Ispiši → Spremi kao PDF*. Podaci
   putuju u samoj poveznici, pa se nigdje dodatno ne pohranjuju; zato tu
   poveznicu ne prosljeđuj dalje. Istu poveznicu dobije i pristupnik na stranici
   zahvale.
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

## 6. Objava i ažuriranje

Stranica je na **Netlifyju**, povezanom s GitHub repozitorijem: svaki `git push`
na `main` Netlify sam objavi za minutu-dvije. Generirane stranice su u
repozitoriju, pa Netlify ništa ne gradi, samo objavi mapu (`netlify.toml`).

Nakon promjena: `node build.mjs`, pa `git add -A`, `git commit` i `git push`.
GitHub Action (`.github/workflows/build.yml`) na svaki push ponovno pokrene
build i **javi grešku ako generirane datoteke ne odgovaraju izvorima** — tako
ne može završiti na webu stranica koja je u međuvremenu mijenjana ručno.

Obrasci, `_redirects` i zaglavlja iz `netlify.toml` rade samo na Netlifyju.
Ako se stranica ikad seli drugamo, to treba riješiti kod novog pružatelja.

---

## 7. Zamjena postojeće (žive) stranice

1. Napravi kopiju stare mape (ili se osloni na Git povijest).
2. U repozitoriju obriši **sve osim** `.git/` (domena je postavljena u
   Netlifyju, ne u datoteci, pa se brisanjem ništa ne gubi).
3. Kopiraj sadržaj zipa u mapu.
4. `node build.mjs` — mora ispisati `no broken local links`.
5. `git add -A && git commit -m "Nova verzija stranice" && git push`.
   Ako stranica ide na hosting preko FTP-a: prenesi cijelu mapu osim `src/`,
   `tools/`, `.github/` i `package.json` (nisu potrebni na serveru, ali ne smetaju).
6. U Google Search Console: **Sitemaps → dodaj `sitemap.xml`** i, po želji,
   *URL Inspection → Request indexing* za naslovnicu.

> **404 stranica** koristi putanje od korijena domene (`/css/…`). Radi na vlastitoj
> domeni i lokalnom serveru; na privremenoj adresi u podmapi bila bi bez stila.

Sve adrese koje je Google mogao indeksirati ostaju iste (`novosti.html`,
`clanstvo.html`, pojedine objave…). Jedina promijenjena adresa je CIET objava;
stara adresa sada preusmjerava na novu (popis `REDIRECTS` u `build.mjs`).
Iz tog popisa build napravi datoteku `_redirects`, pa Netlify odgovara pravim
„301 Moved Permanently” (Google tada prenosi rang stare adrese na novu), a
HTML stranica s preusmjeravanjem ostaje kao rezerva za druge poslužitelje.
Kad promijeniš `slug` neke objave, dodaj redak u `REDIRECTS`; `_redirects`
nemoj uređivati ručno.

## 8. Git na Windowsu: velika/mala slova i završeci redaka

Windows ne razlikuje `Dokumenti` od `dokumenti`, a Git na Windowsu
(`core.ignorecase=true`) zato **ne primijeti** kad se mapi promijeni samo
veličina slova. Posljedica: na GitHubu ostane stara `Dokumenti/`, stranice traže
`dokumenti/…`, i na Linux serveru (Netlify, GitHub Action) svi PDF-ovi su 404.

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

**Završeci redaka.** `.gitattributes` sprema sve tekstualne datoteke s Linux
završecima (LF), da build na Windowsu i na GitHubu da identične datoteke.
Iznimka su kalendarske datoteke (`*.ics -text`): po standardu moraju imati
CRLF, pa ih Git ne dira. Provjera: `git ls-files --eol "*.ics"` mora uz svaku
pokazati `i/crlf`.

---

## 9. Kako je riješena dvojezičnost

- Hrvatski je na korijenu, engleski u `/en/`; svaka stranica ima `canonical`,
  `hreflang` za oba jezika i `x-default` na hrvatski.
- Prebacivač jezika vodi na **isti sadržaj** u drugom jeziku, i na detaljnim
  stranicama (`novosti/<hr-slug>.html` ↔ `en/news/<en-slug>.html`).
- Podaci su dvojezični u istoj datoteci (`{"hr": …, "en": …}`), pa se novost
  unosi jednom.
- Datumi se ispisuju po jeziku: *6. studenoga 2026.* / *6 November 2026*.

## 10. SEO i dijeljenje

- JSON-LD: `Organization` (naslovnica, O nama, Kontakt), `WebSite`,
  `NewsArticle` za novosti, `Event` za događanja, `BreadcrumbList` na detaljnim
  stranicama.
- Open Graph i Twitter oznake sa slikom same objave, pa poveznica na Facebooku
  prikazuje pravi naslov i fotografiju.
- RSS: `feed.xml` i `en/feed.xml` (20 najnovijih objava), povezani iz `<head>`
  i iz footera.
- `sitemap.xml` sadrži sve stranice u oba jezika, s `xhtml:link` alternativama.
- Popisi novosti i događanja (naslovnica, `novosti.html`, `dogadanja.html`)
  upisani su u HTML već pri buildu, istim kodom kartica koji koristi preglednik
  (`js/format.js`). Vide ih tražilice i posjetitelji bez JavaScripta; preglednik
  ih zatim ponovno iscrta s pretragom, straničenjem, filtrima i oznakama
  „Uskoro / Završeno”. Te oznake i oglasi za posao ovise o današnjem datumu,
  pa ih build namjerno ne upisuje: build mora dati isti rezultat svaki dan i u
  svakoj vremenskoj zoni (to provjerava GitHub Action).

## 11. Privatnost i pristupačnost

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

## 12. Vizualni sustav (v3)

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

## 13. Predlozi za dalje

- **Fotografije.** Slika na naslovnici (`images/udruga/globalna-suradnja`) je
  generirana ilustracija; prava fotografija s terenske nastave ili događanja
  bila bi uvjerljivija. Neiskorištena je još `images/udruga/fakultet`. Neke
  slike objava su niske rezolucije pa na kartici izgledaju mekano — vrijedi ih
  zamijeniti originalima.
- **Arhiva događanja.** U `events.json` su samo dva zapisa; prošle panel
  rasprave i terenske nastave iz novosti mogu se prepisati i u događanja.
- **Galerija** s više fotografija po događanju.
- **Newsletter** (Mailchimp ili Buttondown, besplatni planovi).
- **Mentorski program** — stranica na kojoj se studenti prijavljuju za
  mentorstvo s alumnijima.
- **Plausible ili Matomo** ako želiš statistiku posjeta bez kolačića.
