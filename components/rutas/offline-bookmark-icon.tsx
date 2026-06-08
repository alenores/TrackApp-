type OfflineBookmarkIconProps = {
  className?: string;
};

export function OfflineBookmarkIcon({ className = "h-4 w-4" }: OfflineBookmarkIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15.8l-5-2.4L7 19.8V4z" />
    </svg>
  );
}
