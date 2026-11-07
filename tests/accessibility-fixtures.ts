/** Accessibility Audit Fixtures — keyboard / screen reader / high-contrast test definitions. Added. */
export interface AccessibilityFixture {
  id: string; domain: string; standard: string; criteria: string; verified: boolean;
}

export const accessibilityFixtures: AccessibilityFixture[] = [
  { id: "acc-key-nav", domain: "Core Apps", standard: "WCAG 2.1 AA", criteria: "All interactive elements keyboard-accessible", verified: false },
  { id: "acc-screen-reader", domain: "File Explorer / Notes / Settings", standard: "ARIA / VoiceOver / TalkBack", criteria: "Screen reader announces labels and state changes", verified: false },
  { id: "acc-high-contrast", domain: "UI / Themes", standard: "High contrast / color blind", criteria: "Text readable at 4.5:1; icons distinguishable", verified: false },
  { id: "acc-cognitive", domain: "Forms / Settings", standard: "Cognitive accessibility", criteria: "Clear labels; error messages; recovery paths", verified: false },
];
