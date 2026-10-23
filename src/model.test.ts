import { describe, expect, it } from "vitest";
import { maxScore, sessions } from "./data";
import type { Decisions, Matching, Pipeline } from "./data";
import {
  createAttempt,
  emptyProgress,
  outcome,
  parseProgress,
  saveAttempt,
  transition,
} from "./model";
import type { Attempt } from "./model";
const session = sessions[0];
const pipeline = session.challenges[0] as Pipeline;
const matching = session.challenges[1] as Matching;
const decisions = session.challenges[2] as Decisions;
function solvePipeline(a: Attempt) {
  for (const [to, step] of pipeline.steps.entries())
    a = transition(pipeline, a, {
      type: "move",
      from: a.order.indexOf(step.id),
      to,
    });
  return transition(pipeline, a, { type: "check" });
}
function solvePairs(a: Attempt) {
  for (const r of matching.rounds) {
    for (const p of r.pairs) {
      a = transition(matching, a, { type: "task", id: p.id });
      a = transition(matching, a, { type: "pair", id: p.id });
    }
    a = transition(matching, a, { type: "nextRound" });
  }
  return a;
}
describe("pipeline", () => {
  it("always starts shuffled and does not expose feedback", () => {
    for (let i = 0; i < 50; i++) {
      const a = createAttempt(pipeline);
      expect(a.order).not.toEqual(pipeline.steps.map((s) => s.id));
      expect(a.pipelineFeedback).toBeNull();
    }
  });
  it("awards one point only for the first fully correct submission", () => {
    const a = solvePipeline(createAttempt(pipeline));
    expect(a.done).toBe(true);
    expect(outcome(pipeline, a).score).toBe(1);
  });
  it("can complete after correction, without increasing the first score", () => {
    let a = transition(pipeline, createAttempt(pipeline), { type: "check" });
    expect(a.done).toBe(false);
    a = solvePipeline(a);
    expect(a.done).toBe(true);
    expect(outcome(pipeline, a).score).toBe(0);
    expect(transition(pipeline, a, { type: "check" })).toEqual(a);
  });
  it("ignores invalid moves", () => {
    const a = createAttempt(pipeline);
    expect(transition(pipeline, a, { type: "move", from: -1, to: 7 })).toEqual(
      a,
    );
  });
});
describe("matching", () => {
  it("requires selecting a task and finishing a round", () => {
    const a = createAttempt(matching);
    expect(transition(matching, a, { type: "pair", id: "github" })).toEqual(a);
    expect(transition(matching, a, { type: "nextRound" })).toEqual(a);
  });
  it("keeps correct pairs and counts only the first attempt on each pair", () => {
    let a = createAttempt(matching);
    a = transition(matching, a, { type: "task", id: "github" });
    a = transition(matching, a, { type: "pair", id: "vercel" });
    expect(a.selectedTask).toBe("github");
    expect(a.matched).toEqual([]);
    a = solvePairs(a);
    expect(a.done).toBe(true);
    expect(outcome(matching, a).score).toBe(6);
    expect(a.firstPairs.github).toBe("vercel");
  });
  it("earns seven points on a perfect first pass across both rounds", () => {
    const a = solvePairs(createAttempt(matching));
    expect(a.done).toBe(true);
    expect(outcome(matching, a)).toEqual({ score: 7, review: [] });
  });
});
describe("decisions", () => {
  it("does not accept a second answer or skip an unanswered question", () => {
    let a = createAttempt(decisions);
    expect(transition(decisions, a, { type: "nextQuestion" })).toEqual(a);
    a = transition(decisions, a, { type: "answer", id: "commit" });
    a = transition(decisions, a, { type: "answer", id: "push" });
    expect(a.answers).toEqual(["commit"]);
  });
  it("completes all situations and distinguishes first-choice scores", () => {
    let a = createAttempt(decisions);
    decisions.scenarios.forEach((q, i) => {
      a = transition(decisions, a, {
        type: "answer",
        id: i === 0 ? "commit" : q.answer,
      });
      a = transition(decisions, a, { type: "nextQuestion" });
    });
    expect(a.done).toBe(true);
    expect(outcome(decisions, a)).toEqual({
      score: 4,
      review: ["Commit vs push"],
    });
  });
});
describe("results and persistence", () => {
  it("keeps best score while replacing latest on a retry", () => {
    let progress = saveAttempt(
      emptyProgress(),
      session,
      pipeline,
      solvePipeline(createAttempt(pipeline)),
    );
    let retry = createAttempt(pipeline);
    progress = saveAttempt(progress, session, pipeline, retry);
    expect(progress.sessions[session.id].results.pipeline.best).toBe(1);
    expect(retry.checks).toBe(0);
    retry = solvePipeline(transition(pipeline, retry, { type: "check" }));
    progress = saveAttempt(progress, session, pipeline, retry);
    expect(progress.sessions[session.id].results.pipeline).toMatchObject({
      latest: 0,
      best: 1,
      completed: true,
    });
  });
  it("round-trips partial attempts for every game", () => {
    for (const c of session.challenges) {
      let a = createAttempt(c);
      if (c.type === "pipeline") a = transition(c, a, { type: "check" });
      if (c.type === "matching") {
        a = transition(c, a, { type: "task", id: "github" });
        a = transition(c, a, { type: "pair", id: "vercel" });
      }
      if (c.type === "decisions")
        a = transition(c, a, { type: "answer", id: "push" });
      const p = saveAttempt(emptyProgress(), session, c, a);
      expect(parseProgress(JSON.stringify(p))).toEqual({
        progress: p,
        recovered: false,
      });
    }
  });
  it("round-trips completed attempts for every game", () => {
    let d = createAttempt(decisions);
    for (const q of decisions.scenarios) {
      d = transition(decisions, d, { type: "answer", id: q.answer });
      d = transition(decisions, d, { type: "nextQuestion" });
    }
    for (const [c, a] of [
      [pipeline, solvePipeline(createAttempt(pipeline))],
      [matching, solvePairs(createAttempt(matching))],
      [decisions, d],
    ] as const) {
      const p = saveAttempt(emptyProgress(), session, c, a);
      expect(parseProgress(JSON.stringify(p)).progress).toEqual(p);
    }
  });
  it("recovers from corrupt JSON, wrong schemas, and null", () => {
    for (const raw of [
      "{",
      "null",
      "[]",
      '{"schema":0}',
      '{"schema":1,"sessions":null}',
    ]) {
      const p = parseProgress(raw);
      expect(p.recovered).toBe(true);
      expect(p.progress).toEqual(emptyProgress());
    }
    expect(parseProgress(null).recovered).toBe(false);
  });
  it("invalidates stale content without trusting old scores", () => {
    const p = saveAttempt(
      emptyProgress(),
      session,
      pipeline,
      solvePipeline(createAttempt(pipeline)),
    );
    p.sessions[session.id].contentVersion = 0;
    expect(parseProgress(JSON.stringify(p)).progress).toEqual(emptyProgress());
  });
  it("discards corrupt active state but preserves valid completed results", () => {
    const p = saveAttempt(
      emptyProgress(),
      session,
      pipeline,
      solvePipeline(createAttempt(pipeline)),
    );
    p.sessions[session.id].active!.order = ["missing"];
    const restored = parseProgress(JSON.stringify(p));
    expect(restored.recovered).toBe(true);
    expect(restored.progress.sessions[session.id].active).toBeNull();
    expect(restored.progress.sessions[session.id].results.pipeline.best).toBe(
      1,
    );
  });
  it("discards unsafe scores and invalid option orders", () => {
    const p = saveAttempt(
      emptyProgress(),
      session,
      pipeline,
      solvePipeline(createAttempt(pipeline)),
    );
    p.sessions[session.id].results.pipeline.latest = 999;
    expect(
      parseProgress(JSON.stringify(p)).progress.sessions[session.id].results,
    ).toEqual({});
    const m = saveAttempt(
      emptyProgress(),
      session,
      matching,
      createAttempt(matching),
    );
    m.sessions[session.id].active!.optionOrders = [["not-a-tool"]];
    expect(
      parseProgress(JSON.stringify(m)).progress.sessions[session.id].active,
    ).toBeNull();
  });
  it("counts only real challenges and marks the extra question honestly", () => {
    expect(session.challenges.map(maxScore)).toEqual([1, 7, 5]);
    expect(decisions.scenarios.at(-1)?.source.extra).toBe(true);
    expect(session.speaker).toBeNull();
    expect(session.date).toBeNull();
  });
});
