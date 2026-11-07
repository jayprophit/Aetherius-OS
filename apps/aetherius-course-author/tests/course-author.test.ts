import { describe, it } from "node:test";
import assert from "node:assert";
import { CourseAuthor } from "../src/domain.ts";

describe("CourseAuthor", () => {
  it("creates and lists lessons", () => {
    const author = new CourseAuthor();
    const lesson = author.createLesson("Intro", 5, true);
    assert.equal(lesson.quiz, true);
    assert.equal(author.list().length, 1);
  });
});
