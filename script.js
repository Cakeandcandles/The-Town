const FAST = new URLSearchParams(location.search).has("fast");
const TICK = FAST ? 350 : 2800;
const COOLDOWN = FAST ? 500 : 4800;

let token = localStorage.getItem("token");

if (token === "1" || token === "won") {
  window.location.href = "gather.html";
}

if (token === null || token === "dead") {
  localStorage.setItem("token", "0");
  token = "0";
}

const button = document.getElementById("action");
const messagesContainer = document.getElementById("messages");
const resourcesContainer = document.getElementById("resources");
const settlement = document.getElementById("settlement");

let wood = 0;
let huts = 0;
let messageTimer = null;
let logQueue = [];
let telling = false;

const sfx = {
  ctx: null,
  boot() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  },
  beep(freq, dur, type = "sine", gain = 0.03) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  },
};

document.body.addEventListener("pointerdown", () => sfx.boot(), { once: true });

function tell(lines, pace = TICK) {
  const arr = Array.isArray(lines) ? lines : [lines];
  logQueue.push(...arr.map((text) => ({ text, pace })));
  if (!telling) drainLog();
}

function drainLog() {
  if (!logQueue.length) {
    telling = false;
    return;
  }
  telling = true;
  const { text, pace } = logQueue.shift();
  const p = document.createElement("p");
  p.textContent = text;
  messagesContainer.insertBefore(p, messagesContainer.firstChild);
  while (messagesContainer.children.length > 10) {
    messagesContainer.removeChild(messagesContainer.lastChild);
  }
  sfx.beep(220 + Math.random() * 80, 0.07, "triangle", 0.02);
  messageTimer = setTimeout(drainLog, pace);
}

function setResource(id, label, value) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.className = "resource-square";
    el.id = id;
    resourcesContainer.appendChild(el);
  }
  el.textContent = `${label}: ${value}`;
}

function addHutSilhouette() {
  const hut = document.createElement("div");
  hut.className = "bldg hut";
  hut.style.left = huts === 1 ? "18%" : "32%";
  settlement.appendChild(hut);
  const person = document.createElement("div");
  person.className = "person";
  person.style.left = huts === 1 ? "22%" : "38%";
  person.style.animationDelay = `${huts}s`;
  settlement.appendChild(person);
}

function cooldown(btn, ms, done) {
  btn.classList.add("cooldown");
  btn.style.setProperty("--cd", `${ms}ms`);
  setTimeout(() => {
    btn.classList.remove("cooldown");
    done();
  }, ms);
}

function ensureSpan(btn) {
  if (!btn.querySelector("span")) {
    const text = btn.textContent;
    btn.textContent = "";
    const span = document.createElement("span");
    span.textContent = text;
    btn.appendChild(span);
  }
}

tell([
  "The flood is over",
  "All the townspeople are dead",
  "Ruined barns litter the landscape",
  "You get up and look around",
  "The Town needs You.",
]);

setTimeout(() => {
  button.hidden = false;
  sfx.beep(180, 0.12, "square", 0.025);
}, TICK * 5);

const walkAround = function () {
  sfx.boot();
  button.hidden = true;
  messagesContainer.innerHTML = "";
  logQueue = [];
  telling = false;
  clearTimeout(messageTimer);

  tell([
    "You walk to the town square",
    "Everything has been washed away",
    "Broken wood and rubble are everywhere",
    "This is where You will rebuild.",
  ]);

  setTimeout(() => {
    button.hidden = false;
    button.querySelector("span").textContent = "Build a shelter";
    createWoodButton();
    button.addEventListener("click", buildShelter);
  }, TICK * 4);

  button.removeEventListener("click", walkAround);
};

button.addEventListener("click", walkAround);

function createWoodButton() {
  const woodButton = document.createElement("button");
  woodButton.id = "wood-action";
  woodButton.innerHTML = "<span>Gather wood</span>";
  button.parentNode.insertBefore(woodButton, button.nextSibling);
  woodButton.addEventListener("click", gatherWood);
}

function gatherWood(event) {
  const btn = event.currentTarget;
  ensureSpan(btn);
  sfx.beep(140, 0.08, "sawtooth", 0.02);
  cooldown(btn, COOLDOWN, () => {
    wood += 20;
    setResource("resource-wood", "Wood", wood);
    tell("You gathered 20 wood", Math.min(TICK, 1600));
    sfx.beep(320, 0.1, "triangle", 0.03);
    if (wood >= 40 && huts === 0) {
      tell("You'll need 40 wood for a shelter", Math.min(TICK, 1600));
    }
  });
}

function buildShelter() {
  if (wood < 40) {
    tell("You'll need at least 40 wood for a shelter");
    sfx.beep(110, 0.14, "square", 0.03);
    return;
  }

  ensureSpan(button);
  cooldown(button, COOLDOWN, () => {
    wood -= 40;
    huts += 1;
    setResource("resource-wood", "Wood", wood);
    setResource("resource-huts", "Huts", huts);
    addHutSilhouette();
    sfx.beep(260, 0.12, "square", 0.03);
    sfx.beep(390, 0.18, "triangle", 0.03);

    if (huts === 1) {
      tell(["You built Your first shelter", "It will keep You safe for a while"]);
    } else {
      tell(["You built another shelter", "Two huts should be enough"]);
      finishIntro();
    }
  });
}

function goToSquare() {
  localStorage.setItem("token", "1");
  localStorage.setItem("wood", String(wood));
  localStorage.setItem("brick", "0");
  localStorage.setItem("metal", "0");
  localStorage.setItem("huts", String(Math.max(huts, 2)));
  localStorage.setItem("shelters", "0");
  localStorage.setItem("people", "3");
  localStorage.setItem("day", "1");
  localStorage.setItem("playedOnce", "1");
  localStorage.removeItem("townFlags");
  window.location.href = "gather.html";
}

function finishIntro() {
  button.removeEventListener("click", buildShelter);
  setTimeout(() => {
    tell([
      "Night settles on the wreckage",
      "Two wanderers come up the drowned road",
      "They look at the huts, then at You",
      "They say they will help you rebuild",
    ]);
    setTimeout(() => {
      button.hidden = false;
      button.querySelector("span").textContent = "Go to the Square";
      button.addEventListener("click", goToSquare);
    }, TICK * 4);
  }, TICK);
}

const skipBtn = document.getElementById("skip-btn");
if (localStorage.getItem("playedOnce") && skipBtn) {
  skipBtn.hidden = false;
  skipBtn.addEventListener("click", () => {
    wood = Math.max(wood, 20);
    huts = Math.max(huts, 2);
    goToSquare();
  });
}
