import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Calendar, Users, BarChart3, Sparkles } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
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

      {/* Minimal top bar */}
      <nav className="flex justify-between items-center px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="bg-white rounded-xl shadow-sm p-0.5">
            <img src="/viraltalk-logo.png" alt="ViralTalk" className="h-7 w-auto" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">ViralTalk</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogin} className="rounded-full px-5 text-sm font-medium">
          Sign in
        </Button>
      </nav>

      {/* Hero — centred, breathing */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-10 py-16">
        {/* Logo + headline block */}
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-700">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-violet-400/20 blur-2xl scale-110" />
            <img
              src="/viraltalk-logo.png"
              alt="ViralTalk logo"
              className="relative h-28 w-auto drop-shadow-xl"
            />
          </div>

          <div className="space-y-3 max-w-lg">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-none">
              <span className="text-foreground">ViralTalk</span>
            </h1>
            <p className="text-xl text-muted-foreground font-medium">
              Where your friend group comes alive.
            </p>
            <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto leading-relaxed">
              Private groups, real conversations — stories, events, polls, and chat, all in one calm place.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <Button
            size="lg"
            onClick={handleLogin}
            className="h-13 px-10 rounded-full text-base font-semibold shadow-xl shadow-violet-500/20 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            Get Started
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <p className="text-xs text-muted-foreground/60">Sign in with your Replit account — free forever</p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2.5 animate-in fade-in duration-700 delay-300 max-w-md">
          {features.map(({ icon: Icon, label, color, bg }) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full ${bg} border border-border/40 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground`}
            >
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground/50">
        &copy; {new Date().getFullYear()} ViralTalk
      </footer>
    </div>
  );
}
