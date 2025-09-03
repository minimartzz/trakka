import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SplitText from "@/components/gsap/SplitText";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2,
  BarChart3,
  Users,
  Calendar,
  ArrowRight,
  Play,
  TrendingUp,
} from "lucide-react";

const Index = () => {
  // const { user, loading } = useAuth();

  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-background">
  //       <Loader2 className="h-8 w-8 animate-spin" />
  //     </div>
  //   );
  // }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--gradient-subtle)" }}
    >
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-42 pb-42">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
              <span className="text-foreground">Game intelligence for</span>{" "}
              <span className="bg-gradient-to-r from-primary via-chart-2 to-ring bg-clip-text text-transparent">
                <SplitText
                  text="board game enthusiasts"
                  className="pb-2"
                  delay={100}
                  duration={0.6}
                  ease="power3.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 40 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                  rootMargin="-100px"
                  textAlign="center"
                />
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Professional board game tracking software that helps you make
              strategic decisions, backed by comprehensive analytics and powered
              by intelligent insights.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* {user ? (
              <Button asChild size="lg" className="text-base px-8 py-6">
                <Link href="/dashboard">
                  Go href Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="text-base px-8 py-6">
                  <Link href="/auth">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base px-8 py-6">
                  <Link href="/guest">Try Demo</Link>
                </Button>
              </>
            )} */}
          </div>

          <p className="text-sm text-muted-foreground">
            Free trial • No credit card required
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
            Get comprehensive insights
          </h2>
          <h3 className="text-4xl lg:text-5xl font-bold text-foreground">
            All-in-one platform.
          </h3>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ditch the scorepads and make analytics a game habit. Trakka provides
            a single source of truth for all your gaming data.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ boxShadow: "var(--shadow-elegant)" }}
          >
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Session tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed">
                Record detailed game sessions with scores, player performance,
                and game duration. Track victories and defeats with complete
                confidence.
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ boxShadow: "var(--shadow-elegant)" }}
          >
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Real-time metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed">
                Get an up-href-date view of win rates, favorite games, player
                rankings, and more. Uncover insights with game-specific KPIs.
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ boxShadow: "var(--shadow-elegant)" }}
          >
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Group management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed">
                Create gaming groups, organize tournaments, and manage your
                community. Track group statistics and individual progress.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 border-t border-border/50">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Ready href level up your board gaming?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of players who are already tracking their games and
              improving their strategies.
            </p>
            {/* {!user && (
              <Button asChild size="lg" className="text-base px-8 py-6">
                <Link href="/auth">
                  Start tracking today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )} */}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
