import test from 'node:test';
import assert from 'node:assert/strict';
import { SharedVoice } from '../public/voice.js';
import { setMicrophone, closeMedia, VoiceFeedback } from '../public/voice-utils.mjs';
function stream(name) {
  const track = { name, enabled: true, stopped: false, stop() { this.stopped = true; } };
  return { track, getAudioTracks: () => [track], getTracks: () => [track] };
}
test('media cleanup disables/stops every track and closes playback/connections', () => {
  const mic = stream('mic'); const closed = []; const audio = { srcObject: mic, pause() { closed.push('audio'); } };
  setMicrophone(mic, false); assert.equal(mic.track.enabled, false);
  closeMedia({ stream: mic, connections: [{ close() { closed.push('peer'); } }], context: { state: 'running', close() { closed.push('context'); } }, audio });
  assert.equal(mic.track.stopped, true); assert.equal(audio.srcObject, null); assert.deepEqual(closed, ['peer', 'audio', 'context']);
});
test('microphone grant arriving after cancellation is immediately stopped', async () => {
  let grant;
  const mic = stream('mic'); const state = { voiceAvailable: true, voice: { generation: 'g', commands: [] } };
  const client = new SharedVoice({ actor: 'B', state: () => state, request: async () => ({}), audio: { pause() {} }, notice() {},
    dependencies: { navigator: { mediaDevices: { getUserMedia: () => new Promise(resolve => { grant = resolve; }) } }, RTCPeerConnection: class {} } });
  const connecting = client.start(); await client.disconnect(); grant(mic); await connecting;
  assert.equal(mic.track.stopped, true); assert.equal(client.connected, false);
});
test('host mixes only partner microphones into Live, sends Guide plus A to B, and obeys stop', async () => {
  const sources = []; const pcs = []; const mic = stream('A'); const notices = []; const calls = [];
  let destinationIndex = 0;
  class Context {
    state = 'running'; destination = { name: 'speaker' };
    async resume() {} async close() { this.state = 'closed'; }
    createMediaStreamDestination() { return { name: 'dest' + ++destinationIndex, stream: stream('mix' + destinationIndex) }; }
    createMediaStreamSource(input) { const node = { input, targets: [], connect(target) { this.targets.push(target); } }; sources.push(node); return node; }
  }
  class Peer {
    constructor() { pcs.push(this); }
    connectionState = 'connected'; iceGatheringState = 'complete'; tracks = [];
    addTrack(track) { this.tracks.push(track); }
    createDataChannel() { return { readyState: 'open', send() {} }; }
    async createOffer() { return { type: 'offer', sdp: 'v=0' }; }
    async setLocalDescription(d) { this.localDescription = d; }
    async setRemoteDescription(d) { this.remoteDescription = d; }
    close() { this.connectionState = 'closed'; }
  }
  let state = { voiceAvailable: true, status: 'active', phase: 'AQ', voice: { generation: 'g', online: ['A', 'B'], commands: [], signals: [], turn: null } };
  const request = async (action, body) => { calls.push({ action, body }); if (action === 'start') return { sessionId: 'live_test', sdp: 'v=0 answer' }; if (action === 'begin') state.voice.turn = { id: 'turn', speaker: 'A', recording: true }; return state; };
  const client = new SharedVoice({ actor: 'A', request, state: () => state, audio: { pause() {} }, notice: text => notices.push(text),
    dependencies: { navigator: { mediaDevices: { getUserMedia: async () => mic } }, RTCPeerConnection: Peer, AudioContext: Context } });
  await client.start(); assert.equal(mic.track.enabled, false);
  assert.equal(pcs[0].tracks[0].name, 'mix1');
  pcs[0].ontrack({ streams: [stream('Guide')] });
  assert.deepEqual(sources[1].targets.map(x => x.name), ['speaker', 'dest2']);
  await client.sync(state); assert.equal(pcs[1].tracks[0].name, 'mix2');
  pcs[1].ontrack({ streams: [stream('B')] });
  assert.deepEqual(sources[2].targets.map(x => x.name), ['dest1', 'speaker']);
  await client.begin(); assert.equal(mic.track.enabled, true);
  await client.finish(); assert.equal(mic.track.enabled, false);
  state = { ...state, status: 'stopped' }; await client.sync(state);
  assert.equal(mic.track.stopped, true); assert.equal(client.connected, false);
  assert.equal(pcs.every(p => p.connectionState === 'closed'), true);
});


test('microphone feedback warns at three seconds and recovers when sound arrives', () => {
  let now = 0; const feedback = new VoiceFeedback(() => now);
  feedback.listen('one');
  now = 2999; assert.equal(feedback.sample().warning, false);
  now = 3000; assert.match(feedback.sample().message, /can’t hear you/);
  now = 3100; const heard = feedback.sample(0.1);
  assert.equal(heard.warning, false); assert.equal(heard.level, 40);
  now = 6100; assert.match(feedback.sample(0.1).message, /no transcript/);
  feedback.updateTranscript('Hello there');
  assert.equal(feedback.sample(0.1).warning, false);
  assert.equal(feedback.sample(0.1).transcript, 'Hello there');
  now = 9100; assert.match(feedback.sample().message, /can’t hear you/);
  feedback.finish(); assert.equal(feedback.sample().level, 0);
  assert.equal(feedback.sample().warning, false);
  feedback.listen('two'); assert.equal(feedback.sample().transcript, '');
});

test('AI response timeout is separate from microphone input and clears on reply or disconnect', () => {
  let now = 0; const feedback = new VoiceFeedback(() => now);
  feedback.waitForReply('Earlier output');
  now = 3000; assert.match(feedback.sample().message, /AI hasn’t responded/);
  feedback.receiveReply('Earlier output'); assert.equal(feedback.sample().warning, true);
  feedback.receiveReply('Earlier output New words'); assert.equal(feedback.sample().warning, false);
  feedback.waitForReply('x'); now = 6000; assert.equal(feedback.sample().warning, true);
  feedback.reset(); assert.equal(feedback.sample().warning, false);
  assert.equal(feedback.sample().recording, false);
});


test('review mutes immediately and stale recording state cannot re-enable the microphone', async () => {
  const mic = stream('mic');
  let rejectFinish;
  const state = { experience: 'solo', status: 'active', voice: { generation: 'g', online: ['A'], commands: [], signals: [], turn: { id: 'turn', speaker: 'A', recording: true } } };
  const client = new SharedVoice({ actor: 'A', state: () => state, audio: { pause() {} }, notice() {}, request: async () => new Promise((_, reject) => { rejectFinish = reject; }) });
  client.connected = true; client.generation = 'g'; client.channel = { readyState: 'open' }; client.stream = mic; client.localRecordingTurn = 'turn';
  const finish = client.finish();
  assert.equal(mic.track.enabled, false);
  await client.sync(state);
  assert.equal(mic.track.enabled, false);
  rejectFinish(Error('network interrupted'));
  await assert.rejects(finish, /network interrupted/);
  assert.equal(mic.track.enabled, false);
});
