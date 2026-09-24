/* Short, self-contained Web Audio cues for the Dead Channel roulette. */
(() => {
  let context = null;
  let enabled = true;
  function prime() {
    if (!enabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      context ||= new AudioContextClass();
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch { context = null; }
  }
  function note(frequency, duration, volume, type = 'square', delay = 0) {
    if (!enabled || !context || context.state !== 'running') return;
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const at = context.currentTime + delay;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(.001, at);
      gain.gain.exponentialRampToValueAtTime(volume, at + .006);
      gain.gain.exponentialRampToValueAtTime(.001, at + duration);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(at); oscillator.stop(at + duration + .02);
    } catch {}
  }
  window.CINEGENOME_PICKER_SFX = {
    prime,
    tick(step) { note(260 + Math.min(24, step) * 12, .045, .025); },
    finish() {
      note(440, .12, .04, 'triangle');
      note(660, .15, .04, 'triangle', .09);
      note(880, .27, .055, 'triangle', .18);
    },
    setEnabled(value) { enabled = !!value; if (enabled) prime(); },
    isEnabled() { return enabled; }
  };
})();
