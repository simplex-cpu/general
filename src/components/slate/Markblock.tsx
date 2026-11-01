export function Markblock({ className = "" }: { className?: string }) {
  return (
    <img
      src="/brand/monogram-dark.svg"
      alt=""
      className={`h-6 w-6 shrink-0 rounded-md object-contain ${className}`}
      aria-hidden="true"
    />
  );
}
