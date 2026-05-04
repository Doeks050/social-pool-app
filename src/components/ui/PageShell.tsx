import Container from "@/components/Container";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
};

export default function PageShell({
  children,
  className = "",
  containerClassName = "",
}: PageShellProps) {
  return (
    <main className={`min-h-screen bg-zinc-950 text-white ${className}`}>
      <section className="py-5 sm:py-8">
        <Container className={containerClassName}>{children}</Container>
      </section>
    </main>
  );
}