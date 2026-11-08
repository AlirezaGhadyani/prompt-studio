# Security policy

## Supported versions

The latest release on `main` receives fixes.

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private
vulnerability reporting: open the **Security** tab of this repository and choose
**Report a vulnerability**. Include the extension version, OpenChamber version,
and reproduction steps. Never include an API key or private prompt text.

## Scope

Prompt Studio is designed to need no OpenChamber capability:

- It does not send messages, start sessions, or read conversations.
- It does not read or write files on disk.
- It does not reach the network.
- It stores templates only in its own extension storage on the connected server.

Reports about escaping those boundaries, or about a stored template leaking into
another extension's storage, are in scope.
