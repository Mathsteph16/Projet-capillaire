interface DisclaimerProps {
  text?: string;
  className?: string;
}

function Disclaimer({
  text = "Estimation de bien-être, pas un avis médical.",
  className = "",
}: DisclaimerProps) {
  return (
    <p className={`flex items-center gap-1.5 text-xs text-text-faint ${className}`}>
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
      {text}
    </p>
  );
}

export { Disclaimer };
