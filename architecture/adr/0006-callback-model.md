# ADR 0006: Callback model

## Status

Accepted. Milestone 2 implements the empty-account callback. Account-bearing callbacks stay out.

## Context

A requesting program wants to learn the result inside its own instruction. The oracle must invoke that program. A callback that can write oracle state, or that can smuggle extra accounts, can take over the protocol.

## Decision

The request stores `callback_program` and at most 128 bytes of `callback_data`. The default pubkey means no callback. Milestone 2 passes zero accounts, so there is no account-list hash to store. A fulfiller cannot choose the callee's accounts.

On fulfillment, oracle core writes `CallbackExecuted` and then performs one CPI. The instruction name is `callback`. The data is the Anchor discriminator of that name, the 64-byte VRF output, a little-endian `u32` length, and the stored callback bytes. The request account is not included. Oracle accounts are not writable by the callee.

If the callback returns an error, the transaction reverts. The request is not left fulfilled. There is no callback-failed status and no retry instruction. A callback that needs a later retry would be a different decision, because a fulfiller can otherwise burn the transaction on a callee that always fails.

## Consequences

`buildCallbackInstruction` returns those bytes. It does not send a transaction. Account-bearing callbacks are still not implemented.

## Alternatives

Rejected: forwarding `remaining_accounts` from the fulfiller. The fulfiller would choose the callee's accounts.
