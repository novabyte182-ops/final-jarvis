export class VoiceController {
  constructor({ onResult, onStart, onEnd, onInterim } = {}) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.isSupported = !!SpeechRecognition;

    if (!this.isSupported) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript && onInterim) onInterim(interimTranscript);
      if (finalTranscript && onResult) onResult(finalTranscript);
    };

    this.recognition.onstart = onStart || (() => {});
    this.recognition.onend = onEnd || (() => {});
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (onEnd) onEnd();
    };

    this.listening = false;
  }

  start() {
    if (!this.isSupported) return;
    try {
      this.recognition.start();
      this.listening = true;
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }

  stop() {
    if (!this.isSupported) return;
    this.recognition.stop();
    this.listening = false;
  }

  speak(text, { rate = 1, pitch = 1 } = {}) {
    if (!window.speechSynthesis) {
      console.warn('Speech Synthesis not supported');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = pitch;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
      || voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  }
}
