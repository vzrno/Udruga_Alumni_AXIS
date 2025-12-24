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
function initSmoothScroll() {
  const anchors = document.querySelectorAll('a[href^="#"]');

  anchors.forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute("href"));

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

/**
 * 3. Validacija kontakt forme
 */
function initContractForm() {
  const form = document.querySelector("form");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const ime = document.getElementById("ime");
    const email = document.getElementById("email");
    const poruka = document.getElementById("poruka");

    if (!ime.value.trim()) {
      alert("Molimo unesite ime i prezime.");
      ime.focus();
      return;
    }

    if (!validateEmail(email.value)) {
      alert("Molimo unesite ispravnu email adresu.");
      email.focus();
      return;
    }

    if (poruka.value.trim().length < 10) {
      alert("Poruka mora imati barem 10 znakova.");
      poruka.focus();
      return;
    }

    showSuccessMessage(form);
    form.reset();
  });
}

/**
 * Email validacija
 */
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * 4. Poruka uspješne predaje
 */
function showSuccessMessage(form) {
  const msg = document.createElement("div");

  msg.textContent = "Poruka je uspješno poslana. Hvala vam!";
  msg.style.marginTop = "20px";
  msg.style.padding = "15px";
  msg.style.backgroundColor = "#e9f7ef";
  msg.style.border = "1px solid #2ecc71";
  msg.style.borderRadius = "8px";
  msg.style.color = "#2c662d";
  msg.style.fontWeight = "600";

  form.appendChild(msg);

  setTimeout(() => {
    msg.remove();
  }, 5000);
}
