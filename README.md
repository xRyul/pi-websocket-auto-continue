# pi-websocket-auto-continue

Automatically send "continue" as user input after a WebSocket error or idle timeout.

---

It records the result at `agent_end` and waits for `agent_settled` before acting. This allows pi to finish any:
 - built-in retry
 - recovery after compaction
 - queued continuation

It checks the final assistant message. `stopReason` must be `"error"`, and `errorMessage` must be either:

- Exactly `WebSocket error`.
- `WebSocket idle timeout after <digits>ms`, for example `WebSocket idle timeout after 60000ms`.

Aborted runs and other errors do not trigger continuation.

When either message matches, it sends "continue" as user input:

<img width="697" height="227" alt="image" src="https://github.com/user-attachments/assets/0c1ed511-6269-46e8-ba60-39402b693ef0" />


## Install

```bash
pi install npm:pi-websocket-auto-continue
```
