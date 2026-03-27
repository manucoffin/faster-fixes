const CYCLE = 6;

export const flowAnimationStyles = `
@keyframes hfa-highlight {
  0%, 10% {
    box-shadow: none;
    background-color: rgb(39 39 42 / 0.5);
  }
  20%, 65% {
    box-shadow: 0 0 0 1.5px rgb(99 102 241 / 0.5), 0 0 8px rgb(99 102 241 / 0.1);
    background-color: rgb(99 102 241 / 0.08);
  }
  78%, 100% {
    box-shadow: none;
    background-color: rgb(39 39 42 / 0.5);
  }
}

@keyframes hfa-popover {
  0%, 25% { opacity: 0; transform: translateY(4px); }
  33%, 60% { opacity: 1; transform: translateY(0); }
  72%, 100% { opacity: 0; transform: translateY(4px); }
}

@keyframes hfa-line {
  0% { opacity: 0; transform: translateX(-4px); }
  10% { opacity: 1; transform: translateX(0); }
  75% { opacity: 1; transform: translateX(0); }
  88% { opacity: 0; }
  100% { opacity: 0; }
}

@keyframes hfa-beam {
  0% { left: -6px; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: calc(100% + 2px); opacity: 0; }
}
`;

export function TerminalFrame({
  title,
  children,
  contentClassName,
}: {
  title: string;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
      <div className="flex items-center gap-1.5 border-b border-zinc-800/80 px-3 py-2">
        <span className="size-2 rounded-full bg-zinc-700" />
        <span className="size-2 rounded-full bg-zinc-700" />
        <span className="size-2 rounded-full bg-zinc-700" />
        <span className="ml-1.5 font-mono text-xs text-zinc-500">{title}</span>
      </div>
      <div className={contentClassName ?? "flex h-[120px] items-start px-4 py-3"}>
        {children}
      </div>
    </div>
  );
}

export function AnnotateContent() {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="h-2 w-[70%] rounded-[2px] bg-zinc-800" />
      <div className="h-1.5 w-full rounded-[2px] bg-zinc-800/50" />
      <div className="h-1.5 w-[85%] rounded-[2px] bg-zinc-800/50" />
      <div
        className="h-5 w-[45%] rounded-[3px]"
        style={{ animation: `hfa-highlight ${CYCLE}s ease-in-out infinite` }}
      />
      <div
        className="w-[75%] rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1.5"
        style={{
          opacity: 0,
          animation: `hfa-popover ${CYCLE}s ease-in-out infinite`,
        }}
      >
        <p className="font-mono text-[11px] text-zinc-400">
          {'"Fix alignment"'}
        </p>
      </div>
      <div className="h-1.5 w-[60%] rounded-[2px] bg-zinc-800/50" />
    </div>
  );
}

export function StructureContent() {
  const lines = [
    { label: "url", value: "/settings" },
    { label: "path", value: "Panel > Button" },
    { label: "note", value: '"Fix alignment"' },
    { label: "env", value: "Chrome \u00b7 macOS" },
  ];

  return (
    <div className="flex flex-col gap-2">
      {lines.map((line, i) => (
        <div
          key={line.label}
          className="flex gap-2.5 font-mono text-[11px]"
          style={{
            opacity: 0,
            animation: `hfa-line ${CYCLE}s ease infinite`,
            animationDelay: `${i * 0.35}s`,
          }}
        >
          <span className="w-9 shrink-0 text-right text-zinc-600">
            {line.label}
          </span>
          <span className="text-zinc-400">{line.value}</span>
        </div>
      ))}
    </div>
  );
}

export function FixContent() {
  const lines = [
    { text: "$ fix-feedback", cls: "text-emerald-400/80", delay: 0 },
    { text: "\u2192 Reading feedback...", cls: "text-zinc-500", delay: 0.5 },
    { text: "\u2192 src/panel.tsx:24", cls: "text-zinc-500", delay: 0.9 },
    { text: "\u2713 Done", cls: "text-emerald-400/70", delay: 1.3 },
  ];

  return (
    <div className="flex flex-col gap-2">
      {lines.map((line) => (
        <div
          key={line.text}
          className={`font-mono text-[11px] ${line.cls}`}
          style={{
            opacity: 0,
            animation: `hfa-line ${CYCLE}s ease infinite`,
            animationDelay: `${line.delay}s`,
          }}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
}

export function BeamConnector() {
  return (
    <div className="relative h-px w-full">
      <div className="h-px w-full bg-zinc-800" />
      <div
        className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-indigo-400/80"
        style={{
          animation: "hfa-beam 2.5s ease-in-out infinite",
          boxShadow: "0 0 6px rgb(129 140 248 / 0.5)",
        }}
      />
    </div>
  );
}
