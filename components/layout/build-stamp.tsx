import { DEPLOY_SHA } from "@/lib/deploy-stamp";

export function BuildStamp() {
  return (
    <p
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] pb-[max(0.2rem,env(safe-area-inset-bottom))] text-center text-[9px] font-mono leading-none text-slate-500/35"
      aria-hidden
    >
      {DEPLOY_SHA}
    </p>
  );
}
