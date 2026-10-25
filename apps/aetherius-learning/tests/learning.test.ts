import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AccountService,
  EntitlementService,
  EventLedger,
  MemoryRepository,
  NotificationService,
  type Account,
} from "../../app-kit/src/index.ts";
import { LearningService } from "../src/learning.ts";

interface Harness {
  ledger: EventLedger;
  learning: LearningService;
  accounts: AccountService;
  entitlements: EntitlementService;
  notifications: NotificationService;
  educator: Account;
  otherEducator: Account;
  learner: Account;
}

function setup(): Harness {
  const ledger = new EventLedger();
  const accounts = new AccountService(new MemoryRepository(), new MemoryRepository(), { ledger });
  const entitlements = new EntitlementService(new MemoryRepository(), { ledger });
  const notifications = new NotificationService(new MemoryRepository());
  const learning = new LearningService(
    {
      courses: new MemoryRepository(),
      lessons: new MemoryRepository(),
      enrollments: new MemoryRepository(),
      quizzes: new MemoryRepository(),
      attempts: new MemoryRepository(),
      assignments: new MemoryRepository(),
      submissions: new MemoryRepository(),
    },
    { ledger, entitlements, notifications },
  );
  const educator = accounts.create({ handle: "teacher", displayName: "Teacher", roles: ["educator"] });
  const otherEducator = accounts.create({ handle: "other", displayName: "Other", roles: ["educator"] });
  const learner = accounts.create({ handle: "learner", displayName: "Learner" });
  return { ledger, learning, accounts, entitlements, notifications, educator, otherEducator, learner };
}

function publishedCourse(harness: Harness, title = "Bread fundamentals") {
  const course = harness.learning.createCourse(harness.educator, { title });
  const first = harness.learning.addLesson(harness.educator, course.id, { title: "Flour", body: "Wheat." });
  const second = harness.learning.addLesson(harness.educator, course.id, { title: "Water", body: "Hydration." });
  harness.learning.publishCourse(harness.educator, course.id);
  return { course, first, second };
}

test("a learner enrols, finishes every lesson and earns the certificate", () => {
  const harness = setup();
  const { course, first, second } = publishedCourse(harness);
  const enrollment = harness.learning.enroll(harness.learner, course.id);

  assert.equal(harness.entitlements.has(harness.learner.id, `learning:course:${course.id}`), true);
  assert.equal(harness.learning.progress(enrollment.id).percent, 0);

  harness.learning.completeLesson(harness.learner, enrollment.id, first.id);
  assert.equal(harness.learning.progress(enrollment.id).percent, 50);
  const completed = harness.learning.completeLesson(harness.learner, enrollment.id, second.id);

  assert.equal(completed.status, "completed");
  assert.equal(harness.learning.progress(enrollment.id).percent, 100);
  assert.equal(harness.entitlements.has(harness.learner.id, `learning:certificate:${course.id}`), true);
  assert.equal(harness.notifications.unreadCount(harness.learner.id), 2);
});

test("a draft course cannot be enrolled in, and a lesson from another course is refused", () => {
  const harness = setup();
  const draft = harness.learning.createCourse(harness.educator, { title: "Draft course" });
  harness.learning.addLesson(harness.educator, draft.id, { title: "One" });
  assert.throws(() => harness.learning.enroll(harness.learner, draft.id), /published/);

  const { course } = publishedCourse(harness);
  const other = publishedCourse(harness, "Other course");
  const enrollment = harness.learning.enroll(harness.learner, course.id);
  assert.throws(
    () => harness.learning.completeLesson(harness.learner, enrollment.id, other.first.id),
    /does not belong/,
  );
});

test("a prerequisite must be completed before enrolment", () => {
  const harness = setup();
  const basic = harness.learning.createCourse(harness.educator, { title: "Basic" });
  const lesson = harness.learning.addLesson(harness.educator, basic.id, { title: "Start" });
  harness.learning.publishCourse(harness.educator, basic.id);

  const advanced = harness.learning.createCourse(harness.educator, {
    title: "Advanced",
    prerequisiteCourseId: basic.id,
  });
  harness.learning.addLesson(harness.educator, advanced.id, { title: "Continue" });
  harness.learning.publishCourse(harness.educator, advanced.id);

  assert.throws(() => harness.learning.enroll(harness.learner, advanced.id), /prerequisite/);
  const enrollment = harness.learning.enroll(harness.learner, basic.id);
  harness.learning.completeLesson(harness.learner, enrollment.id, lesson.id);
  const advancedEnrollment = harness.learning.enroll(harness.learner, advanced.id);
  assert.equal(advancedEnrollment.courseId, advanced.id);
});

test("quiz scores are exact and the pass threshold is enforced", () => {
  const harness = setup();
  const { course } = publishedCourse(harness);
  const quiz = harness.learning.createQuiz(harness.educator, course.id, {
    title: "Flour check",
    passingPercent: 70,
    questions: [
      { prompt: "Which grain?", options: ["Wheat", "Rice"], correctIndex: 0, points: 2 },
      { prompt: "Which liquid?", options: ["Milk", "Water"], correctIndex: 1, points: 2 },
    ],
  });
  assert.throws(() => harness.learning.submitQuiz(harness.learner, quiz.id, [0, 1]), /enrol/);
  harness.learning.enroll(harness.learner, course.id);

  const failed = harness.learning.submitQuiz(harness.learner, quiz.id, [1, 1]);
  assert.deepEqual({ score: failed.score, maximum: failed.maximum, passed: failed.passed }, { score: 2, maximum: 4, passed: false });
  const passed = harness.learning.submitQuiz(harness.learner, quiz.id, [0, 1]);
  assert.equal(passed.passed, true);
  assert.throws(() => harness.learning.submitQuiz(harness.learner, quiz.id, [0]), /answer every/);
});

test("only the owning educator grades an assignment, and the learner is notified", () => {
  const harness = setup();
  const { course } = publishedCourse(harness);
  harness.learning.enroll(harness.learner, course.id);
  const assignment = harness.learning.createAssignment(harness.educator, course.id, {
    title: "Describe hydration",
    points: 20,
  });
  const submission = harness.learning.submitAssignment(harness.learner, assignment.id, "Water is 70% of the dough.");

  assert.throws(() => harness.learning.gradeSubmission(harness.otherEducator, submission.id, 18, "fine"), /only the course educator/);
  assert.throws(() => harness.learning.gradeSubmission(harness.educator, submission.id, 21, "too high"), /between 0 and 20/);
  const graded = harness.learning.gradeSubmission(harness.educator, submission.id, 18, "Good.");
  assert.equal(graded.status, "graded");
  assert.equal(graded.grade, 18);
  assert.equal(harness.notifications.list(harness.learner.id)[0]?.title, "Assignment graded");
  assert.throws(() => harness.learning.submitAssignment(harness.learner, assignment.id, "again"), /graded/);
});

test("a learner cannot submit work without enrolling", () => {
  const harness = setup();
  const { course } = publishedCourse(harness);
  const assignment = harness.learning.createAssignment(harness.educator, course.id, { title: "Intro" });
  assert.throws(
    () => harness.learning.submitAssignment(harness.learner, assignment.id, "answer"),
    /enrol/,
  );
});
