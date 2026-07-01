import Navbar from "@/components/Navbar";
import LandingFooter from "@/components/landing/footer";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      {children}
      <LandingFooter />
    </div>
  );
}
