/** Inyectado en build vía `next.config.ts` (git local o Vercel). */
export const DEPLOY_SHA = process.env.NEXT_PUBLIC_DEPLOY_SHA ?? "???";
