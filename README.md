# pi-websocket-auto-continue

When WebSocket error occurs automatically send "continue" as user input.

---

It records the result at `agent_end` and waits for `agent_settled` before acting. This allows pi to finish any:
 - built-in retry
 - recovery after compaction
 - queued continuation
It then reads the `stopReason` and `errorMessage`, which both must exactly match following:

```text
stopReason: "error"
errorMessage: "WebSocket error"
```

If all matches then it sends "continue" as user input e.g.:  

<img width="697" height="227" alt="image" src="https://github.com/user-attachments/assets/0c1ed511-6269-46e8-ba60-39402b693ef0" />


## Install

```bash
pi install npm:pi-websocket-auto-continue
```
