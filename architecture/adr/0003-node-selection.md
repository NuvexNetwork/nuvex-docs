# ADR 0003: Node selection

## Status

Amended in Milestone 3. The selection function is the eligibility predicate below. It is not a weighted lottery.

## Context

A private backend that picks a fulfiller cannot be audited from the chain. Selection has to be a function of public inputs: capability, stake, reputation, availability, workload, and randomness.

The specification does not fix the function. Weighting stake linearly favors capital. Weighting reputation favors incumbents. Either choice is an economic policy.

## Decision so far

- Selection inputs are on-chain: job capability bit, stake at or above the configured minimum, a non-expired heartbeat, and a status that the Milestone 3 state machine calls active.
- The requester does not name the fulfiller inside the request.
- The chosen node set is written onto the request so a later observer can recompute or challenge the assignment.
- VRF jobs still verify a proof. Selection of who may submit is not the verification.

## Open

A weighted draw is not decided. It needs an on-chain node index this program does not have, and a weight would be an economic policy. Reputation stays a counter.

## Milestone 2 VRF fulfillment

There is still no assignment. For a VRF request, any registered node may fulfill, first transaction wins, if all of the following hold:

- The requester did not name the fulfiller.
- The node authority signs.
- The node account was created at a slot strictly earlier than the request.
- The VRF public key was set at registration, is not all zeros, and `update_node` cannot replace it.
- The capability mask includes the VRF bit.
- The proof verifies under that stored key.

An operator can register many keys before a request exists and submit the output they prefer. That is a real limitation. Stake-weighted assignment in Milestone 3 is what closes it. This is not a silent path: `fulfill` is the instruction, and tests cover a late key, a missing capability bit, and a forged proof.

## Milestone 3 eligibility

A VRF fulfiller is eligible only when every check below holds in `fulfill`:

- The Milestone 2 key, capability, and proof rules.
- Registry `unstake_cooldown_slots` and `heartbeat_timeout_slots` are both non-zero.
- Node status is Active (`2`).
- `stake >= min_stake`.
- `last_heartbeat != 0` and `clock.slot < last_heartbeat + heartbeat_timeout_slots`.

`fulfill` writes `assigned_node`, `assigned_stake`, and `assigned_heartbeat` on the request. Those are the values it checked, not a later balance. Reputation increments by one through `note_fulfillment`, which only the oracle-core protocol PDA can call. Slash sets reputation to zero. Reputation is not a weight.

There is no on-chain list of nodes. A program cannot draw a winner from every registered key. A seed chosen by the requester could be ground until a preferred key wins. This milestone does not add that draw. The cost of another identity is another deposit of at least `min_stake`. The registry authority sets that number. Zero is allowed and does not resist Sybil. An operator who funds several keys can still submit the output they prefer.

`min_stake`, the cooldown, and the heartbeat window are registry fields. The cooldown and the heartbeat window must each be in `1..=150_000`. That cap is the existing request-timeout safety bound. It stops a config from freezing stake forever. It is not a chosen economic duration. Changing the config does not rewrite a cooldown that has already started.

Status values:

- `1` Registered. Stake may sit below the minimum. The node cannot fulfill or heartbeat.
- `2` Active. A deposit reached `min_stake`.
- `3` Unstaking. The entire stake stays locked until `cooldown_end_slot`. Heartbeat and fulfill are rejected. `withdraw` returns the accounted stake and sets the node back to Registered.

Withdrawable means Unstaking and `slot >= cooldown_end_slot`. It is not a fourth stored status. A node cannot deposit while unstaking. Stake below the minimum can still be unstaked, and it waits the same cooldown. Slash can take lamports from Active or Unstaking, including during the cooldown, and sends them to `slash_destination`. If the stake reaches zero, the node returns to Registered. Rent stays on the account. The slash amount is an argument from the slash authority. There is no automatic percentage.

## Consequences

VRF fulfillment is first-come among nodes that meet the predicate. A node process in this repository still does not submit transactions. Fee shares remain unset.

## Alternatives

Rejected: letting the requester name the fulfiller. The requester would choose the key and the output.
