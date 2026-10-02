# ADR 0005: Fee model

## Status

Accepted as a split of roles. Numeric parameters are not set.

## Context

A request carries `max_fee`. The protocol charges an actual fee at or below that ceiling. Hardcoding lamport amounts in instructions would freeze an economic policy into the binary.

## Decision

Fees are fields on `ProtocolConfig` and `JobConfig`, not constants in program source.

The actual fee is split into four roles:

- node reward
- verifier reward
- protocol treasury
- security fund

The shares are configuration, in basis points, and must sum to 10_000. The check is on-chain when the parameters are written. Milestone 3 still does not pick the basis points and does not transfer request fees. Stake lamports are a separate lock on the node account. `claim_reward` is not an instruction.

`max_fee` is a requester-supplied ceiling. If the configured fee is above the ceiling, request creation fails. The requester is not charged the ceiling automatically.

Lamports use checked arithmetic. There is no token mint in Milestone 0.

## Consequences

Treasury, security fund, and reward destinations are separate authorities. One key must not hold all three. Destinations are set at initialization and are empty until then.

## Alternatives

Rejected: a fixed 70/20/5/5 split in source. The specification lists the roles and does not list the shares.
