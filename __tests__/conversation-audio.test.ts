jest.mock("react", () => ({
  useState: jest.fn(),
  useRef: jest.fn(),
  useCallback: jest.fn((callback) => callback),
}));

import { useCallback, useRef, useState } from "react";
import { useConversation } from "../src/hooks/useConversation";
import { createInitialState } from "../src/lib/conversation/agent";

class MockAudio {
  static instances: MockAudio[] = [];
  src: string;
  onplaying: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = jest.fn().mockResolvedValue(undefined);
  pause = jest.fn();
  removeAttribute = jest.fn();
  load = jest.fn();

  constructor(src: string) {
    this.src = src;
    MockAudio.instances.push(this);
  }
}

const updatedState = {
  ...createInitialState(),
  messages: [{ role: "assistant" as const, content: "Your move is ready.", timestamp: "now" }],
};

function makeAgentResponse() {
  return {
    ok: true,
    json: async () => ({ assistantMessage: "Your move is ready.", updatedState }),
  };
}

function makeSpeechResponse(blob = new Blob(["audio"])) {
  return { ok: true, blob: jest.fn().mockResolvedValue(blob) };
}

async function waitFor(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error("Condition was not met before timeout");
}

describe("useConversation voice playback", () => {
  let values: unknown[];
  let valueIndex: number;
  let phase: string;
  let currentError: string | null;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    values = [];
    valueIndex = 0;
    phase = "idle";
    currentError = null;
    MockAudio.instances = [];

    (useState as jest.Mock).mockImplementation((initialValue) => {
      const index = valueIndex++;
      if (index >= values.length) {
        values[index] = typeof initialValue === "function" ? initialValue() : initialValue;
      }
      return [values[index], (nextValue: unknown) => {
        values[index] = typeof nextValue === "function"
          ? (nextValue as (value: unknown) => unknown)(values[index])
          : nextValue;
        if (index === 1) phase = values[index] as string;
        if (index === 2) currentError = values[index] as string | null;
      }];
    });
    (useRef as jest.Mock).mockImplementation((initialValue) => ({ current: initialValue }));
    (useCallback as jest.Mock).mockImplementation((callback) => callback);

    Object.defineProperty(globalThis, "Audio", { configurable: true, value: MockAudio });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: jest.fn(() => "blob:move-mate-test"),
    });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: jest.fn() });

    fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("requests TTS once for each AI response", async () => {
    fetchMock
      .mockResolvedValueOnce(makeAgentResponse())
      .mockResolvedValueOnce(makeSpeechResponse());
    const conversation = useConversation();

    const pending = conversation.sendMessage("Hello");
    await waitFor(() => MockAudio.instances.length === 1);
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/speech")).toHaveLength(1);
    MockAudio.instances[0].onended?.();
    await pending;
  });

  test("keeps the text response when TTS fails", async () => {
    fetchMock
      .mockResolvedValueOnce(makeAgentResponse())
      .mockRejectedValueOnce(new Error("TTS unavailable"));
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const conversation = useConversation();

    await conversation.sendMessage("Hello");

    expect(values[0]).toEqual(updatedState);
    expect(currentError).toBeNull();
    expect(phase).toBe("idle");
  });

  test("does not enter speaking until audio playback starts", async () => {
    fetchMock
      .mockResolvedValueOnce(makeAgentResponse())
      .mockResolvedValueOnce(makeSpeechResponse());
    const conversation = useConversation();

    const pending = conversation.sendMessage("Hello");
    await waitFor(() => MockAudio.instances.length === 1);
    expect(phase).toBe("preparing");

    MockAudio.instances[0].onplaying?.();
    expect(phase).toBe("speaking");
    MockAudio.instances[0].onended?.();
    await pending;
    expect(phase).toBe("idle");
  });

  test("does not play a stale response after a newer turn starts", async () => {
    const pendingSpeech: Array<(response: ReturnType<typeof makeSpeechResponse>) => void> = [];
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/agent") return Promise.resolve(makeAgentResponse());
      return new Promise((resolve) => pendingSpeech.push(resolve));
    });
    const conversation = useConversation();

    const firstTurn = conversation.sendMessage("First");
    await waitFor(() => pendingSpeech.length === 1);
    const firstSignal = fetchMock.mock.calls.find(([url]) => url === "/api/speech")?.[1].signal as AbortSignal;

    const secondTurn = conversation.sendMessage("Second");
    await waitFor(() => pendingSpeech.length === 2);
    expect(firstSignal.aborted).toBe(true);

    pendingSpeech[1](makeSpeechResponse());
    await waitFor(() => MockAudio.instances.length === 1);
    const staleBlob = makeSpeechResponse();
    pendingSpeech[0](staleBlob);
    await firstTurn;

    expect(staleBlob.blob).not.toHaveBeenCalled();
    expect(MockAudio.instances).toHaveLength(1);
    MockAudio.instances[0].onended?.();
    await secondTurn;
  });
});
