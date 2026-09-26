type Props = React.ComponentPropsWithoutRef<"svg"> & {
  // Render the Jira brand color instead of inheriting `currentColor`.
  colored?: boolean;
};

export function JiraIcon({ className, colored = false, ...props }: Props) {
  return (
    <svg
      className={className}
      {...props}
      fill={colored ? "#2684FF" : "currentColor"}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M15.822 0a7.06 7.06 0 0 0 7.06 7.06h2.906v2.807a7.06 7.06 0 0 0 7.058 7.06V1.372A1.372 1.372 0 0 0 31.474 0zM8.428 7.444a7.06 7.06 0 0 0 7.06 7.06h2.906v2.807a7.06 7.06 0 0 0 7.058 7.06V8.816a1.372 1.372 0 0 0-1.372-1.372zM1.034 14.888a7.06 7.06 0 0 0 7.06 7.06H11v2.807a7.06 7.06 0 0 0 7.058 7.06V16.26a1.372 1.372 0 0 0-1.372-1.372z" />
    </svg>
  );
}
