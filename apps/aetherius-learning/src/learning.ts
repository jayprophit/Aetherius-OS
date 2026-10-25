import {
  EventLedger,
  EntitlementService,
  NotificationService,
  newId,
  nowIso,
  slugify,
  type Account,
  type Repository,
} from "../../app-kit/src/index.ts";

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  educatorId: string;
  status: "draft" | "published" | "archived";
  prerequisiteCourseId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  module: string;
  title: string;
  body: string;
  order: number;
  durationMinutes: number;
}

export interface Enrollment {
  id: string;
  courseId: string;
  learnerId: string;
  status: "active" | "completed";
  completedLessonIds: string[];
  enrolledAt: string;
  completedAt: string | null;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  points: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  questions: QuizQuestion[];
  passingPercent: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  learnerId: string;
  answers: number[];
  score: number;
  maximum: number;
  passed: boolean;
  at: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  instructions: string;
  points: number;
  dueAt: string | null;
}

export interface Submission {
  id: string;
  assignmentId: string;
  learnerId: string;
  content: string;
  status: "submitted" | "graded";
  grade: number | null;
  feedback: string;
  gradedBy: string | null;
  submittedAt: string;
  gradedAt: string | null;
}

export interface LearningOptions {
  ledger?: EventLedger;
  entitlements?: EntitlementService;
  notifications?: NotificationService;
  clock?: () => Date;
}

function requireRole(account: Account, roles: readonly string[]): void {
  if (account.status !== "active" || !roles.some((role) => account.roles.includes(role))) {
    throw new Error(`this action requires one of: ${roles.join(", ")}`);
  }
}

function entitlementFor(courseId: string): string {
  return `learning:course:${courseId}`;
}

function certificateFor(courseId: string): string {
  return `learning:certificate:${courseId}`;
}

/**
 * Learning: courses, lessons, enrolment, assessment and assignment grading.
 *
 * An enrolment is an entitlement grant, which is the same mechanism Commerce
 * uses. A paid course can therefore be sold by Commerce and unlocked here
 * without a second access system.
 */
export class LearningService {
  private readonly courses: Repository<Course>;
  private readonly lessons: Repository<Lesson>;
  private readonly enrollments: Repository<Enrollment>;
  private readonly quizzes: Repository<Quiz>;
  private readonly attempts: Repository<QuizAttempt>;
  private readonly assignments: Repository<Assignment>;
  private readonly submissions: Repository<Submission>;
  private readonly options: LearningOptions;
  private readonly clock: () => Date;

  constructor(
    repos: {
      courses: Repository<Course>;
      lessons: Repository<Lesson>;
      enrollments: Repository<Enrollment>;
      quizzes: Repository<Quiz>;
      attempts: Repository<QuizAttempt>;
      assignments: Repository<Assignment>;
      submissions: Repository<Submission>;
    },
    options: LearningOptions = {},
  ) {
    this.courses = repos.courses;
    this.lessons = repos.lessons;
    this.enrollments = repos.enrollments;
    this.quizzes = repos.quizzes;
    this.attempts = repos.attempts;
    this.assignments = repos.assignments;
    this.submissions = repos.submissions;
    this.options = options;
    this.clock = options.clock ?? (() => new Date());
  }

  createCourse(actor: Account, input: {
    title: string;
    description?: string;
    prerequisiteCourseId?: string | null;
  }): Course {
    requireRole(actor, ["educator", "admin"]);
    if (!input.title?.trim()) throw new Error("a course needs a title");
    const at = nowIso(this.clock);
    const course: Course = {
      id: newId("crs"),
      slug: this.uniqueSlug(input.title),
      title: input.title.trim(),
      description: input.description ?? "",
      educatorId: actor.id,
      status: "draft",
      prerequisiteCourseId: input.prerequisiteCourseId ?? null,
      createdAt: at,
      updatedAt: at,
    };
    this.courses.put(course);
    this.record("learning.course_created", actor.id, course.id, { title: course.title });
    return structuredClone(course);
  }

  addLesson(actor: Account, courseId: string, input: {
    title: string;
    body?: string;
    module?: string;
    durationMinutes?: number;
  }): Lesson {
    const course = this.requireOwnedCourse(actor, courseId);
    if (!input.title?.trim()) throw new Error("a lesson needs a title");
    const duration = input.durationMinutes ?? 10;
    if (!Number.isSafeInteger(duration) || duration <= 0) throw new Error("lesson duration must be a positive integer");
    const existing = this.lessons.all().filter((lesson) => lesson.courseId === course.id);
    const lesson: Lesson = {
      id: newId("lsn"),
      courseId: course.id,
      module: (input.module ?? "Module 1").trim() || "Module 1",
      title: input.title.trim(),
      body: input.body ?? "",
      order: existing.length + 1,
      durationMinutes: duration,
    };
    this.lessons.put(lesson);
    this.record("learning.lesson_added", actor.id, lesson.id, { courseId: course.id });
    return structuredClone(lesson);
  }

  publishCourse(actor: Account, courseId: string): Course {
    const course = this.requireOwnedCourse(actor, courseId);
    if (this.lessons.all().filter((lesson) => lesson.courseId === course.id).length === 0) {
      throw new Error("a course needs at least one lesson before it can be published");
    }
    course.status = "published";
    course.updatedAt = nowIso(this.clock);
    this.courses.put(course);
    this.record("learning.course_published", actor.id, course.id, {});
    return structuredClone(course);
  }

  listCourses(filter: { includeDrafts?: boolean } = {}): Course[] {
    return this.courses
      .all()
      .filter((course) => filter.includeDrafts === true || course.status === "published")
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((course) => structuredClone(course));
  }

  courseLessons(courseId: string): Lesson[] {
    return this.lessons
      .all()
      .filter((lesson) => lesson.courseId === courseId)
      .sort((a, b) => a.order - b.order)
      .map((lesson) => structuredClone(lesson));
  }

  enroll(learner: Account, courseId: string): Enrollment {
    const course = this.requireCourse(courseId);
    if (course.status !== "published") throw new Error("only a published course can be enrolled in");
    const existing = this.enrollments
      .all()
      .find((enrollment) => enrollment.courseId === courseId && enrollment.learnerId === learner.id);
    if (existing) return structuredClone(existing);
    if (course.prerequisiteCourseId) {
      const prerequisite = this.enrollments
        .all()
        .find(
          (enrollment) =>
            enrollment.courseId === course.prerequisiteCourseId &&
            enrollment.learnerId === learner.id &&
            enrollment.status === "completed",
        );
      if (!prerequisite) throw new Error("the prerequisite course has not been completed");
    }
    const at = nowIso(this.clock);
    const enrollment: Enrollment = {
      id: newId("enr"),
      courseId,
      learnerId: learner.id,
      status: "active",
      completedLessonIds: [],
      enrolledAt: at,
      completedAt: null,
    };
    this.enrollments.put(enrollment);
    this.options.entitlements?.grant({
      accountId: learner.id,
      entitlement: entitlementFor(courseId),
      source: `enrollment:${enrollment.id}`,
    });
    this.options.notifications?.notify(learner.id, "Enrolled", `You are enrolled in ${course.title}.`, {
      kind: "learning",
      data: { courseId, enrollmentId: enrollment.id },
    });
    this.record("learning.enrolled", learner.id, enrollment.id, { courseId });
    return structuredClone(enrollment);
  }

  completeLesson(learner: Account, enrollmentId: string, lessonId: string): Enrollment {
    const enrollment = this.requireEnrollment(enrollmentId);
    if (enrollment.learnerId !== learner.id) throw new Error("this enrollment belongs to another learner");
    const lesson = this.lessons.get(lessonId);
    if (!lesson || lesson.courseId !== enrollment.courseId) {
      throw new Error("the lesson does not belong to this course");
    }
    if (!enrollment.completedLessonIds.includes(lessonId)) {
      enrollment.completedLessonIds.push(lessonId);
    }
    const all = this.courseLessons(enrollment.courseId);
    if (all.every((candidate) => enrollment.completedLessonIds.includes(candidate.id))) {
      if (enrollment.status !== "completed") {
        enrollment.status = "completed";
        enrollment.completedAt = nowIso(this.clock);
        this.options.entitlements?.grant({
          accountId: learner.id,
          entitlement: certificateFor(enrollment.courseId),
          source: `enrollment:${enrollment.id}`,
        });
        this.options.notifications?.notify(learner.id, "Course complete", "Your certificate is available.", {
          kind: "learning",
          data: { courseId: enrollment.courseId },
        });
        this.record("learning.course_completed", learner.id, enrollment.id, { courseId: enrollment.courseId });
      }
    }
    this.enrollments.put(enrollment);
    this.record("learning.lesson_completed", learner.id, enrollmentId, { lessonId });
    return structuredClone(enrollment);
  }

  progress(enrollmentId: string): { completed: number; total: number; percent: number } {
    const enrollment = this.requireEnrollment(enrollmentId);
    const total = this.courseLessons(enrollment.courseId).length;
    const completed = enrollment.completedLessonIds.length;
    return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
  }

  enrollmentsFor(learnerId: string): Enrollment[] {
    return this.enrollments
      .all()
      .filter((enrollment) => enrollment.learnerId === learnerId)
      .map((enrollment) => structuredClone(enrollment));
  }

  createQuiz(actor: Account, courseId: string, input: {
    title: string;
    passingPercent?: number;
    questions: Array<{ prompt: string; options: string[]; correctIndex: number; points?: number }>;
  }): Quiz {
    const course = this.requireOwnedCourse(actor, courseId);
    if (!input.title?.trim()) throw new Error("a quiz needs a title");
    if (input.questions.length === 0) throw new Error("a quiz needs at least one question");
    const passing = input.passingPercent ?? 70;
    if (passing < 0 || passing > 100) throw new Error("passing percent must be between 0 and 100");
    const questions: QuizQuestion[] = input.questions.map((question, index) => {
      if (question.options.length < 2) throw new Error(`question ${index + 1} needs at least two options`);
      if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
        throw new Error(`question ${index + 1} has an invalid correct answer`);
      }
      return {
        id: newId("qst"),
        prompt: question.prompt,
        options: [...question.options],
        correctIndex: question.correctIndex,
        points: question.points ?? 1,
      };
    });
    const quiz: Quiz = { id: newId("qiz"), courseId: course.id, title: input.title.trim(), questions, passingPercent: passing };
    this.quizzes.put(quiz);
    this.record("learning.quiz_created", actor.id, quiz.id, { courseId: course.id });
    return structuredClone(quiz);
  }

  submitQuiz(learner: Account, quizId: string, answers: number[]): QuizAttempt {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) throw new Error(`no quiz: ${quizId}`);
    const enrollment = this.enrollments
      .all()
      .find((candidate) => candidate.courseId === quiz.courseId && candidate.learnerId === learner.id);
    if (!enrollment) throw new Error("enrol in the course before taking its quiz");
    if (answers.length !== quiz.questions.length) throw new Error("answer every question");
    let score = 0;
    let maximum = 0;
    quiz.questions.forEach((question, index) => {
      maximum += question.points;
      if (answers[index] === question.correctIndex) score += question.points;
    });
    const percent = maximum === 0 ? 0 : (score / maximum) * 100;
    const attempt: QuizAttempt = {
      id: newId("att"),
      quizId,
      learnerId: learner.id,
      answers: [...answers],
      score,
      maximum,
      passed: percent >= quiz.passingPercent,
      at: nowIso(this.clock),
    };
    this.attempts.put(attempt);
    this.record("learning.quiz_attempted", learner.id, attempt.id, { quizId, score, maximum, passed: attempt.passed });
    return structuredClone(attempt);
  }

  createAssignment(actor: Account, courseId: string, input: {
    title: string;
    instructions?: string;
    points?: number;
    dueAt?: string | null;
  }): Assignment {
    const course = this.requireOwnedCourse(actor, courseId);
    if (!input.title?.trim()) throw new Error("an assignment needs a title");
    const points = input.points ?? 100;
    if (!Number.isSafeInteger(points) || points <= 0) throw new Error("assignment points must be a positive integer");
    if (input.dueAt && Number.isNaN(Date.parse(input.dueAt))) throw new Error(`invalid due date: ${input.dueAt}`);
    const assignment: Assignment = {
      id: newId("asg"),
      courseId: course.id,
      title: input.title.trim(),
      instructions: input.instructions ?? "",
      points,
      dueAt: input.dueAt ?? null,
    };
    this.assignments.put(assignment);
    this.record("learning.assignment_created", actor.id, assignment.id, { courseId: course.id });
    return structuredClone(assignment);
  }

  submitAssignment(learner: Account, assignmentId: string, content: string): Submission {
    const assignment = this.requireAssignment(assignmentId);
    const enrollment = this.enrollments
      .all()
      .find((candidate) => candidate.courseId === assignment.courseId && candidate.learnerId === learner.id);
    if (!enrollment) throw new Error("enrol in the course before submitting its assignment");
    if (!content.trim()) throw new Error("a submission cannot be empty");
    const existing = this.submissions
      .all()
      .find((submission) => submission.assignmentId === assignmentId && submission.learnerId === learner.id);
    if (existing?.status === "graded") throw new Error("a graded submission cannot be replaced");
    const at = nowIso(this.clock);
    const submission: Submission = {
      id: existing?.id ?? newId("sub"),
      assignmentId,
      learnerId: learner.id,
      content,
      status: "submitted",
      grade: null,
      feedback: "",
      gradedBy: null,
      submittedAt: at,
      gradedAt: null,
    };
    this.submissions.put(submission);
    this.record("learning.assignment_submitted", learner.id, submission.id, { assignmentId });
    return structuredClone(submission);
  }

  gradeSubmission(actor: Account, submissionId: string, grade: number, feedback: string): Submission {
    const submission = this.submissions.get(submissionId);
    if (!submission) throw new Error(`no submission: ${submissionId}`);
    const assignment = this.requireAssignment(submission.assignmentId);
    this.requireOwnedCourse(actor, assignment.courseId);
    if (!Number.isFinite(grade) || grade < 0 || grade > assignment.points) {
      throw new Error(`grade must be between 0 and ${assignment.points}`);
    }
    submission.status = "graded";
    submission.grade = grade;
    submission.feedback = feedback;
    submission.gradedBy = actor.id;
    submission.gradedAt = nowIso(this.clock);
    this.submissions.put(submission);
    this.options.notifications?.notify(submission.learnerId, "Assignment graded", `${assignment.title}: ${grade}/${assignment.points}.`, {
      kind: "learning",
      data: { submissionId, assignmentId: assignment.id, grade },
    });
    this.record("learning.assignment_graded", actor.id, submission.id, { grade, points: assignment.points });
    return structuredClone(submission);
  }

  submissionsFor(assignmentId: string): Submission[] {
    return this.submissions
      .all()
      .filter((submission) => submission.assignmentId === assignmentId)
      .map((submission) => structuredClone(submission));
  }

  private requireCourse(courseId: string): Course {
    const course = this.courses.get(courseId);
    if (!course) throw new Error(`no course: ${courseId}`);
    return structuredClone(course);
  }

  private requireOwnedCourse(actor: Account, courseId: string): Course {
    requireRole(actor, ["educator", "admin"]);
    const course = this.requireCourse(courseId);
    if (course.educatorId !== actor.id && !actor.roles.includes("admin")) {
      throw new Error("only the course educator may change this course");
    }
    return course;
  }

  private requireEnrollment(enrollmentId: string): Enrollment {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) throw new Error(`no enrollment: ${enrollmentId}`);
    return structuredClone(enrollment);
  }

  private requireAssignment(assignmentId: string): Assignment {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) throw new Error(`no assignment: ${assignmentId}`);
    return structuredClone(assignment);
  }

  private uniqueSlug(title: string): string {
    const base = slugify(title) || "course";
    let candidate = base;
    let suffix = 2;
    while (this.courses.all().some((course) => course.slug === candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private record(type: string, actor: string, subject: string, data: Record<string, unknown>): void {
    this.options.ledger?.append({ type, actor, subject, data });
  }
}
