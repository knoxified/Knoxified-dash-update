// Browser-direct web call: mic -> WebSocket -> voice-agent worker -> speaker.
// No Twilio and no Telnyx are involved, so web calls cost no telephony fees.
//
// The worker speaks the same frame format Twilio's Media Streams use (JSON
// events carrying base64 8 kHz mu-law audio), so this client captures the mic,
// downsamples to 8 kHz, mu-law encodes it and sends it in that format, and
// plays back whatever mu-law audio the agent sends.

const VOICE_HOST = process.env.NEXT_PUBLIC_VOICE_STREAM_HOST || "https://voice.knoxified.org";

// Set NEXT_PUBLIC_WEBCALL_MODE=twilio to fall back to the Twilio browser call.
export const USE_DIRECT_WEBCALL = process.env.NEXT_PUBLIC_WEBCALL_MODE !== "twilio";

const MULAW_BIAS = 0x84;

function mulawToLinear(byte: number): number {
  const u = ~byte & 0xff;
  const sign = u & 0x80;
  const exponent = (u >> 4) & 0x07;
  const mantissa = u & 0x0f;
  const sample = (((mantissa << 3) + MULAW_BIAS) << exponent) - MULAW_BIAS;
  return sign ? -sample : sample;
}

// Runs on the audio thread: averages the mic signal down to 16 kHz and hands
// back 20 ms (320-sample) Int16 frames.
const WORKLET_SOURCE = `
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.phase = 0;
    this.acc = 0;
    this.count = 0;
    this.frame = new Int16Array(320);
    this.filled = 0;
  }
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;
    for (let i = 0; i < channel.length; i++) {
      this.acc += channel[i];
      this.count++;
      this.phase += 1;
      if (this.phase >= this.ratio) {
        this.phase -= this.ratio;
        const v = Math.max(-1, Math.min(1, this.acc / this.count));
        this.acc = 0;
        this.count = 0;
        this.frame[this.filled++] = (v * 32767) | 0;
        if (this.filled === 320) {
          this.port.postMessage(this.frame.slice());
          this.filled = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("capture-processor", CaptureProcessor);
`;

export interface DirectCallOptions {
  userId: string;
  systemTypeOverride?: string;
  // Fired only when the call ends WITHOUT the user pressing end (agent hung up,
  // connection dropped, mic lost).
  onClosed: () => void;
  onError: (message: string) => void;
}

export interface DirectCall {
  stop: () => void;
}

export async function startDirectWebCall(opts: DirectCallOptions): Promise<DirectCall> {
  // 1. Ask the worker (through the dashboard's proxy) for a call + signed token.
  //    This also checks the account exists and still has minutes.
  const startRes = await fetch("/api/voice/web-call/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: opts.userId,
      direct: true,
      ...(opts.systemTypeOverride ? { systemTypeOverride: opts.systemTypeOverride } : {}),
    }),
  });
  if (!startRes.ok) {
    const body = await startRes.json().catch(() => null);
    throw new Error(
      body?.error === "quota_exceeded"
        ? "You're out of voice minutes for this plan."
        : `Voice agent isn't ready yet (${startRes.status}).`
    );
  }
  const started = await startRes.json();
  const callId: string | undefined = started?.direct?.callId;
  const token: string | undefined = started?.direct?.token;
  if (!callId || !token) {
    throw new Error("The voice agent didn't return a call token. Make sure the latest voice agent is deployed.");
  }

  // 2. Microphone.
  let mic: MediaStream;
  try {
    mic = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch {
    throw new Error("Microphone access was blocked. Allow the mic for this site and try again.");
  }

  const ctx = new AudioContext({ latencyHint: "interactive" });
  await ctx.resume();

  const workletUrl = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "application/javascript" }));
  try {
    await ctx.audioWorklet.addModule(workletUrl);
  } finally {
    URL.revokeObjectURL(workletUrl);
  }
  const capture = new AudioWorkletNode(ctx, "capture-processor");
  const micSource = ctx.createMediaStreamSource(mic);
  micSource.connect(capture);

  // 3. WebSocket to the worker, authenticated by the signed token.
  const wsUrl =
    VOICE_HOST.replace(/^http/, "ws").replace(/\/$/, "") +
    `/voice/stream/${encodeURIComponent(callId)}?provider=browser&token=${encodeURIComponent(token)}`;
  const ws = new WebSocket(wsUrl);

  let stopped = false;
  let playHead = 0;
  const playing = new Set<AudioBufferSourceNode>();
  const streamSid = "browser";

  function teardown() {
    for (const node of playing) {
      try { node.stop(); } catch { /* already stopped */ }
    }
    playing.clear();
    try { capture.port.onmessage = null; capture.disconnect(); micSource.disconnect(); } catch { /* ignore */ }
    mic.getTracks().forEach((t) => t.stop());
    ctx.close().catch(() => { /* already closed */ });
  }

  function finish(userInitiated: boolean) {
    if (stopped) return;
    stopped = true;
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: "stop", streamSid }));
      }
      ws.close();
    } catch { /* ignore */ }
    teardown();
    if (!userInitiated) opts.onClosed();
  }

  function playMulaw(base64: string) {
    const binary = atob(base64);
    const buffer = ctx.createBuffer(1, binary.length, 8000);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < binary.length; i++) data[i] = mulawToLinear(binary.charCodeAt(i)) / 32768;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    const now = ctx.currentTime;
    if (playHead < now + 0.02) playHead = now + 0.05; // small jitter buffer
    source.start(playHead);
    playHead += buffer.duration;
    playing.add(source);
    source.onended = () => playing.delete(source);
  }

  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error("Couldn't connect to the voice agent. Check your connection and try again."));
    ws.onclose = (e) => {
      if (e.code === 1006 || e.code === 1008) reject(new Error("The voice agent refused the call. Try again."));
    };
  }).catch((err) => {
    stopped = true;
    teardown();
    try { ws.close(); } catch { /* ignore */ }
    throw err;
  });

  ws.onerror = () => {
    if (!stopped) opts.onError("The connection to the voice agent was lost.");
  };
  ws.onclose = () => finish(false);
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data as string);
      if (msg.event === "media" && msg.media?.payload) playMulaw(msg.media.payload);
    } catch { /* ignore non-JSON frames */ }
  };

  ws.send(JSON.stringify({
    event: "start",
    streamSid,
    // 16 kHz linear PCM from the mic: far better recognition than 8 kHz mu-law.
    start: { streamSid, callSid: callId, customParameters: {}, mediaFormat: { encoding: "audio/l16", sampleRate: 16000, channels: 1 } },
  }));

  capture.port.onmessage = (event: MessageEvent<Int16Array>) => {
    if (stopped || ws.readyState !== WebSocket.OPEN) return;
    const bytes = new Uint8Array(event.data.buffer, event.data.byteOffset, event.data.byteLength);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    ws.send(JSON.stringify({ event: "media", streamSid, media: { track: "inbound", payload: btoa(bin) } }));
  };

  return { stop: () => finish(true) };
}
