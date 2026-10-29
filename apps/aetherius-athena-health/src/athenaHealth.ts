import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Athena health and wellbeing app.
 *
 * This is the product app. The Athena intelligence runtime in `apps/Athena`
 * remains the shared engine used by the Quantum Assistant; this slice owns the
 * exercise, training, activity, goal, recovery, wellbeing and privacy features
 * the owner asked for.
 *
 * Safety boundary: the app gives deterministic training and readiness
 * heuristics. It is not a clinician, does not diagnose, does not integrate a
 * wearable, and does not claim to prevent or treat injury or illness. A user
 * with a medical condition is told to seek qualified advice.
 */

export const HEALTH_DISCLAIMER =
  "Athena provides general fitness and wellbeing information, not medical advice, diagnosis or treatment. " +
  "Stop if you feel pain or unwell and consult a qualified clinician about your own condition.";

export const DATA_DISCLAIMER =
  "Health data stays local unless the user explicitly consents to cloud sync. This slice stores data in memory; the desktop host owns durable encrypted storage.";

/* ------------------------------------------------------------- exercise set */

export const EXERCISE_CATEGORIES = ["strength", "cardio", "mobility", "balance", "recovery"] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const EQUIPMENT = ["none", "dumbbells", "barbell", "kettlebell", "bands", "machine", "pullup_bar", "bench"] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const HEALTH_FLAGS = [
  "pregnancy",
  "hypertension",
  "heart_condition",
  "joint_injury",
  "back_injury",
  "diabetes",
  "osteoporosis",
] as const;
export type HealthFlag = (typeof HEALTH_FLAGS)[number];

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: string[];
  equipment: Equipment[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  instructions: string[];
  contraindications: HealthFlag[];
  regression: string | null;
  progression: string | null;
}

export interface AddExerciseInput {
  name: string;
  category: ExerciseCategory;
  primaryMuscles: string[];
  equipment: Equipment[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  instructions: string[];
  contraindications?: HealthFlag[];
  regression?: string | null;
  progression?: string | null;
}

const BUILT_IN_EXERCISES: readonly Exercise[] = [
  {
    id: "ex-squat",
    name: "Bodyweight squat",
    category: "strength",
    primaryMuscles: ["quadriceps", "glutes"],
    equipment: ["none"],
    difficulty: 1,
    instructions: ["Stand with feet shoulder-width apart.", "Sit back and down, keeping the chest tall.", "Stand back up."],
    contraindications: ["joint_injury"],
    regression: "Sit-to-stand from a chair.",
    progression: "Goblet squat with a dumbbell.",
  },
  {
    id: "ex-pushup",
    name: "Push-up",
    category: "strength",
    primaryMuscles: ["chest", "triceps", "shoulders"],
    equipment: ["none"],
    difficulty: 2,
    instructions: ["Start in a plank with hands under the shoulders.", "Lower the chest towards the floor.", "Press back up."],
    contraindications: ["joint_injury"],
    regression: "Incline push-up against a bench.",
    progression: "Feet-elevated push-up.",
  },
  {
    id: "ex-glute-bridge",
    name: "Glute bridge",
    category: "strength",
    primaryMuscles: ["glutes", "hamstrings"],
    equipment: ["none"],
    difficulty: 1,
    instructions: ["Lie on your back with knees bent.", "Press through the feet and lift the hips.", "Lower slowly."],
    contraindications: [],
    regression: "Smaller range of motion.",
    progression: "Single-leg glute bridge.",
  },
  {
    id: "ex-plank",
    name: "Forearm plank",
    category: "strength",
    primaryMuscles: ["core"],
    equipment: ["none"],
    difficulty: 2,
    instructions: ["Rest on forearms and toes.", "Keep a straight line from head to heels.", "Breathe steadily."],
    contraindications: ["back_injury"],
    regression: "Knee plank.",
    progression: "Long-lever plank.",
  },
  {
    id: "ex-dead-bug",
    name: "Dead bug",
    category: "strength",
    primaryMuscles: ["core"],
    equipment: ["none"],
    difficulty: 1,
    instructions: ["Lie on your back with arms and knees up.", "Lower one arm and the opposite leg.", "Return and swap."],
    contraindications: [],
    regression: "Move only the legs.",
    progression: "Add a light weight in the hands.",
  },
  {
    id: "ex-step-up",
    name: "Step-up",
    category: "cardio",
    primaryMuscles: ["quadriceps", "glutes"],
    equipment: ["none", "bench"],
    difficulty: 2,
    instructions: ["Place one foot on a stable step.", "Drive up through the foot.", "Step down with control."],
    contraindications: ["joint_injury", "osteoporosis"],
    regression: "Use a lower step.",
    progression: "Add a dumbbell in each hand.",
  },
  {
    id: "ex-march",
    name: "Marching in place",
    category: "cardio",
    primaryMuscles: ["whole body"],
    equipment: ["none"],
    difficulty: 1,
    instructions: ["March on the spot.", "Swing the arms naturally.", "Keep breathing."],
    contraindications: [],
    regression: "Slow the pace.",
    progression: "Add high knees.",
  },
  {
    id: "ex-row",
    name: "Band row",
    category: "strength",
    primaryMuscles: ["back", "biceps"],
    equipment: ["bands"],
    difficulty: 2,
    instructions: ["Anchor the band at chest height.", "Pull the handles towards the ribs.", "Return slowly."],
    contraindications: ["back_injury"],
    regression: "Seated band row.",
    progression: "Single-arm row.",
  },
  {
    id: "ex-press",
    name: "Dumbbell overhead press",
    category: "strength",
    primaryMuscles: ["shoulders", "triceps"],
    equipment: ["dumbbells"],
    difficulty: 3,
    instructions: ["Hold dumbbells at shoulder height.", "Press overhead without arching the back.", "Lower with control."],
    contraindications: ["hypertension", "joint_injury", "heart_condition"],
    regression: "Seated press with lighter weights.",
    progression: "Standing single-arm press.",
  },
  {
    id: "ex-hamstring-stretch",
    name: "Hamstring stretch",
    category: "mobility",
    primaryMuscles: ["hamstrings"],
    equipment: ["none"],
    difficulty: 1,
    instructions: ["Sit with one leg extended.", "Hinge forward from the hips.", "Hold and breathe."],
    contraindications: [],
    regression: "Bend the knee slightly.",
    progression: "Add a strap around the foot.",
  },
  {
    id: "ex-shoulder-mobility",
    name: "Shoulder circles",
    category: "mobility",
    primaryMuscles: ["shoulders"],
    equipment: ["none"],
    difficulty: 1,
    instructions: ["Stand tall with arms out.", "Draw slow circles forwards.", "Reverse the direction."],
    contraindications: [],
    regression: "Smaller circles.",
    progression: "Add light weights.",
  },
  {
    id: "ex-hip-mobility",
    name: "Hip flexor stretch",
    category: "mobility",
    primaryMuscles: ["hip flexors"],
    equipment: ["none"],
    difficulty: 1,
    instructions: ["Kneel in a half-kneeling position.", "Tuck the pelvis and shift forward gently.", "Hold and breathe."],
    contraindications: ["joint_injury"],
    regression: "Use a cushion under the knee.",
    progression: "Add a gentle reach overhead.",
  },
  {
    id: "ex-balance",
    name: "Single-leg balance",
    category: "balance",
    primaryMuscles: ["ankles", "core"],
    equipment: ["none"],
    difficulty: 1,
    instructions: ["Stand near a wall for support.", "Lift one foot.", "Hold steady and swap sides."],
    contraindications: ["joint_injury"],
    regression: "Hold the wall with one hand.",
    progression: "Close the eyes or stand on a cushion.",
  },
  {
    id: "ex-breathing",
    name: "Box breathing",
    category: "recovery",
    primaryMuscles: ["diaphragm"],
    equipment: ["none"],
    difficulty: 1,
    instructions: ["Breathe in for four counts.", "Hold for four.", "Breathe out for four.", "Hold for four."],
    contraindications: [],
    regression: "Use a shorter count.",
    progression: "Extend to six counts.",
  },
  {
    id: "ex-walk",
    name: "Brisk walk",
    category: "cardio",
    primaryMuscles: ["whole body"],
    equipment: ["none"],
    difficulty: 1,
    instructions: ["Walk at a pace that raises the breathing rate.", "Keep a tall posture.", "Cool down at the end."],
    contraindications: ["heart_condition"],
    regression: "Walk more slowly or for less time.",
    progression: "Add gentle inclines.",
  },
];

export interface ExerciseFilter {
  category?: ExerciseCategory;
  equipment?: readonly Equipment[];
  difficultyMax?: number;
  medicalFlags?: readonly HealthFlag[];
}

export interface LibraryOptions {
  ledger?: EventLedger;
  clock?: () => Date;
  seed?: readonly Exercise[];
}

export class ExerciseLibrary {
  private readonly exercises = new Map<string, Exercise>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: LibraryOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    for (const exercise of options.seed ?? BUILT_IN_EXERCISES) {
      this.exercises.set(exercise.id, { ...exercise, equipment: [...exercise.equipment], contraindications: [...exercise.contraindications] });
    }
  }

  add(input: AddExerciseInput): Exercise {
    if (!input.name.trim()) throw new Error("an exercise needs a name");
    if (!EXERCISE_CATEGORIES.includes(input.category)) throw new Error(`unknown category: ${input.category}`);
    if (input.equipment.length === 0) throw new Error("an exercise needs at least one equipment option");
    for (const equipment of input.equipment) {
      if (!EQUIPMENT.includes(equipment)) throw new Error(`unknown equipment: ${equipment}`);
    }
    if (![1, 2, 3, 4, 5].includes(input.difficulty)) throw new Error(`difficulty is out of range: ${input.difficulty}`);
    if (input.instructions.length === 0 || input.instructions.some((step) => !step.trim())) {
      throw new Error("an exercise needs at least one non-empty instruction");
    }
    for (const flag of input.contraindications ?? []) {
      if (!HEALTH_FLAGS.includes(flag)) throw new Error(`unknown health flag: ${flag}`);
    }
    const exercise: Exercise = {
      id: newId("ex"),
      name: input.name.trim(),
      category: input.category,
      primaryMuscles: [...new Set(input.primaryMuscles.map((muscle) => muscle.trim().toLowerCase()).filter(Boolean))],
      equipment: [...new Set(input.equipment)],
      difficulty: input.difficulty,
      instructions: input.instructions.map((step) => step.trim()),
      contraindications: [...new Set(input.contraindications ?? [])],
      regression: input.regression?.trim() || null,
      progression: input.progression?.trim() || null,
    };
    this.exercises.set(exercise.id, exercise);
    this.ledger.append({ type: "health.exercise.added", actor: "library", subject: exercise.id, data: { category: exercise.category } });
    return structuredClone(exercise);
  }

  get(id: string): Exercise | undefined {
    const exercise = this.exercises.get(id);
    return exercise ? structuredClone(exercise) : undefined;
  }

  list(filter: ExerciseFilter = {}): Exercise[] {
    if (filter.category !== undefined && !EXERCISE_CATEGORIES.includes(filter.category)) {
      throw new Error(`unknown category: ${filter.category}`);
    }
    const available = filter.equipment ? new Set(filter.equipment) : null;
    const flags = new Set(filter.medicalFlags ?? []);
    return [...this.exercises.values()]
      .filter((exercise) => filter.category === undefined || exercise.category === filter.category)
      .filter((exercise) => filter.difficultyMax === undefined || exercise.difficulty <= filter.difficultyMax)
      .filter((exercise) => available === null || exercise.equipment.some((item) => available.has(item)))
      .filter((exercise) => !exercise.contraindications.some((flag) => flags.has(flag)))
      .sort((a, b) => a.difficulty - b.difficulty || a.name.localeCompare(b.name))
      .map((exercise) => structuredClone(exercise));
  }

  search(query: string, limit = 20): Exercise[] {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error(`limit is out of range: ${limit}`);
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    return [...this.exercises.values()]
      .filter((exercise) => {
        const haystack = `${exercise.name}\n${exercise.category}\n${exercise.primaryMuscles.join(" ")}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit)
      .map((exercise) => structuredClone(exercise));
  }
}

/* --------------------------------------------------------------- workout plan */

export type TrainingGoal = "strength" | "endurance" | "mobility" | "general";

export interface PlanExercise {
  exerciseId: string;
  name: string;
  category: ExerciseCategory;
  sets: number;
  reps: number | null;
  durationSeconds: number | null;
  restSeconds: number;
  notes: string;
}

export interface PlanSession {
  id: string;
  day: number;
  title: string;
  exercises: PlanExercise[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  goal: TrainingGoal;
  weeks: number;
  sessionsPerWeek: number;
  sessions: PlanSession[];
  progression: string;
  createdAt: string;
  disclaimer: string;
}

export interface PlanRequest {
  goal: TrainingGoal;
  sessionsPerWeek: number;
  weeks: number;
  equipment: readonly Equipment[];
  medicalFlags?: readonly HealthFlag[];
  difficultyMax?: number;
}

const GOAL_MIX: Record<TrainingGoal, readonly [ExerciseCategory, number][]> = {
  strength: [["strength", 2], ["mobility", 1]],
  endurance: [["cardio", 2], ["strength", 1]],
  mobility: [["mobility", 2], ["balance", 1]],
  general: [["strength", 1], ["cardio", 1], ["mobility", 1]],
};

export class PlanBuilder {
  private readonly library: ExerciseLibrary;
  private readonly plans = new Map<string, WorkoutPlan>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(library: ExerciseLibrary, options: { ledger?: EventLedger; clock?: () => Date } = {}) {
    this.library = library;
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  build(request: PlanRequest): WorkoutPlan {
    if (!["strength", "endurance", "mobility", "general"].includes(request.goal)) {
      throw new Error(`unknown goal: ${request.goal}`);
    }
    if (!Number.isInteger(request.sessionsPerWeek) || request.sessionsPerWeek < 1 || request.sessionsPerWeek > 7) {
      throw new Error(`sessionsPerWeek is out of range: ${request.sessionsPerWeek}`);
    }
    if (!Number.isInteger(request.weeks) || request.weeks < 1 || request.weeks > 52) {
      throw new Error(`weeks is out of range: ${request.weeks}`);
    }
    if (request.equipment.length === 0) throw new Error("the plan needs at least one equipment option");

    const pool = this.library.list({
      equipment: request.equipment,
      medicalFlags: request.medicalFlags ?? [],
      difficultyMax: request.difficultyMax ?? 5,
    });
    const mix = GOAL_MIX[request.goal];
    const byCategory = new Map<ExerciseCategory, Exercise[]>();
    for (const [category] of mix) {
      byCategory.set(category, pool.filter((exercise) => exercise.category === category));
    }
    for (const [category, count] of mix) {
      const available = byCategory.get(category)!;
      if (available.length < count) {
        throw new Error(
          `not enough ${category} exercises for a ${request.goal} plan with the selected equipment and health flags (need ${count}, have ${available.length})`,
        );
      }
    }

    const sessions: PlanSession[] = [];
    for (let sessionIndex = 0; sessionIndex < request.sessionsPerWeek; sessionIndex += 1) {
      const exercises: PlanExercise[] = [];
      for (const [category, count] of mix) {
        const available = byCategory.get(category)!;
        for (let offset = 0; offset < count; offset += 1) {
          const exercise = available[(sessionIndex * count + offset) % available.length]!;
          exercises.push(prescribe(exercise, exercises.length + 1));
        }
      }
      sessions.push({
        id: newId("ses"),
        day: sessionIndex + 1,
        title: `Session ${sessionIndex + 1}: ${mix.map(([category]) => category).join(" + ")}`,
        exercises,
      });
    }

    const plan: WorkoutPlan = {
      id: newId("plan"),
      name: `${capitalise(request.goal)} plan`,
      goal: request.goal,
      weeks: request.weeks,
      sessionsPerWeek: request.sessionsPerWeek,
      sessions,
      progression:
        "Repeat this weekly template and add one repetition or a small amount of load when every set feels comfortable. " +
        "Deload if sleep, soreness or readiness worsens.",
      createdAt: nowIso(this.clock),
      disclaimer: HEALTH_DISCLAIMER,
    };
    this.plans.set(plan.id, plan);
    this.ledger.append({ type: "health.plan.built", actor: "planner", subject: plan.id, data: { goal: plan.goal } });
    return structuredClone(plan);
  }

  get(planId: string): WorkoutPlan | undefined {
    const plan = this.plans.get(planId);
    return plan ? structuredClone(plan) : undefined;
  }

  list(): WorkoutPlan[] {
    return [...this.plans.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((plan) => structuredClone(plan));
  }
}

function prescribe(exercise: Exercise, position: number): PlanExercise {
  const base = { exerciseId: exercise.id, name: exercise.name, category: exercise.category, notes: `Position ${position}` };
  if (exercise.category === "strength") {
    return { ...base, sets: 3, reps: 10, durationSeconds: null, restSeconds: 90 };
  }
  if (exercise.category === "cardio") {
    return { ...base, sets: 1, reps: null, durationSeconds: 600, restSeconds: 60 };
  }
  if (exercise.category === "balance") {
    return { ...base, sets: 2, reps: null, durationSeconds: 45, restSeconds: 30 };
  }
  if (exercise.category === "recovery") {
    return { ...base, sets: 1, reps: null, durationSeconds: 300, restSeconds: 0 };
  }
  return { ...base, sets: 2, reps: null, durationSeconds: 60, restSeconds: 30 };
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* --------------------------------------------------------------- activity log */

export const ACTIVITY_KINDS = ["workout", "walk", "run", "cycle", "swim", "other"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export interface Activity {
  id: string;
  kind: ActivityKind;
  startedAt: string;
  durationMinutes: number;
  intensity: number;
  distanceKm: number | null;
  notes: string;
  planSessionId: string | null;
}

export interface AddActivityInput {
  kind: ActivityKind;
  startedAt: string;
  durationMinutes: number;
  intensity: number;
  distanceKm?: number | null;
  notes?: string;
  planSessionId?: string | null;
}

export interface ActivitySummary {
  sessions: number;
  minutes: number;
  load: number;
  byKind: Partial<Record<ActivityKind, number>>;
}

export class ActivityLog {
  private readonly activities = new Map<string, Activity>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: { ledger?: EventLedger; clock?: () => Date } = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  add(input: AddActivityInput): Activity {
    if (!ACTIVITY_KINDS.includes(input.kind)) throw new Error(`unknown activity kind: ${input.kind}`);
    if (!Number.isFinite(Date.parse(input.startedAt))) throw new Error(`startedAt is not a date: ${input.startedAt}`);
    if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 1 || input.durationMinutes > 1440) {
      throw new Error(`durationMinutes is out of range: ${input.durationMinutes}`);
    }
    if (!Number.isInteger(input.intensity) || input.intensity < 1 || input.intensity > 10) {
      throw new Error(`intensity is out of range: ${input.intensity}`);
    }
    const distanceKm = input.distanceKm ?? null;
    if (distanceKm !== null && (!Number.isFinite(distanceKm) || distanceKm < 0)) {
      throw new Error(`distanceKm is out of range: ${distanceKm}`);
    }
    const activity: Activity = {
      id: newId("act"),
      kind: input.kind,
      startedAt: new Date(input.startedAt).toISOString(),
      durationMinutes: input.durationMinutes,
      intensity: input.intensity,
      distanceKm,
      notes: input.notes?.trim() ?? "",
      planSessionId: input.planSessionId ?? null,
    };
    this.activities.set(activity.id, activity);
    this.ledger.append({ type: "health.activity.added", actor: "activity", subject: activity.id, data: { kind: activity.kind } });
    return structuredClone(activity);
  }

  list(range: { from?: string; to?: string } = {}): Activity[] {
    const from = range.from ? Date.parse(range.from) : Number.NEGATIVE_INFINITY;
    const to = range.to ? Date.parse(range.to) : Number.POSITIVE_INFINITY;
    if (range.from && !Number.isFinite(from)) throw new Error(`from is not a date: ${range.from}`);
    if (range.to && !Number.isFinite(to)) throw new Error(`to is not a date: ${range.to}`);
    return [...this.activities.values()]
      .filter((activity) => Date.parse(activity.startedAt) >= from && Date.parse(activity.startedAt) < to)
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
      .map((activity) => structuredClone(activity));
  }

  summary(range: { from: string; to: string }): ActivitySummary {
    const activities = this.list(range);
    const byKind: Partial<Record<ActivityKind, number>> = {};
    let minutes = 0;
    let load = 0;
    for (const activity of activities) {
      minutes += activity.durationMinutes;
      load += activity.durationMinutes * activity.intensity;
      byKind[activity.kind] = (byKind[activity.kind] ?? 0) + activity.durationMinutes;
    }
    return { sessions: activities.length, minutes, load, byKind };
  }

  weeklyLoad(reference: string): number {
    const { from, to } = weekWindow(reference);
    return this.summary({ from, to }).load;
  }

  /** Consecutive days with at least one activity, ending today or yesterday. */
  streak(reference: string): number {
    const referenceDate = startOfUtcDay(new Date(reference));
    if (!Number.isFinite(referenceDate.getTime())) throw new Error(`reference is not a date: ${reference}`);
    const days = new Set(this.list().map((activity) => activity.startedAt.slice(0, 10)));
    const cursor = new Date(referenceDate);
    if (!days.has(cursor.toISOString().slice(0, 10))) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      if (!days.has(cursor.toISOString().slice(0, 10))) return 0;
    }
    let count = 0;
    while (days.has(cursor.toISOString().slice(0, 10))) {
      count += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return count;
  }
}

/* ---------------------------------------------------------------------- goals */

export type GoalMetric = "sessions" | "minutes" | "distanceKm" | "load";
export type GoalPeriod = "week" | "month";

export interface Goal {
  id: string;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
  createdAt: string;
}

export interface GoalProgress {
  goal: Goal;
  current: number;
  target: number;
  percent: number;
  complete: boolean;
  from: string;
  to: string;
}

export class GoalTracker {
  private readonly goals = new Map<string, Goal>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: { ledger?: EventLedger; clock?: () => Date } = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  add(input: { metric: GoalMetric; target: number; period: GoalPeriod }): Goal {
    if (!["sessions", "minutes", "distanceKm", "load"].includes(input.metric)) throw new Error(`unknown metric: ${input.metric}`);
    if (!["week", "month"].includes(input.period)) throw new Error(`unknown period: ${input.period}`);
    if (!Number.isFinite(input.target) || input.target <= 0) throw new Error(`goal target is out of range: ${input.target}`);
    const goal: Goal = {
      id: newId("goal"),
      metric: input.metric,
      target: input.target,
      period: input.period,
      createdAt: nowIso(this.clock),
    };
    this.goals.set(goal.id, goal);
    this.ledger.append({ type: "health.goal.added", actor: "goals", subject: goal.id, data: { metric: goal.metric } });
    return { ...goal };
  }

  list(): Goal[] {
    return [...this.goals.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((goal) => ({ ...goal }));
  }

  remove(goalId: string): boolean {
    if (!this.goals.delete(goalId)) throw new Error(`no goal: ${goalId}`);
    return true;
  }

  progress(goalId: string, log: ActivityLog, reference: string): GoalProgress {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error(`no goal: ${goalId}`);
    const { from, to } = goal.period === "week" ? weekWindow(reference) : monthWindow(reference);
    const summary = log.summary({ from, to });
    const current =
      goal.metric === "sessions"
        ? summary.sessions
        : goal.metric === "minutes"
          ? summary.minutes
          : goal.metric === "distanceKm"
            ? log.list({ from, to }).reduce((total, activity) => total + (activity.distanceKm ?? 0), 0)
            : summary.load;
    const percent = Math.round((current / goal.target) * 1000) / 10;
    return { goal: { ...goal }, current, target: goal.target, percent, complete: current >= goal.target, from, to };
  }
}

/* ------------------------------------------------------------------- recovery */

export interface RecoveryCheckIn {
  id: string;
  at: string;
  sleepHours: number;
  sleepQuality: number;
  soreness: number;
  restingHr: number | null;
  stress: number;
  notes: string;
}

export type ReadinessBand = "rest" | "easy" | "normal" | "hard";

export interface Readiness {
  score: number;
  band: ReadinessBand;
  reasons: string[];
  at: string;
  disclaimer: string;
}

export class RecoveryTracker {
  private readonly checkIns = new Map<string, RecoveryCheckIn>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: { ledger?: EventLedger; clock?: () => Date } = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  add(input: {
    at: string;
    sleepHours: number;
    sleepQuality: number;
    soreness: number;
    restingHr?: number | null;
    stress: number;
    notes?: string;
  }): RecoveryCheckIn {
    if (!Number.isFinite(Date.parse(input.at))) throw new Error(`at is not a date: ${input.at}`);
    if (!Number.isFinite(input.sleepHours) || input.sleepHours < 0 || input.sleepHours > 24) {
      throw new Error(`sleepHours is out of range: ${input.sleepHours}`);
    }
    for (const [name, value] of [
      ["sleepQuality", input.sleepQuality],
      ["soreness", input.soreness],
      ["stress", input.stress],
    ] as const) {
      if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error(`${name} is out of range: ${value}`);
    }
    const restingHr = input.restingHr ?? null;
    if (restingHr !== null && (!Number.isFinite(restingHr) || restingHr < 25 || restingHr > 220)) {
      throw new Error(`restingHr is out of range: ${restingHr}`);
    }
    const checkIn: RecoveryCheckIn = {
      id: newId("rec"),
      at: new Date(input.at).toISOString(),
      sleepHours: input.sleepHours,
      sleepQuality: input.sleepQuality,
      soreness: input.soreness,
      restingHr,
      stress: input.stress,
      notes: input.notes?.trim() ?? "",
    };
    this.checkIns.set(checkIn.id, checkIn);
    this.ledger.append({ type: "health.recovery.added", actor: "recovery", subject: checkIn.id, data: {} });
    return structuredClone(checkIn);
  }

  latest(): RecoveryCheckIn | undefined {
    const sorted = [...this.checkIns.values()].sort((a, b) => b.at.localeCompare(a.at));
    return sorted[0] ? structuredClone(sorted[0]) : undefined;
  }

  readiness(checkIn: RecoveryCheckIn): Readiness {
    let score = 60;
    const reasons: string[] = [];
    if (checkIn.sleepHours >= 7 && checkIn.sleepHours <= 9) {
      score += 15;
      reasons.push("sleep duration is in the usual 7-9 hour range");
    } else if (checkIn.sleepHours >= 6) {
      score += 5;
      reasons.push("sleep duration is slightly below the usual range");
    } else {
      score -= 15;
      reasons.push("short sleep lowers readiness");
    }
    score += (checkIn.sleepQuality - 3) * 5;
    if (checkIn.sleepQuality <= 2) reasons.push("poor sleep quality lowers readiness");
    score -= (checkIn.soreness - 1) * 5;
    if (checkIn.soreness >= 4) reasons.push("high soreness suggests an easier session");
    score -= (checkIn.stress - 1) * 4;
    if (checkIn.stress >= 4) reasons.push("high stress suggests an easier session");
    if (checkIn.restingHr !== null) {
      if (checkIn.restingHr < 60) {
        score += 10;
        reasons.push("resting heart rate is in a lower range");
      } else if (checkIn.restingHr > 80) {
        score -= 10;
        reasons.push("elevated resting heart rate lowers readiness");
      }
    }
    score = Math.max(0, Math.min(100, Math.round(score)));
    const band: ReadinessBand = score < 40 ? "rest" : score < 60 ? "easy" : score < 80 ? "normal" : "hard";
    return {
      score,
      band,
      reasons,
      at: checkIn.at,
      disclaimer: "Readiness is a deterministic heuristic, not a medical assessment.",
    };
  }
}

/* ------------------------------------------------------------------ wellbeing */

export interface WellbeingEntry {
  id: string;
  at: string;
  mood: number;
  energy: number;
  stress: number;
  notes: string;
}

export interface WellbeingSummary {
  entries: number;
  moodAvg: number;
  energyAvg: number;
  stressAvg: number;
  trend: "up" | "down" | "steady";
}

export class WellbeingJournal {
  private readonly entries = new Map<string, WellbeingEntry>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: { ledger?: EventLedger; clock?: () => Date } = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  add(input: { at: string; mood: number; energy: number; stress: number; notes?: string }): WellbeingEntry {
    if (!Number.isFinite(Date.parse(input.at))) throw new Error(`at is not a date: ${input.at}`);
    for (const [name, value] of [
      ["mood", input.mood],
      ["energy", input.energy],
      ["stress", input.stress],
    ] as const) {
      if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error(`${name} is out of range: ${value}`);
    }
    const entry: WellbeingEntry = {
      id: newId("wb"),
      at: new Date(input.at).toISOString(),
      mood: input.mood,
      energy: input.energy,
      stress: input.stress,
      notes: input.notes?.trim() ?? "",
    };
    this.entries.set(entry.id, entry);
    this.ledger.append({ type: "health.wellbeing.added", actor: "wellbeing", subject: entry.id, data: {} });
    return { ...entry };
  }

  summary(range: { from: string; to: string }): WellbeingSummary {
    const from = Date.parse(range.from);
    const to = Date.parse(range.to);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) throw new Error("the summary range is invalid");
    const entries = [...this.entries.values()]
      .filter((entry) => Date.parse(entry.at) >= from && Date.parse(entry.at) < to)
      .sort((a, b) => a.at.localeCompare(b.at));
    if (entries.length === 0) {
      return { entries: 0, moodAvg: 0, energyAvg: 0, stressAvg: 0, trend: "steady" };
    }
    const average = (values: number[]): number => Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
    const middle = Math.ceil(entries.length / 2);
    const first = entries.slice(0, middle);
    const second = entries.slice(middle);
    const moodFirst = average(first.map((entry) => entry.mood));
    const moodSecond = second.length > 0 ? average(second.map((entry) => entry.mood)) : moodFirst;
    const trend = moodSecond > moodFirst + 0.2 ? "up" : moodSecond < moodFirst - 0.2 ? "down" : "steady";
    return {
      entries: entries.length,
      moodAvg: average(entries.map((entry) => entry.mood)),
      energyAvg: average(entries.map((entry) => entry.energy)),
      stressAvg: average(entries.map((entry) => entry.stress)),
      trend,
    };
  }
}

/* -------------------------------------------------------------------- privacy */

export type ConsentPurpose = "healthData" | "research" | "cloudSync";

export interface ConsentState {
  healthData: boolean;
  research: boolean;
  cloudSync: boolean;
  updatedAt: string;
}

export interface AccessRecord {
  at: string;
  actor: string;
  action: string;
}

export class HealthPrivacy {
  private state: ConsentState;
  private readonly records: AccessRecord[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: { ledger?: EventLedger; clock?: () => Date; initial?: Partial<ConsentState> } = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.state = {
      healthData: false,
      research: false,
      cloudSync: false,
      updatedAt: nowIso(this.clock),
      ...(options.initial ?? {}),
    };
    this.validate();
  }

  consent(): ConsentState {
    return { ...this.state };
  }

  setConsent(patch: Partial<Pick<ConsentState, ConsentPurpose>>): ConsentState {
    const next = { ...this.state, ...patch, updatedAt: nowIso(this.clock) };
    if (next.research && !next.healthData) throw new Error("research consent requires health data consent");
    if (next.cloudSync && !next.healthData) throw new Error("cloud sync consent requires health data consent");
    this.state = next;
    this.ledger.append({
      type: "health.consent.changed",
      actor: "user",
      subject: "consent",
      data: { healthData: next.healthData, research: next.research, cloudSync: next.cloudSync },
    });
    return { ...next };
  }

  require(purpose: ConsentPurpose): void {
    if (!this.state[purpose]) throw new Error(`consent is not granted for ${purpose}`);
  }

  record(actor: string, action: string): AccessRecord {
    if (!actor.trim() || !action.trim()) throw new Error("an access record needs an actor and an action");
    const record: AccessRecord = { at: nowIso(this.clock), actor: actor.trim(), action: action.trim() };
    this.records.push(record);
    return { ...record };
  }

  accessLog(): AccessRecord[] {
    return this.records.map((record) => ({ ...record }));
  }

  exportAll(data: Record<string, unknown>): { schema: "aetherius.health-export.v1"; exportedAt: string; consent: ConsentState; data: unknown } {
    this.require("healthData");
    this.record("user", "export");
    return {
      schema: "aetherius.health-export.v1",
      exportedAt: nowIso(this.clock),
      consent: { ...this.state },
      data: structuredClone(data),
    };
  }

  erase(): { erased: true; at: string } {
    const at = nowIso(this.clock);
    this.state = { healthData: false, research: false, cloudSync: false, updatedAt: at };
    this.records.push({ at, actor: "user", action: "erase" });
    this.ledger.append({ type: "health.data.erased", actor: "user", subject: "all", data: {} });
    return { erased: true, at };
  }

  private validate(): void {
    for (const purpose of ["healthData", "research", "cloudSync"] as const) {
      if (typeof this.state[purpose] !== "boolean") throw new Error(`${purpose} consent must be a boolean`);
    }
    if (this.state.research && !this.state.healthData) throw new Error("research consent requires health data consent");
    if (this.state.cloudSync && !this.state.healthData) throw new Error("cloud sync consent requires health data consent");
  }
}

/* ------------------------------------------------------------------ dashboard */

export interface Dashboard {
  disclaimer: string;
  readiness: Readiness | null;
  week: ActivitySummary;
  streak: number;
  goals: GoalProgress[];
  wellbeing: WellbeingSummary | null;
  latestPlan: WorkoutPlan | null;
}

export class AthenaHealth {
  readonly library: ExerciseLibrary;
  readonly plans: PlanBuilder;
  readonly activity: ActivityLog;
  readonly goals: GoalTracker;
  readonly recovery: RecoveryTracker;
  readonly wellbeing: WellbeingJournal;
  readonly privacy: HealthPrivacy;

  constructor(options: { ledger?: EventLedger; clock?: () => Date } = {}) {
    const ledger = options.ledger ?? new EventLedger();
    const clock = options.clock ?? (() => new Date());
    this.library = new ExerciseLibrary({ ledger, clock });
    this.plans = new PlanBuilder(this.library, { ledger, clock });
    this.activity = new ActivityLog({ ledger, clock });
    this.goals = new GoalTracker({ ledger, clock });
    this.recovery = new RecoveryTracker({ ledger, clock });
    this.wellbeing = new WellbeingJournal({ ledger, clock });
    this.privacy = new HealthPrivacy({ ledger, clock });
  }

  dashboard(reference: string): Dashboard {
    const week = weekWindow(reference);
    const latestCheckIn = this.recovery.latest();
    const wellbeingWindow = { from: week.from, to: week.to };
    const plans = this.plans.list();
    return {
      disclaimer: HEALTH_DISCLAIMER,
      readiness: latestCheckIn ? this.recovery.readiness(latestCheckIn) : null,
      week: this.activity.summary(week),
      streak: this.activity.streak(reference),
      goals: this.goals.list().map((goal) => this.goals.progress(goal.id, this.activity, reference)),
      wellbeing: this.wellbeing.summary(wellbeingWindow).entries > 0 ? this.wellbeing.summary(wellbeingWindow) : null,
      latestPlan: plans[0] ?? null,
    };
  }
}

/* --------------------------------------------------------------------- dates */

export function startOfUtcDay(date: Date): Date {
  const copy = new Date(date.getTime());
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

export function weekWindow(reference: string): { from: string; to: string } {
  const date = startOfUtcDay(new Date(reference));
  if (!Number.isFinite(date.getTime())) throw new Error(`reference is not a date: ${reference}`);
  const offset = (date.getUTCDay() + 6) % 7;
  const from = new Date(date);
  from.setUTCDate(from.getUTCDate() - offset);
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 7);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function monthWindow(reference: string): { from: string; to: string } {
  const date = new Date(reference);
  if (!Number.isFinite(date.getTime())) throw new Error(`reference is not a date: ${reference}`);
  const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { from: from.toISOString(), to: to.toISOString() };
}
