# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅        |

## Reporting a Vulnerability

Please report security vulnerabilities **privately** — do not open a public issue.

1. Go to the repository's [Security Advisories](https://github.com/dliting/chatbot-front/security/advisories) page and click "Report a vulnerability", **or**
2. Email the maintainer directly.

Include as much of the following as you can:

- Type of issue (e.g. XSS, prototype pollution, SSRF in examples)
- Full paths of affected files and proof-of-concept or exploit steps
- Impact, including how an attacker might exploit it

You should receive a response within 7 days. Please do not disclose the issue publicly until a fix is released.

## Scope Notes

- The component library sanitizes rendered markdown (DOMPurify) and escapes user content by default; reports about host apps disabling these safeguards are out of scope.
- The example backends in `examples/chatapp` are for local demonstration only and are not intended for production deployment.
