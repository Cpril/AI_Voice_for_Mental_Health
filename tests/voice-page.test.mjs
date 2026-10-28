import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = (await readFile(new URL('../public/app.js', import.meta.url), 'utf8')).replace("import { SharedVoice } from './voice.js';", '');
const settle = async () => { for (let i = 0; i < 8; i++) await new Promise(r => setImmediate(r)); };
function harness() {
  const nodes = new Map(), handlers = {}, calls = [], clients = [];
  let poll;
  const node = () => ({ hidden: false, disabled: false, textContent: '', value: '', scrollHeight: 0, scrollTop: 0, clientHeight: 0, children: [], classList: { toggle() {} }, append(...children) { this.children.push(...children); }, replaceChildren() { this.children = []; } });
  const $ = id => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); };
  const state = { actor: 'A', experience: 'solo', modality: 'voice', voiceAvailable: true, mode: 'openai', phase: 'rapport', title: 'Getting comfortable', status: 'active', joined: ['A'], responded: [], ready: [], busy: false, events: [{ id: 1, type: 'message', actor: 'Guide', text: 'Hello' }], voice: { generation: 'g', connected: false, commands: [], output: '', turn: null } };
  const document = { hidden: false, getElementById: $, createElement: node, createTextNode: text => ({ textContent: text }), addEventListener(name, fn) { handlers[name] = fn; } };
  class Voice {
    constructor() { clients.push(this); this.connected = false; this.ready = false; this.starting = false; this.muted = true; this.starts = 0; }
    async start() { this.starts++; this.connected = this.ready = state.voice.connected = true; }
    async sync() {}
    mute() { this.muted = true; }
    async disconnect() { this.mute(); this.connected = this.ready = state.voice.connected = false; }
    async begin() { this.muted = false; state.voice.turn = { id: 'turn', speaker: 'A', recording: true, text: 'My words' }; return structuredClone(state); }
    async finish() { this.mute(); state.voice.turn.recording = false; return structuredClone(state); }
    waitForReply() {}
    closeImmediately() { this.mute(); }
  }
  const context = { SharedVoice: Voice, URLSearchParams, location: { hash: '#token=participant&actor=A', origin: 'http://localhost:8787' }, document, window: { addEventListener(name, fn) { handlers[name] = fn; } }, setInterval(fn) { poll = fn; return 1; }, clearInterval() {}, setTimeout, confirm: () => true, fetch: async (url, options = {}) => {
    const route = url.replace('/api/', ''); const body = options.body ? JSON.parse(options.body) : undefined; calls.push({ route, body });
    if (route === 'voice/share') { state.events.push({ id: 2, type: 'message', actor: 'A', text: body.text }); state.voice.turn = null; }
    if (route === 'message') state.events.push({ id: state.events.length + 1, type: 'message', actor: 'A', text: body.text });
    return { ok: true, json: async () => structuredClone(route === 'config' ? { voiceAvailable: true, liveModel: 'gpt-live-1' } : state) };
  } };
  vm.runInNewContext(source, context);
  return { $, state, clients, calls, document, handlers, poll: () => poll() };
}

test('voice page connects automatically once, and explicit disconnect stays off across polls', async () => {
  const h = harness(); await settle();
  assert.equal(h.clients.length, 1); assert.equal(h.clients[0].starts, 1);
  assert.equal(h.clients[0].muted, true);
  assert.equal(h.$('voice-connect').hidden, true);
  await h.$('voice-disconnect').onclick(); await h.poll(); await settle();
  assert.equal(h.clients[0].starts, 1);
  assert.equal(h.$('voice-connect').hidden, false);
});

test('voice uses only the review composer and one Send action; hidden tabs mute', async () => {
  const h = harness(); await settle();
  await h.$('voice-speak').onclick();
  assert.equal(h.clients[0].muted, false);
  h.document.hidden = true; h.handlers.visibilitychange(); await settle();
  assert.equal(h.clients[0].muted, true);
  assert.equal(h.state.voice.turn.recording, false);
  h.$('voice-transcript').value = 'Corrected words'; h.$('voice-transcript').oninput();
  await h.$('send').onclick();
  assert.equal(h.calls.find(c => c.route === 'voice/share').body.text, 'Corrected words');
  assert.equal(h.calls.filter(c => c.route === 'guide').length, 0);
  assert.equal(h.$('text-composer').hidden, true);
  assert.equal(h.$('send').disabled, true);
  assert.equal(h.calls.filter(c => c.route === 'message' || c.route === 'guide').length, 0);
});

test('AI message boxes update for streaming fragments even when the number of messages is unchanged', async () => {
  const h = harness(); await settle();
  assert.equal(h.$('messages').children[0].children[1].textContent, 'Hello');
  h.state.events[0].text = 'Hello again';
  await h.poll(); await settle();
  assert.equal(h.$('messages').children[0].children[1].textContent, 'Hello again');
});


test('stop closes audio immediately and shows the participant summary', async () => {
  const h = harness(); await settle();
  await h.$('voice-speak').onclick();
  h.state.status = 'stopped'; h.state.summaryStatus = 'complete'; h.state.finalSummary = 'You shared what made your day better.';
  await h.$('stop').onclick();
  assert.equal(h.clients[0].muted, true);
  assert.equal(h.calls.filter(c => c.route === 'stop').length, 1);
  assert.equal(h.$('session-summary').hidden, false);
  assert.equal(h.$('summary-text').textContent, h.state.finalSummary);
});
