# Athena

Athena, the shared intelligence runtime: model routing, tools, planning, memory, delegation, durable tasks, evaluation and a local-model contract.

**Built:** the runtime and its tests. **Not built:** a connection to a hosted model provider, the Athena user interface, and the owner's recovered Athena requirements.

The owner's original Athena requirements live in a ChatGPT project that is not in the local corpus. This slice is candidate scope derived from the programme's capability list; it must not be presented as the confirmed Athena specification.

## What is built

- Deterministic model routing.
- A tool registry with permission checks.
- Planning and bounded working memory.
- Long-term memory retrieval.
- Delegation between agents.
- Durable task checkpoints that resume in a new service instance.
- Evaluation and a local-model contract.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Reuse

The quantum assistant slice uses this runtime rather than creating a second agent loop.
