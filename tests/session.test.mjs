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


test('solo: one token, immediate start, automatic AI reply and one-person completion', async t => {
  const prompts = [];
  const { call } = await fixture(t, { mode: 'openai', key: 'test-key', fetchImpl: async (_url, options) => {
    prompts.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'A supportive response.' } }] }) };
  } });
  const { data: room } = await call('create', { experience: 'solo' });
  assert.deepEqual(Object.keys(room.participants), ['A']);
  const token = room.participants.A;
  const joined = await call('join', { consent: true }, token);
  assert.equal(joined.data.status, 'active');
  assert.equal(joined.data.experience, 'solo');
  const reply = await call('message', { text: 'I enjoyed a walk.', phase: 'rapport' }, token);
  assert.equal(reply.status, 200);
  assert.equal(reply.data.events.at(-1).text, 'A supportive response.');
  assert.match(prompts[0].messages[0].content, /one participant/);
  for (const phase of SEQUENCES.SOLO) {
    const result = await call('ready', { phase, skip: true }, token);
    assert.equal(result.status, 200);
  }
  const exported = (await call('export', {}, room.adminToken)).data;
  assert.equal(exported.status, 'completed');
  assert.equal(exported.participant_count, 1);
  assert.equal(exported.experience, 'solo');
});

test('duo experience retains PS and waits for both participants', async t => {
  const { call } = await fixture(t);
  const { data: room } = await call('create', { experience: 'duo' });
  assert.equal(room.condition, 'PS');
  assert.equal((await call('join', { consent: true }, room.participants.A)).data.status, 'waiting');
  assert.equal((await call('join', { consent: true }, room.participants.B)).data.status, 'active');
});

test('solo voice starts a speaking turn without B', async t => {
  const { call } = await fixture(t, { key: 'test-key', fetchImpl: async () => ({ ok: true, json: async () => ({ session: { id: 'solo-session' }, transport: { sdp: 'v=0\r\n' } }) }) });
  const { data: room } = await call('create', { experience: 'solo', modality: 'voice' });
  const token = room.participants.A;
  const { data: state } = await call('join', { consent: true }, token);
  const common = { phase: state.phase, generation: state.voice.generation };
  await call('voice/join', common, token);
  assert.equal((await call('voice/start', { ...common, sdp: 'v=0' }, token)).status, 200);
  const turn = await call('voice/begin', common, token);
  assert.equal(turn.status, 200);
  assert.equal(turn.data.voice.turn.speaker, 'A');
  const turnId = turn.data.voice.turn.id;
  await call('voice/finish', { ...common, turnId }, token);
  const shared = await call('voice/share', { ...common, turnId, text: 'A good day.' }, token);
  assert.equal(shared.status, 200);
  assert.equal(shared.data.voice.commands.at(-1).type, 'session.commentary.append');
});


test('voice: all spoken AI replies stream into message history and export without duplicate deltas', async t => {
  const { voiceCall, current, call, room } = await voiceFixture(t, 'PS');
  await voiceCall('start', 'A', { sdp: 'v=0 offer' });
  const output = async (id, text) => voiceCall('event', 'A', { sessionId: 'live_test', event: { type: 'session.output_transcript.delta', event_id: id, delta: text, start_ms: 10, end_ms: 20 } });
  await output('q1', 'Welcome');
  const initial = await current();
  const count = initial.events.length;
  await output('q2', ' to this conversation.');
  const streamed = await current();
  assert.equal(streamed.events.length, count);
  assert.equal(streamed.events.find(e => e.source === 'voice' && e.actor === 'Guide').text, 'Welcome to this conversation.');
  await output('q2', ' to this conversation.');
  const turn = (await voiceCall('begin', 'A')).data.voice.turn;
  await voiceCall('finish', 'A', { turnId: turn.id });
  const share = await voiceCall('share', 'A', { turnId: turn.id, text: 'I enjoyed a walk.' });
  assert.equal(share.data.voice.commands.at(-1).type, 'session.commentary.append');
  await output('reply1', 'That sounds ');
  await output('reply2', 'enjoyable.');
  await call('message', { text: 'I also saw a friend.', phase: 'rapport' }, room.participants.A);
  await output('reply3', 'What did you enjoy about that?');
  const history = (await current()).events.filter(e => e.actor === 'Guide' && e.source === 'voice');
  assert.deepEqual(history.map(e => e.text), ['Welcome to this conversation.', 'That sounds enjoyable.', 'What did you enjoy about that?']);
  const exported = (await call('export', {}, room.adminToken)).data;
  assert.equal(exported.events.filter(e => e.type === 'message' && e.actor === 'Guide' && e.source === 'voice').length, 3);
});


test('conversational rooms introduce the guide and change topics for natural refusals', async t => {
  const { call } = await fixture(t);
  const { data: room } = await call('create', { experience: 'solo' });
  const token = room.participants.A;
  const initial = (await call('join', { consent: true }, token)).data;
  assert.match(initial.events[0].text, /AI conversation guide/);
  assert.match(initial.events[0].text, /pass on any question/);
  for (const refusal of ["I don't want to answer this", 'Can we talk about something else?', 'Please skip this question']) {
    const current = (await call('state', undefined, token)).data;
    const changed = await call('message', { text: refusal, phase: current.phase }, token);
    assert.equal(changed.status, 200);
    assert.match(changed.data.events.at(-1).text, /something else/);
    assert.notEqual(changed.data.events.at(-1).text, current.events.at(-1).text);
  }
});

test('voice intro includes the refusal notice, and approved refusals queue a different question', async t => {
  const { call } = await fixture(t, { key: 'test', fetchImpl: async () => ({ ok: true, json: async () => ({ session: { id: 'intro_session' }, transport: { sdp: 'v=0 answer' } }) }) });
  const { data: room } = await call('create', { experience: 'solo', modality: 'voice' });
  const token = room.participants.A;
  const initial = (await call('join', { consent: true }, token)).data;
  const common = { phase: initial.phase, generation: initial.voice.generation };
  await call('voice/join', common, token);
  await call('voice/start', { ...common, sdp: 'v=0' }, token);
  const started = (await call('state', undefined, token)).data;
  assert.match(started.voice.commands.at(-1).content, /AI conversation guide/);
  assert.match(started.voice.commands.at(-1).content, /pass on any question/);
  const turn = (await call('voice/begin', common, token)).data.voice.turn;
  await call('voice/finish', { ...common, turnId: turn.id }, token);
  const changed = (await call('voice/share', { ...common, turnId: turn.id, text: "I'd rather not answer this. Let's change the topic." }, token)).data;
  assert.equal(changed.phase, 'AQ');
  assert.match(changed.voice.commands.at(-1).content, /different question/);
  assert.match(changed.voice.commands.at(-1).content, /small thing/);
});

test('stop immediately closes voice, summarizes only approved messages, and reuses the summary', async t => {
  let release, summaryCalls = 0, sentMessages;
  const { call } = await fixture(t, { mode: 'openai', key: 'test', fetchImpl: async (url, options) => {
    if (url.includes('/live/')) return { ok: true, json: async () => ({ session: { id: 'summary_session' }, transport: { sdp: 'v=0 answer' } }) };
    summaryCalls++; sentMessages = JSON.parse(options.body).messages;
    await new Promise(resolve => { release = resolve; });
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'You enjoyed a walk and felt relaxed.' } }] }) };
  } });
  const { data: room } = await call('create', { experience: 'solo', modality: 'voice' });
  const token = room.participants.A;
  const initial = (await call('join', { consent: true }, token)).data;
  const common = { phase: initial.phase, generation: initial.voice.generation };
  await call('voice/join', common, token); await call('voice/start', { ...common, sdp: 'v=0' }, token);
  await call('message', { text: 'I enjoyed a walk and felt relaxed.', phase: initial.phase }, token);
  await call('voice/begin', common, token);
  await call('voice/event', { ...common, sessionId: 'summary_session', event: { type: 'session.input_transcript.delta', event_id: 'unsent', delta: 'unapproved private draft', start_ms: 1, end_ms: 2 } }, token);
  const stopping = call('stop', {}, token);
  for (let i = 0; i < 50 && !release; i++) await new Promise(r => setTimeout(r, 10));
  const during = (await call('state', undefined, token)).data;
  assert.equal(during.status, 'stopped'); assert.equal(during.voice.connected, false);
  assert.equal(during.summaryStatus, 'generating');
  assert.doesNotMatch(sentMessages[1].content, /unapproved private draft/);
  assert.match(sentMessages[1].content, /enjoyed a walk/);
  release();
  const stopped = (await stopping).data;
  assert.equal(stopped.summaryStatus, 'complete');
  assert.match(stopped.finalSummary, /felt relaxed/);
  await call('stop', {}, token); assert.equal(summaryCalls, 1);
  const exported = (await call('export', {}, room.adminToken)).data;
  assert.equal(exported.final_summary, stopped.finalSummary);
});

test('summary failures return a labeled recap and leave the session stopped', async t => {
  let fail = false;
  const { call } = await fixture(t, { mode: 'openai', key: 'test', fetchImpl: async () => fail ? { ok: false, status: 503 } : { ok: true, json: async () => ({ choices: [{ message: { content: 'A reply.' } }] }) } });
  const { data: room } = await call('create', { experience: 'solo' });
  const token = room.participants.A;
  await call('join', { consent: true }, token);
  await call('message', { text: 'I enjoyed a walk.', phase: 'rapport' }, token);
  fail = true;
  const result = (await call('stop', {}, token)).data;
  assert.equal(result.status, 'stopped'); assert.equal(result.summaryStatus, 'fallback');
  assert.match(result.finalSummary, /unavailable/); assert.match(result.finalSummary, /I enjoyed a walk/);
});


test('voice and text use the same concise mental health support system prompt', async t => {
  const { SUPPORT_SYSTEM_PROMPT } = await import('../conversation.mjs');
  const captured = [];
  const { call } = await fixture(t, { mode: 'openai', key: 'test', fetchImpl: async (url, options) => {
    captured.push(JSON.parse(options.body));
    return { ok: true, json: async () => url.includes('/live/') ? { session: { id: 'prompt_session' }, transport: { sdp: 'v=0 answer' } } : { choices: [{ message: { content: 'Thank you for sharing.' } }] } };
  } });
  const textRoom = (await call('create', { experience: 'solo' })).data;
  await call('join', { consent: true }, textRoom.participants.A);
  await call('message', { text: 'I feel tired today.', phase: 'rapport' }, textRoom.participants.A);
  assert.ok(captured[0].messages[0].content.startsWith(SUPPORT_SYSTEM_PROMPT));
  const voiceRoom = (await call('create', { experience: 'duo', modality: 'voice' })).data;
  await call('join', { consent: true }, voiceRoom.participants.A);
  const joined = (await call('join', { consent: true }, voiceRoom.participants.B)).data;
  const common = { phase: joined.phase, generation: joined.voice.generation };
  await call('voice/join', common, voiceRoom.participants.A);
  await call('voice/start', { ...common, sdp: 'v=0' }, voiceRoom.participants.A);
  assert.ok(captured[1].session.instructions.startsWith(SUPPORT_SYSTEM_PROMPT));
  assert.match(captured[1].session.instructions, /two participants A and B/);
  assert.match(captured[1].session.instructions, /Remain silent during speaking/);
});
