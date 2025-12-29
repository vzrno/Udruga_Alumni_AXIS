// Glogalni UX (nav, scroll, hamburger)

"use strict";

/**
 * Glavna ulazna točka
 */
document.addEventListener("DOMContentLoaded", () => {
    initHamburger();
    setActiveNavLink();
    enableSmoothScroll();
});

/**
 * 1. Funkcija Habmurger menija
 */
function initHamburger() {
    const hamburger = document.getElementById("hamburger");
    const nav = document.querySelector("nav");

    if (!hamburger || !nav) return;

    hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        nav.classList.toggle("active");
    });

    // Zatvori meni kad se klikne link
    nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            hamburger.classList.remove("active");
            nav.classList.remove("active");
        });
    });
}

/** 
 * 2. Aktivna Navigacija
 */
function setActiveNavLink() {
    const currentPage = window.location.pathname.split("/").pop();
    const links = document.querySelectorAll("nav a");

    links.forEach(link => {
        const linkPage = link.getAttribute("href");

        if (linkPage === currentPage || (currentPage === "" && linkPage === "index.html")) {
            link.classList.add("active");
        }
    });
}

/**
 * 3. Glatko scrolanje (UX))
 */
function enableSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
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