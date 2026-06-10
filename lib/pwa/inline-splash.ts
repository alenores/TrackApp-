export const INLINE_SPLASH_ID = "trackapp-inline-splash";

export const INLINE_SPLASH_STYLES = `
  #${INLINE_SPLASH_ID} {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 100;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #0f172a;
    opacity: 1;
    transition: opacity 300ms ease;
    pointer-events: none;
  }
  html.pwa-standalone #${INLINE_SPLASH_ID} {
    display: flex;
  }
  #${INLINE_SPLASH_ID}.${INLINE_SPLASH_ID}--out {
    opacity: 0;
  }
  #${INLINE_SPLASH_ID} svg {
    width: 7rem;
    height: 7rem;
    border-radius: 1.75rem;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.4);
  }
  #${INLINE_SPLASH_ID} p {
    margin: 1rem 0 0;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.025em;
    color: rgb(209 250 229 / 0.9);
    font-family: system-ui, -apple-system, sans-serif;
  }
`;

export const INLINE_SPLASH_MARKUP = `<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="512" height="512" rx="112" fill="#1e293b"/><path d="M40 400h432L300 168l-68 92-54-70-92 114-46 96Z" fill="#2d6a4f"/><path d="M88 400h336L276 196l-60 78-46-58-70 86-46 78Z" fill="#40916c"/><path d="M236 124 300 168l-28 58-56-38 20-64Z" fill="#d8f3dc"/><path d="M300 168 360 236l-30 48H244l56-116Z" fill="#52b788"/><circle cx="364" cy="136" r="28" fill="#f1f5f9"/></svg><p>TrackApp</p>`;
