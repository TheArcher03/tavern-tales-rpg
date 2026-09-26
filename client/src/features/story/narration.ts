// A free, zero-server narrator using the browser's built-in Web Speech
// API — no TTS API key, no per-play cost, matching this project's
// "costs nothing to run" design. Quality and voice selection vary by
// browser/OS; this degrades silently (no-op) wherever unsupported.
export type NarratorRole = 'dm' | 'system'

function supported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices(): SpeechSynthesisVoice[] {
  if (!supported()) return []
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) cachedVoices = voices
  return cachedVoices
}

if (supported()) {
  // Chrome loads voices asynchronously — the first getVoices() call can
  // return an empty list before this fires.
  window.speechSynthesis.onvoiceschanged = () => loadVoices()
  loadVoices()
}

export function isNarrationSupported(): boolean {
  return supported()
}

// Picks two voices that are as distinct as the browser's voice list
// allows — real per-NPC voice switching isn't attempted (it would need
// authored dialogue to carry a speaker tag, which the prose doesn't), but
// the DM/narrator and system/mechanical lines get an audibly different
// voice or, failing that, a different pitch.
function voiceFor(role: NarratorRole): SpeechSynthesisVoice | undefined {
  const voices = loadVoices()
  if (voices.length === 0) return undefined
  return role === 'dm' ? voices[0] : voices[Math.min(1, voices.length - 1)]
}

export function speak(text: string, role: NarratorRole): void {
  if (!supported() || !text.trim()) return
  const utterance = new SpeechSynthesisUtterance(text)
  const voice = voiceFor(role)
  if (voice) utterance.voice = voice
  utterance.rate = role === 'dm' ? 0.95 : 1.05
  utterance.pitch = role === 'dm' ? 1 : 1.15
  // speechSynthesis queues utterances on its own — calling speak()
  // repeatedly plays them in order rather than overlapping.
  window.speechSynthesis.speak(utterance)
}

export function cancelNarration(): void {
  if (supported()) window.speechSynthesis.cancel()
}
