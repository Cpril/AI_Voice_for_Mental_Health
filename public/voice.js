import { setMicrophone, closeMedia, gatherIce } from './voice-utils.mjs';

// One shared Live call, hosted by A. Only human microphones feed the Live input.
// The return mix to B contains A + Guide; the guide is never fed back to itself.
export class SharedVoice {
  constructor({ actor, request, state, audio, notice, dependencies = globalThis }) {
    Object.assign(this, { actor, request, getState: state, audio, notice, dependencies });
    this.connected = false; this.starting = false; this.serial = Promise.resolve(); this.epoch = 0;
    this.signalCursor = 0; this.commandCursor = 0;
  }
  get ready() { return this.connected && this.partner?.connectionState === 'connected' && (this.actor !== 'A' || this.channel?.readyState === 'open'); }
  async start() {
    if (this.connected || this.starting) return;
    const initial = this.getState();
    if (!initial.voiceAvailable) throw Error('Set OPENAI_API_KEY on the server, then restart it to enable GPT-Live.');
    if (!this.dependencies.navigator?.mediaDevices?.getUserMedia || !this.dependencies.RTCPeerConnection) throw Error('Voice needs a browser with microphone and WebRTC support on localhost or HTTPS.');
    this.starting = true;
    const epoch = ++this.epoch;
    this.generation = initial.voice.generation; this.signalCursor = 0; this.commandCursor = initial.voice.commands.at(-1)?.id || 0;
    try {
      this.notice('Requesting microphone access…');
      const stream = await this.dependencies.navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (epoch !== this.epoch) { closeMedia({ stream }); return; }
      this.stream = stream; setMicrophone(stream, false);
      await this.request('join', {});
      if (epoch !== this.epoch) return;
      if (this.actor === 'A') {
        const AudioContextClass = this.dependencies.AudioContext || this.dependencies.webkitAudioContext;
        this.context = new AudioContextClass(); await this.context.resume();
        if (epoch !== this.epoch) return;
        this.liveInput = this.context.createMediaStreamDestination();
        this.partnerOutput = this.context.createMediaStreamDestination();
        this.micSource = this.context.createMediaStreamSource(stream);
        this.micSource.connect(this.liveInput); this.micSource.connect(this.partnerOutput);
        this.live = new this.dependencies.RTCPeerConnection();
        for (const track of this.liveInput.stream.getAudioTracks()) this.live.addTrack(track, this.liveInput.stream);
        this.live.ontrack = event => {
          const guideStream = event.streams[0] || new this.dependencies.MediaStream([event.track]);
          this.guideSource = this.context.createMediaStreamSource(guideStream);
          this.guideSource.connect(this.context.destination); this.guideSource.connect(this.partnerOutput);
        };
        this.channel = this.live.createDataChannel('live-events');
        this.channel.onmessage = event => {
          if (epoch !== this.epoch) return;
          let data; try { data = JSON.parse(event.data); } catch { return; }
          if (data.type === 'error') { this.notice('GPT-Live reported an error. Disconnect and reconnect if speech stops.'); return; }
          if (['session.input_transcript.delta', 'session.output_transcript.delta'].includes(data.type)) {
            this.serial = this.serial.then(() => epoch === this.epoch ? this.request('event', { sessionId: this.sessionId, event: data }) : undefined)
              .catch(error => this.notice(error.message));
          }
        };
        this.live.onconnectionstatechange = () => { if (['failed', 'closed'].includes(this.live?.connectionState)) void this.disconnect('GPT-Live disconnected. Reconnect to continue.'); };
        const offer = await this.live.createOffer(); await this.live.setLocalDescription(offer); await gatherIce(this.live);
        const answer = await this.request('start', { sdp: this.live.localDescription.sdp });
        if (epoch !== this.epoch) return;
        this.sessionId = answer.sessionId;
        await this.live.setRemoteDescription({ type: 'answer', sdp: answer.sdp });
      }
      this.connected = true;
      this.notice(this.actor === 'A' ? 'GPT-Live connecting. Waiting for both audio connections; microphone is off.' : 'Waiting for participant A to host GPT-Live; microphone is off.');
    } catch (error) {
      await this.disconnect();
      if (error.name === 'NotAllowedError') throw Error('Microphone permission was denied. Allow access for this site and reconnect.');
      throw error;
    } finally { this.starting = false; }
  }
  send(command) {
    if (this.channel?.readyState !== 'open') return false;
    const { id, ...payload } = command;
    this.channel.send(JSON.stringify({ ...payload, event_id: 'app_' + id })); return true;
  }
  async sync(s) {
    if (!this.connected && !this.starting) return;
    if (s.status !== 'active' || s.voice?.generation !== this.generation) { await this.disconnect('Voice disconnected; microphones are off.'); return; }
    if (!this.connected || this.syncing) return;
    this.syncing = true;
    try {
      setMicrophone(this.stream, Boolean(this.ready && s.voice.turn?.recording && s.voice.turn.speaker === this.actor));
      if (this.actor === 'A' && this.ready) for (const command of s.voice.commands) if (command.id > this.commandCursor && this.send(command)) this.commandCursor = command.id;
      if (this.actor === 'A' && s.voice.online.includes('B') && !this.partner) {
        this.makePartner();
        const offer = await this.partner.createOffer(); await this.partner.setLocalDescription(offer); await gatherIce(this.partner);
        await this.request('signal', { signal: { type: 'offer', sdp: this.partner.localDescription.sdp } });
      }
      for (const signal of s.voice.signals) {
        if (signal.id <= this.signalCursor) continue;
        if (signal.type === 'offer' && this.actor === 'B') {
          this.makePartner(); await this.partner.setRemoteDescription({ type: 'offer', sdp: signal.sdp });
          const answer = await this.partner.createAnswer(); await this.partner.setLocalDescription(answer); await gatherIce(this.partner);
          await this.request('signal', { signal: { type: 'answer', sdp: this.partner.localDescription.sdp } });
        } else if (signal.type === 'answer' && this.actor === 'A' && this.partner) await this.partner.setRemoteDescription({ type: 'answer', sdp: signal.sdp });
        this.signalCursor = signal.id;
      }
      if (this.ready) this.notice(s.voice.turn?.recording ? (s.voice.turn.speaker === this.actor ? 'Microphone on · your turn' : 'Your partner is speaking · your microphone is off') : 'Voice connected · microphone off');
    } finally { this.syncing = false; }
  }
  makePartner() {
    if (this.partner) return;
    this.partner = new this.dependencies.RTCPeerConnection({ iceServers: [] });
    const outbound = this.actor === 'A' ? this.partnerOutput.stream : this.stream;
    for (const track of outbound.getAudioTracks()) this.partner.addTrack(track, outbound);
    this.partner.ontrack = event => {
      const stream = event.streams[0] || new this.dependencies.MediaStream([event.track]);
      if (this.actor === 'A') {
        this.partnerSource = this.context.createMediaStreamSource(stream);
        this.partnerSource.connect(this.liveInput); this.partnerSource.connect(this.context.destination);
      } else { this.audio.srcObject = stream; void this.audio.play().catch(() => this.notice('Press Play on the audio controls to hear your partner and guide.')); }
    };
    this.partner.onconnectionstatechange = () => {
      if (this.partner?.connectionState === 'failed') void this.disconnect('Partner audio connection failed. Both partners should reconnect.');
    };
  }
  async begin() {
    if (!this.ready) throw Error('Wait for both partners to connect voice. Participant A must keep their tab open.');
    const result = await this.request('begin', {}); setMicrophone(this.stream, true); return result;
  }
  async finish() {
    setMicrophone(this.stream, false);
    return this.request('finish', { turnId: this.getState().voice.turn.id });
  }
  async disconnect(message = 'Microphone off.') {
    ++this.epoch; this.connected = false;
    const generation = this.generation;
    const live = this.live, partner = this.partner;
    this.live = this.partner = this.channel = null;
    closeMedia({ stream: this.stream, connections: [live, partner], context: this.context, audio: this.audio });
    this.stream = this.context = null;
    this.notice(message);
    if (generation) { try { await this.request('leave', { generation }); } catch { /* Room may already be closed or deleted. */ } }
    this.generation = null;
  }
  closeImmediately() {
    ++this.epoch;
    closeMedia({ stream: this.stream, connections: [this.live, this.partner], context: this.context, audio: this.audio });
    this.connected = false;
  }
}
