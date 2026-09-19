/** Inyectado en build vía `next.config.ts` (git local o Vercel). */
export const SELLO_DE_VERSION = process.env.NEXT_PUBLIC_DEPLOY_SHA ?? "???";
