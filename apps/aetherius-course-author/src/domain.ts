import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Lesson {
  id: string;
  title: string;
  slides: number;
  quiz: boolean;
}

export interface CourseAuthorOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class CourseAuthor {
  private readonly lessons = new Map<string, Lesson>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: CourseAuthorOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createLesson(title: string, slides: number, quiz: boolean): Lesson {
    const lesson: Lesson = { id: newId("lesson"), title, slides, quiz };
    this.lessons.set(lesson.id, lesson);
    this.ledger.append({ type: "course-author.created", actor: "course-author", subject: lesson.id });
    return lesson;
  }

  list(): Lesson[] {
    return Array.from(this.lessons.values());
  }
}
