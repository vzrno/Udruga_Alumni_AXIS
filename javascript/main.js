// Global UX (nav, scroll)

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  setActiveNavLink();
  enableSmoothScroll();
  enableBootstrapValidation();
});

/**
 * Aktivna navigacija (dodaje .active na link trenutne stranice)
 */
function setActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const links = document.querySelectorAll("nav a[href]");

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    if (href === currentPage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });
}

/**
 * Glatko scrolanje za anchor linkove (#...)
 * - ne dira prazne hash linkove (#) niti hash+URL slučajeve
 */
function enableSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  });
}

/**
 * Bootstrap form validation
 * - Adds .was-validated on submit
 */
function enableBootstrapValidation() {
  document.querySelectorAll(".needs-validation").forEach((form) => {
    form.addEventListener("submit", (event) => {
      if (!form.checkValidity ()) {
        event.preventDefault ();
        event.stopPropagation();
      }
      form.classList.add("was-validated");
    });
  });
}