import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Dashboard {
  id: string;
  name: string;
  widgets: string[];
}

export interface Report {
  id: string;
  name: string;
  format: "pdf" | "csv" | "json";
}

export interface AnalyticsOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Analytics {
  private readonly dashboards = new Map<string, Dashboard>();
  private readonly reports = new Map<string, Report>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: AnalyticsOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createDashboard(name: string, widgets: string[]): Dashboard {
    const dashboard: Dashboard = { id: newId("dashboard"), name, widgets };
    this.dashboards.set(dashboard.id, dashboard);
    this.ledger.append({ type: "analytics.dashboard.created", actor: "analytics", subject: dashboard.id });
    return dashboard;
  }

  createReport(name: string, format: Report["format"]): Report {
    const report: Report = { id: newId("report"), name, format };
    this.reports.set(report.id, report);
    this.ledger.append({ type: "analytics.report.created", actor: "analytics", subject: report.id });
    return report;
  }

  listDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values());
  }

  listReports(): Report[] {
    return Array.from(this.reports.values());
  }
}
