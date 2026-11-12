import Navbar from "@/components/Navbar";
import LandingFooter from "@/components/landing/footer";

// Same shell as (home), with the player-page topbar
export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar variant="player" />
      {children}
      <LandingFooter />
    </div>
  );
}
