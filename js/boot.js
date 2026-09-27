/* Runs in <head> before anything is drawn: marks that JavaScript is available
   (CSS uses html.js for the reveal animation) and reads the page settings that
   build.mjs wrote into <script id="axis-config">. Kept as a file rather than an
   inline script so the Content-Security-Policy can forbid inline scripts. */
document.documentElement.classList.add("js");
try {
  window.AXIS = JSON.parse(document.getElementById("axis-config").textContent);
} catch {
  window.AXIS = {};
}
