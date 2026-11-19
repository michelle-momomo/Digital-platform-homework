import type { Session } from "./data";

const course = "Session 4";
const nick = "Nick Goh deck";

export const agenticSession: Session = {
  id: "agentic-ai",
  title: "Agentic AI",
  programme: null,
  speaker: "Nick Goh",
  role: "CEO, INSPIRO Consulting · CMO, Yellow Pages Singapore · Marketing Lead, YP Academy",
  date: "30 Oct 2026",
  topic: "Building an AI Marketing Team",
  contentVersion: 1,
  description:
    "Staff an AI marketing team, then run one handoff from brief to sign-off.",
  sources: [
    {
      title: "Session 4 · 30 Oct 2026 · Managing media campaigns and the guest session",
      url: "/session-4-30oct.pdf",
    },
    {
      title: "Nick Goh · Building an AI Marketing Team · deck pages 1–28",
      url: "/nick-goh-deck-part1.pdf",
    },
    {
      title: "Nick Goh · Building an AI Marketing Team · deck pages 29–55",
      url: "/nick-goh-deck-part2.pdf",
    },
  ],
  notes: [
    "Session 4 pages are physical pages of the course PDF (1–69). This tab uses Section One, Managing Media Campaigns & AI Agents, and Section Two, Building an AI Marketing Team (guest session: Yellow Pages Singapore).",
    "Nick Goh’s guest deck is 55 pages, dated 30 October 2026 on the title slide. The part-1 file is deck pages 1–28. The part-2 file starts at deck page 29. Citations use those original deck page numbers.",
    "The handoff game uses the six seats on deck pages 4–6. The buyer and the analyst are media-team roles from Session 4 pages 4–6, included as decoys rather than extra seats. The LV Terra walkthrough is the classroom demo labeled on deck page 23 as a fictional scenario for educational use, not an official Louis Vuitton line.",
    "Figures are the ones printed on the course slides, which cite BCG, Gartner, McKinsey, Microsoft, IMDA and others. Nothing is added beyond those slides and Nick Goh’s deck.",
  ],
  takeaways: [
    {
      title: "It is a people problem",
      text: "96% of CMOs say they are transforming end to end with AI, yet 42% still use GenAI mainly as a task helper, and only about 8% run campaigns with connected agents. CMOs put 15.3% of marketing budgets into AI, but only 30% have the processes and skills to scale it. Culture, managers and talent practices explain 67% of the impact people get from AI. Individual skills explain 32%.",
      source: { doc: course, pages: [66] },
    },
    {
      title: "Hub, pods, and an agent boss",
      text: "Keep AI governance, data and risk in a central hub, and embed AI skills inside each marketing team. 75% of CMOs are moving to small pods built around business goals or customer segments instead of channels. New roles include an AI product owner, an AI governance owner, a GEO/AEO specialist (being found in AI answers), and AI champions in every team. Each marketer is an “agent boss”: build agents, delegate to them, and treat them like staff, with identity, permissions and a review cycle.",
      source: { doc: course, pages: [67] },
    },
    {
      title: "Redesign the work, then measure",
      text: "The six-step roadmap is: map the work, group it into agent jobs, redesign rather than bolt AI on, start small and roll out in waves, upskill and govern, and measure. Only 21% of companies have redesigned any workflow, and that redesign is called the biggest driver of profit impact. Fewer than 1 in 5 companies track clear KPIs from day one.",
      source: { doc: course, pages: [68] },
    },
    {
      title: "Six seats, and you are seat four",
      text: "Nick’s handoff is Brief Writer (drafts the brief), Brief Validator (a fresh chat that checks objective, audience, message and metric), then Strategist (the Big Idea). You approve it and save it to the knowledge base. Designer and Copywriter then make key visuals, using a connector such as Higgsfield, and the channel-by-channel copy. The Reviewer checks brand voice and signs off.",
      source: { doc: nick, pages: [4, 5, 6] },
    },
    {
      title: "Give each agent a skill",
      text: "The demo Claude project, LVMH AI Marketing Team, holds skills created for the team: Marketing Brief Builder, Brief Validator, Researcher Strategist, Messaging Hierarchy Builder, KV Concept Builder, Creative Review Scorer, and a Governance Compliance Check against the Singapore Code of Advertising Practice (SCAP). A later slide shows Marketing Brief Builder scheduled daily at 6:48 PM and marked Active.",
      source: { doc: nick, pages: [8, 12] },
    },
    {
      title: "Humans still own the big decisions",
      text: "In the AI era, a brief should add first-party data and conversion signals, how much creative the AI needs to test, and the measurement plan, plus rules for where AI may be used, disclosure, and data privacy (the slide gives Singapore’s PDPA as an example). The line on the slide is: AI drafts, humans decide. Objectives, budget and the big idea stay with the team and the client. On the media team, the strategist may use AI for research and still owns the objective and the big idea.",
      source: { doc: course, pages: [6, 20] },
    },
    {
      title: "The classroom demo is marked fictional",
      text: "The walkthrough builds a messaging hierarchy for an LV Terra social launch. The document on screen says it is a fictional scenario for educational use, working wording only, and not an official Louis Vuitton line. The Creative Review Scorer then scores the work against the approved brief. In that demo the three-frame Instagram story is 6.7/10 and the feed post is 4.3/10.",
      source: { doc: nick, pages: [23, 48] },
    },
  ],
  challenges: [
    {
      id: "handoff",
      type: "staffing",
      title: "Run the Handoff",
      label: "Staff the chain",
      minutes: "4 min",
      description:
        "Six seats, one agent at a time. Two familiar roles do not belong.",
      note: "The seats follow Nick Goh’s handoff on deck pages 4–6. The buyer and the analyst are real media-team roles from the course deck. They stay in your hand. Play one card on the open seat. The first card on each seat is the one that scores.",
      seats: [
        {
          id: "writer",
          job: "Draft the brief from the project context.",
          source: { doc: nick, pages: [4, 6] },
        },
        {
          id: "validator",
          job: "Critique that brief in a fresh chat.",
          source: { doc: nick, pages: [4, 6] },
        },
        {
          id: "strategist",
          job: "Turn the validated brief into a Big Idea.",
          source: { doc: nick, pages: [4, 6] },
        },
        {
          id: "you",
          job: "Approve the work and save it to the knowledge base.",
          source: { doc: nick, pages: [6] },
        },
        {
          id: "makers",
          job: "Make the key visuals and the channel-by-channel copy.",
          source: { doc: nick, pages: [5, 6] },
        },
        {
          id: "reviewer",
          job: "Check the work against the brand voice and sign off.",
          source: { doc: nick, pages: [5, 6] },
        },
      ],
      cards: [
        {
          id: "writer",
          name: "Brief Writer",
          blurb: "Drafts the brief. Needs the goal, audience, budget and timing.",
          explanation:
            "Seat one. The Brief Writer drafts the brief from project context. The output is a draft brief.",
          source: { doc: nick, pages: [4, 6] },
        },
        {
          id: "validator",
          name: "Brief Validator",
          blurb: "A new chat. Checks objective, audience, message and metric.",
          explanation:
            "Seat two. The validator critiques the brief with fresh eyes and returns a verdict and the top fixes.",
          source: { doc: nick, pages: [4, 6] },
        },
        {
          id: "strategist",
          name: "Strategist",
          blurb: "Digests the validated brief and writes the Big Idea one-pager.",
          explanation:
            "Seat three. After the brief is validated, the strategist shapes the Big Idea. This is Nick’s strategist, not the media-team strategist who plans channels.",
          source: { doc: nick, pages: [4, 6] },
        },
        {
          id: "you",
          name: "You",
          blurb: "The human checkpoint before anyone makes the work.",
          explanation:
            "Seat four is a person. You approve the brief and save it to the knowledge base. Production comes after that, not before.",
          source: { doc: nick, pages: [6] },
        },
        {
          id: "makers",
          name: "Designer + Copywriter",
          blurb: "Key visuals via Higgsfield, plus messaging by channel.",
          explanation:
            "Seat five. The designer makes the key visuals, using a connector such as Higgsfield. The copywriter builds the messaging hierarchy and adapts it per channel.",
          source: { doc: nick, pages: [5, 6] },
        },
        {
          id: "reviewer",
          name: "Reviewer",
          blurb: "Brand voice, the brief, the Big Idea, then edits and sign-off.",
          explanation:
            "Seat six. The reviewer checks the work against the brand voice and confirms it delivers the brief and the Big Idea. The output is edits and sign-off.",
          source: { doc: nick, pages: [5, 6] },
        },
      ],
      decoys: [
        {
          id: "buyer",
          name: "The Buyer",
          blurb: "Negotiates and purchases ad placements.",
          explanation:
            "The buyer is a media-team role: negotiate placements and secure value and reach. In the AI-era note, buyers and traders spend less time on manual bidding and more on goals, budgets, data and guardrails. That role is not one of the six seats in this handoff.",
          source: { doc: course, pages: [4, 6] },
        },
        {
          id: "analyst",
          name: "The Analyst",
          blurb: "Tracks the campaign and recommends what to optimise.",
          explanation:
            "The analyst tracks performance and recommends optimisations. The AI-era slide moves that work toward incrementality tests and marketing-mix models. Useful, and not a seat in Nick’s brief-to-sign-off chain.",
          source: { doc: course, pages: [5, 6] },
        },
      ],
    },
  ],
};
