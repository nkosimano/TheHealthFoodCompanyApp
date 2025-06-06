// Web implementation of audio service
const SOUNDS = {
  SCAN_SUCCESS: new Audio('/sounds/scan-success.mp3'),
  SCAN_ERROR: new Audio('/sounds/scan-error.mp3'),
  ADJUSTMENT_SUCCESS: new Audio('/sounds/adjustment-success.mp3'),
  ADJUSTMENT_ERROR: new Audio('/sounds/adjustment-error.mp3')
};

export const initAudio = async (): Promise<void> => {
  try {
    // Preload all sounds
    await Promise.all(
      Object.values(SOUNDS).map(sound => sound.load())
    );
  } catch (error) {
    console.warn('Error initializing audio:', error);
  }
};

export const playSound = async (soundName: string): Promise<void> => {
  // Web implementation - no-op
  console.warn('Audio playback is not supported in web version for sound:', soundName);
};