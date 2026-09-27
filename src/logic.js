// QVAC Workout Cooldown Stretch Suggester — core logic.
// Given a workout type, suggests 3-4 relevant cooldown stretches. The
// count requirement (3-4) is enforced deterministically, not left to the
// model's prompt-following alone.

import { completion } from "@qvac/sdk";

function looksUnusable(text) {
  if (!text || text.trim().length < 3) return true;
  const bad = [
    "i cannot", "i can't", "as an ai", "i'm not able", "i do not have",
    "i'm sorry", "i am sorry", "please provide more", "please try again",
    "i'd be happy to help", "could you provide", "can you provide",
  ];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

function parseStretches(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const stretches = [];
  for (const line of lines) {
    const match = line.match(/^(?:\d+[.)]|-|\*)\s*(.+)$/);
    if (match) {
      let s = match[1].trim().replace(/^["“]|["”]$/g, "").trim();
      if (s.length > 2) stretches.push(s);
    }
  }
  if (stretches.length === 0) {
    // Strip any stray leading bullet/number the split missed, so a
    // malformed list line doesn't leak a "2." prefix into the stretch text.
    const bySentence = text
      .split(/(?<=[.!])\s+/)
      .map((s) => s.trim().replace(/^(?:\d+[.)]|-|\*)\s*/, ""))
      .filter((s) => s.length > 5);
    stretches.push(...bySentence);
  }
  return stretches;
}

const GENERIC_FILLERS = (workout) => [
  `A gentle full-body stretch, holding each position for 20-30 seconds, to bring your heart rate down after ${workout}.`,
  `Slow, controlled deep breathing for 1-2 minutes while stretching whatever muscles feel tightest from ${workout}.`,
  `A light walk for a few minutes to let your muscles cool down gradually after ${workout}.`,
  `A gentle neck and shoulder roll to release tension that built up during ${workout}.`,
];

export async function generate(modelId, workoutType) {
  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You are a fitness cooldown assistant. Given the type of workout someone just finished, suggest 4 specific cooldown stretches targeting the muscle groups that workout actually uses — not generic full-body stretches unrelated to the activity. " +
          "Reply as a numbered list 1-4, one stretch per line with a brief 'how to do it' note, nothing else.",
      },
      { role: "user", content: "Workout: heavy leg day (squats and lunges)" },
      {
        role: "assistant",
        content:
          "1. Standing quad stretch — pull one heel toward your glutes, hold 30 seconds each side.\n" +
          "2. Seated hamstring stretch — sit and reach for your toes with legs extended, hold 30 seconds.\n" +
          "3. Standing calf stretch against a wall — hold 20-30 seconds each side.\n" +
          "4. Deep lunge hip flexor stretch — sink into a lunge and push your hips forward, hold 30 seconds each side.",
      },
      // A second, targeted example: without this, the model consistently
      // defaulted "running" to ankle/foot-focused drills instead of the
      // quads/hamstrings/calves that actually matter after a run — a
      // repeatable gap, not one-off noise, confirmed by retesting the same
      // input multiple times.
      { role: "user", content: "Workout: running" },
      {
        role: "assistant",
        content:
          "1. Standing quad stretch — pull one heel toward your glutes, hold 30 seconds each side.\n" +
          "2. Standing hamstring stretch — extend one leg out with heel down, hinge forward at the hips, hold 30 seconds each side.\n" +
          "3. Calf stretch against a wall — back leg straight, heel flat, lean forward, hold 30 seconds each side.\n" +
          "4. Hip flexor lunge stretch — sink into a lunge and push your hips forward, hold 30 seconds each side.",
      },
      { role: "user", content: `Workout: ${workoutType}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.6, maxTokens: 350 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = text.trim();

  let stretches = looksUnusable(text) ? [] : parseStretches(text);

  const fillers = GENERIC_FILLERS(workoutType);
  let fillerIdx = 0;
  while (stretches.length < 3 && fillerIdx < fillers.length) {
    const candidate = fillers[fillerIdx++];
    if (!stretches.includes(candidate)) stretches.push(candidate);
  }
  if (stretches.length > 4) stretches = stretches.slice(0, 4);

  return { stretches };
}
