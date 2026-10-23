export type Source = { pages: number[]; extra?: boolean };
export type Step = {
  id: string;
  text: string;
  explanation: string;
  source: Source;
};
export type Pair = {
  id: string;
  task: string;
  answer: string;
  explanation: string;
  source: Source;
};
export type Scenario = {
  id: string;
  prompt: string;
  options: { id: string; text: string; why: string }[];
  answer: string;
  source: Source;
  review: string;
};
type Base = {
  id: string;
  title: string;
  description: string;
  minutes: string;
  label: string;
};
export type Pipeline = Base & { type: "pipeline"; steps: Step[]; note: string };
export type Matching = Base & {
  type: "matching";
  rounds: { title: string; note: string; pairs: Pair[] }[];
};
export type Decisions = Base & { type: "decisions"; scenarios: Scenario[] };
export type Challenge = Pipeline | Matching | Decisions;
export type Session = {
  id: string;
  title: string;
  speaker: string | null;
  date: string | null;
  contentVersion: number;
  description: string;
  source: { title: string; url: string };
  takeaways: { title: string; text: string; source: Source }[];
  challenges: Challenge[];
};
export const sessions: Session[] = [
  {
    id: "vibe-coding",
    title: "Vibe Coding",
    speaker: null,
    date: null,
    contentVersion: 1,
    description: "Take an idea from your first prompt to a live website.",
    source: {
      title: "LaunchLab: Claude Design, Claude Code, GitHub, and Vercel",
      url: "/lecture-source.pdf",
    },
    takeaways: [
      {
        title: "Start with the interface",
        text: "Describe the visual design, then hand it off to Claude Code to build the working website. This is one workflow introduced in this session, not the only way to build.",
        source: { pages: [4, 7, 8] },
      },
      {
        title: "A commit stays local until you push",
        text: "GitHub stores project files and their history. A commit saves a local snapshot; a push sends it to GitHub. A pull request invites review before merging.",
        source: { pages: [14, 15, 18] },
      },
      {
        title: "Code storage and hosting have different jobs",
        text: "In this workflow, GitHub stores the code. Connect the repository to Vercel to build and host the website, with previews for pull requests.",
        source: { pages: [19, 20, 21] },
      },
      {
        title: "Structure, style, behaviour",
        text: "In a simple static website, index.html holds text and structure, styles.css controls appearance, and script.js adds behaviour. Framework projects may organise these differently.",
        source: { pages: [24] },
      },
      {
        title: "Accounts need a backend",
        text: "Authentication identifies a user; persistent storage keeps their data. Supabase provides authentication and a database for this kind of functionality.",
        source: { pages: [26, 27, 28] },
      },
    ],
    challenges: [
      {
        id: "pipeline",
        type: "pipeline",
        title: "Build the Pipeline",
        label: "Put it in order",
        minutes: "2 min",
        description: "Four steps. One path from idea to a live website.",
        note: "This sequence combines the design handoff and GitHub → Vercel workflow shown in the lecture. It is one way to build a website, not a universal rule.",
        steps: [
          {
            id: "design",
            text: "Design the interface.",
            explanation:
              "Decide how the site should look before handing the design to the coding tool.",
            source: { pages: [4, 7] },
          },
          {
            id: "build",
            text: "Build the working website.",
            explanation:
              "Claude Code turns the design into a functional project and helps debug it.",
            source: { pages: [7, 8] },
          },
          {
            id: "push",
            text: "Commit and push the code to GitHub.",
            explanation:
              "Commit saves a local snapshot. Push uploads it so the remote repository has the code.",
            source: { pages: [15, 20] },
          },
          {
            id: "deploy",
            text: "Connect the repository and deploy with Vercel.",
            explanation:
              "Import the GitHub repository into Vercel to build and host the website.",
            source: { pages: [19, 21] },
          },
        ],
      },
      {
        id: "roles",
        type: "matching",
        title: "Match the Role",
        label: "Make the connections",
        minutes: "3 min",
        description: "Find the right tool. Then find the right file.",
        rounds: [
          {
            title: "The right tool",
            note: "Select a task, then select the tool that does the job.",
            pairs: [
              {
                id: "github",
                task: "Store code and track its history",
                answer: "GitHub",
                explanation:
                  "A repository keeps your files and the history of changes together.",
                source: { pages: [14, 15] },
              },
              {
                id: "vercel",
                task: "Deploy and host a website",
                answer: "Vercel",
                explanation:
                  "Vercel builds and hosts the project imported from your repository.",
                source: { pages: [19, 21] },
              },
              {
                id: "claude",
                task: "Build and debug a project",
                answer: "Claude Code",
                explanation:
                  "Claude Code can read a codebase, run commands, and debug failures.",
                source: { pages: [8, 11] },
              },
              {
                id: "supabase",
                task: "Add authentication and a database",
                answer: "Supabase",
                explanation:
                  "Supabase provides backend services for user authentication and stored data.",
                source: { pages: [28] },
              },
            ],
          },
          {
            title: "The right file",
            note: "For this round, imagine a simple HTML/CSS/JavaScript website. React and other frameworks may organise files differently.",
            pairs: [
              {
                id: "html",
                task: "Change the button text",
                answer: "index.html",
                explanation:
                  "HTML contains the words and structure people read.",
                source: { pages: [24] },
              },
              {
                id: "css",
                task: "Change the button colour",
                answer: "styles.css",
                explanation: "CSS controls colours, typography, and layout.",
                source: { pages: [24] },
              },
              {
                id: "js",
                task: "Make the button respond to a click",
                answer: "script.js",
                explanation:
                  "JavaScript adds behaviour in response to interactions.",
                source: { pages: [24] },
              },
            ],
          },
        ],
      },
      {
        id: "launch",
        type: "decisions",
        title: "Fix the Launch",
        label: "Choose your next move",
        minutes: "3 min",
        description: "A launch-day problem. A practical next step.",
        scenarios: [
          {
            id: "local",
            prompt:
              "You committed your changes locally, but the files on GitHub still look old. What next?",
            answer: "push",
            review: "Commit vs push",
            source: { pages: [15, 18] },
            options: [
              {
                id: "push",
                text: "Push the commits to GitHub.",
                why: "Exactly. A commit is a local snapshot; pushing sends those snapshots to the remote repository.",
              },
              {
                id: "commit",
                text: "Make another commit with the same files.",
                why: "Another local snapshot will not upload the existing ones. Push the commits to update GitHub.",
              },
              {
                id: "deploy",
                text: "Reconnect Vercel first.",
                why: "Hosting cannot pick up code that has not reached GitHub. Push your commits first.",
              },
            ],
          },
          {
            id: "review",
            prompt:
              "Your changes are on a branch. You want a teammate to review them before they join the main project. What next?",
            answer: "pr",
            review: "Review before merging",
            source: { pages: [15, 18] },
            options: [
              {
                id: "merge",
                text: "Merge straight into main.",
                why: "That skips the review you wanted. A pull request lets your teammate discuss the changes before merging.",
              },
              {
                id: "pr",
                text: "Create a pull request.",
                why: "Yes. A pull request proposes changes and gives teammates a place to review and discuss them before merging.",
              },
              {
                id: "clone",
                text: "Clone the repository again.",
                why: "Cloning makes another local copy; it does not request a review. Open a pull request for the branch.",
              },
            ],
          },
          {
            id: "hosting",
            prompt:
              "Your code is on GitHub, but you have not configured any website hosting. How do you get a live website using this workflow?",
            answer: "vercel",
            review: "Storage vs hosting",
            source: { pages: [19, 21] },
            options: [
              {
                id: "public",
                text: "Just make the repository public.",
                why: "Making source code visible does not configure website hosting. Import the repository into Vercel and deploy.",
              },
              {
                id: "push",
                text: "Keep pushing until a website appears.",
                why: "Automatic deployments need hosting to be connected first. Import the repository into Vercel and deploy.",
              },
              {
                id: "vercel",
                text: "Connect the repository to Vercel and deploy.",
                why: "That is the missing step. Vercel builds and hosts the project; later pushes can trigger updates.",
              },
            ],
          },
          {
            id: "accounts",
            prompt:
              "Students want accounts and learning progress that follows them across devices. What does the site need?",
            answer: "backend",
            review: "Authentication and storage",
            source: { pages: [26, 27, 28] },
            options: [
              {
                id: "backend",
                text: "Authentication and persistent storage, for example with Supabase.",
                why: "Right. Authentication identifies the student, and a database can store progress that another device can retrieve.",
              },
              {
                id: "css",
                text: "A login button styled with CSS.",
                why: "A button alone cannot verify an identity or save progress. You need authentication and persistent storage.",
              },
              {
                id: "local",
                text: "Save everything only in this browser.",
                why: "Browser-only data does not automatically follow a student to another device. Use authentication and a shared database.",
              },
            ],
          },
          {
            id: "browser",
            prompt:
              "There is no login. You only want to remember progress in the same browser after a refresh. What is a useful first step?",
            answer: "local",
            review: "Browser-only progress",
            source: { pages: [], extra: true },
            options: [
              {
                id: "variable",
                text: "Keep it only in a JavaScript variable.",
                why: "A normal in-memory variable is lost on refresh. localStorage can retain progress in the same browser.",
              },
              {
                id: "local",
                text: "Save progress with localStorage.",
                why: "Yes. localStorage can survive refreshes in the same browser. It can be cleared or blocked, and it does not sync across devices.",
              },
              {
                id: "github",
                text: "Push every student’s score to the source repository.",
                why: "Source control is not a student-progress store. localStorage is enough for this browser-only requirement.",
              },
            ],
          },
        ],
      },
    ],
  },
];
export const maxScore = (c: Challenge) =>
  c.type === "pipeline"
    ? 1
    : c.type === "matching"
      ? c.rounds.reduce((n, r) => n + r.pairs.length, 0)
      : c.scenarios.length;
