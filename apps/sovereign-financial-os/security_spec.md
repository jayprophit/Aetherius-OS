# Firestore Security Specification - Sovereign Financial OS

## Data Invariants
1. **User Identity Recovery**: A User profile must be owned by the person whose UID matches the document ID. `userId` and `email` are immutable.
2. **Portfolio Integrity**: A Portfolio can only be modified by its owner. `ownerId` is immutable. `netWorth` must be a number.
3. **Transaction Sovereignty**: Transactions are immutable once created. A user can only create and read their own transactions. `userId` must match the creator.

## The "Dirty Dozen" Payloads
These payloads are designed to bypass or break the logic and must return `PERMISSION_DENIED`.

| ID | Payload | Target Path | Reason for Denial |
|----|---------|-------------|-------------------|
| D1 | `{"userId": "attacker", "email": "me@evil.com"}` | `/users/victim` | Identity Spoofing: Attempting to overwrite victim's profile. |
| D2 | `{"userId": "victim", "email": "victim@safe.com", "currency": "GOLD"}` | `/users/victim` | Unverified email: User must be signed in and verified. |
| D3 | `{"userId": "victim", "role": "admin"}` | `/users/victim` | Privilege Escalation: Setting role in a non-admin field. |
| D4 | `{"ownerId": "victim", "netWorth": 1000000}` | `/users/victim/portfolios/main` | Cross-user Write: Attacker attempting to credit their own worth to victim. |
| D5 | `{"ownerId": "attacker", "netWorth": 50}` | `/users/victim/portfolios/main` | Orphaned Resource: Setting redundant `ownerId` that doesn't match path. |
| D6 | `{"userId": "attacker", "amount": 100, "type": "trade"}` | `/users/victim/transactions/t1` | Privacy Bypass: Reading/Writing to another user's transaction ledger. |
| D7 | `{"userId": "victim", "amount": -9999, "type": "bill"}` | `/users/victim/transactions/t1` | Invalid State: Negative amount for bill if logic expects positive absolute. |
| D8 | `{"userId": "victim", "type": "god_mode"}` | `/users/victim/transactions/t1` | Value Poisoning: Using invalid enum value. |
| D9 | `{"large_field": "x" * 2000000}` | `/users/victim` | Denial of Wallet: Oversized payload. |
| D10| `{"timestamp": "2020-01-01T00:00:00Z"}` | `/users/victim/transactions/t1` | Temporal Poisoning: Providing past timestamp instead of server time. |
| D11| `{"userId": "victim", "amount": 100, "extra": "bonus"}` | `/users/victim/transactions/t1` | Shadow Update: Injecting unvalidated ghost fields. |
| D12| `{"userId": "victim"}` | `/users/victim/transactions/t1` (Update) | Immutable Break: Transactions are append-only; update must be denied. |

## The Test Runner
Execution of tests will verify `PERMISSION_DENIED` for all above.
