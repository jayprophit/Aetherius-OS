/**
 * Reminders
 *
 * Aetherius reminders with lists, due dates, location triggers and subtasks.
 *
 * This is a scaffold. Replace the placeholder with the real domain logic.
 */

export const RemindersVersion = "0.1.0";

export interface RemindersState {
  initialized: boolean;
}

export function createReminders(): RemindersState {
  return { initialized: true };
}
