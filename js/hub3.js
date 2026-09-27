/* HUB-3 (PDF417) barcode for paying the membership fee.
   Croatian banking apps read it with "Skeniraj i plati" and fill in the order.

   The data follows the Odluka o plaćanju članarine: poziv na broj is the payment
   date without dots (model HR00), the description names the year. The payer
   fields stay empty, so the bank app fills them from the account that pays.
   Everything is plain ASCII on purpose: PDF417 here encodes bytes, and letters
   such as "Č" would need ISO-8859-2 handling that some bank apps get wrong.

   Markup: <div class="hub3" data-hub3><canvas></canvas> ...</div>
   To change the fee, recipient or IBAN, edit PAYMENT below (and the visible
   payment details on the membership and thank-you pages). */

import { PDF417 } from "../vendor/pdf417.mjs";

const PAYMENT = {
  amountCents: 1000, // 10,00 EUR
  recipient: ["Alumni AXIS Split", "Kopilica 5", "21000 Split"],
  iban: "HR3224070001100770512",
  model: "HR00",
  purpose: "OTHR",
};

const pad = (n) => String(n).padStart(2, "0");

/** HRVHUB30 payload: 14 lines, each ending in "\n". */
export function hub3Payload(today = new Date()) {
  const reference = `${pad(today.getDate())}${pad(today.getMonth() + 1)}${today.getFullYear()}`;
  return [
    "HRVHUB30",
    "EUR",
    String(PAYMENT.amountCents).padStart(15, "0"),
    "", "", "", // payer: filled in by the bank app
    ...PAYMENT.recipient,
    PAYMENT.iban,
    PAYMENT.model,
    reference,
    PAYMENT.purpose,
    `Clanarina ${today.getFullYear()}`,
  ].join("\n") + "\n";
}

for (const box of document.querySelectorAll("[data-hub3]")) {
  const canvas = box.querySelector("canvas");
  if (!canvas) continue;
  try {
    // Error correction level 4 and a 3:1 shape, as the HUB-3 standard recommends.
    PDF417.draw(hub3Payload(), canvas, 3, 4, 4, "#000");
    box.hidden = false;
  } catch (err) {
    console.error(err); // the written payment details are still on the page
  }
}
