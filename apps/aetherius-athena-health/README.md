# Athena Health

The health and wellbeing product slice for Athena: exercise library, workout plans, activity log, goals, recovery readiness, a wellbeing journal, privacy controls and a combined dashboard.

**Built:** the health domain core and tests. **Not built:** a user interface, wearable/device integration, encrypted storage, clinician review or a live Food Wiki mount.

This is a wellness tool, not a medical device. The readiness score is a transparent heuristic, not a diagnosis or treatment plan.

## What is built

- **Exercise library:** a seeded catalogue with category, primary muscle, equipment, difficulty, search and medical-flag filtering; validated custom exercises with regression/progression notes.
- **Workout plans:** strength, endurance, mobility and general goals; sessions per week and week count; equipment and medical constraints; honest refusal when the pool is too small.
- **Activity log:** workouts, walks, runs, cycles, swims and other activity with duration, intensity, distance, weekly load and consecutive-day streaks.
- **Goals:** sessions, minutes, distance and load over a UTC week or month, with progress and completion.
- **Recovery:** sleep, sleep quality, soreness, resting heart rate and stress produce a deterministic readiness band with reasons.
- **Wellbeing journal:** mood, energy and stress averages plus a trend.
- **Privacy:** all consent defaults to off; research and cloud sync require health-data consent; export requires explicit health-data consent; erase clears consent and records the action.
- **Dashboard:** readiness, week summary, streak, goal progress, wellbeing and the latest plan in one view.
- Every mutation is recorded on the shared hash-chained `EventLedger`.

## Honest limits

- No UI, route, host mount or wearable/device integration.
- Data is in-process. There is no database, encryption at rest, key management or secure deletion.
- The exercise catalogue is a small generic seed and has not been reviewed by a qualified trainer or physiotherapist.
- The readiness score is a fixed rule over self-reported inputs; it is not a clinical assessment.
- Food Wiki exposes Athena `ToolDefinition`s, but a live host integration is not built.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Provenance

Built from the owner's direct statement that Athena is an exercise, health and wellbeing app. `apps/Athena` remains the separate shared intelligence runtime used by the quantum assistant; this slice is the health product surface.
