import assert from "node:assert/strict";
import test from "node:test";

import websocketAutoContinueExtension from "./index.ts";

function createHarness({ hasUI = true } = {}) {
	const handlers = new Map();
	const notifications = [];
	const sentMessages = [];

	websocketAutoContinueExtension({
		on(eventName, handler) {
			const eventHandlers = handlers.get(eventName) ?? [];
			eventHandlers.push(handler);
			handlers.set(eventName, eventHandlers);
		},
		sendUserMessage(content, options) {
			sentMessages.push({ content, options });
		},
	});

	const context = {
		hasUI,
		ui: {
			notify(message, level) {
				notifications.push({ message, level });
			},
		},
	};

	async function emit(eventName, event = { type: eventName }) {
		for (const handler of handlers.get(eventName) ?? []) {
			await handler(event, context);
		}
	}

	return { emit, notifications, sentMessages };
}

function assistantMessage(stopReason, errorMessage) {
	return { role: "assistant", stopReason, errorMessage };
}

test("sends one continue input after an exact settled WebSocket error", async () => {
	const harness = createHarness();

	await harness.emit("agent_end", {
		type: "agent_end",
		messages: [
			{ role: "user", content: "work" },
			assistantMessage("error", "WebSocket error"),
		],
	});

	assert.deepEqual(harness.sentMessages, []);

	await harness.emit("agent_settled");

	assert.deepEqual(harness.sentMessages, [
		{ content: "continue", options: { deliverAs: "followUp" } },
	]);
	assert.deepEqual(harness.notifications, [
		{
			message: "WebSocket error detected; continuing automatically.",
			level: "warning",
		},
	]);

	await harness.emit("agent_settled");
	assert.equal(harness.sentMessages.length, 1);
});

test("sends one continue input after settled WebSocket idle timeouts without UI", async () => {
	for (const timeoutMs of [60000, 120000]) {
		const harness = createHarness({ hasUI: false });

		await harness.emit("agent_end", {
			type: "agent_end",
			messages: [
				assistantMessage("error", `WebSocket idle timeout after ${timeoutMs}ms`),
			],
		});
		assert.deepEqual(harness.sentMessages, []);

		await harness.emit("agent_settled");
		await harness.emit("agent_settled");

		assert.deepEqual(harness.sentMessages, [
			{ content: "continue", options: { deliverAs: "followUp" } },
		]);
		assert.deepEqual(harness.notifications, []);
	}
});

test("does not continue when a built-in retry succeeds before settling", async () => {
	const harness = createHarness();

	await harness.emit("agent_end", {
		type: "agent_end",
		messages: [assistantMessage("error", "WebSocket error")],
	});
	await harness.emit("agent_end", {
		type: "agent_end",
		messages: [assistantMessage("stop")],
	});
	await harness.emit("agent_settled");

	assert.deepEqual(harness.sentMessages, []);
});

test("matches only supported errors and the final assistant message", async (t) => {
	const nonMatches = [
		assistantMessage("error", "WebSocket errror"),
		assistantMessage("error", "websocket error"),
		assistantMessage("error", "WebSocket error "),
		assistantMessage("aborted", "WebSocket error"),
		assistantMessage("aborted", "WebSocket idle timeout after 60000ms"),
		assistantMessage("stop", "WebSocket idle timeout after 60000ms"),
		assistantMessage("error", "HTTP idle timeout after 60000ms"),
		assistantMessage("error", "WebSocket idle timeout after soon"),
		assistantMessage("error", "WebSocket idle timeout after 60000ms extra"),
		assistantMessage("error"),
	];

	for (const message of nonMatches) {
		await t.test(`${message.stopReason}: ${message.errorMessage}`, async () => {
			const harness = createHarness();
			await harness.emit("agent_end", {
				type: "agent_end",
				messages: [message],
			});
			await harness.emit("agent_settled");
			assert.deepEqual(harness.sentMessages, []);
		});
	}

	await t.test("later successful assistant message wins", async () => {
		const harness = createHarness();
		await harness.emit("agent_end", {
			type: "agent_end",
			messages: [
				assistantMessage("error", "WebSocket error"),
				assistantMessage("stop"),
			],
		});
		await harness.emit("agent_settled");
		assert.deepEqual(harness.sentMessages, []);
	});
});
