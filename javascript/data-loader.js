"use strict";

document.addEventListener("DOMContentLoaded", () => {
  loadNovosti();
  loadSiteData();
});

/**
 * Učitavanje novosti iz JSON datoteke i prikazuje ih na stranici
 */
async function loadNovosti() {
  const container = document.getElementById("novosti-container");
  if (!container) return;

  const response = await fetch("data/novosti.json");
  const novosti = await response.json();

  container.innerHTML = novosti
    .map(
      (item) => `
        <article>
            <h3>${item.title}</h3>
            <img src="${item.image}" alt="${item.title}" />
            <p>${item.text}</p>
            <small>${formatDate(item.date)}</small>
        </article>
    `
    )
    .join("");
}

/**
 * Centralni podaci o stranici (npr. naziv, kontakt) iz JSON datoteke
 */
async function loadSiteData() {
  const response = await fetch("data/site.json");
  const data = await response.json();

  const hero = document.querySelector(".hero h1");
  if (hero) hero.textContent = data.heroText;
}

/**
 * Formatira datum
 */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("hr-HR");
}
