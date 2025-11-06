// =======================
// ELEMENTOS DO HTML
// =======================
const textInput = document.getElementById("textInput");
const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");
const display = document.getElementById("display");
const speedSlider = document.getElementById("speed");
const speedValue = document.getElementById("speedValue");
const minFreqInput = document.getElementById("minFreq");
const maxFreqInput = document.getElementById("maxFreq");
const loopCheckbox = document.getElementById("loop");

// Botões extras
const encodeBtn = document.createElement("button");
encodeBtn.textContent = "Encode";
const decodeBtn = document.createElement("button");
decodeBtn.textContent = "Decode";
const exportBtn = document.createElement("button");
exportBtn.textContent = "Export WAV";
const quizBtn = document.createElement("button");
quizBtn.textContent = "Start Quiz";

// Inserção no DOM
playBtn.parentNode.insertBefore(encodeBtn, playBtn);
playBtn.parentNode.insertBefore(decodeBtn, playBtn);
playBtn.parentNode.insertBefore(exportBtn, playBtn.nextSibling);
playBtn.parentNode.insertBefore(quizBtn, exportBtn.nextSibling);

// =======================
// VARIÁVEIS GLOBAIS
// =======================
let audioCtx;
let isPlaying = false;
let stopRequested = false;

// =======================
// MAPEAMENTO GRINGOCODE
// =======================
const gringoCode = {
  A: "GX", B: "QL", C: "RM", D: "VT", E: "KO",
  F: "ZN", G: "PB", H: "XS", I: "YD", J: "CF",
  K: "UA", L: "JW", M: "HB", N: "TR", O: "EV",
  P: "NI", Q: "LC", R: "AD", S: "WM", T: "OF",
  U: "SP", V: "GJ", W: "BK", X: "QE", Y: "FR", Z: "DU",
  1: "ON", 2: "TO", 3: "TEE", 4: "FO", 5: "FIV", 6: "SI",
  7: "SEV", 8: "EIT", 9: "NEIN", 0: "ZRO"
};
const reverseGringo = Object.fromEntries(Object.entries(gringoCode).map(([k, v]) => [v, k]));

// =======================
// SLIDER DE VELOCIDADE
// =======================
speedSlider.oninput = () => {
  speedValue.textContent = `${speedSlider.value} ms`;
};

// =======================
// FUNÇÕES DE ÁUDIO
// =======================

// Cria mapa de frequências baseado no alfabeto
function generateFrequencyMap(minFreq, maxFreq) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const freqMap = {};
  const step = (maxFreq - minFreq) / (letters.length - 1);
  letters.forEach((l, i) => {
    freqMap[l] = minFreq + step * i;
  });
  return freqMap;
}

// Tocar tom individual
function playTone(freq, duration) {
  return new Promise((resolve) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      resolve();
    }, duration);
  });
}

// Sequência sonora completa
async function playSequence(text, speed, minFreq, maxFreq, loop) {
  isPlaying = true;
  stopRequested = false;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const freqMap = generateFrequencyMap(minFreq, maxFreq);
  const chars = text.toUpperCase().split("").filter((c) => /[A-Z ]/.test(c));

  display.innerHTML = '<span class="cursor"></span>';
  const cursor = display.querySelector(".cursor");

  do {
    display.innerHTML = "";
    for (let i = 0; i < chars.length; i++) {
      if (stopRequested) return;
      const char = chars[i];
      const freq = freqMap[char];
      const span = document.createElement("span");
      span.textContent = char;
      if (Math.random() < 0.15 && char !== " ") span.classList.add("letter-green");
      display.appendChild(span);
      display.appendChild(cursor);
      if (freq) await playTone(freq, speed);
      await new Promise((r) => setTimeout(r, speed / 2));
    }
    await new Promise((r) => setTimeout(r, 500));
  } while (loop && !stopRequested);

  isPlaying = false;
}

// =======================
// EVENTOS DE BOTÕES
// =======================

// Play
playBtn.onclick = () => {
  if (isPlaying) return;
  const text = textInput.value.trim();
  if (!text) return alert("Type something first!");
  const speed = parseInt(speedSlider.value);
  const minFreq = parseInt(minFreqInput.value);
  const maxFreq = parseInt(maxFreqInput.value);
  const loop = loopCheckbox.checked;
  playSequence(text, speed, minFreq, maxFreq, loop);
};

// Stop
stopBtn.onclick = () => {
  stopRequested = true;
  isPlaying = false;
};

// Encode
encodeBtn.onclick = () => {
  const text = textInput.value.toUpperCase().replace(/[^A-Z ]/g, "");
  let encoded = "";
  for (const ch of text) {
    encoded += (ch === " " ? " " : gringoCode[ch] + " ");
  }
  textInput.value = encoded.trim();
};

// Decode
decodeBtn.onclick = () => {
  const text = textInput.value.toUpperCase().trim();
  const parts = text.split(/\s+/);
  let decoded = "";
  for (const part of parts) decoded += (part === "" ? " " : reverseGringo[part] || "?");
  textInput.value = decoded;
};

// =======================
// EXPORTAR WAV
// =======================
exportBtn.onclick = async () => {
  const text = textInput.value.toUpperCase().split("").filter(c => /[A-Z ]/.test(c));
  if (!text.length) return alert("Type something first!");

  const speed = parseInt(speedSlider.value);
  const minFreq = parseInt(minFreqInput.value);
  const maxFreq = parseInt(maxFreqInput.value);
  const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100 * text.length, 44100);
  const freqMap = generateFrequencyMap(minFreq, maxFreq);

  let offset = 0;
  for (const char of text) {
    const freq = freqMap[char];
    if (freq) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, offset);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(offset);
      osc.stop(offset + speed / 1000);
    }
    offset += speed / 1000;
  }

  const renderedBuffer = await ctx.startRendering();
  const wavBlob = bufferToWav(renderedBuffer);
  const url = URL.createObjectURL(wavBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gringocode.wav";
  a.click();
};

// =======================
// CONVERTER AUDIOBUFFER PARA WAV
// =======================
function bufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels,
        length = buffer.length * numOfChan * 2 + 44,
        bufferArray = new ArrayBuffer(length),
        view = new DataView(bufferArray),
        channels = [],
        sampleRate = buffer.sampleRate;
  let pos = 0;

  function writeString(s) { for (let i = 0; i < s.length; i++) view.setUint8(pos++, s.charCodeAt(i)); }

  writeString("RIFF"); view.setUint32(pos, length - 8, true); pos += 4;
  writeString("WAVE"); writeString("fmt "); view.setUint32(pos, 16, true); pos += 4;
  view.setUint16(pos, 1, true); pos += 2; // PCM
  view.setUint16(pos, numOfChan, true); pos += 2;
  view.setUint32(pos, sampleRate, true); pos += 4;
  view.setUint32(pos, sampleRate * 2 * numOfChan, true); pos += 4;
  view.setUint16(pos, numOfChan * 2, true); pos += 2;
  view.setUint16(pos, 16, true); pos += 2;
  writeString("data"); view.setUint32(pos, length - pos - 4, true); pos += 4;

  for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numOfChan; ch++) {
      let sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      pos += 2;
    }
  }

  return new Blob([view], { type: "audio/wav" });
}

// =======================
// MODO QUIZ
// =======================
quizBtn.onclick = async () => {
  const text = textInput.value.toUpperCase().replace(/[^A-Z]/g, "");
  if (!text) return alert("Type letters first!");

  const speed = parseInt(speedSlider.value);
  const minFreq = parseInt(minFreqInput.value);
  const maxFreq = parseInt(maxFreqInput.value);
  const freqMap = generateFrequencyMap(minFreq, maxFreq);
  let score = 0;

  for (const char of text) {
    await playTone(freqMap[char], speed);
    const guess = prompt("Which letter was that?").toUpperCase();
    if (guess === char) {
      alert("Correct!");
      score++;
    } else {
      alert(`Wrong! It was ${char}`);
    }
  }

  alert(`Quiz finished! Score: ${score}/${text.length}`);
};