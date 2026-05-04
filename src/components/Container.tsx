type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Container({
  children,
  className = "",
}: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-6xl px-3 sm:px-5 lg:px-6 ${className}`}
    >
      {children}
    </div>
  );
}