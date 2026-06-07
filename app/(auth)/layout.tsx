export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center overflow-y-auto overscroll-y-contain bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-3 py-8">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
