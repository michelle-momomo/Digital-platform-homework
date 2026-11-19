import { useRef } from "react";
import type { Holdem, StaffCard, Staffing } from "./data";
import type { Action, Attempt } from "./model";
import { Citation, Icon } from "./ui";

function findCard(c: Staffing, id: string) {
  return [...c.cards, ...c.decoys].find((card) => card.id === id);
}

export function StaffingBoard({
  c,
  a,
  dispatch,
}: {
  c: Staffing;
  a: Attempt;
  dispatch: (action: Action) => void;
}) {
  const feedbackRef = useRef<HTMLDivElement>(null);
  const open = a.matched.length < c.seats.length;
  const seat = c.seats[a.question];
  const last = a.lastPair;
  const played = last ? findCard(c, last.choice) : undefined;
  const correct = !!last && last.task === last.choice;
  const hand = a.optionOrders[0]
    .map((id) => findCard(c, id))
    .filter((card): card is StaffCard => !!card && !a.matched.includes(card.id));
  function play(id: string) {
    dispatch({ type: "play", id });
    requestAnimationFrame(() => feedbackRef.current?.focus());
  }
  return (
    <>
      <p className="eyebrow">SIX SEATS · ONE OPEN AT A TIME</p>
      <h3 className="question-title">Who works this seat?</h3>
      <p className="game-instructions">
        Play the agent whose job matches the open seat. A miss stays on the
        table, and the first card you try is the one that scores.
      </p>
      <p className="context-note">{c.note}</p>
      <ol className="seat-list">
        {c.seats.map((item, index) => {
          const filled = a.matched.includes(item.id);
          const current = open && item.id === seat.id;
          const agent = c.cards.find((card) => card.id === item.id)!;
          return (
            <li
              key={item.id}
              className={`seat ${filled ? "filled" : ""} ${current ? "current" : ""}`}
              aria-current={current ? "step" : undefined}
            >
              <span className="step-position">{index + 1}</span>
              <span>
                <strong>{filled ? agent.name : current ? "Open seat" : "Waiting"}</strong>
                <span className="seat-job">{item.job}</span>
              </span>
              {filled ? <Icon name="check" size={16} /> : <span />}
            </li>
          );
        })}
      </ol>
      {open ? (
        <div className="hand-grid">
          {hand.map((card) => (
            <button
              key={card.id}
              className="staff-card"
              onClick={() => play(card.id)}
            >
              <strong>{card.name}</strong>
              <small>{card.blurb}</small>
            </button>
          ))}
        </div>
      ) : (
        <p className="context-note">
          Still in your hand: {hand.map((card) => card.name).join(" and ")}.
          Those roles never take a seat in this chain.
        </p>
      )}
      <div aria-live="polite" aria-atomic="true">
        {last && played && seat && (
          <div
            ref={feedbackRef}
            tabIndex={-1}
            className={`feedback ${correct ? "correct" : "incorrect"}`}
            role="status"
          >
            <strong>
              {correct ? "✓ Seated." : "↻ Not this seat. The card stays in your hand."}
            </strong>
            <p>
              {correct
                ? played.explanation
                : played.id === last.task
                  ? played.explanation
                  : c.decoys.some((card) => card.id === played.id)
                    ? played.explanation
                    : `${played.name} is in this chain, just not here. This seat needs someone to ${seat.job.charAt(0).toLowerCase()}${seat.job.slice(1)}`}
            </p>
            <Citation source={correct ? played.source : played.source} />
          </div>
        )}
      </div>
      <div className="game-bottom">
        <span>
          {open
            ? `${a.matched.length} of ${c.seats.length} seats filled · ${hand.length} cards still in hand`
            : "Every seat has someone. The decoys never belonged in this chain."}
        </span>
        <button
          className="button primary"
          disabled={open}
          onClick={() => dispatch({ type: "seal" })}
        >
          See results
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </>
  );
}

export function HoldemTable({
  c,
  a,
  dispatch,
}: {
  c: Holdem;
  a: Attempt;
  dispatch: (action: Action) => void;
}) {
  const feedbackRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLHeadingElement>(null);
  const hand = c.hands[a.question];
  const order = a.optionOrders[a.question];
  const cards = order.map((id) => hand.cards.find((card) => card.id === id)!);
  const ready = cards.every(
    (card) => a.plays[card.id] === "hold" || a.plays[card.id] === "fold",
  );
  const revealed = a.lastPair?.task === hand.id;
  const correctNow =
    revealed &&
    cards.every(
      (card) => a.plays[card.id] === (card.hold ? "hold" : "fold"),
    );
  function show() {
    dispatch({ type: "showHand" });
    requestAnimationFrame(() => feedbackRef.current?.focus());
  }
  function next() {
    dispatch({ type: "nextHand" });
    requestAnimationFrame(() => boardRef.current?.focus());
  }
  return (
    <>
      <div className="game-progress">
        <span>
          Hand {a.question + 1} of {c.hands.length}
        </span>
        <span>Five cards · hold or fold each one</span>
      </div>
      <p className="eyebrow">THE BOARD</p>
      <h3 ref={boardRef} tabIndex={-1} className="question-title">
        {hand.board}
      </h3>
      <p className="game-instructions">{c.note}</p>
      <div className="hole-cards">
        {cards.map((card) => {
          const choice = a.plays[card.id];
          const right =
            revealed && choice === (card.hold ? "hold" : "fold");
          const wrong = revealed && !!choice && !right;
          return (
            <article
              key={card.id}
              className={`hole-card ${right ? "is-right" : ""} ${wrong ? "is-wrong" : ""}`}
            >
              <span className="card-rank" aria-hidden="true">
                {card.rank}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 20.5s-6.8-4.2-6.8-8.7a3.9 3.9 0 0 1 6.8-2.5 3.9 3.9 0 0 1 6.8 2.5c0 4.5-6.8 8.7-6.8 8.7z" />
                </svg>
              </span>
              <p>{card.text}</p>
              <div className="hole-actions" role="group" aria-label={card.text}>
                <button
                  aria-pressed={choice === "hold"}
                  aria-label={`Hold. ${card.text}`}
                  onClick={() =>
                    dispatch({ type: "setCard", id: card.id, choice: "hold" })
                  }
                >
                  Hold
                </button>
                <button
                  aria-pressed={choice === "fold"}
                  aria-label={`Fold. ${card.text}`}
                  onClick={() =>
                    dispatch({ type: "setCard", id: card.id, choice: "fold" })
                  }
                >
                  Fold
                </button>
              </div>
              {revealed && (
                <p className="card-verdict">
                  {right
                    ? card.hold
                      ? "Hold stands."
                      : "Fold stands."
                    : card.hold
                      ? "This one is a hold."
                      : "This one is a fold."}
                </p>
              )}
            </article>
          );
        })}
      </div>
      <div aria-live="polite" aria-atomic="true">
        {revealed && (
          <div
            ref={feedbackRef}
            tabIndex={-1}
            className={`feedback ${correctNow ? "correct" : "incorrect"}`}
            role="status"
          >
            <strong>
              {correctNow
                ? "✓ The hand matches the slide."
                : "↻ Some cards are on the wrong side."}
            </strong>
            {correctNow ? (
              <p>
                Every card on this hand agrees with the deck. The first call on
                each card is already scored.
              </p>
            ) : (
              <ul className="verdict-list">
                {cards.map((card) => {
                  const choice = a.plays[card.id];
                  const right = choice === (card.hold ? "hold" : "fold");
                  if (right) return null;
                  return (
                    <li key={card.id}>
                      <strong>{card.hold ? "Hold" : "Fold"}.</strong> {card.why}{" "}
                      <Citation source={card.source} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="game-bottom">
        <span>
          {!ready
            ? "Choose hold or fold on every card, then show the hand."
            : correctNow
              ? "First calls are locked in. Move on when you are ready."
              : revealed
                ? "Change the misses and the next hand opens. A second look does not add points."
                : "Show the hand when every card has a call."}
        </span>
        <div className="hand-actions">
          <button className="button secondary" disabled={!ready} onClick={show}>
            {revealed ? "Show again" : "Show the hand"}
          </button>
          <button className="button primary" disabled={!correctNow} onClick={next}>
            {a.question === c.hands.length - 1 ? "See results" : "Next hand"}
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
