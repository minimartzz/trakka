import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const Creators = () => (
  <section className="px-4 py-20 sm:py-24">
    <div className="container mx-auto">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display font-bold uppercase leading-none text-[clamp(2rem,4vw,2.75rem)]">
          Who&rsquo;s keeping score?
        </h2>
        <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
          Trakka is built by two friends who play too many board games and talk
          way too much smack. The scores used to live in an Excel sheet which
          was difficult to share. Now they live here. It is a small project,
          that started off as a hobby, but now we want to share the ability to
          prove why you're the best with the world.
        </p>
        <Button asChild variant="outline" size="lg" className="mt-8">
          <Link
            href="https://github.com/minimartzz/trakka/blob/main/CHANGELOG.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the changelog on GitHub
            <ArrowUpRight aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  </section>
);

export default Creators;
