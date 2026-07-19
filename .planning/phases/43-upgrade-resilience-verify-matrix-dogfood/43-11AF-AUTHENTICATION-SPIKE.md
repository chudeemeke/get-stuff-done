---
phase: 43
plan: 11AF
status: evidence-only
captured: 2026-07-19
subject: verdaccio@6.8.0
---

# Plan 11AF Verdaccio Authentication Spike

## Correction -- 2026-07-19

A later N=3 compatibility run found the user-level npm registry set to
`http://localhost:4873/`. No registry process remained, so the dead endpoint
made all three candidate installs fail with `ECONNREFUSED`. The operator later
confirmed manually running `npm set registry http://localhost:4873/` from WSL;
the registry setting was therefore operator-created, not evidence that this
spike changed external npm config. The spike still did not capture a
before/after digest of that config, so its cleanup result proved temporary-root
and process cleanup but did not prove host-config invariance.

The user-level registry was restored to `https://registry.npmjs.org/` while
preserving the existing npmjs authentication entry without printing it. Native
Windows and WSL npm now report that registry, resolve the same user-level config
file, and report no `localhost:4873` reference.
A subsequent N=3 matrix passed 945/945 and left no matrix-owned temporary root.
As defense in depth, Plan 11AF must add byte-invariance evidence for user and
project npm config on every success and failure path; an isolated npmrc is not
sufficient unless the implementation also proves no implicit `npm config`
operation can escape it.

## Scope

This is pre-execution evidence for pending Plan 11AF. It does not satisfy the
plan dependency on 11AC, alter the upgrade verifier, or complete either task.

Docker was unavailable and port 4873 had no listener. Rather than claiming a
container pass, the spike installed exact `verdaccio@6.8.0` with lifecycle
scripts disabled, started its real server on an OS-assigned loopback port, and
used a unique system-temporary root for configuration, storage, home, npmrc,
test package, and credentials.

## Authority

- npm `latest`: `verdaccio@6.8.0`
- package metadata modified: `2026-07-13T20:50:19.395Z`
- required runtime: Node `>=20`
- official default authentication: built-in htpasswd
- official default publication policy: `$authenticated`
- npm 9 and later separate user creation (`adduser`) from login

The exact published package implements:

```text
PUT /-/user/:org_couchdb_user/:_rev?/:revision?
```

For an anonymous new user it validates the password, invokes the auth plugin's
`add_user`, and returns HTTP 201 with an API token. The token logout route in
this build only returns a logged-out message; it is not evidence of durable
legacy-token revocation. Plan 11AF must therefore rely on destroying both the
ephemeral registry process/container and the verifier credential root.

Primary references:

- <https://www.verdaccio.org/docs/authentication/>
- <https://www.verdaccio.org/docs/setup-npm/>
- <https://www.verdaccio.org/docs/configuration/>

## Live Result

The spike generated a crypto-random username and password in memory, registered
through the exact route, retained only the returned token, wrote one isolated
npmrc, and published a unique disposable package to that registry.

| Evidence | Result |
| --- | --- |
| Exact Verdaccio version | `6.8.0` |
| Listener | loopback-only, OS-assigned port |
| Registration | HTTP 201 |
| Response bound | at most 64 KiB |
| Token handling | captured in memory, then isolated npmrc |
| Authenticated publish | exit 0 |
| Token/password/auth line in captured output | absent |
| Token/password in process argv | absent |
| Credential-bearing files | contained under temporary root |
| Cleanup | server stopped and temporary root deleted; external npm-config invariance was not proved |

No raw username, password, token, npmrc contents, or credential prefix was
printed or persisted in this artifact.

## Implementation Constraints

1. Validate the registry URL as a loopback-only HTTP endpoint with no embedded
   credentials, query, or fragment before sending registration material.
2. Construct the route with URL and component encoding APIs; never concatenate
   unvalidated external input into a shell command.
3. Use an injected HTTP port with redirects disabled, a hard timeout, a bounded
   response body, fatal JSON decoding, HTTP 201, and a strict token shape.
4. Keep username, password, and token out of child argv. The HTTP request body
   and private in-process state are the credential transport.
5. Write only the registry and scoped `_authToken` entry to the isolated npmrc;
   all npm children receive its path through the existing isolated environment.
6. Redact before constructing errors, step records, or reports. Tests must use
   canaries across stdout, stderr, thrown messages, report JSON, and retained
   files outside the credential root.
7. Treat user creation as part of the ephemeral registry lifecycle. Do not
   claim the legacy logout endpoint revokes the issued token.
8. The final integration must still run the complete pack, publish, install,
   bump, compose, republish, reinstall, and smoke sequence against the pinned
   hosted Verdaccio image. This spike proves authentication and publication
   mechanics only.
9. Snapshot the byte digest of every pre-existing user/project npm config that
   npm could resolve, and prove those bytes are unchanged after success and
   every injected failure. Never run `npm config` against an implicit
   userconfig; all npm children must receive the owned path explicitly.
