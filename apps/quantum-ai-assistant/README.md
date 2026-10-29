# Quantum AI Assistant

The quantum AI assistant slice: a real statevector simulator for small circuits, sampling, and an Athena-backed explanation path with an audit trail.

**Built:** the simulator, the assistant path and its tests. **Not built:** a connection to quantum hardware, and the assistant user interface.

## What is built

- A statevector simulator with X, H, RX, RY and CNOT gates.
- Bell-state and superposition checks.
- Seeded sampling that respects the Born distribution.
- Input validation for qubits, gates and parameters.
- An Athena runtime path and a hash-chained audit trail.
- An explicit disclaimer that this is simulation, not hardware.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Honest limits

This is a classical statevector simulation. No quantum hardware or quantum cloud provider is connected. The simulator is intentionally limited to small circuits.
