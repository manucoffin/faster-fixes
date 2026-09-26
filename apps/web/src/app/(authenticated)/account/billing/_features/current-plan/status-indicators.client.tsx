"use client";

type StatusIndicatorsProps = {
  cancelAtPeriodEnd?: boolean;
};

export function StatusIndicators({ cancelAtPeriodEnd }: StatusIndicatorsProps) {
  // If not a trial, show cancel or renewal status
  const isBeingCanceled = cancelAtPeriodEnd ?? false;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
        isBeingCanceled ? "bg-destructive/10" : "bg-success/10"
      }`}
    >
      <div
        className={`size-2 rounded-full ${
          isBeingCanceled ? "bg-destructive" : "bg-success"
        }`}
      />
      <div className="flex flex-col">
        <p
          className={`text-xs font-medium ${
            isBeingCanceled ? "text-destructive" : "text-success"
          }`}
        >
          {isBeingCanceled
            ? "Cancels at end of billing period"
            : "Auto-renewal"}
        </p>
      </div>
    </div>
  );
}
