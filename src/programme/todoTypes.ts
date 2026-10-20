/**
 * The shape of a todo record, as authored in docs/PROJECT-TODOS.yaml.
 *
 * Kept in its own module so the renderer and the validator agree on the
 * shape without either importing the other.
 */

export interface TodoSource {
  /**
   * Where the task came from. `build-audit` means the task is a statement
   * that a project is broken, and the project's build manifest has to say
   * so too. Everything else is programme work rather than a build defect.
   */
  kind: string;
  /** The specific document, command or conversation the task came from. */
  ref?: string;
}

export interface Todo {
  id: string;
  title: string;
  /** The project that owns the task. */
  project: string;
  status: string;
  /** 1 is most urgent. 5 is recorded but not scheduled. */
  priority: number;
  source?: TodoSource;
  detail?: string;
  evidence?: string;
  /** How the task was resolved, once it was. */
  resolution?: string;
  depends_on?: string[];
  blocks?: string[];
  acceptance?: string[];
  notes?: string;
}
