export class MonitorService {
  getState() { return { processes: [], metrics: [], updatedAt: new Date().toISOString() }; }
  persist() {}
  recordMetric(m: any): string { return m.id || "m-" + Date.now(); }
}
export const monitorService = new MonitorService();
