export function setMicrophone(stream, enabled) {
  for (const track of stream?.getAudioTracks() || []) track.enabled = enabled;
}
export function closeMedia({ stream, connections = [], context, audio } = {}) {
  setMicrophone(stream, false);
  for (const track of stream?.getTracks() || []) track.stop();
  for (const connection of connections) connection?.close();
  if (audio) { audio.pause(); audio.srcObject = null; }
  if (context && context.state !== 'closed') void context.close();
}
export async function gatherIce(connection) {
  if (connection.iceGatheringState === 'complete') return;
  await new Promise((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); connection.removeEventListener('icegatheringstatechange', changed); };
    const changed = () => { if (connection.iceGatheringState === 'complete') { cleanup(); resolve(); } };
    const timer = setTimeout(() => { cleanup(); reject(Error('Audio network negotiation timed out. Try reconnecting.')); }, 10000);
    connection.addEventListener('icegatheringstatechange', changed);
  });
}

// Local signal detection and provider feedback are separate: a moving meter
// confirms microphone input, not successful delivery or transcription.
export class VoiceFeedback {
  constructor(now = () => performance.now()) { this.now = now; this.reset(); }
  reset() { this.recording = false; this.turn = null; this.transcript = ''; this.awaiting = null; this.lastSound = null; this.firstSound = null; }
  listen(turn) {
    if (this.turn !== turn) { this.turn = turn; this.transcript = ''; this.started = this.now(); this.lastSound = null; this.firstSound = null; }
    this.recording = true; this.awaiting = null;
  }
  finish() { this.recording = false; }
  waitForReply(output = '') { this.recording = false; this.awaiting = this.now(); this.previousOutput = output; }
  receiveReply(output) { if (this.awaiting !== null && output !== this.previousOutput) this.awaiting = null; }
  updateTranscript(text) { this.transcript = text || ''; }
  sample(rms = 0) {
    const now = this.now();
    if (this.recording && rms >= 0.015) { this.lastSound = now; this.firstSound ??= now; }
    let message = this.recording ? 'Listening… Speak into your microphone.' : 'Microphone off.';
    let warning = false;
    if (this.recording) {
      if (now - (this.lastSound ?? this.started) >= 3000) { message = 'I can’t hear you. Check your microphone, speak closer, or choose the correct input device.'; warning = true; }
      else if (this.firstSound !== null && !this.transcript.trim() && now - this.firstSound >= 3000) { message = 'Microphone sound detected, but no transcript has arrived from the AI yet. Check the connection or reconnect voice.'; warning = true; }
      else if (this.transcript.trim()) message = 'Speech received · transcript arriving below.';
      else if (this.lastSound !== null) message = 'Microphone sound detected · waiting for transcript…';
    } else if (this.awaiting !== null) {
      warning = now - this.awaiting >= 3000;
      message = warning ? 'The AI hasn’t responded yet. Please wait, or use Ask voice guide to retry.' : 'Waiting for the AI response…';
    }
    return { level: this.recording ? Math.min(100, Math.round(rms * 400)) : 0, recording: this.recording, transcript: this.transcript, message, warning };
  }
}
