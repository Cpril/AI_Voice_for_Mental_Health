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
