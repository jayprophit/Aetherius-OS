# Aetherius OS Community

The Aetherius OS Community application: the feed, the groups, the chat and the events. An integrated application domain of the one Aetherius ecosystem, not a platform of its own.

**Built: the community domain slice.** Public and private groups, invitations, membership, a feed, comments with notifications, events with capacity, reports and moderator resolution with an audit trail. **Not built:** chat (it belongs to the Agent-Bridge messaging primitive), the host application registry mount, and the UI.

This is an integrated application domain of the one Aetherius ecosystem. It does not get its own account system, its own billing system or its own search index: the primitives it uses belong to the projects named in `docs/APPLICATION-SHARED-PRIMITIVES.yaml`. Accounts, notifications and the hash-chained ledger come from `apps/app-kit`. Messaging is owned by Agent-Bridge; this slice does not create a second chat implementation.

## What is built

- Groups with unique slugs, public/private visibility and a moderator owner.
- Invitations for private groups; membership is the permission boundary for posting and commenting.
- A feed of visible posts from public groups and groups the viewer belongs to.
- Comments that notify the post author, and a hidden post that is closed to comment.
- Events with a capacity limit and idempotent RSVPs.
- Reports, moderator-only resolution, an author notification when content is hidden, and a ledger event for every decision.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Not built

Chat, the host registry mount, and the UI. Chat must consume the Agent-Bridge messaging primitive rather than a private copy.

## Where it comes from

The Figma handoff's screen family table lists Community with the feed, groups, chat and events, and the account, message, post and moderation primitives.
