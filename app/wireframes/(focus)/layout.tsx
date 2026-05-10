export default function FocusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-[calc(100vh-2.5rem)] w-full bg-background">{children}</div>;
}
