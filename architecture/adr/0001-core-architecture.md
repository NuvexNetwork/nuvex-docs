# ADR 0001: Core architecture

## Status

Accepted for Milestone 0. Amended in Milestone 1 with the transition graph, and in Milestone 2 with the VRF fulfillment edge.

## Context

Nuvex is a Solana-native verifiable compute and oracle protocol. The long-term surface includes randomness, external data, deterministic computation, optimistic verification, and AI inference. Those jobs must not each grow a private instruction set.

On-chain programs have to stay deterministic and free of HTTP, databases, model runtimes, and GPU work. Anything that talks to the network outside Solana stays off-chain.

## Decision

The protocol is job-agnostic. A request carries a job type, an input, constraints, and a callback. `request_randomness` is not a program entrypoint.

Three programs own the on-chain surface:

- `oracle-core` creates requests, accounts for fees, finalizes, and performs callbacks.
- `oracle-registry` registers nodes, locks stake, records heartbeats, and accepts slash from a configured authority.
- `verification` checks proofs and, from Milestone 6, challenges.

Off-chain services are the oracle node, the indexer, the read API, and later data and inference workers. The API is not a source of protocol truth.

Job kinds are `Vrf`, `Price`, `Data`, `Compute`, and `AiInference`. Only the kind identifier exists today. Executors that would return a fabricated result are not present.

## Request states

The names are `Created`, `Pending`, `Assigned`, `Computing`, `Submitted`, `Verifying`, `Finalized`, `CallbackExecuted`, `Cancelled`, `Expired`, `Rejected`, `Failed`, and `Challenged`.

`Challenged` is not terminal. Terminal states are `CallbackExecuted`, `Cancelled`, `Expired`, `Rejected`, and `Failed`. The numeric discriminants in `nuvex-protocol-types` are the `u8` stored on `OracleRequest`. The enum is not Borsh-serialized.

### Milestone 1 graph

`transition` in `nuvex-protocol-types` classifies every pair.

Allowed, and implemented:

- `Pending → Cancelled`, by the requester, only while `clock.slot < expires_slot`
- `Pending → Expired`, by any crank, only when `clock.slot >= expires_slot`

Reserved. No instruction performs these:

- `Created → Pending`
- `Pending → Assigned`
- `Assigned → Computing`
- `Assigned → Expired`
- `Computing → Submitted`
- `Computing → Expired`
- `Submitted → Verifying`
- `Verifying → Finalized`
- `Finalized → CallbackExecuted`

Every other pair is forbidden. That includes every edge into or out of `Challenged`, `Rejected`, and `Failed`. Milestone 1 does not guess how a challenge returns to finality.

A request account is created already in `Pending`. There is no persisted `Created` state, because there is no separate fee-escrow step. `Created → Pending` stays reserved for that later split.

### Milestone 2 graph

VRF fulfillment adds one allowed edge:

- `Pending → CallbackExecuted`, by `fulfill`, only after the verification program accepts the proof

The reserved multi-step path is unchanged. A VRF request does not persist `Assigned`, `Computing`, `Submitted`, `Verifying`, or `Finalized`. Other jobs must not use `Pending → CallbackExecuted` until their own record says so. Challenge edges stay forbidden.

The status is written before the callback CPI. If the callback fails, the transaction reverts, so the request is not left both fulfilled and unfulfilled. There is no callback-failed status.

## Consequences

Adding a job means a new verifier and an off-chain executor, not a new core program. A VRF request can be cancelled, expired, or fulfilled. Fulfillment does not move a fee.

## Alternatives

A single program would make upgrades and audit scope larger. Separate per-job programs would duplicate fees, callbacks, and node accounting.
