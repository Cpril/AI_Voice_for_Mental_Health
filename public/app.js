import { SharedVoice } from './voice.js';
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.hash.slice(1));
let voice, draftTurn, draftEdited = false;
let credential = params.get('token'), actor = params.get('actor'), state, polling, seen = '';
let voiceAutoAttempted = false, sending = false;
async function api(path, body) {
  const response = await fetch('/api/' + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(credential ? { Authorization: 'Bearer ' + credential } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json(); if (!response.ok) throw Error(result.error); return result;
}
async function run(fn) { $('error').textContent = ''; try { await fn(); } catch (e) { $('error').textContent = e.message; } }
function participantLink(token, participant) { return location.origin + '/#' + new URLSearchParams({ token, actor: participant }); }
function links(data) {
  $('setup').hidden = true; $('researcher').hidden = false;
  $('assignment').textContent = `${data.experience === 'solo' ? 'Condition 1 · Solo + AI' : 'Condition 2 · Two participants + AI'} · ${data.modality === 'voice' ? 'Voice · GPT-Live' : data.mode === 'demo' ? 'Text · scripted demo' : 'Text · OpenAI'}`;
  $('links').replaceChildren();
  for (const [a, t] of Object.entries(data.participants)) { const link = document.createElement('a'); link.href = participantLink(t, a); link.target = '_blank'; link.rel = 'noreferrer'; link.textContent = 'Open participant ' + a; $('links').append(link); }
}
function voiceRequest(action, body = {}) {
  return api('voice/' + action, { phase: state.phase, generation: state.voice.generation, ...body });
}
function voiceInstance() {
  if (!voice) voice = new SharedVoice({ actor, request: voiceRequest, state: () => state, audio: $('voice-audio'), feedback: f => { $('mic-level').value = f.level; $('mic-icon').classList.toggle('listening', f.recording); $('mic-feedback').textContent = f.message; $('mic-feedback').classList.toggle('warning', f.warning); $('live-transcript').textContent = f.transcript || (f.recording ? 'Listening for your words…' : 'Your spoken words will appear here.'); }, notice: text => { $('voice-status').textContent = text; } });
  return voice;
}
async function connectVoice() {
  voiceAutoAttempted = true;
  const instance = voiceInstance();
  const started = instance.start();
  $('voice-connect').hidden = true;
  try { await started; render(await api('state')); }
  catch (error) { $('voice-connect').hidden = false; $('voice-status').textContent = error.message; }
}
function renderVoice(s) {
  const enabled = s.modality === 'voice';
  $('voice-panel').hidden = !enabled;
  $('text-composer').hidden = enabled;
  $('text-label').textContent = 'Your message';
  $('guide').hidden = enabled;
  $('voice-audio').hidden = !(enabled && s.actor === 'B' && voice?.connected);
  if (!enabled) return;
  $('voice-description').textContent = s.experience === 'solo' ? 'Audio goes to OpenAI while your microphone is on. Use headphones. Review your transcript before sharing it with the AI.' : 'Both participants hear the speaker and AI. Audio goes to OpenAI while a microphone is on. Use headphones; A must keep their tab open.';
  $('voice-role').textContent = s.experience === 'solo' ? 'Voice connects automatically. Start speaking, select Microphone off · review, then Send to AI.' : s.actor === 'A' ? 'Voice connects automatically. You host the AI connection; keep this tab open.' : 'Voice connects automatically when both participants join. Wait for participant A to host the AI connection.';
  $('voice-connect').hidden = Boolean(voice?.connected || voice?.starting) || !voiceAutoAttempted;
  $('voice-connect').disabled = s.status !== 'active' || !s.voiceAvailable || voice?.connected || voice?.starting;
  $('voice-disconnect').disabled = !(voice?.connected || voice?.starting);
  $('voice-speak').disabled = s.status !== 'active' || s.busy || !voice?.ready || Boolean(s.voice.turn);
  const mine = s.voice.turn?.speaker === actor;
  $('voice-finish').disabled = !(mine && s.voice.turn.recording);
  $('voice-review').hidden = !(mine && !s.voice.turn.recording);
  if (draftTurn !== s.voice.turn?.id) { draftTurn = s.voice.turn?.id; draftEdited = false; }
  if (mine && !draftEdited) $('voice-transcript').value = s.voice.turn.text || '';
  $('voice-guide-text').textContent = s.voice.output ? 'Guide transcript: ' + s.voice.output : '';
  if (!s.voiceAvailable) $('voice-status').textContent = 'Set OPENAI_API_KEY on the server and restart to enable GPT-Live.';
  if (s.status !== 'active') voiceAutoAttempted = false;
  else if (s.voiceAvailable && !voiceAutoAttempted) void connectVoice();
  if (voice) void voice.sync(s).catch(error => { $('error').textContent = error.message; void voice.disconnect('Connection interrupted. Reconnect to retry.'); });
}
function render(s) {
  state = s;
  renderVoice(s);
  $('mode').textContent = s.modality === 'voice' ? 'Voice · GPT-Live' : s.mode === 'demo' ? 'Scripted demo · no AI calls' : 'OpenAI · ' + s.model;
  $('conversation').hidden = false; $('join').hidden = true;
  $('phase').textContent = `PARTICIPANT ${s.actor} · ${s.phase || 'WAITING'}`;
  $('title').textContent = s.title; $('status').textContent = s.status;
  const signature = JSON.stringify(s.events.map(e => [e.id, e.text, e.type]));
  if (seen !== signature) {
    seen = signature; const nearBottom = $('messages').scrollHeight - $('messages').scrollTop - $('messages').clientHeight < 100;
    $('messages').replaceChildren();
    for (const e of s.events) { const el = document.createElement('div'); el.className = 'message' + (e.actor === 'Guide' ? ' guide' : e.actor === actor ? ' mine' : ''); const label = document.createElement('span'); label.className = 'who'; label.textContent = e.actor === 'Guide' ? 'GUIDE' : e.actor === actor ? 'YOU · ' + actor : e.actor; el.append(label, document.createTextNode(e.text || e.type)); $('messages').append(el); }
    if (nearBottom) $('messages').scrollTop = $('messages').scrollHeight;
  }
  for (const id of ['send', 'guide']) $(id).disabled = s.status !== 'active' || s.busy || Boolean(s.voice?.turn);
  $('text').disabled = s.status !== 'active' || s.busy || Boolean(s.voice?.turn);
  if (s.modality === 'voice') {
    const mine = s.voice.turn?.speaker === actor;
    $('send').textContent = mine ? 'Send transcript to AI' : 'Send to AI';
    $('send').disabled = sending || s.status !== 'active' || s.busy || !s.voice.connected || !mine || s.voice.turn.recording;
    $('send').textContent = 'Send to AI';
  } else $('send').textContent = 'Send';
  $('session-summary').hidden = !s.summaryStatus;
  $('summary-text').textContent = s.summaryStatus === 'generating' ? 'Preparing your discussion summary…' : s.finalSummary || '';
  $('pause').textContent = s.status === 'paused' ? 'Resume' : 'Pause';
  $('pause').disabled = !['active', 'paused'].includes(s.status);
  $('stop').disabled = ['completed', 'stopped'].includes(s.status);
  $('waiting').textContent = s.busy ? 'Guide is processing…' : s.status === 'waiting' ? 'Waiting for the other partner to join.' : s.status === 'completed' ? 'Conversation complete. Thank you.' : '';
}
function poll() { clearInterval(polling); polling = setInterval(() => run(async () => render(await api('state'))), 1500); }
$('create').onclick = () => run(async () => { const data = await api('create', { experience: $('condition').value, modality: $('modality').value }); credential = data.adminToken; actor = 'Researcher'; location.hash = new URLSearchParams({ token: credential, actor }); links(data); $('mode').textContent = data.modality === 'voice' ? 'Voice · GPT-Live' : data.mode === 'demo' ? 'Scripted demo · no AI calls' : 'OpenAI mode'; });
$('enter').onclick = () => run(async () => { if (!$('consent').checked) throw Error('Please acknowledge the demo instructions.'); render(await api('join', { consent: true })); poll(); });
$('send').onclick = () => run(async () => {
  if (sending) return;
  sending = true; $('send').disabled = true;
  try {
    if (state.modality === 'voice' && state.voice.turn?.speaker === actor) {
      if (state.voice.turn.recording) throw Error('Select Microphone off · review first.');
      voiceInstance().mute();
      voiceInstance().waitForReply();
      render(await voiceRequest('share', { turnId: state.voice.turn.id, text: $('voice-transcript').value }));
    } else if (state.modality === 'voice') {
      throw Error('Start speaking, turn the microphone off to review, then send your transcript.');
    } else {
      if (state.modality === 'voice') voiceInstance().waitForReply();
      render(await api('message', { text: $('text').value, phase: state.phase }));
      $('text').value = '';
    }
  } finally { sending = false; render(state); }
});
$('text').onkeydown = e => { if (e.ctrlKey && e.key === 'Enter') $('send').click(); };
for (const action of ['guide', 'pause', 'stop']) $(action).onclick = () => run(async () => { if (action === 'stop' && !confirm('Stop this conversation?')) return; if (action === 'stop' && voice) voice.closeImmediately();
  else if (action === 'pause' && state.status === 'active' && voice) await voice.disconnect();
  if (action === 'stop') { $('stop').disabled = true; $('session-summary').hidden = false; $('summary-text').textContent = 'Preparing your discussion summary…'; } const route = action === 'pause' && state.status === 'paused' ? 'resume' : action; render(await api(route, { phase: state.phase })); });
$('export').onclick = () => run(async () => { const data = await api('export', {}); const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = `dyad-${data.id}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
$('delete').onclick = () => run(async () => { if (!confirm('Permanently remove this room from server memory? Exported files will remain.')) return; await api('delete', {}); location.href = '/'; });
if (credential) run(async () => { const s = await api('state'); actor = s.actor; $('setup').hidden = true; if (s.actor === 'Researcher') { links(s); } else if (s.joined.includes(s.actor)) { render(s); poll(); } else { $('join').hidden = false; if (s.experience === 'solo') $('join-description').textContent = 'This is your individual conversation with the AI. Share only what feels comfortable. You can ask to change the topic, pause, or stop at any time.'; $('mode').textContent = s.modality === 'voice' ? 'Voice · GPT-Live' : s.mode; $('processing').textContent = s.modality === 'voice' ? 'When you connect voice and turn on the microphone, audio is sent to OpenAI and heard by your partner. Reviewed text and reported transcript fragments appear in research exports. No raw audio is saved by this app.' : s.mode === 'demo' ? 'Messages stay in local server memory. The guide is scripted, not an LLM.' : 'In OpenAI mode, disclosures are sent to OpenAI for support and phase summaries. Do not use real sensitive information in this demo.'; } });

$('voice-connect').onclick = () => run(connectVoice);
$('voice-disconnect').onclick = () => run(async () => { voiceAutoAttempted = true; await voiceInstance().disconnect(); render(await api('state')); });
$('voice-speak').onclick = () => run(async () => { render(await voiceInstance().begin()); });
$('voice-finish').onclick = () => run(async () => { render(await voiceInstance().finish()); });
$('voice-transcript').oninput = () => { draftEdited = true; };
for (const action of ['discard']) $('voice-' + action).onclick = () => run(async () => {
  render(await voiceRequest(action, { turnId: state.voice.turn.id, text: $('voice-transcript').value }));
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && voice) {
    voice.mute();
    if (state?.voice?.turn?.speaker === actor && state.voice.turn.recording) void run(async () => render(await voice.finish()));
  }
});
window.addEventListener('pagehide', () => {
  voice?.closeImmediately();
  if (voice?.generation && credential) void fetch('/api/voice/leave', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + credential }, body: JSON.stringify({ generation: voice.generation }) }).catch(() => {});
});
run(async () => { const config = await api('config'); $('modality').value = config.voiceAvailable ? 'voice' : 'text'; $('voice-config').textContent = config.voiceAvailable ? 'Voice available · ' + config.liveModel : 'Voice requires OPENAI_API_KEY on the server. Text demo is available without a key.'; });
