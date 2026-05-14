interface ContentLayoutProps {
  title?: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div>
      <div className="py-4 px-4 sm:px-6 max-w-7xl mx-auto">
        {title && <h1 className="text-xl font-semibold tracking-tight mb-4 text-foreground">{title}</h1>}
        {children}
      </div>
    </div>
  );
}