/**
 * The cross-OS app catalogue.
 *
 * This is the deployment and equivalence map for the first-party app suite. It
 * records which Aetherius app fills which default-app role on each operating
 * system, which apps are unique to one system, and which package formats and
 * signing gates apply. It does not claim that a package has been built or
 * signed; `maturity` says whether a tested domain core exists.
 */

export type OsFamily = "aetherius" | "microsoft" | "apple" | "linux" | "android" | "ios" | "google" | "other";

export type AppCategory =
  | "productivity"
  | "communication"
  | "media"
  | "system"
  | "creativity"
  | "internet"
  | "health"
  | "finance"
  | "education"
  | "developer"
  | "games";

export type PackageFormat =
  | "aetherius-pkg"
  | "msix"
  | "exe"
  | "dmg"
  | "pkg"
  | "deb"
  | "rpm"
  | "flatpak"
  | "snap"
  | "appimage"
  | "apk"
  | "aab"
  | "ipa"
  | "pwa"
  | "wasm";

export type Maturity = "CORE" | "PLANNED";

export interface OsApp {
  id: string;
  name: string;
  category: AppCategory;
  summary: string;
  coreModule: string | null;
  availability: OsFamily[];
  uniqueTo?: OsFamily;
  referenceApps: Partial<Record<OsFamily, string[]>>;
  packageFormats: PackageFormat[];
  maturity: Maturity;
  notes: string;
}

export interface DeploymentTarget {
  os: OsFamily;
  label: string;
  formats: PackageFormat[];
  signing: string;
  store: string;
  notes: string;
}

export interface DeploymentPlan {
  appId: string;
  os: OsFamily;
  formats: PackageFormat[];
  signing: string;
  store: string;
  blockers: string[];
  notes: string;
}

export const OS_FAMILIES: readonly OsFamily[] = [
  "aetherius",
  "microsoft",
  "apple",
  "linux",
  "android",
  "ios",
  "google",
  "other",
];

export const OS_LABELS: Record<OsFamily, string> = {
  aetherius: "Aetherius OS",
  microsoft: "Microsoft Windows",
  apple: "Apple macOS",
  linux: "Linux / Ubuntu",
  android: "Android",
  ios: "Apple iOS / iPadOS",
  google: "Google ChromeOS",
  other: "Other platforms",
};

const ALL: OsFamily[] = [...OS_FAMILIES];

export const DEPLOYMENT_TARGETS: Record<OsFamily, DeploymentTarget> = {
  aetherius: {
    os: "aetherius",
    label: "Aetherius OS",
    formats: ["aetherius-pkg", "pwa", "wasm"],
    signing: "Aetherius package signature and a hash-chained install journal.",
    store: "Aetherius Store",
    notes: "Native package is the target; PWA/WASM are compatibility routes.",
  },
  microsoft: {
    os: "microsoft",
    label: "Microsoft Windows",
    formats: ["msix", "exe"],
    signing: "Authenticode signature; MSIX store packages also need a trusted certificate.",
    store: "Microsoft Store or direct MSIX",
    notes: "MSIX is preferred; an EXE installer needs its own signing and uninstall path.",
  },
  apple: {
    os: "apple",
    label: "Apple macOS",
    formats: ["dmg", "pkg"],
    signing: "Developer ID signature and notarisation.",
    store: "Mac App Store or notarised direct distribution",
    notes: "Hardened runtime and notarisation are required for direct distribution.",
  },
  linux: {
    os: "linux",
    label: "Linux / Ubuntu",
    formats: ["deb", "rpm", "flatpak", "snap", "appimage"],
    signing: "Repository metadata signature; Flatpak/Snap have their own signing.",
    store: "Distribution repository, Flathub or Snap Store",
    notes: "Ship one native package per family; do not claim every format from one build.",
  },
  android: {
    os: "android",
    label: "Android",
    formats: ["apk", "aab"],
    signing: "Android App Bundle signing; Play App Signing for store distribution.",
    store: "Google Play or a managed enterprise store",
    notes: "AAB for Play; APK for direct or enterprise distribution.",
  },
  ios: {
    os: "ios",
    label: "Apple iOS / iPadOS",
    formats: ["ipa"],
    signing: "Apple Developer signing, provisioning profile and App Store review.",
    store: "App Store",
    notes: "No sideloading claim; enterprise distribution needs a separate programme.",
  },
  google: {
    os: "google",
    label: "Google ChromeOS",
    formats: ["pwa", "apk", "aab"],
    signing: "PWA HTTPS origin and service-worker integrity; Android packages use Android signing.",
    store: "Chrome Web Store, Google Play or managed policy",
    notes: "PWA is the primary route; Android packages are the fallback on managed devices.",
  },
  other: {
    os: "other",
    label: "Other platforms",
    formats: ["pwa", "wasm"],
    signing: "HTTPS origin integrity; WASM module hashing.",
    store: "Direct web distribution",
    notes: "Use the portable web/WASM route until a native target is chosen.",
  },
};

const CORE_APPS: OsApp[] = [
  {
    id: "notes",
    name: "Notes",
    category: "productivity",
    summary: "Text notes with tags, pinning, search and full revision history.",
    coreModule: "src/notes.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Notepad", "OneNote"],
      apple: ["Notes"],
      linux: ["Gedit", "Text Editor"],
      android: ["Google Keep"],
      ios: ["Notes"],
      google: ["Google Keep"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "Plain text and Markdown only; no rich-text or handwriting engine.",
  },
  {
    id: "calculator",
    name: "Calculator",
    category: "productivity",
    summary: "Expression calculator with precedence, functions and session history.",
    coreModule: "src/calculator.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Calculator"],
      apple: ["Calculator"],
      linux: ["GNOME Calculator"],
      android: ["Google Calculator"],
      ios: ["Calculator"],
      google: ["Calculator"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "No symbolic algebra, unit conversion or programmer modes yet.",
  },
  {
    id: "files",
    name: "Files",
    category: "system",
    summary: "Virtual filesystem with quota, move, copy, search and MIME routing.",
    coreModule: "src/files.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["File Explorer"],
      apple: ["Finder"],
      linux: ["Nautilus", "Dolphin"],
      android: ["Files by Google"],
      ios: ["Files"],
      google: ["Files"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "The host supplies the real storage adapter; the core is in-memory.",
  },
  {
    id: "calendar",
    name: "Calendar",
    category: "productivity",
    summary: "Events, recurrence, conflict detection and ICS export.",
    coreModule: "src/calendar.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Calendar"],
      apple: ["Calendar"],
      linux: ["GNOME Calendar"],
      android: ["Google Calendar"],
      ios: ["Calendar"],
      google: ["Google Calendar"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "No CalDAV sync; ICS import/export only.",
  },
  {
    id: "photos",
    name: "Photos",
    category: "media",
    summary: "Albums, content-hash deduplication and photo metadata.",
    coreModule: "src/photos.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Photos"],
      apple: ["Photos"],
      linux: ["Shotwell", "Pix"],
      android: ["Google Photos"],
      ios: ["Photos"],
      google: ["Google Photos"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "No image codec or face recognition; metadata and albums only.",
  },
  {
    id: "browser",
    name: "Browser",
    category: "internet",
    summary: "Tabs, bookmarks, blocklist and pagination extraction.",
    coreModule: "src/browser.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Microsoft Edge"],
      apple: ["Safari"],
      linux: ["Firefox", "Chromium"],
      android: ["Chrome"],
      ios: ["Safari"],
      google: ["Chrome"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "No live rendering engine; the host supplies a webview or driver.",
  },
  {
    id: "mail",
    name: "Mail",
    category: "communication",
    summary: "Accounts, folders, threads, drafts, send queue and attachment metadata.",
    coreModule: "src/mail.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Outlook"],
      apple: ["Mail"],
      linux: ["Thunderbird", "Evolution"],
      android: ["Gmail"],
      ios: ["Mail"],
      google: ["Gmail"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "No SMTP/IMAP transport; a host adapter supplies the network.",
  },
  {
    id: "contacts",
    name: "Contacts",
    category: "communication",
    summary: "Address book with groups, duplicate merging and vCard export.",
    coreModule: "src/contacts.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["People"],
      apple: ["Contacts"],
      linux: ["GNOME Contacts"],
      android: ["Contacts"],
      ios: ["Contacts"],
      google: ["Contacts"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "No CardDAV sync.",
  },
  {
    id: "clock",
    name: "Clock",
    category: "system",
    summary: "Alarms, timers, stopwatch and world clocks.",
    coreModule: "src/clock.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Clock"],
      apple: ["Clock"],
      linux: ["GNOME Clocks"],
      android: ["Clock"],
      ios: ["Clock"],
      google: ["Clock"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "No OS wake-up or audio; the host schedules and plays the alarm.",
  },
  {
    id: "tasks",
    name: "Tasks",
    category: "productivity",
    summary: "Lists, priorities, due dates, tags, search and recurrence.",
    coreModule: "src/tasks.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["To Do"],
      apple: ["Reminders"],
      linux: ["GNOME To Do"],
      android: ["Google Tasks"],
      ios: ["Reminders"],
      google: ["Google Tasks"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "No notification delivery.",
  },
  {
    id: "music",
    name: "Music",
    category: "media",
    summary: "Library, playlists, queue, playback state and deterministic shuffle.",
    coreModule: "src/media.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Media Player"],
      apple: ["Music"],
      linux: ["Rhythmbox", "Lollypop"],
      android: ["YouTube Music"],
      ios: ["Music"],
      google: ["YouTube Music"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "No codec, DRM or streaming service.",
  },
  {
    id: "video",
    name: "Video",
    category: "media",
    summary: "Video library, trim ranges and subtitle cues.",
    coreModule: "src/media.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Films & TV"],
      apple: ["TV"],
      linux: ["Totem", "VLC"],
      android: ["Google TV"],
      ios: ["TV"],
      google: ["Google TV"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "No codec or player; metadata and subtitle lookup only.",
  },
  {
    id: "terminal",
    name: "Terminal",
    category: "developer",
    summary: "Allowlisted command interpreter over the virtual filesystem.",
    coreModule: "src/terminal.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Windows Terminal", "PowerShell"],
      apple: ["Terminal"],
      linux: ["GNOME Terminal", "Konsole"],
      android: ["Termux"],
      ios: ["a-Shell"],
      google: ["Linux terminal"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "Not a host shell; no process spawning, pipes or redirection.",
  },
  {
    id: "paint",
    name: "Paint",
    category: "creativity",
    summary: "Layers, vector shapes, undo/redo and SVG export.",
    coreModule: "src/paint.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Paint"],
      apple: ["Preview", "Freeform"],
      linux: ["GIMP", "Inkscape"],
      android: ["Google Canvas"],
      ios: ["Freeform"],
      google: ["Canvas"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "Vector document only; no raster brush engine.",
  },
  {
    id: "writer",
    name: "Writer",
    category: "productivity",
    summary: "Block-based document model with Markdown export and word count.",
    coreModule: "src/office.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Word"],
      apple: ["Pages"],
      linux: ["LibreOffice Writer"],
      android: ["Google Docs"],
      ios: ["Pages"],
      google: ["Google Docs"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "No DOCX/ODT adapter yet; Markdown is the verified export.",
  },
  {
    id: "sheets",
    name: "Sheets",
    category: "productivity",
    summary: "Cells, formulas, ranges, CSV export and circular-reference detection.",
    coreModule: "src/office.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Excel"],
      apple: ["Numbers"],
      linux: ["LibreOffice Calc"],
      android: ["Google Sheets"],
      ios: ["Numbers"],
      google: ["Google Sheets"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "A small formula subset; not a full Excel-compatible engine.",
  },
  {
    id: "slides",
    name: "Slides",
    category: "productivity",
    summary: "Slide deck model with elements, notes, reorder and outline export.",
    coreModule: "src/office.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["PowerPoint"],
      apple: ["Keynote"],
      linux: ["LibreOffice Impress"],
      android: ["Google Slides"],
      ios: ["Keynote"],
      google: ["Google Slides"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "No PPTX adapter or renderer yet; outline is the verified export.",
  },
  {
    id: "settings",
    name: "Settings",
    category: "system",
    summary: "Layered settings, locks, presets, export/import and default-app routing.",
    coreModule: "../aetherius-desktop/src/desktop.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Settings"],
      apple: ["System Settings"],
      linux: ["GNOME Settings"],
      android: ["Settings"],
      ios: ["Settings"],
      google: ["Settings"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "Settings model and installer plans; native preference panes are host work.",
  },
  {
    id: "store",
    name: "Store",
    category: "system",
    summary: "Signed catalogue, semver resolution, permissions, install/rollback.",
    coreModule: "../aetherius-store/src/store.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Microsoft Store"],
      apple: ["App Store"],
      linux: ["GNOME Software", "Snap Store"],
      android: ["Google Play"],
      ios: ["App Store"],
      google: ["Chrome Web Store", "Google Play"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "No live catalogue or payment processor; the store core is local.",
  },
  {
    id: "messages",
    name: "Messages",
    category: "communication",
    summary: "Encrypted storage, membership, presence and notification model.",
    coreModule: "../Decentralized Messaging App/src/messaging.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Phone Link"],
      apple: ["Messages"],
      linux: ["Signal Desktop"],
      android: ["Messages"],
      ios: ["Messages"],
      google: ["Messages"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "No WebRTC media plane or federated transport.",
  },
  {
    id: "health",
    name: "Health",
    category: "health",
    summary: "Exercise library, plans, activity, goals, recovery and privacy controls.",
    coreModule: "../aetherius-athena-health/src/athenaHealth.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Health"],
      apple: ["Health"],
      linux: ["GNOME Health"],
      android: ["Health Connect"],
      ios: ["Health"],
      google: ["Fit"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "Product app; not a medical device and not clinical advice.",
  },
  {
    id: "finance",
    name: "Finance",
    category: "finance",
    summary: "Double-entry ledger, invoices, tax, budgets and reconciliation.",
    coreModule: "../sovereign-financial-os/src/finance.ts",
    availability: ALL,
    referenceApps: {
      microsoft: ["Money"],
      apple: ["Numbers finance templates"],
      linux: ["GnuCash"],
      android: ["Google Finance"],
      ios: ["Wallet"],
      google: ["Google Finance"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "CORE",
    notes: "Local ledger; no bank connection or live market data.",
  },
  {
    id: "camera",
    name: "Camera",
    category: "media",
    summary: "Capture metadata, modes and photo/video handoff.",
    coreModule: null,
    availability: ALL,
    referenceApps: {
      microsoft: ["Camera"],
      apple: ["Photo Booth"],
      linux: ["Cheese"],
      android: ["Camera"],
      ios: ["Camera"],
      google: ["Camera"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "PLANNED",
    notes: "No camera driver or capture pipeline yet.",
  },
  {
    id: "maps",
    name: "Maps",
    category: "internet",
    summary: "Places, favourites, offline packs and route planning over supplied data.",
    coreModule: null,
    availability: ALL,
    referenceApps: {
      microsoft: ["Maps"],
      apple: ["Maps"],
      linux: ["GNOME Maps"],
      android: ["Google Maps"],
      ios: ["Maps"],
      google: ["Google Maps"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "PLANNED",
    notes: "No geodata or live traffic; a data adapter is required.",
  },
  {
    id: "weather",
    name: "Weather",
    category: "internet",
    summary: "Forecast model over caller-supplied observations, units and alerts.",
    coreModule: null,
    availability: ALL,
    referenceApps: {
      microsoft: ["Weather"],
      apple: ["Weather"],
      linux: ["GNOME Weather"],
      android: ["Google Weather"],
      ios: ["Weather"],
      google: ["Google Weather"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "PLANNED",
    notes: "No weather provider; the host supplies observations.",
  },
  {
    id: "archive",
    name: "Archive Manager",
    category: "system",
    summary: "Archive listing and extraction metadata.",
    coreModule: null,
    availability: ALL,
    referenceApps: {
      microsoft: ["File Explorer compression"],
      apple: ["Archive Utility"],
      linux: ["File Roller"],
      android: ["Files by Google"],
      ios: ["Files"],
      google: ["Files"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "PLANNED",
    notes: "No zip/tar codec yet.",
  },
  {
    id: "system-monitor",
    name: "System Monitor",
    category: "system",
    summary: "Metric samples, thresholds and alert state.",
    coreModule: null,
    availability: ALL,
    referenceApps: {
      microsoft: ["Task Manager"],
      apple: ["Activity Monitor"],
      linux: ["GNOME System Monitor"],
      android: ["Device Care"],
      ios: ["Settings battery"],
      google: ["Diagnostics"],
    },
    packageFormats: ["aetherius-pkg", "msix", "dmg", "deb", "flatpak", "apk", "ipa", "pwa"],
    maturity: "PLANNED",
    notes: "No host telemetry collector yet.",
  },
];

const UNIQUE_APPS: OsApp[] = [
  {
    id: "genesis-console",
    name: "Genesis Console",
    category: "developer",
    summary: "Agent orchestration, memory and tool routing for the Genesis organism.",
    coreModule: "../Athena/src/athena.ts",
    availability: ["aetherius"],
    uniqueTo: "aetherius",
    referenceApps: {},
    packageFormats: ["aetherius-pkg", "pwa"],
    maturity: "CORE",
    notes: "Aetherius-only: the console is the local control surface for Genesis.",
  },
  {
    id: "agent-bridge",
    name: "Agent Bridge",
    category: "system",
    summary: "Scoped grants, browser/file/app control and a journaled bridge.",
    coreModule: "../aetherius-crossplatform/src/bridge.ts",
    availability: ["aetherius"],
    uniqueTo: "aetherius",
    referenceApps: {},
    packageFormats: ["aetherius-pkg", "pwa"],
    maturity: "CORE",
    notes: "Host-neutral policy layer; live drivers are host work.",
  },
  {
    id: "aetherius-store",
    name: "Aetherius Store",
    category: "system",
    summary: "First-party storefront with signed packages and entitlements.",
    coreModule: "../aetherius-store/src/store.ts",
    availability: ["aetherius"],
    uniqueTo: "aetherius",
    referenceApps: {},
    packageFormats: ["aetherius-pkg", "pwa"],
    maturity: "CORE",
    notes: "Aetherius-only distribution channel.",
  },
  {
    id: "athena-health",
    name: "Athena Health",
    category: "health",
    summary: "The Athena exercise, recovery and wellbeing product.",
    coreModule: "../aetherius-athena-health/src/athenaHealth.ts",
    availability: ["aetherius"],
    uniqueTo: "aetherius",
    referenceApps: {},
    packageFormats: ["aetherius-pkg", "pwa"],
    maturity: "CORE",
    notes: "Aetherius-only product surface; not a medical device.",
  },
  {
    id: "food-wiki",
    name: "Food Wiki",
    category: "education",
    summary: "Food taxonomy, locations, recipes, photo suggestions and Rife library.",
    coreModule: "../aetherius-food-wiki/src/foodWiki.ts",
    availability: ["aetherius"],
    uniqueTo: "aetherius",
    referenceApps: {},
    packageFormats: ["aetherius-pkg", "pwa"],
    maturity: "CORE",
    notes: "Photo suggestions use caller-supplied labels; no vision model.",
  },
  {
    id: "quantum-assistant",
    name: "Quantum Assistant",
    category: "developer",
    summary: "State-vector simulator, deterministic sampling and tool registry.",
    coreModule: "../quantum-ai-assistant/src/quantumAssistant.ts",
    availability: ["aetherius"],
    uniqueTo: "aetherius",
    referenceApps: {},
    packageFormats: ["aetherius-pkg", "pwa"],
    maturity: "CORE",
    notes: "Simulation only; no quantum hardware.",
  },
  {
    id: "sovereign-finance",
    name: "Sovereign Finance",
    category: "finance",
    summary: "Double-entry ledger, invoices, tax and reconciliation.",
    coreModule: "../sovereign-financial-os/src/finance.ts",
    availability: ["aetherius"],
    uniqueTo: "aetherius",
    referenceApps: {},
    packageFormats: ["aetherius-pkg", "pwa"],
    maturity: "CORE",
    notes: "Aetherius-only finance surface.",
  },
  {
    id: "poietek",
    name: "Poietek",
    category: "creativity",
    summary: "Creative production surface over the native audio engine.",
    coreModule: "../Poietek/src/index.ts",
    availability: ["aetherius"],
    uniqueTo: "aetherius",
    referenceApps: {},
    packageFormats: ["aetherius-pkg", "pwa"],
    maturity: "PLANNED",
    notes: "The existing Poietek build is a Tauri desktop app; this catalogue entry is a target.",
  },
  {
    id: "system-console",
    name: "System Console",
    category: "system",
    summary: "Windows-style process, service and startup control surface.",
    coreModule: null,
    availability: ["microsoft"],
    uniqueTo: "microsoft",
    referenceApps: { microsoft: ["Task Manager", "Services", "Registry Editor"] },
    packageFormats: ["msix", "exe"],
    maturity: "PLANNED",
    notes: "OS-specific: needs a privileged Windows host adapter.",
  },
  {
    id: "spotlight-search",
    name: "Spotlight Search",
    category: "system",
    summary: "macOS-style universal search across files, apps and actions.",
    coreModule: null,
    availability: ["apple"],
    uniqueTo: "apple",
    referenceApps: { apple: ["Spotlight"] },
    packageFormats: ["dmg", "pkg"],
    maturity: "PLANNED",
    notes: "OS-specific: needs macOS indexing adapters.",
  },
  {
    id: "time-machine",
    name: "Time Machine",
    category: "system",
    summary: "Snapshot and restore model for macOS-style backups.",
    coreModule: null,
    availability: ["apple"],
    uniqueTo: "apple",
    referenceApps: { apple: ["Time Machine"] },
    packageFormats: ["dmg", "pkg"],
    maturity: "PLANNED",
    notes: "OS-specific: no snapshot driver yet.",
  },
  {
    id: "shortcuts-automation",
    name: "Shortcuts",
    category: "system",
    summary: "Visual automation recipes with triggers and actions.",
    coreModule: null,
    availability: ["apple", "ios"],
    uniqueTo: "apple",
    referenceApps: { apple: ["Shortcuts"], ios: ["Shortcuts"] },
    packageFormats: ["dmg", "pkg", "ipa"],
    maturity: "PLANNED",
    notes: "The model spans macOS and iOS; the host supplies the trigger runtime.",
  },
  {
    id: "wallet",
    name: "Wallet",
    category: "finance",
    summary: "Cards, passes and transaction history with local privacy controls.",
    coreModule: null,
    availability: ["ios"],
    uniqueTo: "ios",
    referenceApps: { ios: ["Wallet"] },
    packageFormats: ["ipa"],
    maturity: "PLANNED",
    notes: "OS-specific: needs Secure Enclave and NFC adapters.",
  },
  {
    id: "facetime",
    name: "FaceTime",
    category: "communication",
    summary: "Call signalling and media session model.",
    coreModule: null,
    availability: ["apple", "ios"],
    uniqueTo: "apple",
    referenceApps: { apple: ["FaceTime"], ios: ["FaceTime"] },
    packageFormats: ["dmg", "pkg", "ipa"],
    maturity: "PLANNED",
    notes: "OS-specific: no WebRTC media plane or Apple signalling.",
  },
  {
    id: "find-my",
    name: "Find My",
    category: "system",
    summary: "Device and item location model with consent controls.",
    coreModule: null,
    availability: ["apple", "ios"],
    uniqueTo: "apple",
    referenceApps: { apple: ["Find My"], ios: ["Find My"] },
    packageFormats: ["dmg", "pkg", "ipa"],
    maturity: "PLANNED",
    notes: "OS-specific: no location network or hardware beacon.",
  },
  {
    id: "voice-memos",
    name: "Voice Memos",
    category: "media",
    summary: "Recording metadata, transcripts and library.",
    coreModule: null,
    availability: ["apple", "ios"],
    uniqueTo: "apple",
    referenceApps: { apple: ["Voice Memos"], ios: ["Voice Memos"] },
    packageFormats: ["dmg", "pkg", "ipa"],
    maturity: "PLANNED",
    notes: "OS-specific: no audio capture driver.",
  },
  {
    id: "android-keyboard",
    name: "Keyboard",
    category: "system",
    summary: "Input method model with dictionaries and suggestions.",
    coreModule: null,
    availability: ["android", "google"],
    uniqueTo: "android",
    referenceApps: { android: ["Gboard"], google: ["Gboard"] },
    packageFormats: ["apk", "aab"],
    maturity: "PLANNED",
    notes: "OS-specific: needs an Android input-method service.",
  },
  {
    id: "android-widgets",
    name: "Widgets",
    category: "system",
    summary: "Home-screen widget model and refresh policy.",
    coreModule: null,
    availability: ["android", "google"],
    uniqueTo: "android",
    referenceApps: { android: ["Google Widgets"], google: ["ChromeOS widgets"] },
    packageFormats: ["apk", "aab"],
    maturity: "PLANNED",
    notes: "OS-specific: needs an Android launcher adapter.",
  },
  {
    id: "linux-package-manager",
    name: "Package Manager",
    category: "system",
    summary: "Repository, dependency and upgrade model for Linux packages.",
    coreModule: null,
    availability: ["linux"],
    uniqueTo: "linux",
    referenceApps: { linux: ["APT", "Snap", "Flatpak"] },
    packageFormats: ["deb", "rpm", "flatpak", "snap", "appimage"],
    maturity: "PLANNED",
    notes: "OS-specific: needs privileged package backends.",
  },
  {
    id: "linux-service-manager",
    name: "Service Manager",
    category: "system",
    summary: "Service, unit and startup control model.",
    coreModule: null,
    availability: ["linux"],
    uniqueTo: "linux",
    referenceApps: { linux: ["systemd", "GNOME Services"] },
    packageFormats: ["deb", "rpm", "flatpak"],
    maturity: "PLANNED",
    notes: "OS-specific: needs a systemd/D-Bus adapter.",
  },
  {
    id: "chromeos-linux",
    name: "Linux Terminal",
    category: "developer",
    summary: "ChromeOS Linux container terminal profile.",
    coreModule: null,
    availability: ["google"],
    uniqueTo: "google",
    referenceApps: { google: ["Linux development environment"] },
    packageFormats: ["pwa", "apk"],
    maturity: "PLANNED",
    notes: "OS-specific: needs a ChromeOS Crostini adapter.",
  },
];

export const APP_CATALOG: readonly OsApp[] = [...CORE_APPS, ...UNIQUE_APPS];

export function appsFor(os: OsFamily): OsApp[] {
  requireOs(os);
  return APP_CATALOG.filter((app) => app.availability.includes(os)).map((app) => structuredClone(app));
}

export function uniqueApps(os: OsFamily): OsApp[] {
  requireOs(os);
  return APP_CATALOG.filter((app) => app.uniqueTo === os).map((app) => structuredClone(app));
}

export function coreApps(): OsApp[] {
  return APP_CATALOG.filter((app) => app.maturity === "CORE").map((app) => structuredClone(app));
}

export function deploymentPlan(appId: string, os: OsFamily, options: { signed?: boolean } = {}): DeploymentPlan {
  requireOs(os);
  const app = APP_CATALOG.find((entry) => entry.id === appId);
  if (!app) throw new Error(`no app: ${appId}`);
  if (!app.availability.includes(os)) throw new Error(`${app.name} is not available on ${OS_LABELS[os]}`);
  const target = DEPLOYMENT_TARGETS[os];
  const formats = app.packageFormats.filter((format) => target.formats.includes(format));
  if (formats.length === 0) throw new Error(`no common package format for ${app.name} on ${OS_LABELS[os]}`);
  const blockers: string[] = [];
  if (options.signed !== true) blockers.push(target.signing);
  if (app.maturity !== "CORE") blockers.push("The app is PLANNED: no tested domain core exists yet.");
  return {
    appId,
    os,
    formats,
    signing: target.signing,
    store: target.store,
    blockers,
    notes: `${app.notes} ${target.notes}`.trim(),
  };
}

export function validateCatalog(): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const formats = new Set<PackageFormat>([
    "aetherius-pkg",
    "msix",
    "exe",
    "dmg",
    "pkg",
    "deb",
    "rpm",
    "flatpak",
    "snap",
    "appimage",
    "apk",
    "aab",
    "ipa",
    "pwa",
    "wasm",
  ]);
  for (const app of APP_CATALOG) {
    if (ids.has(app.id)) problems.push(`duplicate app id: ${app.id}`);
    ids.add(app.id);
    if (app.availability.length === 0) problems.push(`${app.id} has no availability`);
    for (const os of app.availability) {
      if (!OS_FAMILIES.includes(os)) problems.push(`${app.id} names an unknown OS: ${os}`);
    }
    if (app.uniqueTo && !app.availability.includes(app.uniqueTo)) {
      problems.push(`${app.id} is unique to ${app.uniqueTo} but is not available there`);
    }
    if (app.maturity === "CORE" && !app.coreModule) {
      problems.push(`${app.id} is CORE but has no core module`);
    }
    if (app.packageFormats.length === 0) problems.push(`${app.id} has no package format`);
    for (const format of app.packageFormats) {
      if (!formats.has(format)) problems.push(`${app.id} has an unknown package format: ${format}`);
    }
    for (const os of Object.keys(app.referenceApps) as OsFamily[]) {
      if (!OS_FAMILIES.includes(os)) problems.push(`${app.id} maps a reference app to an unknown OS: ${os}`);
    }
  }
  for (const os of OS_FAMILIES) {
    if (appsFor(os).length === 0) problems.push(`${os} has no apps`);
    if (DEPLOYMENT_TARGETS[os].formats.length === 0) problems.push(`${os} has no package formats`);
  }
  return problems;
}

function requireOs(os: string): asserts os is OsFamily {
  if (!OS_FAMILIES.includes(os as OsFamily)) throw new Error(`unknown OS family: ${os}`);
}
