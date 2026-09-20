// RigService proxy (P10). No hardware is probed here; all reads report
// empty defaults until the real hardware provider lands.
export type RigState = any;
export type HardwareComponent = any;
export type ComponentType = string;
export const componentDatabase: any[] = [];

export const rigService = {
  getRig(): RigState {
    return {};
  },
  calculateStats(_rig: RigState): any {
    return {};
  },
  validateRig(_rig: RigState): any {
    return { ok: false, reason: "backend unreachable" };
  },
  resetToDefault(): void {},
  updatePart(_type: any, _part: any, _action: any): void {},
  rigState$: {
    subscribe(_fn: (state: any) => void): { unsubscribe(): void } {
      return { unsubscribe() {} };
    },
  },
};
