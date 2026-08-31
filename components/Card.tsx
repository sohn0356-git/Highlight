export default function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-2xl bg-white p-5 shadow-sm border border-neutral-100 text-left ${onClick ? "cursor-pointer transition active:scale-[0.99]" : ""} ${className}`}
    >
      {children}
    </Comp>
  );
}
