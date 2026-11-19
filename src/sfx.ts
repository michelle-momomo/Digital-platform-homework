let ctx: AudioContext | null = null;

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.05) {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx || new Ctx();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.value = gain;
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start();
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.stop(ctx.currentTime + dur);
  } catch {
    /* autoplay rules vary; silence is fine */
  }
}

export function sfx(kind: "ok" | "bad" | "pop" | "fanfare", muted: boolean) {
  if (muted) return;
  if (kind === "ok") tone(660, 0.12, "sine");
  else if (kind === "bad") tone(180, 0.16, "triangle", 0.04);
  else if (kind === "pop") tone(520, 0.08, "sine", 0.04);
  else {
    tone(523, 0.12, "sine");
    setTimeout(() => tone(659, 0.12, "sine"), 90);
    setTimeout(() => tone(784, 0.18, "sine"), 180);
  }
}
