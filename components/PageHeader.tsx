export default function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-2">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
