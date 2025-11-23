interface ContentLayoutProps {
  title?: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div>
      <div className="container pt-2 pb-2 px-2 sm:px-4">
        <h1 className="text-2xl font-bold tracking-tight mb-4">{title}</h1>
        {children}
      </div>
    </div>
  );
}