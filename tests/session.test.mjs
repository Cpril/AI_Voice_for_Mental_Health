import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.mjs';
import { SEQUENCES } from '../study.mjs';
async function fixture(t, options = {}) {
  const app = createApp({ mode: 'demo', ...options });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => app.server.close(resolve)));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  async function call(route, body, token) {
    const res = await fetch(base + '/api/' + route, { method: body === undefined ? 'GET' : 'POST', headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: res.status, data: await res.json() };
  }
  return { ...app, call };
}
async function joined(call, condition) {
  const { data: room } = await call('create', { condition });
  await call('join', { consent: true }, room.participants.A); await call('join', { consent: true }, room.participants.B); return room;
}
for (const condition of ['PS', 'DS', 'BP']) test(`${condition}: phases, two-party advancement, completion/export`, async t => {
  const { call } = await fixture(t); const room = await joined(call, condition);
  for (const phase of SEQUENCES[condition]) {
    const before = (await call('state', undefined, room.participants.A)).data;
    assert.equal(before.phase, phase); assert.equal(before.condition, undefined); assert.equal(before.participants, undefined);
    assert.equal((await call('ready', { phase }, room.participants.A)).status, 400);
    assert.equal((await call('ready', { phase, skip: true }, room.participants.A)).data.phase, phase);
    await call('ready', { phase, skip: true }, room.participants.B);
  }
  assert.equal((await call('state', undefined, room.participants.A)).data.status, 'completed');
  assert.equal((await call('message', { text: 'late', phase: 'RQ' }, room.participants.A)).status, 409);
  assert.equal((await call('export', {}, room.participants.A)).status, 403);
  const exported = (await call('export', {}, room.adminToken)).data;
  assert.deepEqual(exported.events.filter(e => e.type === 'phase_entered').map(e => e.phase), SEQUENCES[condition]);
  assert.equal(JSON.stringify(exported).includes(room.participants.A), false);
});
test('permissions, consent, stale writes, pause/resume, stop, deletion', async t => {
  const { call } = await fixture(t); const { data: room } = await call('create', { condition: 'BP' });
  assert.equal((await call('state', undefined, 'wrong')).status, 401);
  assert.equal((await call('join', { consent: false }, room.participants.A)).status, 400);
  await call('join', { consent: true }, room.participants.A); await call('join', { consent: true }, room.participants.B);
  assert.equal((await call('message', { phase: 'CQ', text: 'stale' }, room.participants.A)).status, 409);
  await call('pause', {}, room.participants.A);
  assert.equal((await call('message', { phase: 'AQ', text: 'paused' }, room.participants.B)).status, 409);
  await call('resume', {}, room.participants.B);
  await call('message', { phase: 'AQ', text: '<script>alert(1)</script>' }, room.participants.A);
  await call('ready', { phase: 'AQ' }, room.participants.A);
  await call('message', { phase: 'AQ', text: 'more discussion' }, room.participants.B);
  assert.deepEqual((await call('state', undefined, room.participants.A)).data.ready, []);
  await call('stop', {}, room.participants.B);
  assert.equal((await call('guide', { phase: 'AQ' }, room.participants.A)).status, 409);
  await call('delete', {}, room.adminToken);
  assert.equal((await call('state', undefined, room.participants.A)).status, 401);
});
test('mock API: DS boundary, Analyzer feedback, no keys exported, BP no calls', async t => {
  const requests = [];
  const mock = async (url, options) => { requests.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ choices: [{ message: { content: 'Mock reply' } }] }) }; };
  const { call } = await fixture(t, { mode: 'openai', key: 'test-key-not-real', fetchImpl: mock });
  const room = await joined(call, 'DS');
  await call('message', { phase: 'rapport', text: 'A enjoyed a walk' }, room.participants.A);
  await call('guide', { phase: 'rapport' }, room.participants.A);
  assert.match(requests[0].messages[0].content, /no partner-reflection prompts/);
  assert.equal(requests[0].model, 'gpt-4.1-2025-04-14'); assert.equal(requests[0].store, false);
  await call('ready', { phase: 'rapport' }, room.participants.A);
  await call('ready', { phase: 'rapport', skip: true }, room.participants.B);
  assert.match(requests[1].messages[0].content, /Analyzer/);
  await call('guide', { phase: 'AQ' }, room.participants.A);
  assert.match(requests[2].messages[1].content, /Mock reply/);
  assert.equal(JSON.stringify((await call('export', {}, room.adminToken)).data).includes('test-key-not-real'), false);
  const bp = await joined(call, 'BP'); const count = requests.length;
  await call('guide', { phase: 'AQ' }, bp.participants.A); assert.equal(requests.length, count);
});
test('provider failure preserves phase and permits retry', async t => {
  let fail = true;
  const { call } = await fixture(t, { mode: 'openai', key: 'fake', fetchImpl: async () => fail ? { ok: false, status: 503 } : { ok: true, json: async () => ({ choices: [{ message: { content: 'summary' } }] }) } });
  const room = await joined(call, 'PS');
  await call('message', { phase: 'rapport', text: 'hello' }, room.participants.A);
  await call('ready', { phase: 'rapport' }, room.participants.A);
  assert.equal((await call('ready', { phase: 'rapport', skip: true }, room.participants.B)).status, 502);
  assert.equal((await call('state', undefined, room.participants.A)).data.phase, 'rapport');
  fail = false; await call('ready', { phase: 'rapport' }, room.participants.A);
  assert.equal((await call('ready', { phase: 'rapport', skip: true }, room.participants.B)).data.phase, 'AQ');
});


async function voiceFixture(t, condition = 'PS', fetchImpl) {
  const f = await fixture(t, { key: 'voice-test-key', fetchImpl: fetchImpl || (async () => ({ ok: true, json: async () => ({ session: { id: 'live_test' }, transport: { type: 'webrtc', sdp: 'v=0\r\nanswer' } }) })) });
  const { data: room } = await f.call('create', { condition, modality: 'voice' });
  await f.call('join', { consent: true }, room.participants.A); await f.call('join', { consent: true }, room.participants.B);
  const current = () => f.call('state', undefined, room.participants.A).then(x => x.data);
  const initial = await current();
  const voiceCall = (action, actor = 'A', extra = {}) => f.call('voice/' + action, { phase: initial.phase, generation: initial.voice.generation, ...extra }, room.participants[actor]);
  await voiceCall('join', 'A'); await voiceCall('join', 'B');
  return { ...f, room, current, voiceCall };
}

test('voice: authenticated Live SDP handshake, defaults, condition policy and no credential export', async t => {
  const requests = [];
  const { voiceCall, current, call, room } = await voiceFixture(t, 'DS', async (url, options) => {
    requests.push({ url, options, body: JSON.parse(options.body) });
    return { ok: true, json: async () => ({ session: { id: 'live_mock' }, transport: { type: 'webrtc', sdp: 'v=0 answer' } }) };
  });
  assert.equal((await voiceCall('start', 'B', { sdp: 'v=0 offer' })).status, 403);
  assert.equal((await voiceCall('start', 'A', { sdp: 'bad' })).status, 400);
  const answer = await voiceCall('start', 'A', { sdp: 'v=0 offer' });
  assert.equal(answer.data.sdp, 'v=0 answer');
  assert.equal(requests[0].url, 'https://api.openai.com/v1/live/sessions');
  assert.equal(requests[0].body.session.model, 'gpt-live-1');
  assert.equal(requests[0].body.session.store, false);
  assert.equal(requests[0].body.session.audio.output.voice, 'marin');
  assert.match(requests[0].body.session.instructions, /Never ask partners to reflect/);
  assert.equal((await voiceCall('start', 'A', { sdp: 'v=0 offer' })).status, 409);
  const exported = await call('export', {}, room.adminToken);
  assert.equal(exported.data.modality, 'voice'); assert.equal(exported.data.live_model, 'gpt-live-1');
  assert.equal(JSON.stringify(exported.data).includes('voice-test-key'), false);
  assert.equal(JSON.stringify(exported.data).includes('v=0'), false);
  assert.equal((await current()).voice.connected, true);
});

test('voice: speaker lock, transcript deduplication/privacy, correction, stale events, pause', async t => {
  const { voiceCall, current, call, room } = await voiceFixture(t, 'BP');
  await voiceCall('start', 'A', { sdp: 'v=0 offer' });
  await voiceCall('begin', 'B');
  assert.equal((await voiceCall('begin', 'A')).status, 409);
  const event = { type: 'session.input_transcript.delta', event_id: 'input1', delta: 'a quiet day', start_ms: 100, end_ms: 200 };
  assert.equal((await voiceCall('event', 'B', { sessionId: 'live_test', event })).status, 403);
  await voiceCall('event', 'A', { sessionId: 'live_test', event });
  assert.equal((await voiceCall('event', 'A', { sessionId: 'live_test', event })).data.duplicate, true);
  const aState = await current(); assert.equal(aState.voice.turn.text, undefined);
  const bState = (await call('state', undefined, room.participants.B)).data;
  assert.equal(bState.voice.turn.text, 'a quiet day');
  assert.equal((await call('ready', { phase: 'AQ', skip: true }, room.participants.A)).status, 409);
  assert.equal((await voiceCall('share', 'B', { turnId: bState.voice.turn.id, text: 'corrected' })).status, 409);
  await voiceCall('finish', 'B', { turnId: bState.voice.turn.id });
  await voiceCall('share', 'B', { turnId: bState.voice.turn.id, text: 'I enjoyed a quiet day.' });
  const shared = (await current()).events.find(e => e.actor === 'B' && e.type === 'message');
  assert.equal(shared.source, 'voice'); assert.equal(shared.transcript_corrected, true);
  assert.equal((await voiceCall('event', 'A', { sessionId: 'live_test', event: { ...event, event_id: 'late' } })).data.ignored, true);
  await call('pause', {}, room.participants.A);
  assert.equal((await current()).voice.connected, false);
  assert.equal((await voiceCall('begin', 'B')).status, 409);
});

test('voice: signaling privacy, guide command, phase update and BP instructions', async t => {
  const { voiceCall, current, call, room } = await voiceFixture(t, 'BP');
  await voiceCall('signal', 'A', { signal: { type: 'offer', sdp: 'v=0 partner' } });
  assert.equal((await current()).voice.signals.length, 0);
  const b = (await call('state', undefined, room.participants.B)).data;
  assert.equal(b.voice.signals[0].type, 'offer');
  await voiceCall('start', 'A', { sdp: 'v=0 offer' });
  await call('guide', { phase: 'AQ' }, room.participants.B);
  const command = (await current()).voice.commands.at(-1);
  assert.equal(command.type, 'session.commentary.append'); assert.match(command.content, /no support or follow-up/);
  await call('ready', { phase: 'AQ', skip: true }, room.participants.A);
  await call('ready', { phase: 'AQ', skip: true }, room.participants.B);
  assert.match((await current()).voice.commands.findLast(c => c.type === 'session.instructions.append').content, /CQ/);
});

test('voice: missing key and provider failure are recoverable; text mode cannot access voice', async t => {
  const { call } = await fixture(t, { key: '' });
  const { data: room } = await call('create', { condition: 'BP', modality: 'voice' });
  await call('join', { consent: true }, room.participants.A); await call('join', { consent: true }, room.participants.B);
  const s = (await call('state', undefined, room.participants.A)).data;
  assert.equal(s.voiceAvailable, false);
  assert.equal((await call('voice/join', { phase: s.phase, generation: s.voice.generation }, room.participants.A)).status, 503);
  const textRoom = await joined(call, 'BP');
  assert.equal((await call('voice/join', {}, textRoom.participants.A)).status, 409);
  const f = await voiceFixture(t, 'PS', async () => ({ ok: false, status: 403 }));
  assert.equal((await f.voiceCall('start', 'A', { sdp: 'v=0 offer' })).status, 502);
  assert.equal((await f.current()).voice.connected, false);
  assert.equal((await f.voiceCall('start', 'A', { sdp: 'v=0 offer' })).status, 502);
});


test('voice: a pause during startup never returns a usable canceled SDP', async t => {
  let entered, release;
  const started = new Promise(resolve => { entered = resolve; });
  const f = await voiceFixture(t, 'PS', async () => { entered(); return new Promise(resolve => { release = () => resolve({ ok: true, json: async () => ({ session: { id: 'live_canceled' }, transport: { sdp: 'v=0 answer' } }) }); }); });
  const pending = f.voiceCall('start', 'A', { sdp: 'v=0 offer' });
  await started; await f.call('pause', {}, f.room.participants.B); release();
  assert.equal((await pending).status, 409); assert.equal((await f.current()).voice.connected, false);
});

test('voice: discarding a turn redacts its draft text in exports', async t => {
  const f = await voiceFixture(t, 'BP'); await f.voiceCall('start', 'A', { sdp: 'v=0 offer' }); await f.voiceCall('begin', 'A');
  const turn = (await f.current()).voice.turn;
  await f.voiceCall('event', 'A', { sessionId: 'live_test', event: { type: 'session.input_transcript.delta', event_id: 'discard_event', delta: 'discard this fictional phrase', start_ms: 10, end_ms: 20 } });
  await f.voiceCall('finish', 'A', { turnId: turn.id }); await f.voiceCall('discard', 'A', { turnId: turn.id });
  const exported = (await f.call('export', {}, f.room.adminToken)).data;
  assert.equal(JSON.stringify(exported).includes('discard this fictional phrase'), false);
  assert.equal(exported.events.find(e => e.live_event_id === 'discard_event').redacted, true);
});
