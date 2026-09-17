import type {
	AgentEndEvent,
	ExtensionAPI,
} from "@earendil-works/pi-coding-agent";

const WEBSOCKET_ERROR = "WebSocket error";
const CONTINUE_INPUT = "continue";

function endedWithWebSocketError(messages: AgentEndEvent["messages"]): boolean {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (message?.role !== "assistant") continue;

		return (
			message.stopReason === "error" &&
			(message.errorMessage === WEBSOCKET_ERROR ||
				/^WebSocket idle timeout after \d+ms$/.test(message.errorMessage ?? ""))
		);
	}

	return false;
}

export default function websocketAutoContinueExtension(pi: ExtensionAPI): void {
	let continueAfterSettling = false;

	pi.on("agent_end", (event) => {
		continueAfterSettling = endedWithWebSocketError(event.messages);
	});

	pi.on("agent_settled", (_event, ctx) => {
		if (!continueAfterSettling) return;
		continueAfterSettling = false;

		if (ctx.hasUI) {
			ctx.ui.notify(
				"WebSocket error detected; continuing automatically.",
				"warning",
			);
		}

		pi.sendUserMessage(CONTINUE_INPUT, { deliverAs: "followUp" });
	});
}
