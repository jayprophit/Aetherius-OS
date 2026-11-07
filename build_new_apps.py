import json
from pathlib import Path

root = Path(".")
apps_dir = root / "apps" / "aetherius-app-suite" / "src"
components = [
    "browser.ts",
    "calculator.ts",
    "calendar.ts",
    "clock.ts",
    "contacts.ts",
    "files.ts",
    "mail.ts",
    "media.ts",
    "notes.ts",
    "office.ts",
    "paint.ts",
    "photos.ts",
    "tasks.ts",
    "terminal.ts",
    # New core 6 reference apps
    "writer.ts",
    "sheets.ts",
    "slides.ts",
    "canvas.ts",
    "journal.ts",
    "recorder.ts",
]

# Create component files
for comp in components:
    path = apps_dir / comp
    if not path.exists():
        class_name = comp.replace(".ts", "").replace("-", "_").replace(" ", "")
        class_name = "".join(w.capitalize() for w in class_name.split("_"))
        template = f"""/**
 * Aetherius OS Application Slice: {comp.replace('.ts', '')}
 *
 * Status: scaffolded - domain core only.
 * Next steps: real domain model, persistence via app-kit store, UI adapters per host,
 * accessibility, data export/restore, crash recovery.
 */

export class {class_name} {{
  readonly id = "{comp.replace('.ts', '')}";
  readonly version = "0.0.0";

  async init(): Promise<void> {{
    return undefined;
  }}

  async create(data: unknown): Promise<unknown> {{
    throw new Error("{comp}: not implemented");
  }}

  async read(id: string): Promise<unknown> {{
    throw new Error("{comp}: not implemented");
  }}

  async update(id: string, data: unknown): Promise<unknown> {{
    throw new Error("{comp}: not implemented");
  }}

  async delete(id: string): Promise<boolean> {{
    throw new Error("{comp}: not implemented");
  }}
}}
"""
        path.write_text(template, encoding="utf-8")
        print(f"Created {path}")

# Create test files for new apps
tests_dir = root / "apps" / "aetherius-app-suite" / "tests"
tests_dir.mkdir(parents=True, exist_ok=True)

test_components = [
    "notes", "calculator", "files", "writer", "sheets", "slides",
    "canvas", "journal", "recorder",
]

for comp in test_components:
    test_path = tests_dir / f"{comp}.test.ts"
    if not test_path.exists():
        cls = comp.replace("-", "_").replace(" ", "")
        cls = "".join(w.capitalize() for w in cls.split("_"))
        template = f"""import {{ test }} from "node:test";
import assert from "node:assert/strict";
import {{ {cls} }} from "../src/{comp}.ts";

test("basic {comp} functionality", () => {{
  const app = new {cls}();
  assert.strictEqual(app.id, "{comp}");
  assert.strictEqual(typeof app.create, "function");
  assert.strictEqual(typeof app.read, "function");
  assert.strictEqual(typeof app.update, "function");
  assert.strictEqual(typeof app.delete, "function");
}});
"""
        test_path.write_text(template, encoding="utf-8")
        print(f"Created {test_path}")

print("Setup complete.")