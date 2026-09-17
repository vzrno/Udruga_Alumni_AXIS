/* News archive. The cards come from the build; this adds the search box and
   the pager over the markup that is already in the page. Cards past the first
   page ship with data-overflow, which css hides until this file takes over,
   so there is no flash and the page still works without JavaScript. */

"use strict";

const CFG = window.AXIS || {};
const T = CFG.t || {};
const PER_PAGE = 6; // keep in step with NEWS_PER_PAGE in build.mjs

const list = document.getElementById("news-list");
if (list) init();

function init() {
  const cards = Array.from(list.querySelectorAll("[data-news]"));
  if (!cards.length) return;

  const searchEl = document.getElementById("news-search");
  const pagerEl = document.getElementById("news-pager");
  const countEl = document.getElementById("news-count");

  let matched = cards;
  let page = 1;

  cards.forEach((card) => card.removeAttribute("data-overflow"));

  const render = () => {
    const pages = Math.max(1, Math.ceil(matched.length / PER_PAGE));
    page = Math.min(page, pages);
    const start = (page - 1) * PER_PAGE;
    const shown = matched.slice(start, start + PER_PAGE);

    cards.forEach((card) => {
      card.hidden = !shown.includes(card);
    });
    shown.forEach((card) => card.classList.add("is-visible"));

    if (countEl) {
      const n = matched.length;
      countEl.textContent = n ? `${n} ${n === 1 ? T.itemOne || "" : T.itemMany || ""}` : "";
    }

    if (!matched.length) {
      const box = document.createElement("div");
      box.className = "col-12";
      box.setAttribute("data-empty", "");
      box.innerHTML = '<div class="state-msg"><p></p></div>';
      box.querySelector("p").textContent = T.noResults || "";
      list.querySelector("[data-empty]")?.remove();
      list.append(box);
    } else {
      list.querySelector("[data-empty]")?.remove();
    }

    if (!pagerEl) return;
    if (pages <= 1) {
      pagerEl.innerHTML = "";
      return;
    }
    pagerEl.innerHTML = "";
    for (let i = 1; i <= pages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === page ? "active" : ""}`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "page-link";
      btn.dataset.page = String(i);
      btn.textContent = String(i);
      if (i === page) btn.setAttribute("aria-current", "page");
      li.append(btn);
      pagerEl.append(li);
    }
  };

  searchEl?.addEventListener("input", () => {
    const q = searchEl.value.trim().toLowerCase();
    matched = !q ? cards : cards.filter((card) => (card.dataset.search || "").includes(q));
    page = 1;
    render();
  });

  pagerEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn) return;
    page = Number(btn.dataset.page) || 1;
    render();
    list.scrollIntoView({
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  });

  render();
}
