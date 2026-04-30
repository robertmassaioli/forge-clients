---
editUrl: false
next: false
prev: false
title: "getInvokingUserId"
---

> **getInvokingUserId**(`payload`): `string` \| `undefined`

Defined in: [packages/core/src/adapters/ForgeInvocationPayload.ts:172](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/adapters/ForgeInvocationPayload.ts#L172)

Extract the invoking user's account ID from a Forge Remote payload.
Returns undefined if the invocation was not triggered by a user
(e.g. scheduled triggers, webtriggers without a session).

## Parameters

### payload

[`ForgeInvocationPayload`](/forge-clients/reference/interfaces/forgeinvocationpayload/)

## Returns

`string` \| `undefined`
