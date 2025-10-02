export default function Input({ icon: Icon, error, className = "", ...props }) {
  return (
    <div className="space-y-1">
      <div className={`flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur px-3 py-2 transition focus-within:border-indigo-400 ${className} ${error ? "border-red-500 dark:border-red-500" : ""}`}>
        {Icon ? <Icon className="h-4 w-4 text-zinc-400" /> : null}
        <input
          className="w-full bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
          {...props}
        />
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
