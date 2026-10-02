# ADR 0002: Account model

## Status

Accepted as a layout specification. Amended in Milestone 1 for the request and registry accounts, in Milestone 2 for `VrfResult` and the node VRF key, and in Milestone 3 for stake configuration and the assignment snapshot. Challenge and reward vault accounts are not allocated.

## Context

Global mutable accounts are easy to substitute and expensive when they grow without a bound. Every account below is a PDA. Seeds are shared with `nuvex-common` and `tests/fixtures/pda-seeds.json`.

No account stores a URL or an unbounded list. Vectors, when they appear in Milestone 1, have an explicit maximum.

## Accounts

### ProtocolConfig

- Purpose: protocol authority and pause flag. Fee parameters are not stored.
- Seeds: `["protocol"]`.
- Authority: the config authority, expected to be a multisig before any value-bearing deployment.
- Mutability: the authority may update parameters. Requests may not.
- Initializer: the deployer, once, in Milestone 1.
- Rent: paid by the initializer. Size is fixed.
- A request copies `expires_slot` at creation. Later job-config edits do not rewrite it.

### NodeRegistry

- Purpose: registry authority and global node counters.
- Seeds: `["registry"]`.
- Authority: registry authority, separate from the treasury.
- Mutability: registration instructions, not the node operator directly.
- Initializer: deployer, Milestone 1.
- Rent: fixed size. The registry does not embed every node.

### Node

- Purpose: one operator.
- Seeds: `["node", node_authority]`.
- Authority: the node authority signs registration and heartbeats. The operator field is a separate pubkey and is not required to be the same key.
- Mutability: the node authority updates capability and metadata hashes. Stake moves only through stake instructions. Slash moves only through the slash authority.
- Initializer: the node authority, Milestone 1.
- Fields: `node_authority`, `operator`, `vrf_pubkey`, `stake`, `supported_job_mask`, `status`, `reputation`, `created_slot`, `last_heartbeat`, `cooldown_end_slot`.
- `vrf_pubkey` is set at registration. All zeros cannot fulfill. A non-zero key must pass `solana-ecvrf` point validation. `update_node` cannot replace it.
- `stake` is lamports locked in the account above rent. `reputation` counts successful fulfillments and is not a selection weight. `last_heartbeat` is the slot of the last heartbeat. `cooldown_end_slot` is set by unstake. `node_count` on the registry is a write hotspot.
- The registry also stores `min_stake`, `unstake_cooldown_slots`, `heartbeat_timeout_slots`, `slash_authority`, and `slash_destination`. Those stay zero until `configure_stake`.
- Rent: fixed size. No URL.
- Assumption: off-chain endpoints are discovered from a signed document whose hash may be stored on the account. The document itself is not on-chain.

### OracleRequest

- Purpose: one job request and its lifecycle.
- Seeds: `["request", requester, request_id]`.
- `request_id` is exactly 32 bytes. The requester is in the seed so one user cannot occupy another user's id.
- Authority: the requester cancels only where the transition graph allows. A VRF fulfiller is a node authority under ADR 0003. The callback program does not own the account.
- Mutability: core instructions along the transition graph. A callback CPI must not be given a writable request account.
- Initializer: the requester, Milestone 1.
- Rent: the requester pays. Anyone may close a terminal request. The lamports return to the stored requester, who must be a system account. A pending request cannot be closed.
- `max_fee` is stored and never transferred. Input is at most 256 bytes. Callback data is at most 128 bytes. Empty input and empty callback data are allowed. The default pubkey means no callback. A non-default program is invoked by `fulfill` with zero accounts.
- `assigned_node`, `assigned_stake`, and `assigned_heartbeat` stay empty until `fulfill` writes the node it accepted.

### JobConfig

- Purpose: per-job timeout and whether new requests are accepted. Fee, quorum, and capability requirements are not stored.
- Seeds: `["job_config", job_type]`.
- Authority: config authority.
- Initializer: config authority, when that job is enabled. A missing config means the job is unsupported.
- Assumption: enabling `AiInference` requires a verification story. Creating the account is not that story.

### VerificationState

- Purpose: proof material bound to one request.
- Seeds: `["verification", request_pubkey]`.
- Authority: the verification program. Core reads it. The requester does not write it.
- Initializer: oracle core, by CPI into `verify_vrf`, signed by the protocol PDA. The fulfiller pays rent.
- Fields: `request`, `node`, `vrf_pubkey` (32), `output` (64), `proof` (80), `bump`. The account is `VrfResult`. A second fulfill cannot create it again, and a failed transaction does not leave it behind.

### Challenge

- Purpose: one dispute by one challenger against one request.
- Seeds: `["challenge", request_pubkey, challenger]`.
- Authority: the challenger opens it. Resolution is a separate instruction with its own authority rule, Milestone 7.
- Assumption: the bond and the slash destination are economic parameters, not hardcoded.

### RewardVault

- Purpose: holds fees before distribution.
- Seeds: `["reward_vault"]`.
- Authority: PDA signer of oracle core. No keypair.
- Mutability: fee and reward instructions only.
- Assumption: the vault is a system-owned lamport account or a token account. Token versus lamport is deferred to the fee ADR amendment in Milestone 2. Milestone 0 does not create it.

## Consequences

Program ids in `Anchor.toml` are development ids. Rotating them changes every PDA. Production ids are chosen at first deployment and then kept stable.

## Alternatives

Embedding nodes inside the registry account would hit account size limits and make registration a write hotspot.
