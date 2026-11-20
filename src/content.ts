export type OrderStep = {
  kind: "order";
  prompt: string;
  items: { id: string; label: string }[];
  why: string;
  source: string;
};
export type ChoiceStep = {
  kind: "choice";
  prompt: string;
  options: { id: string; label: string }[];
  answer: string;
  why: string;
  source: string;
};
export type SwipeCard = {
  id: string;
  text: string;
  truth: boolean;
  why: string;
  source: string;
};
export type SwipeStep = {
  kind: "swipe";
  cards: SwipeCard[];
};
export type MatchStep = {
  kind: "match";
  how: string;
  pairs: { id: string; left: string; right: string; why: string; source: string }[];
};
export type MemoryStep = {
  kind: "memory";
  how: string;
  pairs: { id: string; a: string; b: string; why: string; source: string }[];
};
export type SortStep = {
  kind: "sort";
  how: string;
  left: string;
  right: string;
  cards: { id: string; text: string; basket: "left" | "right"; why: string; source: string }[];
};
export type ChatStep = {
  kind: "chat";
  how: string;
  says: string;
  replies: { id: string; text: string; ok: boolean; why: string; source: string }[];
};
export type AssignStep = {
  kind: "assign";
  prompt: string;
  agents: { id: string; label: string; note: string }[];
  tasks: { id: string; label: string; agent: string; why: string; source: string }[];
};
export type PokerStep = {
  kind: "poker";
  prompt: string;
  cards: { id: string; text: string; hold: boolean; why: string; source: string }[];
};
export type Step = OrderStep | ChoiceStep | AssignStep | PokerStep | SwipeStep | MatchStep | MemoryStep | SortStep | ChatStep;
export type Level = {
  id: string;
  title: string;
  sticker: string;
  learn?: { icon: string; points: string[]; source: string };
  limitMs: number;
  steps: Step[];
};
export type Region = {
  id: string;
  title: string;
  when: string;
  who: string;
  color: string;
  x: number;
  y: number;
  landmark: "rocket" | "robot" | "tower" | "mist";
  flavor: (cleared: number) => string;
  levels: Level[];
  locked?: boolean;
};

const note = "Class notes, 13 Nov";

export const regions: Region[] = [
  {
    id: "vibe",
    title: "Vibe Coding",
    when: "9 Oct",
    who: "LaunchLab",
    color: "#B7E4C7",
    x: 22,
    y: 58,
    landmark: "rocket",
    flavor: (n) => `Launch pad ${n}/6`,
    levels: [
      {
        id: "pipeline",
        title: "Sketch, then ship",
        sticker: "Design, build, push, then host.",
        limitMs: 40000,
        steps: [
          {
            kind: "choice",
            prompt: "An idea wants to become a live site.",
            options: [
              { id: "right", label: "Design, then build, push, and host" },
              { id: "host", label: "Host it before you design" },
              { id: "push", label: "Push the code before you build" },
            ],
            answer: "right",
            why: "Design the look, build it, push the code, then connect hosting.",
            source: "Lecture pp. 4, 7, 20, 21",
          },
        ],
      },
      {
        id: "tools",
        title: "Who does this job?",
        sticker: "Each tool has one job.",
        limitMs: 50000,
        steps: [
          {
            kind: "assign",
            prompt: "Drag or tap each job onto the tool that does it.",
            agents: [
              { id: "github", label: "GitHub", note: "Files and history" },
              { id: "vercel", label: "Vercel", note: "Build and host" },
              { id: "claude", label: "Claude Code", note: "Build and debug" },
              { id: "supabase", label: "Supabase", note: "Auth and data" },
            ],
            tasks: [
              {
                id: "store",
                label: "Store the code and its history",
                agent: "github",
                why: "A repository keeps the files and the history together.",
                source: "Lecture pp. 14, 15",
              },
              {
                id: "host",
                label: "Deploy and host the site",
                agent: "vercel",
                why: "Vercel builds and hosts the project from the repository.",
                source: "Lecture pp. 19, 21",
              },
              {
                id: "debug",
                label: "Build and debug the project",
                agent: "claude",
                why: "Claude Code can read the codebase, run commands, and debug.",
                source: "Lecture pp. 8, 11",
              },
              {
                id: "auth",
                label: "Add login and a database",
                agent: "supabase",
                why: "Supabase supplies authentication and a database.",
                source: "Lecture p. 28",
              },
            ],
          },
        ],
      },
      {
        id: "files",
        title: "Which file?",
        sticker: "Words, colour, and clicks live in different files.",
        limitMs: 40000,
        steps: [
          {
            kind: "assign",
            prompt: "A plain HTML site. Open the file that owns the change.",
            agents: [
              { id: "html", label: "index.html", note: "Words" },
              { id: "css", label: "styles.css", note: "Look" },
              { id: "js", label: "script.js", note: "Clicks" },
            ],
            tasks: [
              {
                id: "text",
                label: "Change the button text",
                agent: "html",
                why: "HTML holds the words people read.",
                source: "Lecture p. 24",
              },
              {
                id: "color",
                label: "Change the button colour",
                agent: "css",
                why: "CSS controls colour, type, and layout.",
                source: "Lecture p. 24",
              },
              {
                id: "click",
                label: "Make the button react to a click",
                agent: "js",
                why: "JavaScript adds the behaviour.",
                source: "Lecture p. 24",
              },
            ],
          },
        ],
      },
      {
        id: "push",
        title: "It never left the laptop",
        sticker: "A commit is local until you push.",
        limitMs: 25000,
        steps: [
          {
            kind: "choice",
            prompt: "You committed. GitHub still shows the old files.",
            options: [
              { id: "push", label: "Push the commits" },
              { id: "again", label: "Commit the same files again" },
              { id: "vercel", label: "Reconnect Vercel first" },
            ],
            answer: "push",
            why: "A commit is a local snapshot. A push sends it to GitHub.",
            source: "Lecture pp. 15, 18",
          },
        ],
      },
      {
        id: "live",
        title: "Make it live",
        sticker: "GitHub stores code. Vercel hosts the site.",
        limitMs: 25000,
        steps: [
          {
            kind: "choice",
            prompt: "The code is on GitHub. No host is connected.",
            options: [
              { id: "public", label: "Make the repo public" },
              { id: "push", label: "Keep pushing until a site appears" },
              { id: "vercel", label: "Connect the repo to Vercel and deploy" },
            ],
            answer: "vercel",
            why: "Visible source is not hosting. Vercel builds and hosts the site.",
            source: "Lecture pp. 19, 21",
          },
        ],
      },
      {
        id: "boss",
        title: "Launch day",
        sticker: "Review, accounts, then the same four-step ship.",
        limitMs: 70000,
        steps: [
          {
            kind: "choice",
            prompt: "A teammate should review the branch before it joins main.",
            options: [
              { id: "merge", label: "Merge straight into main" },
              { id: "pr", label: "Open a pull request" },
              { id: "clone", label: "Clone the repo again" },
            ],
            answer: "pr",
            why: "A pull request is the review before the merge.",
            source: "Lecture pp. 15, 18",
          },
          {
            kind: "choice",
            prompt: "Students need accounts and progress that follow them to another device.",
            options: [
              { id: "back", label: "Auth and a database, such as Supabase" },
              { id: "css", label: "A login button styled in CSS" },
              { id: "local", label: "Save it only in this browser" },
            ],
            answer: "back",
            why: "Auth identifies them. A database keeps progress for the next device.",
            source: "Lecture pp. 26, 27, 28",
          },
          {
            kind: "order",
            prompt: "Boss check. Ship the site in the right order.",
            items: [
              { id: "design", label: "Design" },
              { id: "build", label: "Build" },
              { id: "push", label: "Push" },
              { id: "host", label: "Host" },
            ],
            why: "Same path: design, build, push, host.",
            source: "Lecture pp. 4, 7, 20, 21",
          },
        ],
      },
    ],
  },
  {
    id: "agentic",
    title: "Agentic AI",
    when: "30 Oct",
    who: "Nick Goh",
    color: "#D9C7F0",
    x: 50,
    y: 22,
    landmark: "robot",
    flavor: (n) => `Chain ${n}/6`,
    levels: [
      {
        id: "writer",
        title: "Hire the Brief Writer",
        sticker: "The brief is drafted before anyone else touches it.",
        learn: {
          icon: "✎",
          source: "Nick Goh deck pp. 4, 6",
          points: ["Brief Writer drafts the brief", "Include goal, audience, budget, timing", "The buyer only negotiates placements"],
        },
        limitMs: 40000,
        steps: [
          {
            kind: "swipe",
            cards: [
              { id: "draft", text: "The Brief Writer drafts the brief.", truth: true, why: "The Brief Writer drafts the brief. The buyer only negotiates placements.", source: "Nick Goh deck pp. 4, 6" },
              { id: "buyer-drafts", text: "The buyer drafts the brief.", truth: false, why: "The buyer only negotiates placements.", source: "Nick Goh deck pp. 4, 6" },
              { id: "needs", text: "The brief needs the goal, audience, budget, and timing.", truth: true, why: "Those are the inputs the Brief Writer needs.", source: "Nick Goh deck p. 4" },
              { id: "buyer-seat", text: "The buyer is a seat in this handoff.", truth: false, why: "The buyer only negotiates placements. That role is not one of the six seats.", source: "Nick Goh deck pp. 4, 6" },
              { id: "buyer-job", text: "The buyer negotiates placements.", truth: true, why: "The buyer only negotiates placements.", source: "Nick Goh deck pp. 4, 6" },
            ],
          },
        ],
      },
      {
        id: "validator",
        title: "Fresh eyes",
        sticker: "A new chat checks the brief.",
        learn: {
          icon: "👀",
          source: "Nick Goh deck pp. 4, 6",
          points: ["Validator is a fresh chat", "Checks objective, audience, message, metric", "The Analyst is not on this chain"],
        },
        limitMs: 45000,
        steps: [
          {
            kind: "match",
            how: "Tap one on the left, then its match.",
            pairs: [
              { id: "fresh", left: "Brief Validator", right: "A fresh chat", why: "The validator is a new chat with fresh eyes.", source: "Nick Goh deck pp. 4, 6" },
              { id: "checks", left: "The checklist", right: "Objective, audience, message, metric", why: "That checklist is the validator’s job.", source: "Nick Goh deck p. 4" },
              { id: "analyst", left: "The Analyst", right: "Not on this chain", why: "That checklist is the validator’s job.", source: "Nick Goh deck p. 4" },
            ],
          },
        ],
      },
      {
        id: "strategist",
        title: "The Big Idea",
        sticker: "Strategy starts after the brief is valid.",
        learn: {
          icon: "✦",
          source: "Nick Goh deck pp. 4, 6",
          points: ["Strategist digests the valid brief", "Then writes the Big Idea"],
        },
        limitMs: 40000,
        steps: [
          {
            kind: "memory",
            how: "Flip two cards that go together.",
            pairs: [
              { id: "role", a: "Strategist", b: "Writes the Big Idea", why: "The strategist digests the valid brief and writes the Big Idea.", source: "Nick Goh deck pp. 4, 6" },
              { id: "order", a: "Valid brief", b: "Comes before the idea", why: "The strategist digests the valid brief and writes the Big Idea.", source: "Nick Goh deck pp. 4, 6" },
            ],
          },
        ],
      },
      {
        id: "you",
        title: "You approve",
        sticker: "A person saves the brief before production.",
        learn: {
          icon: "✓",
          source: "Nick Goh deck p. 6",
          points: ["Seat four is you", "AI can draft. You decide.", "You save it to the knowledge base"],
        },
        limitMs: 35000,
        steps: [
          {
            kind: "sort",
            how: "Tap the basket this card belongs in.",
            left: "AI does it",
            right: "You do it",
            cards: [
              { id: "draft", text: "Draft the brief", basket: "left", why: "AI can draft. You decide.", source: "Nick Goh deck p. 6" },
              { id: "approve", text: "Approve the brief", basket: "right", why: "Seat four is you. AI can draft. You decide.", source: "Nick Goh deck p. 6" },
              { id: "save", text: "Save it to the knowledge base", basket: "right", why: "You approve it and save it to the knowledge base.", source: "Nick Goh deck p. 6" },
              { id: "decide", text: "Decide", basket: "right", why: "AI can draft. You decide.", source: "Nick Goh deck p. 6" },
            ],
          },
        ],
      },
      {
        id: "makers",
        title: "Production desk",
        sticker: "Visuals and channel lines come after your yes.",
        learn: {
          icon: "✿",
          source: "Nick Goh deck pp. 5, 6",
          points: ["Design makes the visuals", "Copy adapts the lines per channel", "They work after your yes"],
        },
        limitMs: 40000,
        steps: [
          {
            kind: "chat",
            how: "Tap the reply that fits.",
            says: "The brief is saved. Who makes the work?",
            replies: [
              { id: "makers", text: "Designer and copywriter", ok: true, why: "Design makes the visuals. Copy adapts the lines per channel.", source: "Nick Goh deck pp. 5, 6" },
              { id: "analyst", text: "The Analyst", ok: false, why: "Design makes the visuals. The Analyst is not on this chain.", source: "Nick Goh deck pp. 5, 6" },
              { id: "buyer", text: "The buyer", ok: false, why: "Designer and copywriter make the work after your yes.", source: "Nick Goh deck pp. 5, 6" },
            ],
          },
        ],
      },
      {
        id: "boss",
        title: "The big client",
        sticker: "Six seats. One chain. You are seat four.",
        learn: {
          icon: "★",
          source: "Nick Goh deck pp. 5, 6",
          points: ["Brief Writer drafts first", "You approve before production", "Reviewer signs off brand voice"],
        },
        limitMs: 80000,
        steps: [
          {
            kind: "swipe",
            cards: [
              { id: "draft", text: "The Brief Writer drafts the brief.", truth: true, why: "Brief Writer drafts. The buyer is not in this chain.", source: "Nick Goh deck p. 6" },
              { id: "buyer", text: "The buyer is in this chain.", truth: false, why: "The buyer is not in this chain.", source: "Nick Goh deck p. 6" },
              { id: "check", text: "The validator checks the brief in a new chat.", truth: true, why: "Validator checks the brief in a new chat.", source: "Nick Goh deck p. 6" },
              { id: "you", text: "You approve before anyone produces the work.", truth: true, why: "You approve before anyone produces the work.", source: "Nick Goh deck p. 6" },
              { id: "sign", text: "The reviewer checks brand voice and signs off.", truth: true, why: "The reviewer checks brand voice and signs off.", source: "Nick Goh deck pp. 5, 6" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "linkedin",
    title: "LinkedIn",
    when: "13 Nov",
    who: "Cindy Leong",
    color: "#C5E4F7",
    x: 78,
    y: 58,
    landmark: "tower",
    flavor: (n) =>
      n >= 6 ? "Top Voice" : n >= 3 ? "Industry Expert" : n >= 1 ? "Active" : "Newbie",
    levels: [
      {
        id: "headline",
        title: "A headline a model can see",
        sticker: "Say the topic in the heading.",
        learn: {
          icon: "✎",
          source: note,
          points: ["The heading should state the topic", "92% of cited pieces in her study did"],
        },
        limitMs: 25000,
        steps: [
          {
            kind: "chat",
            how: "Tap the reply that fits.",
            says: "Which heading can a model use?",
            replies: [
              { id: "clear", text: "How AI is changing B2B buying decisions", ok: true, why: "She said the heading should state the topic. 92% of cited pieces in her study did.", source: note },
              { id: "vague", text: "The future is here", ok: false, why: "She said the heading should state the topic.", source: note },
              { id: "tease", text: "What you need to know", ok: false, why: "She said the heading should state the topic.", source: note },
            ],
          },
        ],
      },
      {
        id: "names",
        title: "Name it",
        sticker: "Name the company. Name the tool.",
        learn: {
          icon: "🏷",
          source: note,
          points: ["Name the company and the tool", "She cited that in 75% of the cited pieces"],
        },
        limitMs: 25000,
        steps: [
          {
            kind: "sort",
            how: "Tap the basket this line belongs in.",
            left: "Names it",
            right: "Too vague",
            cards: [
              { id: "named", text: "LinkedIn launched a new advertising solution", basket: "left", why: "Name the company and the tool.", source: note },
              { id: "vague", text: "Our company", basket: "right", why: "Name the company and the tool.", source: note },
              { id: "hype", text: "We just changed everything", basket: "right", why: "Name the company and the tool.", source: note },
              { id: "rule", text: "Name the company and the tool", basket: "left", why: "She cited that in 75% of the cited pieces.", source: note },
            ],
          },
        ],
      },
      {
        id: "format",
        title: "Answer the buying question",
        sticker: "Best-of, comparison, or how to choose.",
        learn: {
          icon: "☰",
          source: note,
          points: ["Best-of lists", "Side-by-side comparisons", "How-to-choose guides"],
        },
        limitMs: 25000,
        steps: [
          {
            kind: "memory",
            how: "Flip two cards that go together.",
            pairs: [
              { id: "yes", a: "How to choose", b: "A format she named", why: "She named best-of lists, side-by-side comparisons, and how-to-choose guides.", source: note },
              { id: "no", a: "Hype video", b: "Not a format she named", why: "She named best-of lists, side-by-side comparisons, and how-to-choose guides.", source: note },
            ],
          },
        ],
      },
      {
        id: "week",
        title: "Show up again this week",
        sticker: "Two or three educational posts. No virality required.",
        learn: {
          icon: "↻",
          source: note,
          points: ["2–3 educational posts a week", "You do not need a viral post"],
        },
        limitMs: 25000,
        steps: [
          {
            kind: "match",
            how: "Tap one on the left, then its match.",
            pairs: [
              { id: "plan", left: "Her plan", right: "2–3 educational posts a week", why: "She suggested 2–3 educational posts a week.", source: note },
              { id: "viral", left: "Not her plan", right: "One viral slogan, then quiet", why: "You do not need a viral post.", source: note },
              { id: "logo", left: "Also not her plan", right: "Only a logo post", why: "She suggested 2–3 educational posts a week.", source: note },
            ],
          },
        ],
      },
      {
        id: "poker",
        title: "Show the hand",
        sticker: "Hold what she said. Fold the rest.",
        learn: {
          icon: "♥",
          source: note,
          points: ["Short post for people, long article for the model", "No virality required", "About 75% people, about 25% company pages"],
        },
        limitMs: 50000,
        steps: [
          {
            kind: "swipe",
            cards: [
              { id: "two", text: "One topic: a short post for people and a long article for the model.", truth: true, why: "That was her answer for writing to humans and to AI.", source: note },
              { id: "viral", text: "You do not need a viral post to be accepted by an LLM.", truth: true, why: "You do not need virality to be accepted by an LLM.", source: note },
              { id: "people", text: "About 75% of those citations came from individual creators.", truth: true, why: "She cited about 75% from individuals and about 25% from company pages.", source: note },
              { id: "company", text: "Company pages supplied most of those citations.", truth: false, why: "Company pages were the smaller share, about 25%.", source: note },
              { id: "pay", text: "Paying to boost a post makes an LLM cite it.", truth: false, why: "Pay does not earn the citation. Test it organically, then amplify.", source: note },
            ],
          },
        ],
      },
      {
        id: "boss",
        title: "See, think, respond",
        sticker: "If it cannot see the post, it cannot recommend you.",
        learn: {
          icon: "→",
          source: note,
          points: ["See comes first", "Short for people, long for the model", "Pay does not buy the citation"],
        },
        limitMs: 40000,
        steps: [
          {
            kind: "chat",
            how: "Tap the reply that fits.",
            says: "A model never finds the post. What comes first?",
            replies: [
              { id: "see", text: "See", ok: true, why: "See comes first. If a model cannot find the content, it cannot use it.", source: note },
              { id: "think", text: "Think", ok: false, why: "See comes first. If a model cannot find the content, it cannot use it.", source: note },
              { id: "respond", text: "Respond", ok: false, why: "See comes first. If a model cannot find the content, it cannot use it.", source: note },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "soon-a",
    title: "Coming soon",
    when: "Later",
    who: "A future guest",
    color: "#D9D4DE",
    x: 16,
    y: 18,
    landmark: "mist",
    flavor: () => "Locked",
    levels: [],
    locked: true,
  },
  {
    id: "soon-b",
    title: "Coming soon",
    when: "Later",
    who: "A future guest",
    color: "#D9D4DE",
    x: 84,
    y: 18,
    landmark: "mist",
    flavor: () => "Locked",
    levels: [],
    locked: true,
  },
];

export const playable = regions.filter((r) => !r.locked);

export function findRegion(id: string) {
  return regions.find((r) => r.id === id);
}

export function gradedCount(level: Level) {
  return level.steps.reduce((n, step) => {
    if (step.kind === "order") return n + step.items.length;
    if (step.kind === "choice") return n + 1;
    if (step.kind === "assign") return n + step.tasks.length;
    if (step.kind === "swipe") return n + step.cards.length;
    if (step.kind === "match" || step.kind === "memory") return n + step.pairs.length;
    if (step.kind === "sort") return n + step.cards.length;
    if (step.kind === "chat") return n + 1;
    return n + step.cards.length;
  }, 0);
}
