import { assertEquals } from 'jsr:@std/assert@1';
import { founderOfferApplies } from './founder-offer.ts';

Deno.test('sócio fundador: só com parceiro, no plano Agenda e com vaga', () => {
  assertEquals(founderOfferApplies({ hasPartner: true, planName: 'Agenda', remaining: 3 }), true);
  assertEquals(founderOfferApplies({ hasPartner: false, planName: 'Agenda', remaining: 3 }), false);
  assertEquals(founderOfferApplies({ hasPartner: true, planName: 'Essencial', remaining: 3 }), false);
  assertEquals(founderOfferApplies({ hasPartner: true, planName: 'Agenda', remaining: 0 }), false);
});
