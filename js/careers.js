/* Jobs and training: type filter and pager over the cards the build wrote. */

"use strict";

const CFG = window.AXIS || {};
const T = CFG.t || {};
const PER_PAGE = 9; // keep in step with JOBS_PER_PAGE in build.mjs

const list = document.getElementById("jobs-list");
if (list) init();

function init() {
  const cards = Array.from(list.querySelectorAll("[data-job]"));
  if (!cards.length) return;

  const filterEl = document.getElementById("jobs-filter");
  const pagerEl = document.getElementById("jobs-pager");
  const countEl = document.getElementById("jobs-count");

  let type = "all";
  let page = 1;

  cards.forEach((card) => card.removeAttribute("data-overflow"));

  const render = () => {
    const matched = type === "all" ? cards : cards.filter((c) => c.dataset.type === type);
    const pages = Math.max(1, Math.ceil(matched.length / PER_PAGE));
    page = Math.min(page, pages);
    const start = (page - 1) * PER_PAGE;
    const shown = matched.slice(start, start + PER_PAGE);

    cards.forEach((card) => {
      card.hidden = !shown.includes(card);
    });
    shown.forEach((card) => card.classList.add("is-visible"));

    if (countEl) countEl.textContent = String(matched.length);

    list.querySelector("[data-empty]")?.remove();
    if (!matched.length) {
      const box = document.createElement("div");
      box.className = "col-12";
      box.setAttribute("data-empty", "");
      box.innerHTML = '<div class="state-msg"><p></p></div>';
      box.querySelector("p").textContent = T.noJobs || "";
      list.append(box);
    }

    if (!pagerEl) return;
    pagerEl.innerHTML = "";
    if (pages <= 1) return;
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

  filterEl?.addEventListener("change", () => {
    type = filterEl.value;
    page = 1;
    render();
  });

  pagerEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn) return;
    page = Number(btn.dataset.page) || 1;
    render();
  });

  render();
}
