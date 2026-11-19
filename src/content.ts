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
export type Step = OrderStep | ChoiceStep | AssignStep | PokerStep;
export type Level = {
  id: string;
  title: string;
  sticker: string;
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
    x: 20,
    y: 36,
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
            kind: "order",
            prompt: "An idea wants to become a live site. Put the four steps in order.",
            items: [
              { id: "design", label: "Design the interface" },
              { id: "build", label: "Build the working site" },
              { id: "push", label: "Commit and push to GitHub" },
              { id: "host", label: "Deploy with Vercel" },
            ],
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
            prompt: "Drop each job on the tool that actually does it.",
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
    y: 24,
    landmark: "robot",
    flavor: (n) => `Desks open ${Math.min(6, n + 1)}`,
    levels: [
      {
        id: "writer",
        title: "Hire the Brief Writer",
        sticker: "The brief is drafted before anyone else touches it.",
        limitMs: 40000,
        steps: [
          {
            kind: "assign",
            prompt: "You are a one-person shop. Staff the first desk.",
            agents: [
              { id: "writer", label: "Brief Writer", note: "Drafts the brief" },
              { id: "buyer", label: "The Buyer", note: "Not on this chain" },
            ],
            tasks: [
              {
                id: "draft",
                label: "Draft the brief from the project",
                agent: "writer",
                why: "The Brief Writer drafts the brief. The buyer only negotiates placements.",
                source: "Nick Goh deck pp. 4, 6",
              },
              {
                id: "needs",
                label: "Capture goal, audience, budget, and timing",
                agent: "writer",
                why: "Those are the inputs the Brief Writer needs.",
                source: "Nick Goh deck p. 4",
              },
            ],
          },
        ],
      },
      {
        id: "validator",
        title: "Fresh eyes",
        sticker: "A new chat checks the brief.",
        limitMs: 45000,
        steps: [
          {
            kind: "assign",
            prompt: "The draft is messy. Hire a critic.",
            agents: [
              { id: "writer", label: "Brief Writer", note: "Already hired" },
              { id: "validator", label: "Brief Validator", note: "Fresh chat" },
              { id: "analyst", label: "The Analyst", note: "Not on this chain" },
            ],
            tasks: [
              {
                id: "fresh",
                label: "Critique the brief in a fresh chat",
                agent: "validator",
                why: "The validator is a new chat with fresh eyes.",
                source: "Nick Goh deck pp. 4, 6",
              },
              {
                id: "checks",
                label: "Check objective, audience, message, and metric",
                agent: "validator",
                why: "That checklist is the validator’s job.",
                source: "Nick Goh deck p. 4",
              },
            ],
          },
        ],
      },
      {
        id: "strategist",
        title: "The Big Idea",
        sticker: "Strategy starts after the brief is valid.",
        limitMs: 40000,
        steps: [
          {
            kind: "assign",
            prompt: "The brief survived the check. Shape the idea.",
            agents: [
              { id: "validator", label: "Brief Validator", note: "Already hired" },
              { id: "strategist", label: "Strategist", note: "Big Idea" },
              { id: "buyer", label: "The Buyer", note: "Not on this chain" },
            ],
            tasks: [
              {
                id: "idea",
                label: "Turn the valid brief into a Big Idea",
                agent: "strategist",
                why: "The strategist digests the valid brief and writes the Big Idea.",
                source: "Nick Goh deck pp. 4, 6",
              },
            ],
          },
        ],
      },
      {
        id: "you",
        title: "You approve",
        sticker: "A person saves the brief before production.",
        limitMs: 35000,
        steps: [
          {
            kind: "assign",
            prompt: "Nothing is produced until a human says yes.",
            agents: [
              { id: "strategist", label: "Strategist", note: "Already hired" },
              { id: "you", label: "You", note: "Human checkpoint" },
              { id: "buyer", label: "The Buyer", note: "Not on this chain" },
            ],
            tasks: [
              {
                id: "save",
                label: "Approve it and save it to the knowledge base",
                agent: "you",
                why: "Seat four is you. AI can draft. You decide.",
                source: "Nick Goh deck p. 6",
              },
            ],
          },
        ],
      },
      {
        id: "makers",
        title: "Production desk",
        sticker: "Visuals and channel lines come after your yes.",
        limitMs: 40000,
        steps: [
          {
            kind: "assign",
            prompt: "The brief is saved. Make the work.",
            agents: [
              { id: "you", label: "You", note: "Already approved" },
              { id: "makers", label: "Designer + Copywriter", note: "KVs and lines" },
              { id: "analyst", label: "The Analyst", note: "Not on this chain" },
            ],
            tasks: [
              {
                id: "kv",
                label: "Key visuals via Higgsfield, plus channel copy",
                agent: "makers",
                why: "Design makes the visuals. Copy adapts the lines per channel.",
                source: "Nick Goh deck pp. 5, 6",
              },
            ],
          },
        ],
      },
      {
        id: "boss",
        title: "The big client",
        sticker: "Six seats. One chain. You are seat four.",
        limitMs: 80000,
        steps: [
          {
            kind: "assign",
            prompt: "Boss client. Staff every seat, then run the chain.",
            agents: [
              { id: "writer", label: "Brief Writer", note: "Draft" },
              { id: "validator", label: "Brief Validator", note: "Fresh chat" },
              { id: "strategist", label: "Strategist", note: "Big Idea" },
              { id: "you", label: "You", note: "Approve" },
              { id: "makers", label: "Designer + Copywriter", note: "Make" },
              { id: "reviewer", label: "Reviewer", note: "Sign off" },
              { id: "buyer", label: "The Buyer", note: "Decoy" },
            ],
            tasks: [
              {
                id: "draft",
                label: "Draft the brief",
                agent: "writer",
                why: "Brief Writer drafts. The buyer is not in this chain.",
                source: "Nick Goh deck p. 6",
              },
              {
                id: "check",
                label: "Fresh-chat critique",
                agent: "validator",
                why: "Validator checks the brief in a new chat.",
                source: "Nick Goh deck p. 6",
              },
              {
                id: "idea",
                label: "Shape the Big Idea",
                agent: "strategist",
                why: "Strategist turns the valid brief into the Big Idea.",
                source: "Nick Goh deck p. 6",
              },
              {
                id: "save",
                label: "Approve and save",
                agent: "you",
                why: "You approve before anyone produces the work.",
                source: "Nick Goh deck p. 6",
              },
              {
                id: "make",
                label: "Visuals and channel lines",
                agent: "makers",
                why: "Designer and copywriter make the work after your yes.",
                source: "Nick Goh deck pp. 5, 6",
              },
              {
                id: "sign",
                label: "Brand voice and sign-off",
                agent: "reviewer",
                why: "The reviewer checks brand voice and signs off.",
                source: "Nick Goh deck pp. 5, 6",
              },
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
    y: 38,
    landmark: "tower",
    flavor: (n) =>
      n >= 6 ? "Top Voice" : n >= 3 ? "Industry Expert" : n >= 1 ? "Active" : "Newbie",
    levels: [
      {
        id: "headline",
        title: "A headline a model can see",
        sticker: "Say the topic in the heading.",
        limitMs: 25000,
        steps: [
          {
            kind: "choice",
            prompt: "An assistant is skimming your post. Which heading can it use?",
            options: [
              { id: "vague", label: "The future is here" },
              { id: "clear", label: "How AI is changing B2B buying decisions" },
              { id: "tease", label: "What you need to know" },
            ],
            answer: "clear",
            why: "She said the heading should state the topic. 92% of cited pieces in her study did.",
            source: note,
          },
        ],
      },
      {
        id: "names",
        title: "Name it",
        sticker: "Name the company. Name the tool.",
        limitMs: 25000,
        steps: [
          {
            kind: "choice",
            prompt: "The line says “our company launched a tool.” Fix it.",
            options: [
              { id: "vague", label: "Keep “our company”" },
              { id: "named", label: "LinkedIn launched a new advertising solution" },
              { id: "hype", label: "We just changed everything" },
            ],
            answer: "named",
            why: "Name the company and the tool. She cited that in 75% of the cited pieces.",
            source: note,
          },
        ],
      },
      {
        id: "format",
        title: "Answer the buying question",
        sticker: "Best-of, comparison, or how to choose.",
        limitMs: 25000,
        steps: [
          {
            kind: "choice",
            prompt: "A buyer asks how to choose. What do you publish?",
            options: [
              { id: "guide", label: "A how-to-choose guide" },
              { id: "slogan", label: "A slogan and a logo" },
              { id: "mood", label: "A hype video with no answer" },
            ],
            answer: "guide",
            why: "She named best-of lists, side-by-side comparisons, and how-to-choose guides.",
            source: note,
          },
        ],
      },
      {
        id: "week",
        title: "Show up again this week",
        sticker: "Two or three educational posts. No virality required.",
        limitMs: 25000,
        steps: [
          {
            kind: "choice",
            prompt: "The citation meter is flat. What do you change?",
            options: [
              { id: "cadence", label: "2–3 educational posts this week, with a list" },
              { id: "viral", label: "One viral slogan, then go quiet" },
              { id: "logo", label: "Only a company-page logo post" },
            ],
            answer: "cadence",
            why: "She suggested 2–3 educational posts a week. You do not need a viral post.",
            source: note,
          },
        ],
      },
      {
        id: "poker",
        title: "Show the hand",
        sticker: "Hold what she said. Fold the rest.",
        limitMs: 50000,
        steps: [
          {
            kind: "poker",
            prompt: "Bonus hand. Hold the line she actually taught.",
            cards: [
              {
                id: "two",
                text: "One topic, two executions: short post for people, long article for the model.",
                hold: true,
                why: "That was her answer for writing to humans and to AI.",
                source: note,
              },
              {
                id: "viral",
                text: "You do not need a viral post to be accepted by an LLM.",
                hold: true,
                why: "Her line: you do not need virality to be accepted by an LLM.",
                source: note,
              },
              {
                id: "people",
                text: "About 75% of the LinkedIn citations she cited came from individual creators.",
                hold: true,
                why: "She cited about 75% from individuals and about 25% from company pages.",
                source: note,
              },
              {
                id: "company",
                text: "Company pages supplied most of those citations.",
                hold: false,
                why: "Company pages were the smaller share, about 25%.",
                source: note,
              },
              {
                id: "pay",
                text: "Paying to boost a post is what makes an LLM cite it.",
                hold: false,
                why: "Pay does not earn the citation. Test it organically, then amplify.",
                source: note,
              },
            ],
          },
        ],
      },
      {
        id: "boss",
        title: "See, think, respond",
        sticker: "If it cannot see the post, it cannot recommend you.",
        limitMs: 70000,
        steps: [
          {
            kind: "order",
            prompt: "Boss flow. Put her three steps in order.",
            items: [
              { id: "see", label: "See" },
              { id: "think", label: "Think" },
              { id: "respond", label: "Respond" },
            ],
            why: "See comes first. If a model cannot find the content, it cannot use it.",
            source: note,
          },
          {
            kind: "choice",
            prompt: "Same topic. What do you actually publish?",
            options: [
              { id: "both", label: "A short post for people and a long article for the model" },
              { id: "long", label: "One huge post for everyone" },
              { id: "meme", label: "Only a meme" },
            ],
            answer: "both",
            why: "People want the short version. The model can use the detailed one.",
            source: note,
          },
          {
            kind: "choice",
            prompt: "The article works. How do you spend?",
            options: [
              { id: "organic", label: "Post it natively, then amplify what works" },
              { id: "pay", label: "Pay first so the model has to cite you" },
              { id: "link", label: "Drop a YouTube link and nothing else" },
            ],
            answer: "organic",
            why: "Upload it on LinkedIn with a transcript. Pay widens reach. It does not buy the citation.",
            source: note,
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
    color: "#E4E0E6",
    x: 32,
    y: 74,
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
    color: "#E4E0E6",
    x: 70,
    y: 76,
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
    return n + step.cards.length;
  }, 0);
}
