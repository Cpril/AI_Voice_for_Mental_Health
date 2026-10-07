# Scaffolded Vulnerability — couples replication workspace

User-selected scope: close couples replication, protocol and working prototype. Created October 6, 2026.

## Run

Requires Node.js 20 or later. No dependency installation is needed.

```powershell
cd 'C:\Users\prisc\OneDrive - Calvin University\4Fall\senior project\AI_Voice_for_Mental_Health'
node server.mjs
```

Open [the local prototype](http://127.0.0.1:8787). Create a room and open the A and B links in separate tabs. Each participant acknowledges the fictional-data demo. Both may share messages and select Ready or Skip to advance. Either can pause or stop the whole session. The researcher view exports JSON or deletes the room.

Default text mode is scripted demo, with no API key or network AI calls. Voice mode always uses GPT-Live and requires a server API key. It tests flow, not adaptive LLM behavior. Sessions live in memory until deletion or server restart. Exports are separate copies. Secret links grant access; keep them private. The server binds only to loopback, so remote separate-location participation is not deployed yet.

## Optional LLM mode

Set OPENAI_API_KEY in your shell environment using your normal secret-management process; never put it in source files or participant links. Then:

```powershell
$env:CHAT_MODE = 'openai'
$env:API_MODEL = 'gpt-4.1-2025-04-14'
node server.mjs
```

The server calls OpenAI for requested guide support and phase-end Analyzer summaries in PS/DS. BP uses fixed prompts. Calls set `store: false`, which does not eliminate all provider processing/retention. Live paid API calls have not been verified; the integration is tested with a mock. See the [official API reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create) and [model documentation](https://developers.openai.com/api/docs/models/gpt-4.1).

## Verify

```powershell
node --test tests/*.test.mjs
```

## Materials

- [Replication protocol](protocol.md): procedure, randomization, analysis, participant handling.
- [Measures](measures.md): source instrument/scoring and coding checklist.
- [Fidelity register](fidelity.md): implemented features, departures, research-readiness work.
- `study.mjs`: phase sequences and reconstructed prompts.
- `server.mjs`: dyad sessions, controller, Driver/Analyzer, exports.
- `public/`: browser interface.
- `design_alternatives/solo/`: inactive earlier solo proposal; its CP arm and surveys do not apply here.

This is an independently written browser text reconstruction with paraphrased prompts, not the authors' exact Telegram implementation. Optional GPT-Live voice is now available as a documented modality/model extension; text remains the default. The full original questionnaires, richer rapport behavior, secure remote participation, and research consent must be finalized before recruitment. Corrections to the closing recap are logged in chat; the displayed recap is not automatically rewritten. The export's `surveys` field is currently reserved and empty.

Reference: Jiang, Z., Yeo, S., Herremans, D., & Perrault, S. T. (2026). *Scaffolded Vulnerability: Chatbot-Mediated Reciprocal Self-Disclosure and Need-Supportive Interaction in Couples*. CHI 2026. [Published article](https://doi.org/10.1145/3772318.3791370), [full-text preprint v1](https://arxiv.org/html/2602.07508v1), [authors' prototype](https://github.com/AMAAI-Lab/relational-ai). Verify preprint/published-version consistency before registration. No upstream code was copied or executed.


## Voice conversations (GPT-Live)

Select **Voice · GPT-Live** when creating a room. Both partners join their links. A clicks **Connect voice** first; B also connects. Once both audio connections are ready, take turns with **Start my speaking turn**. Microphones start off. Click **Microphone off · review**, wait for the transcript to settle, edit it, then **Share corrected transcript** or **Discard transcript**. Use **Ask voice guide** for a spoken response. Both partners hear the speaker and guide. Use headphones; A must keep their hosting tab open.

The server uses OPENAI_API_KEY and defaults to LIVE_MODEL=gpt-live-1, LIVE_VOICE=marin. No long-lived API key reaches the browser. This uses the dedicated Live endpoint, not browser speech recognition or the older Realtime API. Voice works even when text chat is in demo mode; PS/DS voice phase summaries use the configured text model through the existing Analyzer. See [voice setup and architecture](VOICE.md).

Pause, stop, disconnect, and leaving the page switch off microphone tracks. A room pause or stop disconnects the other participant when their next state poll arrives (normally within 1.5 seconds). Reconnect both partners after a pause. Partner audio uses a direct WebRTC connection; the current local prototype has no TURN relay and does not yet support arbitrary remote networks. Real microphone-to-provider playback has not been verified in this implementation session; tests use mock media and provider responses.
