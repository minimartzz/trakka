import Link from "next/link";

/**
 * Different methods of rendering content formatting
 *
 * 1. Text: default words, each block has a newline spacing between them
 * 2. Steps: Ordered list with a header title that's bolded
 * 3. Bullets: Unordered list with NO header title. Items are closer to each other
 *
 * Bodies are ReactNode, so that they can carry HTML styling
 */
export type AnswerBlock =
  | { kind: "text"; body: React.ReactNode }
  | { kind: "steps"; items: { lead: string; body: React.ReactNode }[] }
  | { kind: "bullets"; items: React.ReactNode[] };

export interface Question {
  qns: string;
  ans: AnswerBlock[];
}

// Inline link within the string
const FaqLink = ({ href, children }: { href: string; children: string }) => (
  <Link
    href={href}
    className="font-medium text-foreground underline decoration-muted-foreground/50 underline-offset-2 transition-colors hover:text-primary hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-xs"
  >
    {children}
  </Link>
);

export const QUESTIONS: Question[] = [
  {
    qns: "What is Trakka?",
    ans: [
      {
        kind: "text",
        body: "Trakka is a board game tracking platform built for board gamers, by board gamers. We have found that while many other tracking apps focus on individual performance and recording, none can quite capture the competitiveness and inclusiveness that a true board game experience should deliver. Trakka aims to solve this problem in three ways:",
      },
      {
        kind: "steps",
        items: [
          {
            lead: "The tribe is the unit",
            body: "A tribe is essentially a gaming group, much like the various gaming groups you may have in real life.",
          },
          {
            lead: "Sessions are recorded in your specific tribe",
            body: "Providing relevance and visibility for all members of the tribe to view and participate in.",
          },
          {
            lead: "Performance metrics with depth",
            body: "We have built various performance metrics and tools to deliver deeper and more insightful statistics for all users.",
          },
        ],
      },
      {
        kind: "text",
        body: "Whether you play casually with family, meet regularly with a gaming group or play solo, Trakka helps keep track and provide insights for all your sessions.",
      },
    ],
  },
  {
    qns: "What can I do with Trakka?",
    ans: [
      {
        kind: "text",
        body: "Many board game trackers tell you what you played. Trakka is designed to help you understand what happened.",
      },
      {
        kind: "text",
        body: "Trakka combines session tracking, group management and performance analytics in one platform. It lets you:",
      },
      {
        kind: "bullets",
        items: [
          "Keep a complete record of your board game sessions",
          "Track scores, winners, playing time and player performance",
          "Create Tribes for different groups of friends or family",
          "Compare players across games and sessions",
          "Discover your strongest games and toughest matchups",
          "View statistics that account for differences between games",
          "See how your performance changes over time",
        ],
      },
    ],
  },
  {
    qns: "How to get started?",
    ans: [
      {
        kind: "text",
        body: "Getting started takes only a few steps.",
      },
      {
        kind: "steps",
        items: [
          {
            lead: "Create your account",
            body: (
              <>
                Sign up for a Trakka account{" "}
                <FaqLink href="/login?tab=sign-up">here</FaqLink> and complete
                your player profile.
              </>
            ),
          },
          {
            lead: "Create a Tribe",
            body: "Create a Tribe for the group of people you normally play with. Give it a name and invite or add your fellow players.",
          },
          {
            lead: "Record your first session",
            body: "Select the game, add the participating players and enter the session details. Hit save.",
          },
          {
            lead: "Explore your statistics",
            body: "Once your session has been saved, Trakka automatically updates the relevant player, game and Tribe statistics.",
          },
        ],
      },
      {
        kind: "text",
        body: "The more sessions you record, the more rich your insights become.",
      },
    ],
  },
  {
    qns: "What is a Tribe?",
    ans: [
      {
        kind: "text",
        body: "Tribes are how we organise ourselves in Trakka. A Tribe is a essentially group of players, and for now, anyone can create your own Tribe.",
      },
      {
        kind: "text",
        body: "You might create a Tribe for:",
      },
      {
        kind: "bullets",
        items: [
          "Your family",
          "A regular weekend gaming group",
          "Colleagues",
          "A board game club",
          "A tournament or event",
          "Different groups of friends",
        ],
      },
      {
        kind: "text",
        body: "Each Tribe has its own admin, members, games, sessions and statistics. This makes it easy to keep different gaming groups organised while seeing how each player performs within that group.",
      },
      {
        kind: "text",
        body: "You can belong to more than one Tribe.",
      },
    ],
  },
  {
    qns: "What statistics does Trakka track?",
    ans: [
      {
        kind: "text",
        body: "Trakka tracks statistics across your personal profile, individual games and Tribes.",
      },
      {
        kind: "text",
        body: "These include:",
      },
      {
        kind: "bullets",
        items: [
          "Total sessions played",
          "Total wins",
          "Overall win rate",
          "Game-specific win rate",
          "Weighted Player Average, or WPA",
          "Number of unique games played",
          "Total and average playing time",
          "Average score",
          "Highest score",
          "Most-played games",
          "Most successful games",
          "Player rankings",
          "Performance against specific players",
          "Recent performance and winning streaks",
        ],
      },
      {
        kind: "text",
        body: "Not every statistic applies to every game and we will continue to add more insights along the way.",
      },
    ],
  },
  {
    qns: "How do we calculate Weighted Player Average (WPA)?",
    ans: [
      {
        kind: "text",
        body: "WPA is an adjusted performance statistic that adds context to your basic win rate.",
      },
      {
        kind: "text",
        body: "A standard win rate treats every game equally. However, the expected chance of winning can change depending on factors such as:",
      },
      {
        kind: "bullets",
        items: [
          "The number of players",
          "The amount of time a game would take",
          "The difficulty of the game",
        ],
      },
      {
        kind: "text",
        body: "WPA takes into account these factors and awards higher points to players who win long, complex, multi-player games over short, light and games with fewer players.",
      },
    ],
  },
  {
    qns: "What if some players are not on Trakka?",
    ans: [
      {
        kind: "text",
        body: "Well, get them onto Trakka!",
      },
      {
        kind: "text",
        body: "If a player is not on Trakka, you may still be able to add a player to a Tribe and record their participation without requiring them to create an account immediately through the anonymous player submission. This creates a unique code that they may claim on a later date. Claiming their code on a later date immediately links player records so they can view their statistics directly.",
      },
    ],
  },
  {
    qns: "Who can see my Tribes and statistics?",
    ans: [
      {
        kind: "text",
        body: "Access depends on the Tribe's visibility and your account settings.",
      },
      {
        kind: "text",
        body: "Private Tribe information is intended to be viewed only by its members. Public profiles, community rankings or shareable reports may display selected information where those features are enabled.",
      },
      {
        kind: "text",
        body: "Trakka will not intentionally display private Tribe information publicly without the appropriate visibility settings.",
      },
    ],
  },
  {
    qns: "Is Trakka free to use?",
    ans: [
      {
        kind: "text",
        body: "Trakka is currently free to get started with, and no credit card is required.",
      },
      {
        kind: "text",
        body: "As Trakka continues to grow, certain advanced or community features may be introduced separately. Any changes to available features will be communicated clearly to users.",
      },
    ],
  },
  {
    qns: "How can I suggest a feature or report a problem",
    ans: [
      {
        kind: "text",
        body: "We welcome feedback from the board gaming community. Please report through the feedback widget at the bottom right of the screen.",
      },
      {
        kind: "text",
        body: "When reporting a problem, it is helpful to include:",
      },
      {
        kind: "bullets",
        items: [
          "What you were trying to do",
          "What happened",
          "What you expected to happen",
          "The game or Tribe involved",
          "A screenshot, where possible",
          "The device and browser you were using",
        ],
      },
      {
        kind: "text",
        body: "Feature suggestions are also welcome, particularly ideas for new statistics, game formats and ways to make session tracking more effective and/or easier.",
      },
    ],
  },
];
