type SectionCardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function SectionCard({
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm sm:rounded-3xl sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}