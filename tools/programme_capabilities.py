"""The capability matrix for each family of first-party project.

The owner named the families: apps, blockchain, finance, commerce,
e-learning, social media, communication, databases, cloud services and
local services, alongside the ones the existing programme already
covers. A family is a set of things a project in it is expected to do.

This file is that set, stated as searchable evidence. Each capability
carries the words that would appear in the source of a project that has
it, so that "does this project have a cart" is answered by looking,
rather than by guessing from a README.

Each capability is written so that finding the word is necessary but not
sufficient, and the generator records the file the word was found in, so
a hit can be checked by a person.
"""

from __future__ import annotations

# family -> capability list.
# Each capability: (id, label, [search terms])
FAMILY_CAPABILITIES: dict[str, list[tuple[str, str, list[str]]]] = {
    "apps": [
        ("APP-001", "Application shell and navigation", ["routing", "navigator", "router", "screen", "tab bar"]),
        ("APP-002", "Session state management", ["state management", "store", "reducer", "context", "statecontainer"]),
        ("APP-003", "Offline behaviour and sync", ["offline", "sync", "conflict resolution", "queued writes"]),
        ("APP-004", "Push notification delivery", ["push notification", "fcm", "apns", "notification service"]),
        ("APP-005", "Account and sign-in", ["login", "sign in", "signin", "authenticate", "oauth", "session token"]),
        ("APP-006", "User preferences and settings", ["preferences", "settings", "user preferences"]),
        ("APP-007", "Accessibility", ["accessibility", "aria", "screen reader", "a11y"]),
        ("APP-008", "Packaging and distribution", ["app store", "manifest", "bundle id", "package id", "version bump"]),
    ],
    "blockchain": [
        ("BC-001", "Chain runtime or node", ["blockchain", "consensus", "block producer", "node", "p2p", "gossip"]),
        ("BC-002", "Smart contracts", ["smart contract", "solidity", "contract", "evm", "abi", "bytecode"]),
        ("BC-003", "Token or asset standard", ["token", "erc-", "nft", "mint", "burn", "supply"]),
        ("BC-004", "Wallet and key custody", ["wallet", "keystore", "private key", "sign transaction", "signer"]),
        ("BC-005", "Transaction history and state", ["transaction", "ledger", "block hash", "receipt", "confirmations"]),
        ("BC-006", "Fees or gas", ["gas", "fee", "price per gas", "cost per transaction"]),
        ("BC-007", "Bridges and oracles", ["bridge", "oracle", "cross-chain", "price feed"]),
        ("BC-008", "Auditable history", ["audit", "immutable", "proof", "merkle", "attestation"]),
    ],
    "finance": [
        ("FIN-001", "Accounting and double-entry ledger", ["ledger", "journal entry", "double entry", "accounting"]),
        ("FIN-002", "Invoicing", ["invoice", "billing", "payment terms", "due date"]),
        ("FIN-003", "Payment handling", ["payment", "stripe", "charge", "settlement", "payout"]),
        ("FIN-004", "Budgeting", ["budget", "spend limit", "allocation", "forecast"]),
        ("FIN-005", "Markets and trading", ["trading", "order book", "position", "portfolio", "exchange", "broker"]),
        ("FIN-006", "Tax handling", ["tax", "vat", "gst", "sales tax", "tax rate"]),
        ("FIN-007", "Financial reporting", ["report", "profit and loss", "balance sheet", "cash flow", "statement"]),
        ("FIN-008", "Reconciliation", ["reconcil", "match transaction", "difference", "variance"]),
        ("FIN-009", "Risk and compliance controls", ["risk", "compliance", "kyc", "aml", "sanction", "limit"]),
    ],
    "commerce": [
        ("COM-001", "Product catalogue", ["catalog", "catalogue", "product model", "sku", "variant"]),
        ("COM-002", "Cart", ["cart", "basket", "add to cart"]),
        ("COM-003", "Checkout", ["checkout", "place order", "shipping address", "billing address"]),
        ("COM-004", "Order management", ["order", "fulfil", "fulfill", "order status"]),
        ("COM-005", "Payments integration", ["stripe", "paypal", "payment intent", "checkout session", "webhook"]),
        ("COM-006", "Inventory and stock", ["inventory", "stock level", "sku count", "backorder"]),
        ("COM-007", "Pricing and discounts", ["price", "discount", "coupon", "sale", "price rule"]),
        ("COM-008", "Subscriptions", ["subscription", "recurring", "billing cycle", "plan price"]),
        ("COM-009", "Seller or merchant dashboard", ["seller", "merchant", "vendor dashboard", "storefront"]),
        ("COM-010", "Tax and shipping calculation", ["shipping rate", "shipping cost", "tax calculation"]),
        ("COM-011", "Reviews and ratings", ["review", "rating", "testimonial"]),
        ("COM-012", "Order tracking and fulfilment", ["tracking number", "shipment", "tracking status"]),
    ],
    "elearning": [
        ("EDU-001", "Course management", ["course", "curriculum", "course builder", "module"]),
        ("EDU-002", "Lesson content delivery", ["lesson", "topic", "content block", "page builder"]),
        ("EDU-003", "Quizzes and assessment", ["quiz", "question", "answer", "grade", "marking"]),
        ("EDU-004", "Progress tracking", ["progress", "completion", "percent complete"]),
        ("EDU-005", "Certificates", ["certificate", "pdf certificate", "issue certificate"]),
        ("EDU-006", "Enrolment and cohorts", ["enrol", "enroll", "student", "cohort", "class"]),
        ("EDU-007", "Course payments", ["course purchase", "paid course", "course price", "membership payment"]),
        ("EDU-008", "Gamification", ["points", "badge", "achievement", "leaderboard", "gamipress"]),
        ("EDU-009", "Discussion forums", ["forum", "discussion", "thread", "comment"]),
        ("EDU-010", "Learning analytics", ["analytics", "engagement", "completion rate", "drop off"]),
    ],
    "social_media": [
        ("SOC-001", "User profiles", ["profile", "avatar", "bio", "handle"]),
        ("SOC-002", "Feed", ["feed", "timeline", "newsfeed"]),
        ("SOC-003", "Connections and follower graph", ["follow", "follower", "following", "connection", "friend request"]),
        ("SOC-004", "Post composer", ["post composer", "create post", "new post", "publish"]),
        ("SOC-005", "Comments and replies", ["comment", "reply", "thread reply"]),
        ("SOC-006", "Likes and reactions", ["like", "reaction", "upvote"]),
        ("SOC-007", "Direct messaging", ["direct message", "private message", "conversation thread", "dm"]),
        ("SOC-008", "Media upload", ["upload", "media library", "attachment", "file upload"]),
        ("SOC-009", "Notifications", ["notification", "activity feed", "alert"]),
        ("SOC-010", "Moderation", ["moderation", "report content", "ban", "block user"]),
        ("SOC-011", "Groups and communities", ["group", "community", "membership", "forum id"]),
    ],
    "communication": [
        ("COM-101", "Realtime delivery", ["websocket", "realtime", "server-sent", "socket", "pubsub"]),
        ("COM-102", "Message store", ["message store", "message table", "conversation id", "thread id"]),
        ("COM-103", "Presence", ["presence", "online status", "typing indicator", "last seen"]),
        ("COM-104", "Notification delivery", ["notification", "push", "email template", "sms gateway"]),
        ("COM-105", "Rich media messages", ["attachment", "image message", "file message", "voice message"]),
        ("COM-106", "Voice and video", ["voice call", "video call", "webrtc", "rtc", "room"]),
        ("COM-107", "Email integration", ["smtp", "imap", "email service", "mail server", "sendmail"]),
        ("COM-108", "Encryption of messages", ["encrypt", "e2e", "end-to-end", "cipher"]),
        ("COM-109", "Federation between servers", ["federation", "matrix protocol", "activitypub", "protocol bridge"]),
    ],
    "databases": [
        ("DB-001", "Schema definition", ["schema", "create table", "model definition", "migration file"]),
        ("DB-002", "Migrations", ["migration", "migrate", "alter table", "version stamp"]),
        ("DB-003", "Query layer", ["select", "query builder", "orm", "repository"]),
        ("DB-004", "Indexing", ["index", "primary key", "unique constraint"]),
        ("DB-005", "Transactions", ["transaction", "commit", "rollback", "atomic"]),
        ("DB-006", "Backup and restore", ["backup", "restore", "snapshot", "dump"]),
        ("DB-007", "Replication and scaling", ["replica", "shard", "partition", "read replica"]),
        ("DB-008", "Connection management", ["pool", "connection pool", "retry on failure"]),
        ("DB-009", "Database observability", ["slow query", "explain plan", "db metrics", "query log"]),
    ],
    "cloud_services": [
        ("CLD-001", "Service definition", ["service manifest", "compose file", "helm chart", "chart.yaml"]),
        ("CLD-002", "Container build", ["dockerfile", "container image", "image build"]),
        ("CLD-003", "Orchestration", ["kubernetes", "kubectl", "deployment manifest", "helm"]),
        ("CLD-004", "Configuration and secrets", ["secret", "configmap", "environment variable", "secrets manager"]),
        ("CLD-005", "Autoscaling", ["autoscal", "replica count", "hpa", "load balance"]),
        ("CLD-006", "Networking and ingress", ["ingress", "load balancer", "dns record", "reverse proxy"]),
        ("CLD-007", "Object storage", ["s3", "bucket", "object storage", "blob"]),
        ("CLD-008", "Logging and monitoring", ["prometheus", "grafana", "opentelemetry", "log aggregation", "alerting"]),
        ("CLD-009", "Continuous integration", ["workflow", "ci pipeline", "build pipeline", "actions/"]),
        ("CLD-010", "Cost control", ["cost", "budget alert", "spending", "quota"]),
    ],
    "local_services": [
        ("LOC-001", "Local runtime", ["localhost", "local server", "loopback", "127.0.0.1"]),
        ("LOC-002", "Local model inference", ["ollama", "gguf", "llama.cpp", "local model", "quantiz"]),
        ("LOC-003", "Offline caching", ["offline cache", "cache directory", "air gap", "no network"]),
        ("LOC-004", "Local data store", ["sqlite", "local database", "local file store", "json store"]),
        ("LOC-005", "Device access", ["serial", "bluetooth", "usb", "device access", "midi port"]),
        ("LOC-006", "Resource scheduling", ["scheduler", "thread pool", "worker pool", "cpu affinity"]),
        ("LOC-007", "Local installation", ["installer", "setup script", "install script", "msix", "pkg"]),
        ("LOC-008", "Update mechanism", ["update check", "version check", "self update", "upgrade"]),
    ],
    "platform": [
        ("PLT-001", "Runtime or kernel", ["kernel", "scheduler", "syscall", "boot", "init process"]),
        ("PLT-002", "Module system", ["module", "plugin loader", "dynamic library", "import registry"]),
        ("PLT-003", "Isolation between parts", ["sandbox", "isolat", "capability", "namespace"]),
        ("PLT-004", "User interface shell", ["workspace", "dashboard", "panel", "editor pane", "layout"]),
        ("PLT-005", "Extension system", ["extension", "addon", "contribution point", "registry"]),
        ("PLT-006", "Configuration management", ["settings", "config", "profile", "preferences"]),
        ("PLT-007", "Observability", ["telemetry", "trace", "log stream", "metrics", "audit"]),
        ("PLT-008", "Distribution and packaging", ["package", "build manifest", "artifact", "release"]),
    ],
    "intelligence": [
        ("INT-001", "Model routing across providers", ["model router", "provider registry", "route model", "model registry"]),
        ("INT-002", "Tool execution", ["tool call", "tool registry", "execute tool", "function call"]),
        ("INT-003", "Planning and decomposition", ["plan", "decompose", "subtask", "step plan"]),
        ("INT-004", "Working memory and context", ["working memory", "context window", "scratchpad", "short term memory"]),
        ("INT-005", "Long term memory", ["long term memory", "vector store", "embedding", "episodic"]),
        ("INT-006", "Multi agent coordination", ["multi agent", "agent pool", "delegate", "swarm", "hive"]),
        ("INT-007", "Authority and permissions", ["authority", "permission", "capability scope", "rbac"]),
        ("INT-008", "Durable task state", ["checkpoint", "resume", "durable", "task state", "crash recovery"]),
        ("INT-009", "Evaluation and benchmarking", ["benchmark", "evaluation", "score", "eval suite"]),
        ("INT-010", "Local and offline model", ["ollama", "local model", "gguf", "offline inference"]),
    ],
    "creative": [
        ("CRE-001", "Audio engine", ["audio engine", "sample rate", "buffer size", "mixer bus"]),
        ("CRE-002", "MIDI", ["midi", "note on", "midi port", "program change"]),
        ("CRE-003", "Plugin host", ["plugin host", "vst", "au", "clap", "scan plugin"]),
        ("CRE-004", "Plugin SDK", ["plugin sdk", "api for plugins", "processor base", "audio processor"]),
        ("CRE-005", "Timeline and arrangement", ["timeline", "arrangement", "clip", "transport"]),
        ("CRE-006", "Mixer and routing", ["mixer", "bus", "routing matrix", "insert", "send"]),
        ("CRE-007", "Sampler and instruments", ["sampler", "instrument", "wavetable", "soundfont"]),
        ("CRE-008", "Export and rendering", ["export", "render", "bounce", "mixdown", "encode"]),
        ("CRE-009", "Scoring and notation", ["score", "notation", "staff", "piano roll"]),
    ],
    "knowledge": [
        ("KNW-001", "Ingest", ["ingest", "crawl", "import", "harvest", "collect"]),
        ("KNW-002", "Structure and categorisation", ["taxonomy", "category", "tag", "ontology"]),
        ("KNW-003", "Link graph", ["link graph", "relation", "edges", "graph traversal"]),
        ("KNW-004", "Search", ["search", "index", "query", "ranking", "bm25"]),
        ("KNW-005", "Source citation", ["citation", "source reference", "provenance", "attribution"]),
        ("KNW-006", "Versioning", ["version", "revision", "history", "snapshot"]),
        ("KNW-007", "Publication", ["publish", "export", "render site", "static site"]),
    ],
    "tools": [
        ("TLS-001", "Command line entry point", ["argparse", "commander", "click", "main(", "cli"]),
        ("TLS-002", "Configuration", ["config", "settings", "flags", "options"]),
        ("TLS-003", "Structured output", ["json output", "report", "table", "csv output"]),
        ("TLS-004", "Testing", ["test", "assert", "spec", "unittest", "pytest"]),
    ],
}

# The families the owner named directly.
OWNER_FAMILIES = [
    "apps", "blockchain", "finance", "commerce", "elearning",
    "social_media", "communication", "databases", "cloud_services",
    "local_services",
]
