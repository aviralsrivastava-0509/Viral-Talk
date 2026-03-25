import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Calendar, Users } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="text-2xl font-bold font-display flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center text-white shadow-lg shadow-primary/20">
            V
          </div>
          ViralTalk
        </div>
        <Button onClick={handleLogin}>Log In</Button>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto w-full gap-8 py-20">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight">
            Your friends, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              all in one place.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plan events, share stories, vote on polls, and keep the group chat alive.
            The only app your friend group needs.
          </p>
        </div>

        <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1" onClick={handleLogin}>
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="p-6 rounded-2xl bg-card border shadow-lg hover:shadow-xl transition-shadow text-left">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Group Chat & Stories</h3>
            <p className="text-muted-foreground">Share ephemeral stories or important announcements. Keep everyone in the loop.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border shadow-lg hover:shadow-xl transition-shadow text-left">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Event Planning</h3>
            <p className="text-muted-foreground">Coordinate meetups with dates, times, and locations. No more "when are we free?"</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border shadow-lg hover:shadow-xl transition-shadow text-left">
            <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Polls & Voting</h3>
            <p className="text-muted-foreground">Decide where to eat or what movie to watch democratically. End the debates.</p>
          </div>
        </div>

        {/* Abstract Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[100px]" />
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} ViralTalk. Built for fun.
      </footer>
    </div>
  );
}
