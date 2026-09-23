/* Global behaviour: current nav item, in-page anchors, forms, copy link,
   consent-gated map, carousel pause control, footer year. */

import { t, escapeHtml, reveal } from "./util.js";

document.addEventListener("DOMContentLoaded", () => {
  markCurrentNav();
  smoothAnchors();
  stampYear();
  wireForms();
  wireThanks();
  wireCopyText();
  wireCopyLink();
  wireMapConsent();
  wireCarouselPause();
  reveal();
  wireHeaderShadow();
});

/* Header gains a shadow once the page is scrolled. */
function wireHeaderShadow() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const update = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

/* Nav: the build marks the active item; this covers "/" and "/en/" where the
   file name is missing from the URL. */
function markCurrentNav() {
  const file = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-header .nav-link").forEach((link) => {
    const href = (link.getAttribute("href") || "").split("/").pop();
    if (href && href === file) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });
}

function smoothAnchors() {
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });
}

function stampYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}

/* ----------------------------------------------------------------- forms --
   Netlify Forms: see wireForms() below and README, section 5. */
/**
 * Croatian OIB check digit (ISO 7064, MOD 11,10). Catches typos such as a
 * swapped or missing digit before the form is sent.
 */
function isValidOib(value) {
  if (!/^\d{11}$/.test(value)) return false;
  let a = 10;
  for (let i = 0; i < 10; i++) {
    a = (a + Number(value[i])) % 10;
    if (a === 0) a = 10;
    a = (a * 2) % 11;
  }
  const check = (11 - a) % 10;
  return check === Number(value[10]);
}

/**
 * Show only the fieldset that matches the chosen radio (data-toggle-group).
 * Fields in hidden fieldsets are disabled, so they are neither validated nor
 * sent. Without JavaScript every fieldset stays visible.
 */
function wireToggleGroups(form) {
  const radios = form.querySelectorAll("[data-toggle-group]");
  if (!radios.length) return () => {};
  const groups = form.querySelectorAll("[data-group]");
  const update = () => {
    const chosen = form.querySelector("[data-toggle-group]:checked")?.dataset.toggleGroup;
    groups.forEach((g) => {
      const on = g.dataset.group === chosen;
      g.hidden = !on;
      g.disabled = !on;
    });
  };
  radios.forEach((r) => r.addEventListener("change", update));
  update();
  return update;
}

/**
 * Forms are handled by Netlify Forms: the HTML carries data-netlify="true",
 * Netlify registers the form at deploy time, stores every submission and
 * emails it to the address set under Project configuration → Notifications.
 * Here we only send it without leaving the page (POST to "/", url-encoded,
 * with the hidden form-name field), as Netlify's docs describe.
 */
function wireForms() {
  document.querySelectorAll("form[data-ajax-form]").forEach((form) => {
    const statusBox = form.querySelector("[data-form-status]");
    const submit = form.querySelector('button[type="submit"]');
    const mail = form.dataset.mailto || "";

    const refreshGroups = wireToggleGroups(form);

    form.querySelectorAll("[data-oib]").forEach((input) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "").slice(0, 11);
        input.setCustomValidity(input.value && !isValidOib(input.value) ? t.oibInvalid : "");
      });
    });

    const say = (kind, message) => {
      if (!statusBox) return;
      statusBox.className = kind === "ok" ? "panel-note mt-3" : "alert alert-danger mt-3";
      statusBox.textContent = message;
      statusBox.hidden = false;
      statusBox.setAttribute("role", kind === "ok" ? "status" : "alert");
      statusBox.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) {
        form.querySelector(":invalid")?.focus();
        return;
      }

      // Subject line of the notification email, e.g. "Nova pristupnica: Ana Horvat".
      const subject = form.querySelector('input[name="subject"]');
      if (subject) {
        const who = form.querySelector('[name="ime_i_prezime"], [name="name"]')?.value.trim();
        const topic = form.querySelector('[name="topic"]')?.value;
        subject.value = [subject.dataset.subject, topic, who].filter(Boolean).join(" · ") + " — Alumni AXIS Split";
      }

      const data = new FormData(form);
      if (data.get("bot-field")) return; // honeypot: silently drop bots

      // Address of the printable copy: the answers travel in the link itself,
      // so the notification email (and the applicant) can open and print it.
      const printPage = form.dataset.printPage;
      let printLink = "";
      if (printPage) {
        const q = new URLSearchParams();
        for (const [key, value] of data.entries()) {
          if (["form-name", "subject", "bot-field", "pristupnica_za_ispis"].includes(key)) continue;
          if (String(value).trim()) q.set(key, value);
        }
        q.set("predano", new Date().toLocaleString(document.documentElement.lang || "hr"));
        printLink = `${window.location.origin}${printPage}?${q.toString()}`;
        data.set("pristupnica_za_ispis", printLink);
      }

      submit.disabled = true;
      const label = submit.innerHTML;
      submit.textContent = t.formSending;
      try {
        const res = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(data).toString(),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // Same thank-you page Netlify would show without JavaScript,
        // told which form was sent so it shows the matching text.
        if (printLink) sessionStorage.setItem("axis-print-link", printLink);
        const next = form.getAttribute("action");
        if (next) {
          window.location.assign(`${next}?obrazac=${encodeURIComponent(data.get("form-name") || "")}`);
          return;
        }
        form.reset();
        form.classList.remove("was-validated");
        refreshGroups();
        say("ok", form.dataset.ok || t.formOk);
      } catch (err) {
        say("error", `${t.formError} ${mail ? `${t.formErrorMail} ${mail}` : ""}`.trim());
      } finally {
        submit.disabled = false;
        submit.innerHTML = label;
      }
    });
  });
}

/* Thank-you page: show only the part for the form that was sent
   (?obrazac=pristupnica or ?obrazac=kontakt). Without the parameter
   — e.g. after a submission without JavaScript — everything stays visible. */
function wireThanks() {
  const parts = document.querySelectorAll("[data-thanks]");
  if (!parts.length) return;
  const link = document.querySelector("[data-print-link]");
  const stored = sessionStorage.getItem("axis-print-link");
  if (link && stored) {
    link.href = stored;
    link.hidden = false;
    sessionStorage.removeItem("axis-print-link");
  }

  const sent = new URLSearchParams(window.location.search).get("obrazac");
  if (!sent) return;
  parts.forEach((el) => {
    el.hidden = el.dataset.thanks !== sent;
  });
}

/* Buttons that copy a fixed text, e.g. the IBAN. */
function wireCopyText() {
  document.querySelectorAll("[data-copy-text]").forEach((btn) => {
    const original = btn.textContent;
    let timer = null;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copyText);
        btn.textContent = t.copiedShort || "✓";
      } catch (err) {
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        btn.textContent = original;
      }, 2000);
    });
  });
}

/* Copy the address of the current page (article share box). */
function wireCopyLink() {
  document.querySelectorAll("[data-copy-link]").forEach((btn) => {
    const original = btn.innerHTML;
    let timer = null;
    btn.addEventListener("click", async () => {
      const url = window.location.href;
      try {
        await navigator.clipboard.writeText(url);
      } catch (err) {
        const field = document.createElement("input");
        field.value = url;
        document.body.append(field);
        field.select();
        document.execCommand("copy");
        field.remove();
      }
      btn.innerHTML = escapeHtml(t.copied || "");
      clearTimeout(timer);
      timer = setTimeout(() => {
        btn.innerHTML = original;
      }, 2000);
    });
  });
}

/* The map is only fetched from Google Maps once the visitor asks for it,
   so no third party sees an IP address on a plain page view. */
function wireMapConsent() {
  document.querySelectorAll("[data-map]").forEach((holder) => {
    const button = holder.querySelector("[data-map-load]");
    button?.addEventListener("click", () => {
      const frame = document.createElement("iframe");
      frame.src = holder.dataset.map;
      frame.title = holder.dataset.mapTitle || "";
      frame.loading = "lazy";
      frame.style.border = "0";
      frame.referrerPolicy = "no-referrer-when-downgrade";
      holder.innerHTML = "";
      holder.classList.add("ratio", "ratio-4x3");
      holder.append(frame);
    });
  });
}

/* WCAG 2.2.2: moving content needs a way to stop it. */
function wireCarouselPause() {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  document.querySelectorAll('.carousel[data-bs-ride="carousel"]').forEach((el) => {
    const instance = window.bootstrap?.Carousel?.getOrCreateInstance(el);
    let playing = !reduce;
    if (reduce) instance?.pause();

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "carousel-pause";
    const label = () => (playing ? t.pause || "Pause" : t.play || "Play");
    const paint = () => {
      btn.innerHTML = `<span aria-hidden="true">${playing ? "❙❙" : "▶"}</span>`;
      btn.setAttribute("aria-label", label());
      btn.title = label();
    };

    btn.addEventListener("click", () => {
      playing = !playing;
      if (playing) instance?.cycle();
      else instance?.pause();
      paint();
    });

    paint();
    el.append(btn);
  });
}
