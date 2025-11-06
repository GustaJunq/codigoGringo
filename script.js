const textInput = document.getElementById("textInput");
const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");
const display = document.getElementById("display");
const speedSlider = document.getElementById("speed");
const speedValue = document.getElementById("speedValue");
const minFreqInput = document.getElementById("minFreq");
const maxFreqInput = document.getElementById("maxFreq");
const loopCheckbox = document.getElementById("loop");

// novos botões
const encodeBtn = document.createElement("button");
encodeBtn.textContent = "Encode";
encodeBtn.id = "encodeBtn";

const decodeBtn = document.createElement("button");
decodeBtn.textContent = "Decode";
decodeBtn.id = "decodeBtn";

// insere logo antes do botão Play
playBtn.parentNode.insertBefore(encodeBtn, playBtn);
playBtn.parentNode.insertBefore(decodeBtn, playBtn);

let audioCtx;
let isPlaying = false;
let stopRequested = false;

// Mapeamento GringoCode
const gringoCode = {
  A: "GX", B: "QL", C: "RM", D: "VT", E: "KO",
  F: "ZN", G: "PB", H: "XS", I: "YD", J: "CF",
  K: "UA", L: "JW", M: "HB", N: "TR", O: "EV",
  P: "NI", Q: "LC", R: "AD", S: "WM", T: "OF",
  U: "SP", V: "GJ", W: "BK", X: "QE", Y: "FR", Z: "DU",
  1: "ON", 2: "TO", 3: "TEE", 4: "FO", 5: "FIV", 6: "SI", 7: "SEV", 8: "EIT", 9: "NEIN", 0: "ZRO"
};
const reverseGringo = Object.fromEntries(Object.entries(gringoCode).map(([k, v]) => [v, k]));

// Atualiza valor do slider de velocidade
speedSlider.oninput = () => {
  speedValue.textContent = `${speedSlider.value} ms`;
};

// Gera as frequências do alfabeto
function generateFrequencyMap(minFreq, maxFreq) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const freqMap = {};
  const step = (maxFreq - minFreq) / (letters.length - 1);
  letters.forEach((l, i) => {
    freqMap[l] = minFreq + step * i;
  });
  return freqMap;
}

// Função para tocar um tom
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

// Sequência sonora
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

// Botão Play
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

// Botão Stop
stopBtn.onclick = () => {
  stopRequested = true;
  isPlaying = false;
};

// Botão Encode
encodeBtn.onclick = () => {
  const text = textInput.value.toUpperCase().replace(/[^A-Z ]/g, "");
  let encoded = "";
  for (const ch of text) {
    if (ch === " ") encoded += " ";
    else encoded += gringoCode[ch] + " ";
  }
  textInput.value = encoded.trim();
};

// Botão Decode
decodeBtn.onclick = () => {
  const text = textInput.value.toUpperCase().trim();
  const parts = text.split(/\s+/);
  let decoded = "";
  for (const part of parts) {
    if (part === "") decoded += " ";
    else decoded += reverseGringo[part] || "?";
  }
  textInput.value = decoded;
};