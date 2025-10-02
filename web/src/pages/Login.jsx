import { useState } from "react";
import { api, extractErrorMessage } from "../api/client";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import DarkModeToggle from "../components/DarkModeToggle";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState("");

  const validate = () => {
    const e = { email: "", password: "" };
    if (!email) e.email = "Email is required";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return !e.email && !e.password;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    try {
      setLoading(true);
      const { data } = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      const role = data?.user?.role;
      if (role === "admin") window.location.href = "/admin";
      else if (role === "support") window.location.href = "/support";
      else if (role === "packaging") window.location.href = "/packaging";
      else window.location.href = "/";
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 px-4">
      <DarkModeToggle />
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center">
            <span className="text-xl font-bold text-indigo-600">EL</span>
          </div>
          <h1 className="text-2xl font-semibold">Sign in to your account</h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">Shukhi Life Admin Panel</p>
        </div>

        {/* Card */}
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur p-6 shadow-xl"
        >
          <div className="space-y-4">
            <Input
              icon={Mail}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              error={errors.email}
            />

            <div className="space-y-1">
              <div className={`flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur px-3 py-2 transition focus-within:border-indigo-400 ${errors.password ? "border-red-500 dark:border-red-500" : ""}`}>
                <Lock className="h-4 w-4 text-zinc-400" />
                <input
                  className="w-full bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? <p className="text-sm text-red-500">{errors.password}</p> : null}
            </div>

            {formError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {formError}
              </div>
            ) : null}

            <Button type="submit" loading={loading} className="mt-2">Sign in</Button>

            <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
              By continuing you agree to our Terms &amp; Privacy Policy.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

