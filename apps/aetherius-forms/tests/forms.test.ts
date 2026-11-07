import { describe, it } from "node:test";
import assert from "node:assert";
import { FormsService } from "../src/domain.ts";

describe("FormsService", () => {
  it("creates forms and submits responses", () => {
    const forms = new FormsService();
    const form = forms.createForm("Survey", [{ label: "Name", type: "text", required: true }]);
    const response = forms.submit(form.id, { Name: "Alice" });
    assert.equal(response.formId, form.id);
    assert.equal(response.values.Name, "Alice");
  });

  it("throws on missing form", () => {
    const forms = new FormsService();
    assert.throws(() => forms.submit("nonexistent", {}), /form not found/);
  });
});
