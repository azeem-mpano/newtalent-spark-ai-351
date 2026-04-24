import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, Zap, Shield, BarChart3, Globe, ArrowRight, CheckCircle, Star, Sparkles } from "lucide-react";

const Index = () => {
  const openAuth = () => {
    window.open("/auth", "_blank", "noopener,noreferrer");
  };

  const features = [
    { icon: Zap, title: "AI-Powered Screening", desc: "Automatically rank and shortlist candidates using advanced AI analysis of skills, experience, and fit." },
    { icon: Shield, title: "Smart Job Matching", desc: "Match candidates to jobs based on skills, experience, and detailed requirements with precision." },
    { icon: BarChart3, title: "Real-Time Analytics", desc: "Track applications, hiring pipeline progress, and recruitment metrics at a glance." },
    { icon: Globe, title: "Professional Profiles", desc: "LinkedIn, GitHub, and portfolio integration for comprehensive and transparent screening." },
  ];

  const testimonials = [
    { name: "Sarah K.", role: "HR Director", text: "Talent 4G AI cut our screening time by 80%. The AI shortlisting is incredibly accurate." },
    { name: "James M.", role: "Software Engineer", text: "Found my dream job in a week. The application process was seamless and modern." },
    { name: "Amina D.", role: "Startup Founder", text: "We hired 3 engineers in 2 weeks using AI screening. Game-changer for startups." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl gradient-primary flex items-center justify-center shadow-md shrink-0">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-base sm:text-xl tracking-tight truncate">Talent 4G AI</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Button variant="ghost" size="sm" onClick={openAuth} className="font-medium h-9 px-2 sm:px-4 sm:h-10 text-sm">Sign In</Button>
            <Button variant="hero" size="sm" onClick={openAuth} className="shadow-md h-9 px-3 sm:px-4 sm:h-10 text-sm">
              <span className="hidden xs:inline">Get Started</span>
              <span className="xs:hidden">Start</span>
              <ArrowRight className="ml-1 sm:ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero text-primary-foreground py-16 sm:py-24 lg:py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(16,185,129,0.1)_0%,_transparent_60%)]" />
        <div className="container text-center space-y-5 sm:space-y-8 relative z-10 px-4">
          <Badge variant="secondary" className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary/20 text-primary-foreground border-0 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 inline" />
            AI-Powered Recruitment
          </Badge>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] max-w-4xl mx-auto tracking-tight">
            Hire Smarter with{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
              AI Intelligence
            </span>
          </h1>
          <p className="text-sm sm:text-lg md:text-xl max-w-2xl mx-auto text-primary-foreground/70 leading-relaxed px-2">
            Talent 4G AI connects top talent with great opportunities. Recruiters screen with AI, applicants find dream jobs — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 px-4 sm:px-0">
            <Button variant="hero" size="lg" onClick={openAuth} className="text-sm sm:text-base px-6 sm:px-8 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
              <Briefcase className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Find Jobs
            </Button>
            <Button size="lg" variant="outline" onClick={openAuth} className="text-sm sm:text-base px-6 sm:px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm w-full sm:w-auto">
              <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Post a Job
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-2 sm:pt-4 text-xs sm:text-sm text-primary-foreground/50">
            <span className="flex items-center gap-1 sm:gap-1.5"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Free to use</span>
            <span className="flex items-center gap-1 sm:gap-1.5"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> AI-Powered</span>
            <span className="flex items-center gap-1 sm:gap-1.5"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Instant setup</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 sm:py-24 lg:py-32">
        <div className="container px-4">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <Badge variant="outline" className="px-3 py-1 text-xs">Features</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold tracking-tight">Why Choose Talent 4G AI?</h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">Everything you need for modern recruitment, powered by AI.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((f, i) => (
              <div key={i} className="group p-5 sm:p-7 rounded-2xl bg-card shadow-card hover:shadow-elevated transition-all duration-300 border hover:-translate-y-1">
                <div className="h-11 w-11 sm:h-13 sm:w-13 rounded-xl gradient-primary flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-md">
                  <f.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 sm:py-24 bg-muted/40">
        <div className="container px-4">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <Badge variant="outline" className="px-3 py-1 text-xs">How It Works</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold tracking-tight">Three Simple Steps</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 max-w-5xl mx-auto">
            {[
              { step: "1", title: "Create Your Profile", desc: "Sign up as a job seeker or recruiter. Set up your professional profile.", icon: Users },
              { step: "2", title: "Explore & Apply", desc: "Browse active jobs, submit applications with resume and links.", icon: Briefcase },
              { step: "3", title: "AI Screens & Hires", desc: "AI analyzes, scores, and shortlists the best candidates instantly.", icon: Zap },
            ].map((s, i) => (
              <div key={i} className="text-center space-y-3 sm:space-y-5 relative">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto text-primary-foreground font-display font-bold text-xl sm:text-2xl shadow-lg">
                  {s.step}
                </div>
                <h3 className="font-display font-semibold text-lg sm:text-xl">{s.title}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed px-4 sm:px-0">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-14 sm:py-24">
        <div className="container px-4">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <Badge variant="outline" className="px-3 py-1 text-xs">Testimonials</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold tracking-tight">Loved by Teams & Talent</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className="p-5 sm:p-6 rounded-2xl bg-card border shadow-card space-y-3 sm:space-y-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-warning text-warning" />)}
                </div>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-24 gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.2)_0%,_transparent_70%)]" />
        <div className="container text-center space-y-5 sm:space-y-8 relative z-10 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold tracking-tight">Ready to Transform Your Hiring?</h2>
          <p className="text-sm sm:text-lg text-primary-foreground/70 max-w-xl mx-auto">Join teams using AI-powered recruitment to build winning teams.</p>
          <Button variant="hero" size="lg" onClick={openAuth} className="text-sm sm:text-base px-8 sm:px-12 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto max-w-sm mx-auto">
            Get Started Free <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-10 border-t bg-card/50">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center">
              <Briefcase className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">Talent 4G AI</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">© 2026 Talent 4G AI. Built for Africa's talent ecosystem.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
