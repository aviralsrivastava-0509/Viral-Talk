import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, MessageCircle, Calendar, Users, BarChart3, Sparkles } from "lucide-react";

export default function Landing() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 2) return;
    login(username.trim());
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

        {/* Login card */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 w-full max-w-sm">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl shadow-black/5">
            <div className="mb-5 text-center">
              <h2 className="text-base font-semibold text-foreground">Pick your username</h2>
              <p className="text-sm text-muted-foreground mt-0.5">New here? We'll create your account automatically.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
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
                  disabled={isLoggingIn}
                />
              </div>

              {loginError && (
                <p className="text-xs text-destructive text-center px-1">{loginError.message}</p>
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all"
                disabled={isLoggingIn || username.trim().length < 2}
                data-testid="button-login"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Signing in…
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
