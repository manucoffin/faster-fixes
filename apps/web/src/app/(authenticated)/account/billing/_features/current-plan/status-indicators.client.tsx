"use client";

interface StatusIndicatorsProps {
  cancelAtPeriodEnd?: boolean;
}

export function StatusIndicators({ cancelAtPeriodEnd }: StatusIndicatorsProps) {
  // If not a trial, show cancel or renewal status
  const isBeingCanceled = cancelAtPeriodEnd ?? false;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
        isBeingCanceled
          ? "bg-red-50 dark:bg-red-950/30"
          : "bg-green-50 dark:bg-green-950/30"
      }`}
    >
      <div
        className={`size-2 rounded-full ${
          isBeingCanceled
            ? "bg-red-600 dark:bg-red-500"
            : "bg-green-600 dark:bg-green-500"
        }`}
      />
      <div className="flex flex-col">
        <p
          className={`text-xs font-medium ${
            isBeingCanceled
              ? "text-red-900 dark:text-red-200"
              : "text-green-900 dark:text-green-200"
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
