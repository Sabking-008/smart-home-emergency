let S = { latitude: 0, longitude: 0 };
let fireActive = false;
let alarmSoundEnabled = false;
let alarmSilenced = false;
let alarmAudioContext = null;
let alarmTimer = null;

const $ = id => document.getElementById(id);

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(window.tt);
  window.tt = setTimeout(() => $("toast").classList.remove("show"), 2200);
}

async function cmd(url, body = null) {
  try {
    const options = { method: "POST", headers: { "Content-Type": "application/json" } };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) throw Error(data.error || "Command failed");

    toast(data.message || "Command sent");
    await status();
  } catch (error) {
    toast(error.message);
  }
}

function angle(value) {
  $("angle").textContent = value + "°";
}

function setServo(value) {
  cmd("/api/servo", { angle: Number(value) });
}

function playAlarmBeep() {
  if (!alarmAudioContext) return;

  const now = alarmAudioContext.currentTime;
  const oscillator = alarmAudioContext.createOscillator();
  const volume = alarmAudioContext.createGain();

  oscillator.type = "square";
  oscillator.frequency.value = 880;
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  oscillator.connect(volume);
  volume.connect(alarmAudioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.3);
}

function startAlarmSound() {
  if (!alarmSoundEnabled || !fireActive || alarmSilenced || alarmTimer !== null) return;

  if (alarmAudioContext.state === "suspended") {
    alarmAudioContext.resume().catch(() => {});
  }

  playAlarmBeep();
  alarmTimer = setInterval(playAlarmBeep, 600);
}

function stopAlarmSound() {
  if (alarmTimer !== null) clearInterval(alarmTimer);
  alarmTimer = null;
}

function updateFireAlert(detected) {
  if (detected && !fireActive) alarmSilenced = false;

  if (!detected && fireActive) {
    stopAlarmSound();
    alarmSilenced = false;
  }

  fireActive = detected;

  const banner = $("fireAlert");
  banner.hidden = !detected;

  const siteAlarmBadge = $("siteAlarmBadge");
  const siteAlarmText = $("siteAlarmText");
  const siteSoundButton = $("siteSoundButton");

  if (!alarmSoundEnabled) {
    siteAlarmBadge.textContent = "DISABLED";
    siteAlarmText.textContent = "Enable the website sound once so it can play when fire is detected.";
    siteSoundButton.textContent = "ENABLE ALARM SOUND";
  } else if (detected && alarmSilenced) {
    siteAlarmBadge.textContent = "SILENCED";
    siteAlarmText.textContent = "Fire detected. The website alarm is silenced.";
    siteSoundButton.textContent = "RESUME ALARM";
  } else if (detected) {
    siteAlarmBadge.textContent = "SOUNDING";
    siteAlarmText.textContent = "Fire detected. The website alarm is playing.";
    siteSoundButton.textContent = "SILENCE ALARM";
  } else {
    siteAlarmBadge.textContent = "READY";
    siteAlarmText.textContent = "Website alarm is ready and will sound when fire is detected.";
    siteSoundButton.textContent = "TEST ALARM SOUND";
  }

  if (!detected) return;

  if (!alarmSoundEnabled) {
    $("fireAlertText").textContent = "Flame detected. Tap to enable the alarm sound.";
    $("fireSoundButton").textContent = "Enable alarm sound";
  } else if (alarmSilenced) {
    $("fireAlertText").textContent = "Flame detected. The alarm sound is silenced.";
    $("fireSoundButton").textContent = "Resume alarm";
  } else {
    $("fireAlertText").textContent = "Flame detected. Alarm sound is active.";
    $("fireSoundButton").textContent = "Silence alarm";
    startAlarmSound();
  }
}

async function toggleFireSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    toast("Alarm sound is not supported by this browser");
    return;
  }

  try {
    if (!alarmAudioContext) alarmAudioContext = new AudioContextClass();
    await alarmAudioContext.resume();

    if (!alarmSoundEnabled) {
      alarmSoundEnabled = true;

      if (fireActive) {
        alarmSilenced = false;
        startAlarmSound();
      } else {
        playAlarmBeep();
        toast("Alarm sound enabled");
      }
    } else if (fireActive) {
      alarmSilenced = !alarmSilenced;

      if (alarmSilenced) stopAlarmSound();
      else startAlarmSound();
    } else {
      playAlarmBeep();
      toast("Alarm sound enabled");
    }

    updateFireAlert(fireActive);
  } catch (error) {
    toast("Could not start alarm sound");
  }
}

function paint(s) {
  S = s;

  $("sysBadge").textContent = s.armed ? "ARMED" : "DISARMED";
  $("sysBadge").style.color = s.armed ? "#ff9999" : "#7de8bd";
  $("sys").textContent = s.armed ? "System is armed" : "System is safe";
  $("sysText").textContent = s.armed
    ? "Emergency monitoring is active."
    : "Emergency monitoring is currently disabled.";

  $("alarmBadge").textContent = s.alarm ? "ON" : "OFF";
  $("alarmBadge").style.color = s.alarm ? "#ff9999" : "#7de8bd";
  $("alarmText").textContent = s.alarm ? "Alarm active" : "Alarm inactive";

  const fireDetected = s.fire === true || s.fire === 1 || s.fire === "true";
  $("fire").textContent = fireDetected ? "FIRE ALERT" : "SAFE";
  $("fire").style.color = fireDetected ? "#ed5754" : "#27c98a";
  $("fireD").textContent = fireDetected ? "Fire detected" : "No fire detected";
  updateFireAlert(fireDetected);

  $("vib").textContent = s.vibration ? "DETECTED" : "NORMAL";
  $("vib").style.color = s.vibration ? "#f2aa43" : "#27c98a";
  $("vibD").textContent = s.vibration ? "Vibration detected" : "No vibration detected";
  $("dist").textContent = Number(s.distance || 0).toFixed(1);

  const servoAngle = Math.round(Number(s.servo || 0));
  $("servo").textContent = servoAngle;
  $("slider").value = servoAngle;
  $("angle").textContent = servoAngle + "°";
  $("gate").textContent = servoAngle >= 90 ? "Open" : "Closed";
  $("gateBadge").textContent = servoAngle >= 90 ? "OPEN" : "CLOSED";

  $("lat").textContent = Number(s.latitude || 0).toFixed(6);
  $("lon").textContent = Number(s.longitude || 0).toFixed(6);
  $("sat").textContent = Math.round(s.satellites || 0);
  $("speed").textContent = Number(s.speed || 0).toFixed(1);

  const mpu = s.mpu || {};
  $("mpu").innerHTML = ["ax", "ay", "az", "gx", "gy", "gz"]
    .map(key => `<div><span>${key.toUpperCase()}</span><b>${Number(mpu[key] || 0).toFixed(2)}</b></div>`)
    .join("");

  $("dot").className = s.online ? "on" : "";
  $("conn").textContent = s.online ? "ESP8266 Online" : "ESP8266 Offline";
  $("dev").textContent = s.online ? "Online" : "Offline";

  const lastSeen = s.lastSeen ? new Date(s.lastSeen).toLocaleTimeString() : "Never";
  $("seen").textContent = s.lastSeen ? "Last update: " + lastSeen : "Waiting for device";
  $("last").textContent = lastSeen;
}

async function status() {
  try {
    const response = await fetch("/api/status", { cache: "no-store" });
    paint(await response.json());
  } catch (error) {
    // Keep the last displayed state if the connection briefly drops.
  }
}

function map() {
  if (!S.latitude || !S.longitude) return toast("GPS coordinates not available");

  window.open(
    "https://www.google.com/maps?q=" + S.latitude + "," + S.longitude,
    "_blank"
  );
}

function loadCam() {
  const url = $("camUrl").value.trim();

  try {
    new URL(url);
  } catch {
    return toast("Enter a valid camera URL");
  }

  localStorage.cam = url;
  $("cam").src = url;
  $("cam").hidden = false;
  $("camBox").hidden = true;
  toast("Camera loaded");
}

if (localStorage.cam) $("camUrl").value = localStorage.cam;

window.addEventListener("pagehide", stopAlarmSound);
status();
setInterval(status, 2000);
