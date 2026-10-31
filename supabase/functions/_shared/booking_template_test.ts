import { strictEqual as assertEquals } from "node:assert";
import { renderBookingTemplate } from "./booking-template.ts";

Deno.test("troca todas as variáveis, inclusive {google_review}", () => {
  const out = renderBookingTemplate(
    "Olá {cliente}! {profissional} {servico} {data} {horario} {valor} {link} {google_review} {localizacao}",
    { customerName: "Ana", professionalName: "Carlos", serviceName: "Corte", date: "2026-11-27", time: "14:30:00",
      price: 50, link: "https://m.br/avaliar/x", googleReviewUrl: "https://g.page/r/abc", locationLink: "https://m.br/r/1" },
  );
  assertEquals(out, "Olá Ana! Carlos Corte 27/11/2026 14:30 R$ 50,00 https://m.br/avaliar/x https://g.page/r/abc https://m.br/r/1");
});

Deno.test("variável sem valor some (não fica o texto cru)", () => {
  assertEquals(renderBookingTemplate("Avalie: {google_review}", {}), "Avalie: ");
});

Deno.test("maiúsculas também valem", () => {
  assertEquals(renderBookingTemplate("{CLIENTE}", { customerName: "Ana" }), "Ana");
});
