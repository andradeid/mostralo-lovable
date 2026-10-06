// Cloudflare Pages Function: "/" — prévia OG em domínio personalizado
import { handleCustomDomainOg } from './_lib/customDomainOg';

export const onRequest = handleCustomDomainOg;
