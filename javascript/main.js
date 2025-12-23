"use strict";

/**
 * Glavna ulazna točka
 */
document.addEventListener("DOMContentLoaded", () => {
  initNavigator();
  initSmoothScroll();
  initContractForm();
  initUIEffiect();
});

/** * 1. Aktivna Navigacija
 * Označava aktivnu stranicu u <nav>
 */
function initNavigator() {
  const navLinks = document.querySelectorAll("nav a");
  const currentPage = window.location.pathname.split("/").pop();

  navLinks.forEach((link) => {
    const linkPage = link.getAttribute("href");

    if (
      linkPage === currentPage ||
      (currentPage === "" && linkPage === "index.html")
    ) {
      link.style.color = "#ffcc00";
      link.style.fontWeight = "700";
    }
  });
}

/**
 * 2. Glatko scrolanje za linkove
 */
