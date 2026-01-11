// Glogalni UX (nav, scroll, hamburger)

"use strict";

/**
 * Glavna ulazna točka
 */
document.addEventListener("DOMContentLoaded", () => {
    setActiveNavLink();
    enableSmoothScroll();
});

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

