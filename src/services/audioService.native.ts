// Web-compatible audio service

// Sound URLs - replace with actual file URLs
const SOUNDS = {
  SCAN_SUCCESS: '/sounds/scan-success.mp3',
  SCAN_ERROR: '/sounds/scan-error.mp3',
  ADJUSTMENT_SUCCESS: '/sounds/adjustment-success.mp3',
  ADJUSTMENT_ERROR: '/sounds/adjustment-error.mp3'
} as const;

type SoundKey = keyof typeof SOUNDS;

// Audio context and cache for web
let audioContext: AudioContext | null = null;
const audioBuffers = new Map<SoundKey, AudioBuffer>();

/**
 * Initialize audio context (web only)
 */
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || ((window as unknown) as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  return audioContext;
};

/**
 * Load all sound files
 */
export const loadSounds = async (): Promise<void> => {
  try {
    const context = getAudioContext();
    
    // Load each sound
    await Promise.all(
      (Object.entries(SOUNDS) as [SoundKey, string][]).map(async ([key, url]) => {
        try {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await context.decodeAudioData(arrayBuffer);
          audioBuffers.set(key, audioBuffer);
        } catch (error) {
          console.error(`Error loading sound ${key}:`, error);
        }
      })
    );
  } catch (error) {
    console.error('Error initializing audio:', error);
  }
};

/**
 * Play a sound by key
 */
export const playSound = async (soundKey: SoundKey): Promise<void> => {
  try {
    const buffer = audioBuffers.get(soundKey);
    if (buffer) {
      const context = getAudioContext();
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(0);
    }
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

/**
 * Preload all sounds (alias for loadSounds for backward compatibility)
 */
export const initAudio = loadSounds;