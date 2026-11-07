import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Project {
  id: string;
  name: string;
  language: string;
  files: string[];
}

export interface IDEOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class IDE {
  private readonly projects = new Map<string, Project>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: IDEOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  openProject(name: string, language: string, files: string[] = []): Project {
    const project: Project = { id: newId("project"), name, language, files };
    this.projects.set(project.id, project);
    this.ledger.append({ type: "ide.opened", actor: "ide", subject: project.id });
    return project;
  }

  listProjects(): Project[] {
    return Array.from(this.projects.values());
  }
}
