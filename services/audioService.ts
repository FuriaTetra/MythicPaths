
// Web Audio API helper for procedural sound generation
// Generates dynamic, epic soundscapes without external assets.

type AudioEnvironment = 'FOREST' | 'CAVE' | 'TOWN' | 'COMBAT' | 'DUNGEON' | 'mysterious';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isMusicMuted = true; // Default to muted music
let lastEnvironment: string | null = null;

let currentNodes: { 
  oscillators: OscillatorNode[], 
  gains: GainNode[] 
} = { oscillators: [], gains: [] };

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
};

// Helper to create a rich, detuned "Super Saw" voice (simulates strings/horns)
const createVoice = (ctx: AudioContext, dest: AudioNode, freq: number, type: 'sawtooth' | 'sine' | 'triangle', vol: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.value = freq;
  
  // Detuning for "Epic" thickness
  if (type === 'sawtooth') {
      osc.detune.value = (Math.random() * 10) - 5; 
  }

  gain.gain.value = 0; 
  // Soft attack
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2);

  osc.connect(gain);
  gain.connect(dest);
  osc.start();

  return { osc, gain };
};

export const audioService = {
  init: () => {
    return getCtx();
  },

  setMusicMute: (mute: boolean) => {
    isMusicMuted = mute;
    const ctx = getCtx();
    
    if (ctx.state === 'suspended') ctx.resume();

    if (mute) {
      audioService.stopAmbience();
    } else {
      // Resume last environment if we unmute
      if (lastEnvironment) {
        audioService.playEnvironment(lastEnvironment);
      }
    }
  },

  playEnvironment: async (env: string) => {
    lastEnvironment = env;
    const ctx = getCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    
    // Always stop previous track first
    audioService.stopAmbience();

    // If music is muted, record the env but don't play sounds
    if (isMusicMuted) return;

    // Determine chord structure based on environment
    let freqs: number[] = [];
    let wave: 'sawtooth' | 'sine' | 'triangle' = 'sawtooth';
    let baseVol = 0.1;

    const e = env.toUpperCase();
    
    if (e.includes('COMBAT') || e.includes('FIGHT')) {
       // Tension: Low dissonant rumble
       freqs = [55, 58, 110, 115]; // A1, Bb1 (Clash)
       wave = 'sawtooth';
       baseVol = 0.15;
    } else if (e.includes('TOWN') || e.includes('INN')) {
       // Warm Major Chord
       freqs = [130.81, 164.81, 196.00, 261.63]; // C3 Major
       wave = 'triangle'; // Flute-like
       baseVol = 0.1;
    } else if (e.includes('CAVE') || e.includes('DUNGEON')) {
       // Dark Minor Ambience
       freqs = [65.41, 77.78, 130.81]; // C2, Eb2 (Deep Minor)
       wave = 'sine'; // Hollow
       baseVol = 0.3;
    } else {
       // FOREST / EPIC DEFAULT (D Minor ish)
       freqs = [73.42, 110.00, 146.83, 220.00, 293.66]; // D2, A2, D3, A3, D4
       wave = 'sawtooth'; // String-like
       baseVol = 0.08;
    }

    // Create the "Orchestra"
    const voices: any[] = [];
    freqs.forEach(f => {
       const v1 = createVoice(ctx, masterGain!, f, wave, baseVol);
       voices.push(v1);
       
       if (wave === 'sawtooth') {
         const v2 = createVoice(ctx, masterGain!, f + 0.5, wave, baseVol * 0.7);
         voices.push(v2);
       }
    });

    currentNodes = {
        oscillators: voices.map(v => v.osc),
        gains: voices.map(v => v.gain)
    };
  },

  stopAmbience: () => {
    const ctx = getCtx();
    const { oscillators, gains } = currentNodes;
    
    // Smooth release
    gains.forEach(g => {
        try {
            g.gain.cancelScheduledValues(ctx.currentTime);
            g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
        } catch(e) {}
    });

    // Clear reference immediately so we don't try to stop them twice
    currentNodes = { oscillators: [], gains: [] };

    setTimeout(() => {
        oscillators.forEach(o => { try { o.stop(); } catch(e){} });
    }, 2100);
  },

  // SFX always plays regardless of isMusicMuted (unless context suspended, but we try to keep it open)
  playTyping: () => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Randomize pitch slightly for realism
    const randomDetune = Math.random() * 200 - 100;
    
    osc.frequency.value = 800 + randomDetune;
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  },

  playClick: () => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  },

  playDamage: () => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.4);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }
};
