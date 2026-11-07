import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Repository {
  id: string;
  name: string;
  url: string;
  branch: string;
}

export interface Commit {
  id: string;
  repositoryId: string;
  message: string;
  author: string;
}

export interface SourceOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Source {
  private readonly repositories = new Map<string, Repository>();
  private readonly commits = new Map<string, Commit>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: SourceOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addRepository(name: string, url: string, branch: string): Repository {
    const repository: Repository = { id: newId("repository"), name, url, branch };
    this.repositories.set(repository.id, repository);
    this.ledger.append({ type: "source.repo.added", actor: "source", subject: repository.id });
    return repository;
  }

  commit(repositoryId: string, message: string, author: string): Commit {
    const commit: Commit = { id: newId("commit"), repositoryId, message, author };
    this.commits.set(commit.id, commit);
    this.ledger.append({ type: "source.commit", actor: "source", subject: commit.id });
    return commit;
  }

  listRepositories(): Repository[] {
    return Array.from(this.repositories.values());
  }
}
