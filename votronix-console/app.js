const state = {
  apiBase: localStorage.getItem("votronixApiBase") || "http://127.0.0.1:8765",
  effects: [],
  chain: [],
  recorder: null,
  recordChunks: [],
};

const $ = (id) => document.getElementById(id);

function apiUrl(path) {
  return `${state.apiBase.replace(/\/$/, "")}${path}`;
}

async function api(path, options = {}) {
  const init = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };
  const response = await fetch(apiUrl(path), init);
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return payload;
}

function post(path, payload = {}) {
  return api(path, { method: "POST", body: JSON.stringify(payload) });
}

async function upload(path, formData) {
  const response = await fetch(apiUrl(path), { method: "POST", body: formData });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `Upload failed: ${response.status}`);
  }
  return payload;
}

function toast(message) {
  const node = $("toast");
  node.textContent = message;
  node.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => node.classList.remove("show"), 3200);
}

function setOnline(online, message) {
  $("connection-dot").classList.toggle("online", online);
  $("connection-text").textContent = message;
}

async function refreshAll() {
  try {
    await Promise.all([loadStatus(), loadEffects(), loadProviders(), loadProjects(), loadSettings()]);
    setOnline(true, "Connected to Python");
  } catch (error) {
    setOnline(false, "Start web_server.py");
    toast(error.message);
  }
}

async function loadStatus() {
  const status = await api("/api/status");
  $("project-title").textContent = status.project;
  $("source-state").textContent = status.source_loaded ? status.source_audio || "Loaded" : "No audio";
  $("sample-rate").textContent = `${status.sample_rate || 0} Hz`;
  $("channels").textContent = status.channels || 0;
  $("effect-count").textContent = status.effects_in_chain || 0;
  updateAudioPreview(status.source_loaded);
  await loadChain();
  await loadWaveform();
}

function updateAudioPreview(sourceLoaded) {
  const audio = $("audio-preview");
  if (!sourceLoaded) {
    audio.removeAttribute("src");
    audio.load();
    updateTransportTime();
    return;
  }
  const nextSrc = apiUrl(`/api/audio/processed.wav?t=${Date.now()}`);
  if (audio.src !== nextSrc) {
    audio.src = nextSrc;
    audio.load();
  }
}

async function loadEffects() {
  const payload = await api("/api/effects");
  state.effects = payload.effects;
  const select = $("effect-select");
  select.innerHTML = state.effects
    .map((effect) => `<option value="${escapeHtml(effect.effect_id)}">${escapeHtml(effect.display_name)}</option>`)
    .join("");
  renderEffectParams();
}

async function loadChain() {
  const payload = await api("/api/chain");
  state.chain = payload.chain;
  renderChain();
}

async function loadProviders() {
  const payload = await api("/api/providers");
  fillSelect($("tts-provider"), payload.tts);
  fillSelect($("stt-provider"), payload.stt);
}

async function loadProjects() {
  const payload = await api("/api/projects");
  const list = $("project-list");
  if (payload.projects.length === 0) {
    list.innerHTML = "<p>No saved projects yet.</p>";
    return;
  }
  list.innerHTML = payload.projects
    .map(
      (project) => `
        <div class="project-item">
          <span>${escapeHtml(project.name)}</span>
          <button data-load-project="${escapeHtml(project.path)}">Load</button>
        </div>
      `,
    )
    .join("");
}

async function loadSettings() {
  const payload = await api("/api/settings");
  $("settings-output").textContent = JSON.stringify(payload.settings, null, 2);
}

async function loadWaveform() {
  const payload = await api("/api/waveform?buckets=160");
  const points = payload.processed.length ? payload.processed : payload.source;
  const waveform = $("waveform");
  if (!points.length) {
    waveform.innerHTML = "<span>Waveform appears after audio is loaded</span>";
    return;
  }
  waveform.innerHTML = `<div class="waveform-bars">${points
    .map((point) => {
      const peak = Math.max(Math.abs(point.minimum || 0), Math.abs(point.maximum || 0));
      const height = Math.max(2, Math.min(100, peak * 100));
      return `<i style="height:${height}%"></i>`;
    })
    .join("")}</div>`;
}

function fillSelect(select, providers) {
  select.innerHTML = providers
    .map((provider) => `<option value="${escapeHtml(provider.provider_id)}">${escapeHtml(provider.display_name)}</option>`)
    .join("");
}

function renderEffectParams() {
  const effect = state.effects.find((item) => item.effect_id === $("effect-select").value);
  const params = $("effect-params");
  if (!effect || !effect.parameters.length) {
    params.innerHTML = "<p>This effect has no editable parameters.</p>";
    return;
  }
  params.innerHTML = effect.parameters
    .map(
      (param) => `
        <div class="param">
          <label for="param-${escapeHtml(param.name)}">${escapeHtml(param.name)}</label>
          <input id="param-${escapeHtml(param.name)}" data-param="${escapeHtml(param.name)}" type="range"
            min="${param.minimum}" max="${param.maximum}" step="0.01" value="${param.default}" />
          <input data-param-value="${escapeHtml(param.name)}" value="${param.default}" />
        </div>
      `,
    )
    .join("");
}

function renderChain() {
  const list = $("chain-list");
  if (!state.chain.length) {
    list.innerHTML = "<p>No effects in the active chain.</p>";
    return;
  }
  list.innerHTML = state.chain
    .map((item) => {
      const effect = state.effects.find((candidate) => candidate.effect_id === item.effect_id);
      const name = effect ? effect.display_name : item.effect_id;
      const params = Object.entries(item.parameters || {})
        .map(([key, value]) => `${escapeHtml(key)}: ${escapeHtml(String(value))}`)
        .join(", ");
      return `
        <div class="chain-item">
          <header>
            <div>
              <strong>${escapeHtml(name)}</strong>
              <small>${params || "Default parameters"}</small>
            </div>
            <button data-remove-effect="${escapeHtml(item.instance_id)}">Remove</button>
          </header>
        </div>
      `;
    })
    .join("");
}

function selectedEffectParameters() {
  const values = {};
  document.querySelectorAll("[data-param-value]").forEach((input) => {
    values[input.dataset.paramValue] = Number(input.value);
  });
  return values;
}

function bindEvents() {
  document.querySelectorAll("nav button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("nav button, .panel").forEach((node) => node.classList.remove("active"));
      button.classList.add("active");
      $(button.dataset.panel).classList.add("active");
    });
  });

  $("api-base").value = state.apiBase;
  $("save-api").addEventListener("click", () => {
    state.apiBase = $("api-base").value.trim() || "http://127.0.0.1:8765";
    localStorage.setItem("votronixApiBase", state.apiBase);
    refreshAll();
  });

  $("refresh-status").addEventListener("click", refreshAll);
  bindTransportEvents();
  $("effect-select").addEventListener("change", renderEffectParams);
  $("effect-params").addEventListener("input", (event) => {
    if (!event.target.dataset.param) return;
    const valueInput = document.querySelector(`[data-param-value="${event.target.dataset.param}"]`);
    valueInput.value = event.target.value;
  });

  $("load-audio").addEventListener("click", async () => {
    await post("/api/audio/load", { path: $("audio-path").value.trim() });
    toast("Audio loaded");
    await loadStatus();
  });

  $("upload-audio").addEventListener("click", async () => {
    const file = $("audio-file").files[0];
    if (!file) {
      toast("Choose a WAV file first");
      return;
    }
    const formData = new FormData();
    formData.append("audio", file);
    const payload = await upload("/api/audio/upload", formData);
    toast(`Imported ${payload.path}`);
    await loadStatus();
  });

  $("export-audio").addEventListener("click", async () => {
    const payload = await post("/api/audio/export", { name: "processed_web.wav" });
    toast(`Exported ${payload.path}`);
  });

  $("add-effect").addEventListener("click", async () => {
    await post("/api/effects/add", {
      effect_id: $("effect-select").value,
      parameters: selectedEffectParameters(),
    });
    toast("Effect added");
    await loadStatus();
  });

  $("clear-chain").addEventListener("click", async () => {
    await post("/api/effects/clear");
    toast("Chain cleared");
    await loadStatus();
  });

  $("chain-list").addEventListener("click", async (event) => {
    const instanceId = event.target.dataset.removeEffect;
    if (!instanceId) return;
    await post("/api/effects/remove", { instance_id: instanceId });
    toast("Effect removed");
    await loadStatus();
  });

  $("infer-effects").addEventListener("click", async () => {
    const payload = await post("/api/ai/infer-effects", { prompt: $("ai-prompt").value });
    toast(`Applied ${payload.applied} inferred effect command(s)`);
    await loadStatus();
  });

  $("run-tts").addEventListener("click", async () => {
    const payload = await post("/api/tts/synthesize", {
      provider_id: $("tts-provider").value,
      text: $("tts-text").value,
    });
    toast(`Generated ${payload.path}`);
    await loadStatus();
  });

  $("run-stt").addEventListener("click", async () => {
    const payload = await post("/api/stt/transcribe", { provider_id: $("stt-provider").value });
    $("transcript-output").textContent = JSON.stringify(payload.transcript, null, 2);
    toast("Transcript complete");
  });

  $("new-project").addEventListener("click", async () => {
    await post("/api/project/new", { name: $("new-project-name").value.trim() || "Untitled Project" });
    toast("New project ready");
    await refreshAll();
  });

  $("save-project").addEventListener("click", async () => {
    const payload = await post("/api/project/save");
    toast(`Saved ${payload.path}`);
    await loadProjects();
  });

  $("reload-projects").addEventListener("click", loadProjects);
  $("project-list").addEventListener("click", async (event) => {
    const path = event.target.dataset.loadProject;
    if (!path) return;
    await post("/api/project/load", { path });
    toast("Project loaded");
    await refreshAll();
  });
}

function bindTransportEvents() {
  const audio = $("audio-preview");
  const seek = $("transport-seek");

  $("play-audio").addEventListener("click", async () => {
    if (!audio.src) {
      toast("Import a WAV before playback");
      return;
    }
    await audio.play();
  });

  $("pause-audio").addEventListener("click", () => audio.pause());

  $("stop-audio").addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    updateTransportTime();
  });

  $("reverse-audio").addEventListener("click", () => {
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  });

  $("forward-audio").addEventListener("click", () => {
    audio.currentTime = Math.min(audio.duration || audio.currentTime + 10, audio.currentTime + 10);
  });

  $("previous-track").addEventListener("click", () => {
    audio.currentTime = 0;
  });

  $("next-track").addEventListener("click", () => {
    if (Number.isFinite(audio.duration)) {
      audio.currentTime = Math.max(0, audio.duration - 0.05);
    }
  });

  $("record-audio").addEventListener("click", toggleRecording);

  seek.addEventListener("input", () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
  });

  audio.addEventListener("timeupdate", updateTransportTime);
  audio.addEventListener("loadedmetadata", updateTransportTime);
  audio.addEventListener("ended", updateTransportTime);
}

function updateTransportTime() {
  const audio = $("audio-preview");
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  $("time-current").textContent = formatTime(audio.currentTime || 0);
  $("time-duration").textContent = formatTime(duration);
  $("transport-seek").value = duration > 0 ? Math.round(((audio.currentTime || 0) / duration) * 1000) : 0;
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

async function toggleRecording() {
  const button = $("record-audio");
  if (state.recorder && state.recorder.state === "recording") {
    state.recorder.stop();
    button.classList.remove("recording");
    button.textContent = "Record";
    return;
  }
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    toast("Browser recording is not available here");
    return;
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  state.recordChunks = [];
  state.recorder = new MediaRecorder(stream);
  state.recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) state.recordChunks.push(event.data);
  });
  state.recorder.addEventListener("stop", async () => {
    stream.getTracks().forEach((track) => track.stop());
    try {
      const sourceBlob = new Blob(state.recordChunks, { type: state.recorder.mimeType });
      const wavBlob = await mediaBlobToWav(sourceBlob);
      const formData = new FormData();
      formData.append("audio", wavBlob, `recording-${Date.now()}.wav`);
      const payload = await upload("/api/audio/upload", formData);
      toast(`Recorded ${payload.path}`);
      await loadStatus();
    } catch (error) {
      toast(error.message);
    }
  });
  state.recorder.start();
  button.classList.add("recording");
  button.textContent = "Stop Rec";
  toast("Recording started");
}

async function mediaBlobToWav(blob) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("This browser cannot convert recordings to WAV.");
  }
  const context = new AudioContextClass();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await context.decodeAudioData(arrayBuffer);
  const wav = encodeWav(audioBuffer);
  await context.close();
  return new Blob([wav], { type: "audio/wav" });
}

function encodeWav(audioBuffer) {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const frameCount = audioBuffer.length;
  const dataBytes = frameCount * channels * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataBytes, true);
  let offset = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[frame]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return buffer;
}

function writeString(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

bindEvents();
refreshAll();
