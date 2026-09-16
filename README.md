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
├── images/  brand/ events/ udruga/  (uz svaku sliku i -700 varijanta)
├── dokumenti/  statut i pristupnice (PDF)
├── .github/workflows/build.yml   provjera na svaki push
└── build.mjs                     generator
```

Datoteke u korijenu, u `en/`, `novosti/` i `dogadanja/` **ne uređuju se ručno** —
generator ih prepisuje. Sadržaj se mijenja u `src/` i `data/`.

---

## 2. Build

Potreban je Node.js 18+.

```bash
node build.mjs
```

Ispis: `39 pages, 2 feeds, sitemap, robots` i `no broken local links`. Ako neki
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
  "image": "images/events/naziv-slike.webp",
  "title": { "hr": "Naslov", "en": "Title" },
  "location": { "hr": "Split, Kopilica 5", "en": "Split, Kopilica 5" },
  "tags": { "hr": ["radionica"], "en": ["workshop"] },
  "description": { "hr": "Tekst…\n\nDrugi odlomak.", "en": "Text…\n\nSecond paragraph." },
  "agenda": { "hr": [{ "time": "18:00", "topic": "Uvod" }], "en": [{ "time": "18:00", "topic": "Introduction" }] },
  "board": { "hr": [], "en": [] }
}
```

- `\n\n` u tekstu postaje novi odlomak na stranici.
- `agenda` i `board` mogu se izostaviti; tada se ti dijelovi ne prikazuju.
- Ako je `description` samo web adresa, stranica nudi poveznicu na vanjsku objavu.
- Slug bez č ć ž š đ i bez razmaka. Pravilo: naslov malim slovima, riječi
  spojene crticom, do šest riječi.

### Novo događanje

Isto, u `data/events.json` (`dogadanja/<slug>.html`). Dodatno: `endTime`,
`highlights` i `url` za vanjsku prijavu. Događanje je „Nadolazeće“ dok mu ne
prođe datum i vrijeme završetka; naslovnica prikazuje tri najbliža, a
`dogadanja.html` cijelu arhivu.

### Novi oglas za posao

U `data/jobs.json`; `type` je `"job"` ili `"education"`, `deadline` je neobavezan.

### Nova slika

U `images/events/` ili `images/udruga/`, **bez razmaka i dijakritika**, WebP,
širina 1400 px. Uz svaku sliku treba i varijanta za mobitele:

```bash
# jedna slika u dvije veličine
npx --yes @squoosh/cli --webp '{"quality":82}' --resize '{"width":1400}' -d images/events slika.png
npx --yes @squoosh/cli --webp '{"quality":80}' --resize '{"width":700}'  -d /tmp slika.png
# datoteku iz /tmp preimenuj u <naziv>-700.webp i stavi uz original
```

Stranice same traže `<naziv>-700.webp` preko `srcset`, pa mobitel skida manju
datoteku. Ako varijanta ne postoji, `build.mjs` to javi kao pokvaren link.

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

1. **Adresa stranice.** U `build.mjs`:

   ```js
   const SITE = "https://alumniaxis.hr";
   ```

   Na GitHub Pages npr. `https://korisnik.github.io/Udruga_Alumni_AXIS`. Od toga
   zavise `canonical`, `hreflang`, `sitemap.xml`, RSS, JSON-LD i slika za
   dijeljenje. Nakon promjene pokreni build.

2. **Obrasci.** Otvori besplatni račun na [formspree.io](https://formspree.io) i
   zamijeni `YOUR_FORM_ID` na četiri mjesta: `src/pages/hr/contact.html`,
   `src/pages/en/contact.html`, `src/pages/hr/membership.html`,
   `src/pages/en/membership.html`. Dok to ne učiniš, gumbi otvaraju program za
   e-poštu s pripremljenom porukom — rade, ali poruke ne dolaze automatski.

3. **Google Search Console.** Prijavi `sitemap.xml` i provjeri da su prepoznate
   obje jezične verzije (*International Targeting*). Nakon toga u *Rich Results
   Test* provjeri jednu stranicu događanja — treba prepoznati `Event`.

---

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
- Karta na stranici Kontakt učitava se tek kad je posjetitelj sam otvori
  klikom, uz napomenu zašto.
- Stranica `privatnost.html` / `en/privacy.html` opisuje obradu podataka;
  **provjeri rokove i primatelje prije objave** i po potrebi ju daj na pregled
  osobi za zaštitu podataka na Sveučilištu.
- Animacije pri skrolanju i prijelazi isključuju se ako posjetitelj u sustavu
  ima uključeno smanjeno kretanje (`prefers-reduced-motion`).
- Vidljiv fokus, `aria-live` za dinamičke liste, `aria-pressed` na filterima,
  preskakanje na sadržaj, ispravna hijerarhija naslova.

---

## 10. Vizualni sustav (v3)

- **Naslovnica:** full-bleed fotografija s naslovom preko nje (umjesto karusela),
  ispod nje tri "vrijednosti" (događanja, poslovi, zajednica) koje se lagano
  preklapaju s fotografijom, zatim događanja, novosti i crvena traka s pozivom.
- **Kartice** bez okvira: fotografija 3:2 sa zaobljenim rubovima, datum kao
  "čip" u kutu slike, naslov koji se podcrta pri prelasku mišem, tekstualna
  poveznica sa strelicom umjesto gumba. Oglasi za posao (bez slike) zadržavaju
  lagani okvir.
- **O nama:** kronologija Udruge i Upravni odbor s inicijalima.
- **Header** sa zamućenom pozadinom, sjenom pri skrolanju i crvenim gumbom
  "Postani član"; **footer** s logotipom, uredno poravnatim stupcima i
  poveznicama na RSS i privatnost.
- Sve boje, radijusi i sjene su tokeni u `:root` na vrhu `css/base.css` —
  promjena crvene mijenja cijelu stranicu.
- Hero fotografiju mijenjaš u `src/pages/hr/home.html` i `en/home.html`
  (`images/udruga/kampus.webp`); preporuka je vodoravna fotografija najmanje
  1600 px širine, s "praznim" prostorom lijevo gdje ide tekst.

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
