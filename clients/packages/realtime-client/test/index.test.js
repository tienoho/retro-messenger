import { describe, it } from "node:test";
import assert from "node:assert";
import { RetroRealtimeClient } from "../src/index.ts";

function triggerSignalREvent(client, eventName, ...args) {
  const handlers = client.connection._methods[eventName.toLowerCase()];
  if (handlers) {
    for (const handler of handlers) {
      handler(...args);
    }
  }
}

describe("RetroRealtimeClient", () => {
  it("should initialize and expose call signaling methods and listener registrations", () => {
    const client = new RetroRealtimeClient("http://localhost:5000/realtime");
    assert.strictEqual(typeof client.startCall, "function");
    assert.strictEqual(typeof client.endCall, "function");
    assert.strictEqual(typeof client.joinCall, "function");
    assert.strictEqual(typeof client.onCallStarted, "function");
    assert.strictEqual(typeof client.onCallEnded, "function");
    assert.strictEqual(typeof client.onParticipantJoined, "function");
    assert.strictEqual(typeof client.onParticipantLeft, "function");
    assert.strictEqual(typeof client.sendCallOffer, "function");
    assert.strictEqual(typeof client.sendCallAnswer, "function");
    assert.strictEqual(typeof client.sendIceCandidate, "function");
    assert.strictEqual(typeof client.onCallOffer, "function");
    assert.strictEqual(typeof client.onCallAnswer, "function");
    assert.strictEqual(typeof client.onIceCandidate, "function");
    assert.strictEqual(typeof client.onReconnected, "function");
  });

  it("notifies reconnect listeners", () => {
    const client = new RetroRealtimeClient("http://localhost:5000/realtime");
    let receivedConnectionId = null;
    client.onReconnected(connectionId => {
      receivedConnectionId = connectionId;
    });

    for (const callback of client.connection._reconnectedCallbacks) {
      callback("connection-2");
    }

    assert.strictEqual(receivedConnectionId, "connection-2");
  });

  it("should invoke StartCall, EndCall, and JoinCall with correct positional signatures", async () => {
    const client = new RetroRealtimeClient("http://localhost:5000/realtime");
    const invocations = [];
    client.connection.invoke = async (methodName, ...args) => {
      invocations.push({ methodName, args });
    };

    await client.startCall("conv-101", "video");
    assert.deepStrictEqual(invocations[0], {
      methodName: "StartCall",
      args: ["conv-101", "video"],
    });

    await client.startCall("conv-101");
    assert.deepStrictEqual(invocations[1], {
      methodName: "StartCall",
      args: ["conv-101", "audio"],
    });

    await client.endCall("conv-102");
    assert.deepStrictEqual(invocations[2], {
      methodName: "EndCall",
      args: ["conv-102"],
    });

    await client.joinCall("conv-103");
    assert.deepStrictEqual(invocations[3], {
      methodName: "JoinCall",
      args: ["conv-103"],
    });
  });

  it("should correctly unpack CallStarted event argument indices", () => {
    const client = new RetroRealtimeClient("http://localhost:5000/realtime");
    let received = null;
    client.onCallStarted((evt) => {
      received = evt;
    });

    // Backend broadcasts (conversationId, initiatorId, roomName, callType)
    triggerSignalREvent(client, "CallStarted", "conv-201", "user-initiator", "room-201", "video");

    assert.ok(received);
    assert.strictEqual(received.conversationId, "conv-201");
    assert.strictEqual(received.callerId, "user-initiator");
    assert.strictEqual(received.roomName, "room-201");
    assert.strictEqual(received.callType, "video");
    assert.ok(received.startedAt);
  });

  it("should correctly unpack CallEnded event argument indices", () => {
    const client = new RetroRealtimeClient("http://localhost:5000/realtime");
    let received = null;
    client.onCallEnded((evt) => {
      received = evt;
    });

    // Backend broadcasts (conversationId, endedById)
    triggerSignalREvent(client, "CallEnded", "conv-202", "user-ender");

    assert.ok(received);
    assert.strictEqual(received.conversationId, "conv-202");
    assert.strictEqual(received.endedById, "user-ender");
    assert.strictEqual(received.roomName, "conv_conv-202");
    assert.ok(received.endedAt);
  });

  it("should correctly unpack ParticipantJoined event argument indices", () => {
    const client = new RetroRealtimeClient("http://localhost:5000/realtime");
    let received = null;
    client.onParticipantJoined((evt) => {
      received = evt;
    });

    // Backend broadcasts (conversationId, userId)
    triggerSignalREvent(client, "ParticipantJoined", "conv-203", "user-participant");

    assert.ok(received);
    assert.strictEqual(received.conversationId, "conv-203");
    assert.strictEqual(received.userId, "user-participant");
    assert.strictEqual(received.roomName, "conv_conv-203");
    assert.ok(received.joinedAt);
  });

  it("should correctly unpack ParticipantLeft event argument indices", () => {
    const client = new RetroRealtimeClient("http://localhost:5000/realtime");
    let received = null;
    client.onParticipantLeft((evt) => {
      received = evt;
    });

    // Backend broadcasts (conversationId, userId)
    triggerSignalREvent(client, "ParticipantLeft", "conv-204", "user-leaving");

    assert.ok(received);
    assert.strictEqual(received.conversationId, "conv-204");
    assert.strictEqual(received.userId, "user-leaving");
    assert.strictEqual(received.roomName, "conv_conv-204");
    assert.ok(received.leftAt);
  });

  it("should correctly unpack CallOffer, CallAnswer, and IceCandidate events", () => {
    const client = new RetroRealtimeClient("http://localhost:5000/realtime");
    let receivedOffer = null;
    let receivedAnswer = null;
    let receivedIce = null;

    client.onCallOffer((evt) => {
      receivedOffer = evt;
    });
    client.onCallAnswer((evt) => {
      receivedAnswer = evt;
    });
    client.onIceCandidate((evt) => {
      receivedIce = evt;
    });

    triggerSignalREvent(client, "CallOfferReceived", "conv-301", "peer-1", "mock-sdp-offer");
    triggerSignalREvent(client, "CallAnswerReceived", "conv-301", "peer-2", "mock-sdp-answer");
    triggerSignalREvent(client, "IceCandidateReceived", "conv-301", "peer-1", "candidate:1", "audio", 0);

    assert.ok(receivedOffer);
    assert.strictEqual(receivedOffer.conversationId, "conv-301");
    assert.strictEqual(receivedOffer.senderId, "peer-1");
    assert.strictEqual(receivedOffer.sdp, "mock-sdp-offer");

    assert.ok(receivedAnswer);
    assert.strictEqual(receivedAnswer.conversationId, "conv-301");
    assert.strictEqual(receivedAnswer.senderId, "peer-2");
    assert.strictEqual(receivedAnswer.sdp, "mock-sdp-answer");

    assert.ok(receivedIce);
    assert.strictEqual(receivedIce.conversationId, "conv-301");
    assert.strictEqual(receivedIce.senderId, "peer-1");
    assert.strictEqual(receivedIce.candidate, "candidate:1");
    assert.strictEqual(receivedIce.sdpMid, "audio");
    assert.strictEqual(receivedIce.sdpMLineIndex, 0);
  });

  it("should safely handle subscribeConversation when disconnected and resubscribe on reconnect", async () => {
    const client = new RetroRealtimeClient("http://localhost:5000/realtime");
    const invocations = [];
    client.connection.invoke = async (methodName, ...args) => {
      invocations.push({ methodName, args });
    };

    // When disconnected (default HubConnectionState.Disconnected)
    await client.subscribeConversation("conv-401");
    // Should NOT throw, but records the subscription without calling invoke yet
    assert.strictEqual(invocations.length, 0);

    // Simulate connection becomes Connected
    client.connection._connectionState = "Connected";
    await client.subscribeConversation("conv-402");
    assert.strictEqual(invocations.length, 1);
    assert.deepStrictEqual(invocations[0], {
      methodName: "SubscribeConversation",
      args: ["conv-402"],
    });

    // Simulate reconnection triggers resubscribe of all recorded conversations
    invocations.length = 0;
    for (const callback of client.connection._reconnectedCallbacks) {
      await callback("connection-reconnected");
    }

    assert.strictEqual(invocations.length, 2);
    const subscribed = invocations.map(inv => inv.args[0]);
    assert.ok(subscribed.includes("conv-401"));
    assert.ok(subscribed.includes("conv-402"));
  });

  it("should safely no-op for markRead and typing indicators when disconnected", async () => {
    const client = new RetroRealtimeClient("http://localhost:5000/realtime");
    let called = false;
    client.connection.invoke = async () => {
      called = true;
    };

    await client.markRead("conv-501", 10);
    await client.startTyping("conv-501");
    await client.stopTyping("conv-501");

    assert.strictEqual(called, false);
  });
});
