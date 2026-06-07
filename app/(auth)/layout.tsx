export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-scroll-pane flex h-full min-h-0 items-center justify-center px-3 py-8">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
