import { test } from "node:test";
import assert from "node:assert/strict";

import { EventLedger } from "../../app-kit/src/index.ts";
import {
  ACTIVITY_KINDS,
  ActivityLog,
  AthenaHealth,
  DATA_DISCLAIMER,
  EQUIPMENT,
  EXERCISE_CATEGORIES,
  ExerciseLibrary,
  GoalTracker,
  HEALTH_DISCLAIMER,
  HEALTH_FLAGS,
  HealthPrivacy,
  PlanBuilder,
  RecoveryTracker,
  WellbeingJournal,
  monthWindow,
  startOfUtcDay,
  weekWindow,
} from "../src/athenaHealth.ts";

const CLOCK = () => new Date("2026-10-29T00:00:00.000Z");

/* --------------------------------------------------------------- exercise set */

test("the exercise library seeds a usable catalogue and filters it honestly", () => {
  const ledger = new EventLedger([], CLOCK);
  const library = new ExerciseLibrary({ ledger, clock: CLOCK });

  assert.ok(library.list().length >= 12);
  assert.equal(library.list({ category: "cardio" }).length, 3);
  assert.equal(library.list({ category: "mobility" }).length, 3);
  assert.deepEqual(
    library.list({ equipment: ["dumbbells"] }).map((exercise) => exercise.name),
    ["Dumbbell overhead press"],
  );
  assert.ok(library.list({ difficultyMax: 1 }).every((exercise) => exercise.difficulty === 1));

  // A heart condition removes both the overhead press and the brisk walk.
  const safe = library.list({ medicalFlags: ["heart_condition"] });
  assert.equal(safe.some((exercise) => exercise.id === "ex-press"), false);
  assert.equal(safe.some((exercise) => exercise.id === "ex-walk"), false);
  assert.ok(safe.some((exercise) => exercise.id === "ex-march"));

  assert.deepEqual(library.search("glute").map((exercise) => exercise.name), [
    "Bodyweight squat",
    "Glute bridge",
    "Step-up",
  ]);
  assert.deepEqual(library.search("core").map((exercise) => exercise.name), [
    "Dead bug",
    "Forearm plank",
    "Single-leg balance",
  ]);
  assert.deepEqual(library.search(""), []);
  assert.throws(() => library.search("x", 0), /limit is out of range/);
  assert.throws(() => library.list({ category: "yoga" as never }), /unknown category/);
  assert.equal(ledger.ofType("health.exercise.added").length, 0);
});

test("custom exercises are validated and stored", () => {
  const library = new ExerciseLibrary({ clock: CLOCK });
  const added = library.add({
    name: "  Calf raise  ",
    category: "strength",
    primaryMuscles: ["Calves", "calves"],
    equipment: ["none", "dumbbells"],
    difficulty: 1,
    instructions: ["Rise onto the toes.", "Lower slowly."],
    contraindications: ["joint_injury"],
    regression: "Seated calf raise.",
    progression: "Single-leg calf raise.",
  });
  assert.match(added.id, /^ex_/);
  assert.equal(added.name, "Calf raise");
  assert.deepEqual(added.primaryMuscles, ["calves"]);
  assert.equal(added.regression, "Seated calf raise.");
  assert.equal(library.get(added.id)?.name, "Calf raise");

  const base = {
    name: "Test",
    category: "strength" as const,
    primaryMuscles: ["core"],
    equipment: ["none" as const],
    difficulty: 2 as const,
    instructions: ["Do the thing."],
  };
  assert.throws(() => library.add({ ...base, name: "  " }), /needs a name/);
  assert.throws(() => library.add({ ...base, category: "yoga" as never }), /unknown category/);
  assert.throws(() => library.add({ ...base, equipment: [] }), /at least one equipment/);
  assert.throws(() => library.add({ ...base, equipment: ["jetpack" as never] }), /unknown equipment/);
  assert.throws(() => library.add({ ...base, difficulty: 0 as never }), /difficulty is out of range/);
  assert.throws(() => library.add({ ...base, instructions: [] }), /at least one/);
  assert.throws(() => library.add({ ...base, instructions: ["  "] }), /at least one/);
  assert.throws(() => library.add({ ...base, contraindications: ["allergy" as never] }), /unknown health flag/);
});

/* ---------------------------------------------------------------- plan builder */

test("a strength plan schedules the goal mix across the week", () => {
  const ledger = new EventLedger([], CLOCK);
  const library = new ExerciseLibrary({ ledger, clock: CLOCK });
  const builder = new PlanBuilder(library, { ledger, clock: CLOCK });
  const plan = builder.build({ goal: "strength", sessionsPerWeek: 3, weeks: 4, equipment: ["none"] });

  assert.equal(plan.goal, "strength");
  assert.equal(plan.weeks, 4);
  assert.equal(plan.sessionsPerWeek, 3);
  assert.equal(plan.sessions.length, 3);
  assert.deepEqual(plan.sessions.map((session) => session.day), [1, 2, 3]);
  assert.equal(plan.disclaimer, HEALTH_DISCLAIMER);
  for (const session of plan.sessions) {
    assert.deepEqual(
      session.exercises.map((exercise) => exercise.category),
      ["strength", "strength", "mobility"],
    );
    const strength = session.exercises.filter((exercise) => exercise.category === "strength");
    assert.ok(strength.every((exercise) => exercise.sets === 3 && exercise.reps === 10 && exercise.restSeconds === 90));
    const mobility = session.exercises.find((exercise) => exercise.category === "mobility")!;
    assert.equal(mobility.durationSeconds, 60);
    assert.equal(mobility.reps, null);
  }
  assert.equal(builder.get(plan.id)?.name, "Strength plan");
  assert.equal(builder.list().length, 1);
  assert.equal(ledger.ofType("health.plan.built").length, 1);
});

test("health flags and equipment constrain the plan pool", () => {
  const library = new ExerciseLibrary({ clock: CLOCK });
  const builder = new PlanBuilder(library, { clock: CLOCK });

  const gentle = builder.build({
    goal: "strength",
    sessionsPerWeek: 2,
    weeks: 1,
    equipment: ["none"],
    medicalFlags: ["joint_injury"],
    difficultyMax: 2,
  });
  assert.equal(gentle.sessions.length, 2);
  const ids = new Set(gentle.sessions.flatMap((session) => session.exercises.map((exercise) => exercise.exerciseId)));
  assert.equal(ids.has("ex-squat"), false);
  assert.equal(ids.has("ex-pushup"), false);

  assert.throws(
    () => builder.build({ goal: "mobility", sessionsPerWeek: 1, weeks: 1, equipment: ["dumbbells"] }),
    /not enough mobility exercises/,
  );
  assert.throws(
    () => builder.build({ goal: "yoga" as never, sessionsPerWeek: 1, weeks: 1, equipment: ["none"] }),
    /unknown goal/,
  );
  assert.throws(
    () => builder.build({ goal: "general", sessionsPerWeek: 0, weeks: 1, equipment: ["none"] }),
    /sessionsPerWeek is out of range/,
  );
  assert.throws(
    () => builder.build({ goal: "general", sessionsPerWeek: 8, weeks: 1, equipment: ["none"] }),
    /sessionsPerWeek is out of range/,
  );
  assert.throws(
    () => builder.build({ goal: "general", sessionsPerWeek: 1, weeks: 0, equipment: ["none"] }),
    /weeks is out of range/,
  );
  assert.throws(
    () => builder.build({ goal: "general", sessionsPerWeek: 1, weeks: 53, equipment: ["none"] }),
    /weeks is out of range/,
  );
  assert.throws(
    () => builder.build({ goal: "general", sessionsPerWeek: 1, weeks: 1, equipment: [] }),
    /at least one equipment/,
  );
  assert.equal(builder.get("missing"), undefined);
});

/* ---------------------------------------------------------------- activity log */

test("the activity log validates entries and summarises a week", () => {
  const ledger = new EventLedger([], CLOCK);
  const log = new ActivityLog({ ledger, clock: CLOCK });
  const walk = log.add({
    kind: "walk",
    startedAt: "2026-10-26T08:00:00Z",
    durationMinutes: 30,
    intensity: 4,
    distanceKm: 2.5,
    notes: "Morning loop",
  });
  log.add({ kind: "workout", startedAt: "2026-10-27T18:00:00Z", durationMinutes: 45, intensity: 7 });
  log.add({ kind: "run", startedAt: "2026-10-29T07:00:00Z", durationMinutes: 20, intensity: 8, distanceKm: 3.5 });
  log.add({ kind: "swim", startedAt: "2026-10-20T07:00:00Z", durationMinutes: 30, intensity: 5 });

  assert.equal(walk.distanceKm, 2.5);
  assert.equal(log.list().length, 4);
  assert.equal(log.list({ from: "2026-10-26T00:00:00Z", to: "2026-11-02T00:00:00Z" }).length, 3);

  const summary = log.summary({ from: "2026-10-26T00:00:00Z", to: "2026-11-02T00:00:00Z" });
  assert.equal(summary.sessions, 3);
  assert.equal(summary.minutes, 95);
  assert.equal(summary.load, 30 * 4 + 45 * 7 + 20 * 8);
  assert.deepEqual(summary.byKind, { walk: 30, workout: 45, run: 20 });

  assert.equal(log.weeklyLoad("2026-10-29T00:00:00Z"), 595);
  assert.equal(log.streak("2026-10-29T00:00:00Z"), 1, "27 and 28 are consecutive, 29 is today, 26 is separated by the 28th");
  assert.equal(log.streak("2026-10-28T00:00:00Z"), 2);

  assert.throws(() => log.add({ kind: "yoga" as never, startedAt: "2026-10-29T00:00:00Z", durationMinutes: 10, intensity: 1 }), /unknown activity kind/);
  assert.throws(() => log.add({ kind: "walk", startedAt: "nope", durationMinutes: 10, intensity: 1 }), /not a date/);
  assert.throws(() => log.add({ kind: "walk", startedAt: "2026-10-29T00:00:00Z", durationMinutes: 0, intensity: 1 }), /durationMinutes is out of range/);
  assert.throws(() => log.add({ kind: "walk", startedAt: "2026-10-29T00:00:00Z", durationMinutes: 1441, intensity: 1 }), /durationMinutes is out of range/);
  assert.throws(() => log.add({ kind: "walk", startedAt: "2026-10-29T00:00:00Z", durationMinutes: 10, intensity: 0 }), /intensity is out of range/);
  assert.throws(() => log.add({ kind: "walk", startedAt: "2026-10-29T00:00:00Z", durationMinutes: 10, intensity: 11 }), /intensity is out of range/);
  assert.throws(() => log.add({ kind: "walk", startedAt: "2026-10-29T00:00:00Z", durationMinutes: 10, intensity: 1, distanceKm: -1 }), /distanceKm is out of range/);
  assert.throws(() => log.list({ from: "nope" }), /from is not a date/);
  assert.throws(() => log.list({ to: "nope" }), /to is not a date/);
  assert.equal(ledger.ofType("health.activity.added").length, 4);
});

test("a streak counts consecutive days ending today or yesterday", () => {
  const log = new ActivityLog({ clock: CLOCK });
  for (const day of ["2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27"]) {
    log.add({ kind: "walk", startedAt: `${day}T08:00:00Z`, durationMinutes: 10, intensity: 2 });
  }
  assert.equal(log.streak("2026-10-27T23:00:00Z"), 4);
  assert.equal(log.streak("2026-10-28T06:00:00Z"), 4, "yesterday counts");
  assert.equal(log.streak("2026-10-29T06:00:00Z"), 0, "a missed day breaks the streak");
  assert.throws(() => log.streak("nope"), /reference is not a date/);
});

/* --------------------------------------------------------------------- goals */

test("goals track weekly and monthly activity", () => {
  const ledger = new EventLedger([], CLOCK);
  const log = new ActivityLog({ ledger, clock: CLOCK });
  const goals = new GoalTracker({ ledger, clock: CLOCK });

  const sessions = goals.add({ metric: "sessions", target: 3, period: "week" });
  const distance = goals.add({ metric: "distanceKm", target: 10, period: "month" });
  log.add({ kind: "walk", startedAt: "2026-10-27T08:00:00Z", durationMinutes: 30, intensity: 4, distanceKm: 4 });
  log.add({ kind: "run", startedAt: "2026-10-29T08:00:00Z", durationMinutes: 30, intensity: 7, distanceKm: 6 });

  const sessionProgress = goals.progress(sessions.id, log, "2026-10-29T00:00:00Z");
  assert.equal(sessionProgress.current, 2);
  assert.equal(sessionProgress.percent, 66.7);
  assert.equal(sessionProgress.complete, false);
  assert.equal(sessionProgress.from, "2026-10-26T00:00:00.000Z");
  assert.equal(sessionProgress.to, "2026-11-02T00:00:00.000Z");

  const distanceProgress = goals.progress(distance.id, log, "2026-10-29T00:00:00Z");
  assert.equal(distanceProgress.current, 10);
  assert.equal(distanceProgress.percent, 100);
  assert.equal(distanceProgress.complete, true);
  assert.equal(distanceProgress.from, "2026-10-01T00:00:00.000Z");

  assert.equal(goals.list().length, 2);
  assert.equal(goals.remove(distance.id), true);
  assert.throws(() => goals.remove(distance.id), /no goal/);
  assert.throws(() => goals.progress("missing", log, "2026-10-29T00:00:00Z"), /no goal/);
  assert.throws(() => goals.add({ metric: "calories" as never, target: 1, period: "week" }), /unknown metric/);
  assert.throws(() => goals.add({ metric: "sessions", target: 1, period: "year" as never }), /unknown period/);
  assert.throws(() => goals.add({ metric: "sessions", target: 0, period: "week" }), /target is out of range/);
  assert.throws(() => goals.add({ metric: "sessions", target: Number.NaN, period: "week" }), /target is out of range/);
});

/* ------------------------------------------------------------------ recovery */

test("recovery check-ins produce a deterministic readiness band", () => {
  const ledger = new EventLedger([], CLOCK);
  const recovery = new RecoveryTracker({ ledger, clock: CLOCK });
  const good = recovery.add({
    at: "2026-10-29T06:00:00Z",
    sleepHours: 8,
    sleepQuality: 4,
    soreness: 1,
    restingHr: 55,
    stress: 1,
  });
  const readiness = recovery.readiness(good);
  assert.equal(readiness.score, 90);
  assert.equal(readiness.band, "hard");
  assert.ok(readiness.reasons.includes("sleep duration is in the usual 7-9 hour range"));
  assert.ok(readiness.reasons.includes("resting heart rate is in a lower range"));
  assert.match(readiness.disclaimer, /not a medical assessment/);

  const poor = recovery.readiness(
    recovery.add({ at: "2026-10-28T06:00:00Z", sleepHours: 5, sleepQuality: 1, soreness: 5, restingHr: 90, stress: 5 }),
  );
  assert.equal(poor.score, 0);
  assert.equal(poor.band, "rest");
  assert.ok(poor.reasons.includes("high soreness suggests an easier session"));

  const normal = recovery.readiness(
    recovery.add({ at: "2026-10-27T06:00:00Z", sleepHours: 7, sleepQuality: 3, soreness: 2, stress: 2 }),
  );
  assert.equal(normal.score, 66);
  assert.equal(normal.band, "normal");

  assert.equal(recovery.latest()?.at, "2026-10-29T06:00:00.000Z");
  assert.equal(ledger.ofType("health.recovery.added").length, 3);

  assert.throws(
    () => recovery.add({ at: "nope", sleepHours: 8, sleepQuality: 3, soreness: 2, stress: 2 }),
    /not a date/,
  );
  assert.throws(
    () => recovery.add({ at: "2026-10-29T00:00:00Z", sleepHours: -1, sleepQuality: 3, soreness: 2, stress: 2 }),
    /sleepHours is out of range/,
  );
  assert.throws(
    () => recovery.add({ at: "2026-10-29T00:00:00Z", sleepHours: 8, sleepQuality: 6, soreness: 2, stress: 2 }),
    /sleepQuality is out of range/,
  );
  assert.throws(
    () => recovery.add({ at: "2026-10-29T00:00:00Z", sleepHours: 8, sleepQuality: 3, soreness: 0, stress: 2 }),
    /soreness is out of range/,
  );
  assert.throws(
    () => recovery.add({ at: "2026-10-29T00:00:00Z", sleepHours: 8, sleepQuality: 3, soreness: 2, stress: 2, restingHr: 24 }),
    /restingHr is out of range/,
  );
});

/* ------------------------------------------------------------------ wellbeing */

test("the wellbeing journal averages entries and reports a trend", () => {
  const ledger = new EventLedger([], CLOCK);
  const journal = new WellbeingJournal({ ledger, clock: CLOCK });
  journal.add({ at: "2026-10-26T20:00:00Z", mood: 2, energy: 3, stress: 4, notes: "Tired" });
  journal.add({ at: "2026-10-27T20:00:00Z", mood: 3, energy: 3, stress: 3 });
  journal.add({ at: "2026-10-29T20:00:00Z", mood: 5, energy: 4, stress: 1 });

  const summary = journal.summary({ from: "2026-10-26T00:00:00Z", to: "2026-11-02T00:00:00Z" });
  assert.equal(summary.entries, 3);
  assert.equal(summary.moodAvg, 3.3);
  assert.equal(summary.energyAvg, 3.3);
  assert.equal(summary.stressAvg, 2.7);
  assert.equal(summary.trend, "up");

  const empty = journal.summary({ from: "2026-01-01T00:00:00Z", to: "2026-02-01T00:00:00Z" });
  assert.deepEqual(empty, { entries: 0, moodAvg: 0, energyAvg: 0, stressAvg: 0, trend: "steady" });

  assert.throws(() => journal.summary({ from: "2026-02-01T00:00:00Z", to: "2026-01-01T00:00:00Z" }), /range is invalid/);
  assert.throws(() => journal.add({ at: "nope", mood: 3, energy: 3, stress: 3 }), /not a date/);
  assert.throws(() => journal.add({ at: "2026-10-29T00:00:00Z", mood: 0, energy: 3, stress: 3 }), /mood is out of range/);
  assert.throws(() => journal.add({ at: "2026-10-29T00:00:00Z", mood: 3, energy: 6, stress: 3 }), /energy is out of range/);
  assert.throws(() => journal.add({ at: "2026-10-29T00:00:00Z", mood: 3, energy: 3, stress: 1.5 }), /stress is out of range/);
  assert.equal(ledger.ofType("health.wellbeing.added").length, 3);
});

/* -------------------------------------------------------------------- privacy */

test("health privacy defaults to no consent and enforces the dependency", () => {
  const ledger = new EventLedger([], CLOCK);
  const privacy = new HealthPrivacy({ ledger, clock: CLOCK });
  assert.deepEqual(privacy.consent(), {
    healthData: false,
    research: false,
    cloudSync: false,
    updatedAt: "2026-10-29T00:00:00.000Z",
  });
  assert.throws(() => privacy.require("healthData"), /consent is not granted/);
  assert.throws(() => privacy.setConsent({ research: true }), /requires health data consent/);
  assert.throws(() => privacy.setConsent({ cloudSync: true }), /requires health data consent/);
  assert.throws(() => privacy.exportAll({ anything: true }), /consent is not granted for healthData/);

  privacy.setConsent({ healthData: true });
  privacy.setConsent({ research: true, cloudSync: true });
  assert.equal(privacy.consent().research, true);
  assert.equal(ledger.ofType("health.consent.changed").length, 2);

  const exported = privacy.exportAll({ workouts: 3 });
  assert.equal(exported.schema, "aetherius.health-export.v1");
  assert.equal(exported.exportedAt, "2026-10-29T00:00:00.000Z");
  assert.equal(exported.consent.healthData, true);
  assert.deepEqual(exported.data, { workouts: 3 });
  assert.deepEqual(privacy.accessLog().map((record) => record.action), ["export"]);

  const erased = privacy.erase();
  assert.equal(erased.erased, true);
  assert.deepEqual(
    { healthData: privacy.consent().healthData, research: privacy.consent().research, cloudSync: privacy.consent().cloudSync },
    { healthData: false, research: false, cloudSync: false },
  );
  assert.deepEqual(privacy.accessLog().map((record) => record.action), ["export", "erase"]);
  assert.equal(ledger.ofType("health.data.erased").length, 1);

  assert.throws(
    () => new HealthPrivacy({ initial: { research: true, healthData: false } }),
    /research consent requires health data consent/,
  );
  assert.throws(() => privacy.record(" ", "export"), /actor and an action/);
  assert.throws(() => privacy.record("user", "  "), /actor and an action/);
});

/* ------------------------------------------------------------------ dashboard */

test("the dashboard combines readiness, activity, goals, wellbeing and the latest plan", () => {
  const health = new AthenaHealth({ clock: CLOCK });
  assert.equal(health.dashboard("2026-10-29T00:00:00Z").readiness, null);
  assert.equal(health.dashboard("2026-10-29T00:00:00Z").latestPlan, null);

  health.activity.add({ kind: "workout", startedAt: "2026-10-28T18:00:00Z", durationMinutes: 40, intensity: 6 });
  health.activity.add({ kind: "walk", startedAt: "2026-10-29T08:00:00Z", durationMinutes: 20, intensity: 3, distanceKm: 2 });
  health.recovery.add({ at: "2026-10-29T06:00:00Z", sleepHours: 7, sleepQuality: 3, soreness: 2, stress: 2 });
  health.wellbeing.add({ at: "2026-10-29T20:00:00Z", mood: 4, energy: 3, stress: 2 });
  const goal = health.goals.add({ metric: "minutes", target: 60, period: "week" });
  const plan = health.plans.build({ goal: "general", sessionsPerWeek: 2, weeks: 2, equipment: ["none"] });

  const dashboard = health.dashboard("2026-10-29T00:00:00Z");
  assert.equal(dashboard.disclaimer, HEALTH_DISCLAIMER);
  assert.equal(dashboard.readiness?.band, "normal");
  assert.equal(dashboard.week.sessions, 2);
  assert.equal(dashboard.week.minutes, 60);
  assert.equal(dashboard.streak, 2);
  assert.equal(dashboard.goals.length, 1);
  assert.equal(dashboard.goals[0]!.goal.id, goal.id);
  assert.equal(dashboard.goals[0]!.complete, true);
  assert.equal(dashboard.wellbeing?.entries, 1);
  assert.equal(dashboard.latestPlan?.id, plan.id);
  assert.match(DATA_DISCLAIMER, /stays local/);
  assert.deepEqual([...ACTIVITY_KINDS].length, 6);
  assert.deepEqual([...EXERCISE_CATEGORIES].length, 5);
  assert.deepEqual([...EQUIPMENT].length, 8);
  assert.deepEqual([...HEALTH_FLAGS].length, 7);
});

/* ---------------------------------------------------------------------- dates */

test("week and month windows are UTC and Monday-based", () => {
  assert.equal(startOfUtcDay(new Date("2026-10-29T18:45:00Z")).toISOString(), "2026-10-29T00:00:00.000Z");
  assert.deepEqual(weekWindow("2026-10-29T12:00:00Z"), {
    from: "2026-10-26T00:00:00.000Z",
    to: "2026-11-02T00:00:00.000Z",
  });
  assert.deepEqual(weekWindow("2026-10-26T00:00:00Z"), {
    from: "2026-10-26T00:00:00.000Z",
    to: "2026-11-02T00:00:00.000Z",
  });
  assert.deepEqual(monthWindow("2026-10-29T12:00:00Z"), {
    from: "2026-10-01T00:00:00.000Z",
    to: "2026-11-01T00:00:00.000Z",
  });
  assert.throws(() => weekWindow("nope"), /not a date/);
  assert.throws(() => monthWindow("nope"), /not a date/);
});
