import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, type UsernameStatus } from "@/hooks/use-auth";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Calendar,
  Users,
  BarChart3,
  Sparkles,
  Lock,
} from "lucide-react";

type Step =
  | { kind: "username" }
  | { kind: "password"; username: string; status: UsernameStatus };

export default function Landing() {
  const {
    checkUsername,
    isCheckingUsername,
    checkUsernameError,
    login,
    isLoggingIn,
    loginError,
    resetLoginError,
  } = useAuth();

  const [step, setStep] = useState<Step>({ kind: "username" });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (username.trim().length < 2) return;
    try {
      const result = await checkUsername(username.trim());
      setStep({ kind: "password", username: result.username, status: result.status });
      setPassword("");
      setConfirmPassword("");
      resetLoginError();
    } catch {
      // error displayed via checkUsernameError
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (step.kind !== "password") return;
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }
    if (step.status !== "existing" && password !== confirmPassword) {
      setLocalError("Passwords don't match");
      return;
    }
    try {
      await login({ username: step.username, password, mode: step.status });
    } catch {
      // error displayed via loginError
    }
  };

  const goBack = () => {
    setStep({ kind: "username" });
    setPassword("");
    setConfirmPassword("");
    setLocalError(null);
    resetLoginError();
  };

  const features = [
    { icon: MessageCircle, label: "Group Chat", color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/40" },
    { icon: Sparkles, label: "Stories", color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/40" },
    { icon: Calendar, label: "Events", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/40" },
    { icon: BarChart3, label: "Polls", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { icon: Users, label: "Private Groups", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/40" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Soft ambient gradients */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-violet-500/6 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-400/5 blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-blue-400/4 blur-[100px]" />
      </div>

      {/* Top bar */}
      <nav className="flex items-center px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <img src="/viraltalk-icon.png" alt="ViralTalk" className="h-7 w-auto flex-shrink-0" />
          <span className="font-bold text-lg tracking-tight text-foreground">ViralTalk</span>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-10">
        {/* Logo + headline */}
        <div className="flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-700 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-violet-400/20 blur-2xl scale-110" />
            <img src="/viraltalk-icon.png" alt="ViralTalk logo" className="relative h-24 w-auto drop-shadow-xl" />
          </div>
          <div className="space-y-2 max-w-md">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">ViralTalk</h1>
            <p className="text-lg text-muted-foreground">Where your friend group comes alive.</p>
          </div>
        </div>

        {/* Auth card */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 w-full max-w-sm">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl shadow-black/5">
            {step.kind === "username" ? (
              <>
                <div className="mb-5 text-center">
                  <h2 className="text-base font-semibold text-foreground">Pick your username</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    New here? We'll help you set up an account.
                  </p>
                </div>

                <form onSubmit={handleUsernameSubmit} className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">@</span>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your_username"
                      className="pl-8 h-11 rounded-xl bg-muted/50 border-border/50 focus:border-violet-400 focus:ring-violet-400/20 text-sm"
                      autoFocus
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      data-testid="input-username"
                      disabled={isCheckingUsername}
                    />
                  </div>

                  {checkUsernameError && (
                    <p className="text-xs text-destructive text-center px-1" data-testid="text-username-error">
                      {checkUsernameError.message}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all"
                    disabled={isCheckingUsername || username.trim().length < 2}
                    data-testid="button-continue-username"
                  >
                    {isCheckingUsername ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Checking…
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-[11px] text-muted-foreground/60 text-center mt-4 leading-relaxed">
                  Usernames are lowercase letters, numbers, _ and -. Min 2 characters.
                </p>
              </>
            ) : (
              <PasswordStep
                step={step}
                password={password}
                confirmPassword={confirmPassword}
                onPassword={setPassword}
                onConfirm={setConfirmPassword}
                onSubmit={handlePasswordSubmit}
                onBack={goBack}
                isLoading={isLoggingIn}
                error={localError || loginError?.message || null}
              />
            )}
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 animate-in fade-in duration-700 delay-300 max-w-sm">
          {features.map(({ icon: Icon, label, color, bg }) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${bg} border border-border/30 text-xs font-medium text-foreground/60`}
            >
              <Icon className={`w-3 h-3 ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </main>

      <footer className="py-5 text-center text-xs text-muted-foreground/40">
        &copy; {new Date().getFullYear()} ViralTalk
      </footer>
    </div>
  );
}

function PasswordStep({
  step,
  password,
  confirmPassword,
  onPassword,
  onConfirm,
  onSubmit,
  onBack,
  isLoading,
  error,
}: {
  step: Extract<Step, { kind: "password" }>;
  password: string;
  confirmPassword: string;
  onPassword: (v: string) => void;
  onConfirm: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  const showConfirm = step.status !== "existing";

  const heading =
    step.status === "new"
      ? "Create your password"
      : step.status === "existing"
      ? "Welcome back"
      : "Set up a password";

  const subheading =
    step.status === "new"
      ? `Pick a password for @${step.username}.`
      : step.status === "existing"
      ? `Enter your password for @${step.username}.`
      : `Your account exists but doesn't have a password yet. Set one to claim @${step.username}.`;

  return (
    <>
      <div className="mb-5 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-300 mb-2">
          <Lock className="w-4 h-4" />
        </div>
        <h2 className="text-base font-semibold text-foreground" data-testid="text-password-step-heading">
          {heading}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{subheading}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <Input
          type="password"
          value={password}
          onChange={(e) => onPassword(e.target.value)}
          placeholder="Password"
          className="h-11 rounded-xl bg-muted/50 border-border/50 focus:border-violet-400 focus:ring-violet-400/20 text-sm"
          autoFocus
          autoComplete={step.status === "existing" ? "current-password" : "new-password"}
          data-testid="input-password"
          disabled={isLoading}
        />

        {showConfirm && (
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirm(e.target.value)}
            placeholder="Confirm password"
            className="h-11 rounded-xl bg-muted/50 border-border/50 focus:border-violet-400 focus:ring-violet-400/20 text-sm"
            autoComplete="new-password"
            data-testid="input-confirm-password"
            disabled={isLoading}
          />
        )}

        {error && (
          <p className="text-xs text-destructive text-center px-1" data-testid="text-password-error">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all"
          disabled={isLoading || password.length < 6}
          data-testid="button-submit-password"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              {step.status === "existing" ? "Signing in…" : "Creating account…"}
            </>
          ) : (
            <>
              {step.status === "existing" ? "Sign in" : "Continue"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full h-9 rounded-xl text-xs text-muted-foreground"
          onClick={onBack}
          disabled={isLoading}
          data-testid="button-back-username"
        >
          <ArrowLeft className="mr-1 w-3.5 h-3.5" />
          Use a different username
        </Button>
      </form>
    </>
  );
}
