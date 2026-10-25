# Aetherius OS Learning

The Aetherius OS Learning application: the learner and educator views, the courses and lessons, the assessment, and the groups. An integrated application domain of the one Aetherius ecosystem, not a platform of its own.

**Built: the learning domain slice.** Courses, ordered lessons, enrolment, prerequisite enforcement, quizzes with pass marks, assignments and grading, progress and completion. **Not built:** the learner and educator UI, the host application registry mount, and a content authoring editor.

This is an integrated application domain of the one Aetherius ecosystem. It does not get its own account system, its own billing system or its own search index: the primitives it uses belong to the projects named in `docs/APPLICATION-SHARED-PRIMITIVES.yaml`. Accounts, entitlements and the hash-chained ledger come from `apps/app-kit`; Commerce and Learning share their data model rather than creating two.

## What is built

- Courses with draft/published state, ordered lessons and prerequisite courses.
- Enrolment that refuses an unmet prerequisite and records the enrolment event.
- Quizzes with a pass mark; submissions are graded and completion is recorded.
- Assignments submitted by learners and graded by an educator.
- Progress through the ordered lessons and a completion result per enrolment.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Not built

The learner and educator UI, the host registry mount, and an authoring editor. Courses are currently created through the service API.

## Where it comes from

The Figma handoff's V2 inputs table gives the destination as Aetherius OS Learning, with the LearnDash LMS 4.5.0.3 as the concept source. It is third-party and is referenced, not copied.
