#!/usr/bin/env python3
"""Mine every conversation for the products and systems the owner wants.

The owner has said the material is enough to finish many projects, and
has named the families: apps, blockchain, finance, commerce, e-learning,
social media, communication, databases, cloud services, local services,
and others. The conversations explain what those are, so the job here is
to read the conversations for the concrete product concepts and record
them with the evidence that produced them.

Two things are recorded for every concept: where it was asked for, and
how often. A concept named once is a passing thought; a concept named in
many conversations across many assistants is part of the programme.

Usage:
    python tools/mine_product_concepts.py
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CORPUS = REPO / "research" / "conversation-corpus" / "index.json"
CHATGPT = REPO / "research" / "chatgpt-all-conversations.json"
CODEX = REPO / "research" / "codex-history"

# The families the owner named, and the words that signal membership.
FAMILIES: dict[str, tuple[str, ...]] = {
    "apps": ("app", "application", "mobile app", "ios app", "android app",
             "web app", "pwa", "store", "marketplace", "play store"),
    "blockchain": ("blockchain", "smart contract", "defi", "decentralised",
                   "decentralized", "token", "wallet", "ledger", "consensus",
                   "validator", "nft", "dao", "cryptocurrency", "crypto"),
    "finance": ("finance", "financial", "banking", "payment", "trading",
                "investment", "portfolio", "budget", "invoice", "expense",
                "tax", "insurance", "loan", "mortgage", "accounting",
                "stock", "crypto"),
    "commerce": ("commerce", "ecommerce", "e-commerce", "shop", "store",
                 "product", "cart", "checkout", "order", "customer",
                 "merchant", "subscription", "pricing", "catalogue",
                 "catalog", "inventory", "wholesale", "retail"),
    "elearning": ("elearning", "e-learning", "learning", "course", "lesson",
                  "quiz", "tutorial", "curriculum", "student", "teacher",
                  "education", "training", "academy", "lms", "certification",
                  "grading"),
    "social_media": ("social media", "social network", "feed", "post",
                      "follow", "follower", "profile", "community", "forum",
                      "comment", "like", "share", "influencer", "messaging app",
                      "chat app", "discord", "telegram", "whatsapp"),
    "communication": ("communication", "messaging", "chat", "email",
                      "notification", "sms", "voice", "video call", "voip",
                      "collab", "collaboration", "chatbot", "newsletter"),
    "databases": ("database", "db", "sql", "nosql", "postgres", "mysql",
                  "mongodb", "sqlite", "redis", "schema", "query", "index",
                  "orm", "data store", "data store", "migration"),
    "cloud_services": ("cloud", "aws", "azure", "gcp", "s3", "ec2", "lambda",
                       "serverless", "kubernetes", "docker", "container",
                       "terraform", "cdn", "load balancer", "microservice"),
    "local_services": ("local", "offline", "on-premise", "self-hosted",
                       "self hosted", "localhost", "air-gapped", "embedded",
                       "device", "iot", "edge"),
}

# A product concept: a capitalised or hyphenated phrase near a product
# word, or a quoted phrase that names a thing.
CONCEPT = re.compile(
    r"(?i)\b([a-z][a-z0-9]*(?:[- ][a-z][a-z0-9]*){0,3})\s+"
    r"(app|application|platform|system|engine|os|suite|marketplace|"
    r"dashboard|portal|service|api|framework|library|tool|extension|"
    r"assistant|agent|kernel|database|store|hub|network|protocol|"
    r"compiler|player|editor|tracker|manager|monitor|analyst|assistant)\b")

# A capitalised proper noun that looks like a product.
PROPER = re.compile(r"\b([A-Z][A-Za-z0-9]{2,}(?:[- ][A-Z][A-Za-z0-9]{2,}){0,2})\b")

STOP_PROPER = {
    "The", "This", "That", "There", "These", "Those", "Then", "When", "What",
    "Where", "Which", "Who", "Why", "How", "And", "But", "For", "Not", "You",
    "Your", "Yes", "Now", "Let", "All", "Any", "Can", "Cannot", "Could",
    "Should", "Would", "Will", "With", "From", "Into", "Also", "Just",
    "Like", "Make", "Have", "Has", "Was", "Were", "Are", "Its", "It's",
    "I'm", "I've", "I'll", "Don't", "Doesn't", "Didn't", "Sorry", "Please",
    "Thanks", "Thank", "Hello", "Hi", "Okay", "Yes", "Sure", "Actually",
    "However", "Also", "Because", "Since", "While", "After", "Before",
    "During", "Both", "Each", "Some", "Most", "Many", "Much", "More",
    "Less", "Very", "Really", "Quite", "Just", "Still", "Again", "Once",
    "Here", "There", "Over", "Under", "Between", "About", "Another",
    "English", "Python", "Java", "JavaScript", "TypeScript", "Rust",
    "Linux", "Windows", "MacOS", "Android", "Chrome", "Firefox", "Safari",
    "OpenAI", "Google", "Microsoft", "Apple", "Amazon", "Meta", "Facebook",
    "Twitter", "Instagram", "LinkedIn", "YouTube", "Reddit", "Netflix",
    "Tesla", "NASA", "MIT", "Stanford", "Harvard", "NASA", "IEEE",
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    "Sunday", "January", "February", "March", "April", "June", "July",
    "August", "September", "October", "November", "December",
}


def family_of(text: str) -> list[str]:
    low = text.lower()
    return [f for f, words in FAMILIES.items() if any(w in low for w in words)]


def concepts_in(text: str) -> list[str]:
    out = set()
    for m in CONCEPT.finditer(text):
        phrase = m.group(1).strip().lower()
        if len(phrase) > 2 and phrase not in ("a", "the", "my", "our", "this"):
            out.add(f"{phrase} {m.group(2).lower()}")
    for m in PROPER.finditer(text):
        name = m.group(1).strip()
        if name in STOP_PROPER:
            continue
        if len(name) < 4:
            continue
        out.add(name)
    return list(out)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(REPO / "research" / "concepts"))
    args = ap.parse_args()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    texts: list[tuple[str, str]] = []

    if CORPUS.exists():
        for rec in json.loads(CORPUS.read_text(encoding="utf-8")):
            body = "\n".join([rec.get("opening", "")] + rec.get("asks", []))
            texts.append((rec.get("source", "?"), body))
        print(f"corpus: {len(texts)} conversations")

    before = len(texts)
    if CHATGPT.exists():
        for rec in json.loads(CHATGPT.read_text(encoding="utf-8")):
            body = "\n".join([rec.get("first", "")] + rec.get("later", []))
            texts.append((f"chatgpt/{rec.get('id')}", body))
    print(f"chatgpt api: {len(texts) - before} conversations")

    if CODEX.is_dir():
        n = 0
        for p in CODEX.rglob("*.txt"):
            try:
                texts.append((f"codex/{p.name}", p.read_text(encoding="utf-8",
                                                              errors="replace")))
                n += 1
            except OSError:
                continue
        print(f"codex: {n} threads")

    concept_count: Counter[str] = Counter()
    concept_families: dict[str, set[str]] = defaultdict(set)
    concept_sources: dict[str, set[str]] = defaultdict(set)
    family_count: Counter[str] = Counter()
    family_sources: dict[str, set[str]] = defaultdict(set)
    family_concepts: dict[str, Counter[str]] = defaultdict(Counter)

    for source, body in texts:
        fams = family_of(body)
        for f in fams:
            family_count[f] += 1
            family_sources[f].add(source)
        for c in concepts_in(body):
            concept_count[c] += 1
            concept_sources[c].add(source)
            for f in fams:
                concept_families[c].add(f)
                family_concepts[f][c] += 1

    print(f"\n{len(texts)} sources read, {len(concept_count)} distinct concepts")

    records = []
    for concept, n in concept_count.most_common():
        if n < 2:
            continue
        records.append({
            "concept": concept,
            "mentions": n,
            "sources": len(concept_sources[concept]),
            "families": sorted(concept_families[concept]),
        })

    (out_dir / "concepts.json").write_text(
        json.dumps(records, indent=1, ensure_ascii=False), encoding="utf-8")

    lines = ["# Product concepts mined from the conversations", "",
             f"{len(texts)} conversation sources were read. A concept is listed",
             "when it was named in more than one source, so that a passing",
             "thought does not become a project.", ""]
    lines += ["## The families the owner named", "",
              "| Family | Conversations | Distinct concepts |",
              "|---|---|---|"]
    for fam, n in family_count.most_common():
        lines.append(f"| {fam} | {n} | {len(family_concepts[fam])} |")
    lines += ["", "## Concepts by family", ""]
    for fam, n in family_count.most_common():
        lines.append(f"### {fam}")
        lines.append("")
        for concept, c in family_concepts[fam].most_common(30):
            lines.append(f"- **{concept}** — {c} mentions")
        lines.append("")
    (out_dir / "concepts.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("wrote", out_dir / "concepts.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
