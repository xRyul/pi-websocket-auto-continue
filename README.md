# pi-websocket-auto-continue

Pi extension that automatically sends the literal user input `continue` after a settled WebSocket transport failure.

## Behavior

The extension matches only an assistant message with both:

```text
stopReason: "error"
errorMessage: "WebSocket error"
```

It records the result at `agent_end` and waits for `agent_settled` before acting. This lets Pi finish any built-in retry, compaction recovery, or already queued continuation first. If the final run still has the exact error, the extension sends:

```text
continue
```

A TUI warning is shown when the automatic continuation is triggered. Each later run that independently ends with the same exact error can trigger another continuation.

## Install

Install from npm:

```bash
pi install npm:pi-websocket-auto-continue
```

Or install the tagged GitHub release:

```bash
pi install git:github.com/xRyul/pi-websocket-auto-continue@v0.1.0
```

Run `/reload` in an existing Pi session, or restart Pi, to load it.

For local development, symlink this checkout into Pi's global extension directory:

```bash
ln -s "$PWD" ~/.pi/agent/extensions/pi-websocket-auto-continue
```

## Development

```bash
npm install
npm test
npm run typecheck
```

## Security

Pi extensions run with your user permissions. Review the source before installing third-party Pi packages.
