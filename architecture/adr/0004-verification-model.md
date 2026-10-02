# ADR 0004: Verification model

## Status

Accepted for VRF in Milestone 2. The library below is the verifier. No audit report was found, and that absence is part of the decision.

## Context

VRF is the first job that needs a proof. The protocol must not invent a VRF, and it must not treat a majority vote as a substitute for a proof on a randomness job.

Other jobs verify differently:

- Price: median of fresh observations, Milestone 5.
- Data: source-specific checks plus quorum, Milestone 5.
- Compute: deterministic agreement, with commit/reveal in Milestone 6.
- AI: a commitment to model and output. That commitment is not a proof of correct inference. Milestone 8 must say so in the product surface. ZK or zkML is Milestone 9 and only after measured cost.

## Decision

VRF verification is `solana-ecvrf` 0.0.1, crate `solana-ecvrf`, repository `https://github.com/blueshift-gg/solana-ecvrf`.

- Algorithm: ECVRF-EDWARDS25519-SHA512-TAI, RFC 9381, suite byte `0x03`.
- Public key: 32-byte compressed Ed25519 point. Proof: 80 bytes, `Gamma (32) || c (16) || s (32)`. Output: 64-byte `beta_string`.
- Audit: none found. The crate documents RFC Appendix B.3 vectors and its own Mollusk measurements of about 10,000 compute units. This repository does not treat those measurements as an audit.
- On-chain hashing is the `sol_sha512` syscall from SIMD-0512. A cluster where that feature is inactive cannot run the verifier. Host proving uses the crate's `prove` feature and is not compiled into the programs.
- Alpha, built by `nuvex-vrf` and never taken from instruction data: `nuvex-vrf-v1` || request account pubkey || job type `u8` || input length `u16` little-endian || input bytes.
- The verification account is `VrfResult`, seeds `["verification", request]`, owned by the verification program. Oracle core creates it by CPI. The protocol PDA is the required signer, so a user cannot submit an unbound alpha.
- Randomness: one key has one output for one alpha. A consumer can rely on that uniqueness. A consumer cannot rely on the output being unbiased against an operator who registered many keys before the request. See ADR 0003.

## Consequences

A forged proof is not a protocol result. Tests must keep rejecting one. `ProofKind::Vrf` reports that the format is specified. Price, data, compute, and inference verifiers are still absent.

## Alternatives

Rejected: a hand-rolled hash of a node signature presented as a VRF. It is not a VRF.
