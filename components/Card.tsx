export default function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white p-5 shadow-sm border border-neutral-100 ${className}`}>{children}</div>;
}
