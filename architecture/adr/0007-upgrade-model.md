# ADR 0007: Upgrade model

## Status

Accepted as policy. No program is deployed.

## Context

The programs are upgradeable only through an explicit authority. Burning that authority during development would make bug fixes require a new address and would break every PDA consumer. Burning it later is a governance decision, not a default.

## Decision

- Development and devnet upgrade authority is a multisig, not a hot node key and not the program deploy keypair.
- The program deploy keypairs under `keys/program/` are gitignored. They authorize the program address at first deploy. They are not the long-term upgrade authority. `scripts/deploy-mainnet.sh` refuses to run.
- Before any mainnet deployment the policy in `security/UPGRADE_POLICY.md` has to name the multisig, the timelock, and the emergency pause path. Pause is a flag on `ProtocolConfig`, not an upgrade.
- Upgrades are announced with the buffer hash before execution, except a documented emergency class that still requires the multisig.
- IDL and source revision are published with the upgrade. A closed-source upgrade is out of policy.

## Consequences

Milestone 0 has nothing to upgrade. The next person who deploys to devnet sets the upgrade authority to the multisig in the same flow as the deploy, not afterwards as a best effort.

## Alternatives

Rejected: immutable programs from the first deploy. The account layout is not finished.
