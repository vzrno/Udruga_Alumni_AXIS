/* Global behaviour: current nav item, in-page anchors, forms, copy link,
   consent-gated map, carousel pause control, footer year. */

import { t, escapeHtml, reveal } from "./util.js";

document.addEventListener("DOMContentLoaded", () => {
  markCurrentNav();
  smoothAnchors();
  stampYear();
  wireForms();
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
   Every form with data-endpoint posts there (Formspree, Formsubmit, a
   serverless function…). Until an endpoint is configured the submit button
   opens the visitor's mail client with the message pre-filled, so it is never
   a dead end. */
function wireForms() {
  document.querySelectorAll("form[data-endpoint]").forEach((form) => {
    const statusBox = form.querySelector("[data-form-status]");
    const submit = form.querySelector('button[type="submit"]');

    const say = (kind, message) => {
      if (!statusBox) return;
      statusBox.className = kind === "ok" ? "panel-note mt-3" : "alert alert-danger mt-3";
      statusBox.textContent = message;
      statusBox.hidden = false;
      statusBox.setAttribute("role", "status");
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) {
        form.querySelector(":invalid")?.focus();
        return;
      }

      const data = new FormData(form);
      if (data.get("_gotcha")) return; // honeypot: silently drop bots

      const endpoint = (form.dataset.endpoint || "").trim();
      const mail = form.dataset.mailto || "";
      const subject = form.dataset.subject || t.formSubject;

      if (!endpoint || endpoint.includes("YOUR_FORM_ID")) {
        const lines = [];
        for (const [key, value] of data.entries()) {
          if (key.startsWith("_") || !String(value).trim()) continue;
          lines.push(`${key}: ${value}`);
        }
        window.location.href =
          `mailto:${mail}?subject=${encodeURIComponent(subject)}` +
          `&body=${encodeURIComponent(lines.join("\n"))}`;
        say("ok", t.formMailto);
        return;
      }

      submit.disabled = true;
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        form.reset();
        form.classList.remove("was-validated");
        say("ok", t.formOk);
      } catch (err) {
        say("error", `${t.formError} ${mail ? `${t.formErrorMail} ${mail}` : ""}`.trim());
      } finally {
        submit.disabled = false;
      }
    });
  });
}

/* Copy the address of the current page (article share box). */
function wireCopyLink() {
  document.querySelectorAll("[data-copy-link]").forEach((btn) => {
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
      const original = btn.innerHTML;
      btn.innerHTML = escapeHtml(t.copied || "");
      setTimeout(() => {
        btn.innerHTML = original;
      }, 2000);
    });
  });
}

/* The map is only fetched from OpenStreetMap once the visitor asks for it,
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
