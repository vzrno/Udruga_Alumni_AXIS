import { fetchJSON } from "./api.js";
import { mapJobs } from "./jobs.adapter.js";
import { renderJobs } from "./jobs.renderer.js";

document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  loadJobs();
});

/* =====================
   MENU
===================== */
function initMenu() {
  const hamburger = document.getElementById("hamburger");
  const nav = document.getElementById("mainNav");

  hamburger.addEventListener("click", () => {
    nav.classList.toggle("open");
    hamburger.setAttribute(
      "aria-expanded",
      nav.classList.contains("open")
    );
  });
}

/* =====================
   CMS DATA
===================== */
async function loadJobs() {
  const container = document.getElementById("nas-rad-container");
  if (!container) return;

  const data = await fetchJSON("/data/jobs.json");

  const jobs = mapJobs(data);

  renderJobs(container, jobs);
}
