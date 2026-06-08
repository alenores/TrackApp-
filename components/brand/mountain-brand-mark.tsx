type MountainBrandMarkProps = {
  className?: string;
};

export function MountainBrandMark({ className = "" }: MountainBrandMarkProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <rect width="512" height="512" rx="112" fill="#1e293b" />
      <path
        d="M40 400h432L300 168l-68 92-54-70-92 114-46 96Z"
        fill="#2d6a4f"
      />
      <path
        d="M88 400h336L276 196l-60 78-46-58-70 86-46 78Z"
        fill="#40916c"
      />
      <path
        d="M236 124 300 168l-28 58-56-38 20-64Z"
        fill="#d8f3dc"
      />
      <path
        d="M300 168 360 236l-30 48H244l56-116Z"
        fill="#52b788"
      />
      <circle cx="364" cy="136" r="28" fill="#f1f5f9" />
    </svg>
  );
}
