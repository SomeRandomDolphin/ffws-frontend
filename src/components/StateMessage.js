const StateMessage = ({
  title,
  message,
  actionLabel,
  onAction,
  tone = "neutral",
}) => {
  const tones = {
    neutral: "border-zinc-200 bg-zinc-50 text-zinc-700",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return (
    <div
      className={`rounded-xl border p-4 text-left ${tones[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <p className="font-semibold">{title}</p>
      {message && <p className="mt-1 text-sm opacity-80">{message}</p>}
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 rounded-lg border border-current px-3 py-1.5 text-sm font-medium hover:bg-white/60"
        >
          {actionLabel || "Coba lagi"}
        </button>
      )}
    </div>
  );
};

export default StateMessage;
