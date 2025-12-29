"use strict";

/**
 * Glavna ulazna točka
 */
document.addEventListener("DOMContentLoaded", () => {
    initHamburger();
    setActiveNavLink();
    enableSmoothScroll();
    loadNovosti();
    initUIEffects();
    initScrollAnimations();
    initBackToTop();
    initContractForm();
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

/** * 2. Aktivna Navigacija
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
 * 3. Glatko scrolanje za linkove
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
 * 4. Dinamičke novosti
 */
async function loadNovosti() {
    const container = document.querySelector("#novosti-container");
    if (!container) return;

    try {
        const res = await fetch("data/novosti.json");
        const novosti = await res.json;

        container.innerHTML = "";

        novosti.forEach((item) => {
            const article = document.createElement("article");

            article.innerHTML = `
        <h3>${item.title}</h3>
        <img src="${item.image}" alt="${item.title}" class="novosti-img">
        <p>${item.text}</p>
        <small>Datum objave: ${item.date}</small>
      `;

            container.appendChild(article);
        });
    } catch (error) {
        container.innerHTML = "<p>Greška pri učitavanju novosti.</p>";
        console.error(error);
    }
}

/**
 * 5. UI Efekti (hover animacije preko JS-a)
 */
function initUIEffects() {
    const cards = document.querySelectorAll(".card, .bullets");

    cards.forEach((el) => {
        el.addEventListener("mouseenter", () => {
            el.style.transform = "scale(1.05)";
        });

        el.addEventListener("mouseleave", () => {
            el.style.transform = "scale(1)";
        });
    });
}

/**
 * 6. Scroll animacije
 */
function initScrollAnimations() {
    const elements = document.querySelectorAll(".content-section, article");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                }
            });
        }, { threshold: 0.1 }
    );

    elements.forEach((el) => observer.observe(el));
}

/**
 * 7. Back to top
 */
function initBackToTop() {
    const btn = document.createElement("button");
    btn.innerText = "↑";
    btn.className = "back-to-top";
    document.body.appendChild(btn);

    window.addEventListener("scroll", () => {
        btn.style.display = window.scrollY > 400 ? "block" : "none";
    });

    btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

/**
 * 8. Validacija kontakt forme
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
 * 8.1. Email validacija
 */
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * 8.2. Poruka uspješne predaje
 */
function showSuccessMessage(form) {
    const msg = document.createElement("div");

    msg.textContent = "Poruka uspješno poslana ✔️. Hvala vam!";
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