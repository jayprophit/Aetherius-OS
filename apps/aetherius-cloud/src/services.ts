/**
 * Aetherius Cloud — free / freemium service catalog.
 *
 * DESCRIPTORS ONLY: no credentials, no tokens, no endpoints with secrets.
 * Every entry is a service a user may connect with their OWN account
 * ("bring your own"), so the user stays in control of their data and the
 * platform never becomes a data silo.
 *
 * `credentialRef` names a stable reference in the approved vault — never a
 * value. `byo: true` means the user supplies their own account/credentials.
 */

export type ServiceCategory =
  | "storage"
  | "ai"
  | "compute"
  | "ops"
  | "identity"
  | "communication";

export interface FreeService {
  id: string;
  name: string;
  category: ServiceCategory;
  /** One-line free-tier description, or "none" when paid-only. */
  freeTier: string;
  /** User connects their own account (user controls the data). */
  byo: boolean;
  /** Stable vault reference for a platform-held credential, if any. */
  credentialRef?: string;
  url: string;
}

export const FREE_SERVICES: FreeService[] = [
  // ---- Storage (bring-your-own) ----
  { id: "google-drive", name: "Google Drive", category: "storage",
    freeTier: "15 GB shared", byo: true, url: "https://drive.google.com" },
  { id: "onedrive", name: "Microsoft OneDrive", category: "storage",
    freeTier: "5 GB", byo: true, url: "https://onedrive.live.com" },
  { id: "dropbox", name: "Dropbox", category: "storage",
    freeTier: "2 GB", byo: true, url: "https://www.dropbox.com" },
  { id: "terrabox", name: "TerraBox", category: "storage",
    freeTier: "1 TB (ad-supported)", byo: true, url: "https://terrabox.app" },
  { id: "github-storage", name: "GitHub (repos, Releases, LFS)", category: "storage",
    freeTier: "Unlimited public repos; 2 GB LFS", byo: true,
    credentialRef: "keepass:API/github", url: "https://github.com" },
  { id: "cloudflare-r2", name: "Cloudflare R2", category: "storage",
    freeTier: "10 GB-month egress-free", byo: false, url: "https://www.cloudflare.com/developer-platform/products/r2/" },
  { id: "supabase-storage", name: "Supabase Storage", category: "storage",
    freeTier: "1 GB", byo: false, credentialRef: "keepass:Aetherius/Cloud/Supabase",
    url: "https://supabase.com/storage" },

  // ---- AI inference ----
  { id: "groq", name: "Groq", category: "ai",
    freeTier: "Rate-limited free inference", byo: false,
    credentialRef: "keepass:API/groq", url: "https://console.groq.com" },
  { id: "gemini", name: "Google Gemini", category: "ai",
    freeTier: "Free tier via AI Studio", byo: false,
    credentialRef: "keepass:API/gemini", url: "https://aistudio.google.com" },
  { id: "openrouter", name: "OpenRouter", category: "ai",
    freeTier: "Free models (:free) + openrouter/free router", byo: false,
    credentialRef: "keepass:API/openrouter", url: "https://openrouter.ai" },
  { id: "huggingface", name: "Hugging Face", category: "ai",
    freeTier: "Hosted inference + datasets", byo: false,
    credentialRef: "keepass:API/huggingface", url: "https://huggingface.co" },
  { id: "vercel-ai-gateway", name: "Vercel AI Gateway", category: "ai",
    freeTier: "Developer credits", byo: false,
    credentialRef: "keepass:API/vercel ai gateway", url: "https://vercel.com/ai-gateway" },
  { id: "cloudflare-workers-ai", name: "Cloudflare Workers AI", category: "ai",
    freeTier: "10,000 neurons/day", byo: false, url: "https://developers.cloudflare.com/workers-ai/" },
  { id: "ollama", name: "Ollama (local)", category: "ai",
    freeTier: "Local models, fully offline", byo: false, url: "https://ollama.com" },

  // ---- Compute / fabric ----
  { id: "cloudflare-workers", name: "Cloudflare Workers + Pages + D1 + KV + Queues",
    category: "compute", freeTier: "Workers Free / Pages unlimited / D1 5 GB / KV 1 GB",
    byo: false, url: "https://developers.cloudflare.com/workers/" },
  { id: "supabase-edge", name: "Supabase Edge Functions", category: "compute",
    freeTier: "500k invocations/month", byo: false,
    credentialRef: "keepass:Aetherius/Cloud/Supabase", url: "https://supabase.com/functions" },
  { id: "github-actions", name: "GitHub Actions", category: "compute",
    freeTier: "2,000 minutes/month", byo: true,
    credentialRef: "keepass:API/github", url: "https://github.com/features/actions" },
  { id: "oracle-always-free", name: "Oracle Cloud Always Free", category: "compute",
    freeTier: "ARM Ampere A1 + VM, 4 OCPU/24 GB", byo: true, url: "https://www.oracle.com/cloud/free/" },

  // ---- Operations ----
  { id: "sentry", name: "Sentry", category: "ops",
    freeTier: "5k errors/month after trial", byo: false,
    credentialRef: "keepass:API/sentry", url: "https://aetherius-os.sentry.io" },
  { id: "codecov", name: "Codecov", category: "ops",
    freeTier: "Free for public repos", byo: true, url: "https://app.codecov.io" },
  { id: "uptimerobot", name: "UptimeRobot", category: "ops",
    freeTier: "50 monitors, 5-min interval", byo: true, url: "https://uptimerobot.com" },
  { id: "uptime-kuma", name: "Uptime Kuma (self-hosted)", category: "ops",
    freeTier: "Self-hosted, unlimited", byo: false, url: "https://github.com/louislam/uptime-kuma" },

  // ---- Identity ----
  { id: "github-oauth", name: "GitHub OAuth / Sign-in", category: "identity",
    freeTier: "Free developer tier", byo: true, url: "https://github.com/settings/developers" },
  { id: "google-oauth", name: "Google OAuth", category: "identity",
    freeTier: "Free developer tier", byo: true, url: "https://console.cloud.google.com/apis/credentials" },
  { id: "keycloak", name: "Keycloak (self-hosted)", category: "identity",
    freeTier: "Open source, self-hosted", byo: false, url: "https://www.keycloak.org" },

  // ---- Communication ----
  { id: "brevo", name: "Brevo (email)", category: "communication",
    freeTier: "300 emails/day", byo: true, url: "https://app.brevo.com" },
  { id: "make", name: "Make (automation)", category: "communication",
    freeTier: "1,000 ops/month", byo: true, url: "https://www.make.com" },
  { id: "zapier", name: "Zapier", category: "communication",
    freeTier: "100 tasks/month", byo: true, url: "https://zapier.com" },
];

export function servicesByCategory(category: ServiceCategory): FreeService[] {
  return FREE_SERVICES.filter((s) => s.category === category);
}

export function byoServices(): FreeService[] {
  return FREE_SERVICES.filter((s) => s.byo);
}
