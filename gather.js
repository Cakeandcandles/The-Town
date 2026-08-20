const FAST = new URLSearchParams(location.search).has("fast");
const TICK = FAST ? 350 : 2600;
const COOLDOWN = FAST ? 500 : 4800;
const DAY = FAST ? 2500 : 18000;

const $ = (id) => document.getElementById(id);

const els = {
  top: $("top"),
  status: $("status"),
  messages: $("messages"),
  resources: $("resources"),
  settlement: $("settlement"),
  wood: $("wood-btn"),
  brick: $("action"),
  metal: $("metal-btn"),
  look: $("look-btn"),
  hut: $("hut-btn"),
  shelter: $("shelter-btn"),
  well: $("well-btn"),
  palisade: $("palisade-btn"),
  barn: $("barn-btn"),
  forge: $("forge-btn"),
  tower: $("tower-btn"),
  hall: $("hall-btn"),
  restart: $("restart-btn"),
  event1: $("event-btn"),
  event2: $("event-btn-2"),
};

function num(key, fallback) {
  const n = Number(localStorage.getItem(key));
  return Number.isFinite(n) ? n : fallback;
}

function readFlags() {
  try {
    return JSON.parse(localStorage.getItem("townFlags") || "{}");
  } catch {
    return {};
  }
}

const state = {
  token: localStorage.getItem("token"),
  wood: num("wood", 0),
  brick: num("brick", 0),
  metal: num("metal", 0),
  huts: num("huts", 2),
  shelters: num("shelters", 0),
  people: num("people", 3),
  day: num("day", 1),
  well: num("well", 0),
  palisade: num("palisade", 0),
  barn: num("barn", 0),
  forge: num("forge", 0),
  tower: num("tower", 0),
  hall: num("hall", 0),
  flags: Object.assign(
    {
      introDone: false,
      metal: false,
      dogs: "none",
      threeShelter: false,
      eventOpen: false,
      over: false,
    },
    readFlags()
  ),
};

if (state.token !== "1" && state.token !== "won") {
  window.location.href = "main.html";
}

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
  chord(freqs) {
    freqs.forEach((f, i) => setTimeout(() => this.beep(f, 0.22, "triangle", 0.035), i * 90));
  },
};

document.body.addEventListener("pointerdown", () => sfx.boot(), { once: true });

let logQueue = [];
let telling = false;
let tellTimer = null;
let eventTimer = null;
let pendingEvent = null;

function tell(lines, opts = {}) {
  const arr = Array.isArray(lines) ? lines : [lines];
  const pace = opts.pace ?? TICK;
  const kind = opts.kind || "";
  logQueue.push(...arr.map((text) => ({ text, pace, kind })));
  if (!telling) drainLog();
}

function note(text, kind = "") {
  const p = document.createElement("p");
  p.textContent = text;
  if (kind) p.className = kind;
  els.messages.insertBefore(p, els.messages.firstChild);
  while (els.messages.children.length > 12) {
    els.messages.removeChild(els.messages.lastChild);
  }
}

function drainLog() {
  if (!logQueue.length) {
    telling = false;
    return;
  }
  telling = true;
  const { text, pace, kind } = logQueue.shift();
  note(text, kind);
  sfx.beep(210 + Math.random() * 70, 0.06, "triangle", 0.018);
  tellTimer = setTimeout(drainLog, pace);
}

function save() {
  const keys = [
    "wood",
    "brick",
    "metal",
    "huts",
    "shelters",
    "people",
    "day",
    "well",
    "palisade",
    "barn",
    "forge",
    "tower",
    "hall",
  ];
  keys.forEach((k) => localStorage.setItem(k, String(state[k])));
  localStorage.setItem("townFlags", JSON.stringify(state.flags));
  localStorage.setItem("token", state.token);
}

function housing() {
  return state.huts * 2 + state.shelters * 4;
}

function yieldOf(base) {
  const hands = Math.max(1, state.people);
  const tools = state.forge ? 1.45 : 1;
  return Math.max(1, Math.floor((base + hands * 7) * tools));
}

function placeName() {
  if (state.hall) return "The Town";
  if (state.palisade && state.shelters >= 2) return "The Village";
  if (state.shelters >= 2) return "The Settlement";
  return "The Square";
}

function setRes(id, label, value, show) {
  let el = document.getElementById(id);
  if (!show) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.className = "resource-square";
    el.id = id;
    els.resources.appendChild(el);
  }
  el.textContent = `${label}: ${value}`;
}

function renderResources() {
  setRes("resource-wood", "Wood", state.wood, true);
  setRes("resource-brick", "Brick", state.brick, true);
  setRes("resource-metal", "Metal", state.metal, state.flags.metal);
  setRes("resource-people", "People", `${state.people} / ${housing()} beds`, true);
  setRes("resource-huts", "Huts", state.huts, state.huts > 0);
  setRes("resource-shelters", "Shelters", state.shelters, state.shelters > 0);
  const built = [];
  if (state.well) built.push("Well");
  if (state.palisade) built.push("Palisade");
  if (state.barn) built.push("Barn");
  if (state.forge) built.push("Forge");
  if (state.tower) built.push("Watchtower");
  if (state.hall) built.push("Town Hall");
  setRes("resource-built", "Built", built.join(" · ") || "Ruins", built.length > 0);
}

function renderStatus() {
  els.top.textContent = placeName();
  document.title = placeName();
  const mood = state.hall
    ? "reborn"
    : state.people <= 1
      ? "barely holding"
      : state.people >= 8
        ? "alive again"
        : "after the flood";
  els.status.textContent = `Day ${state.day} · ${state.people} ${state.people === 1 ? "soul" : "souls"} · ${mood}`;
}

const SLOTS = {
  hut: ["7%", "16%", "84%", "92%"],
  shelter: ["28%", "42%", "56%", "74%"],
  well: ["24%"],
  barn: ["68%"],
  forge: ["18%"],
  tower: ["88%"],
  townhall: ["48%"],
};

function addBldg(type, left) {
  const d = document.createElement("div");
  d.className = `bldg ${type}`;
  d.style.left = left;
  if (type === "townhall") d.style.marginLeft = "-46px";
  els.settlement.appendChild(d);
}

function renderTown() {
  els.settlement.innerHTML = "";
  const ruins = document.createElement("div");
  ruins.className = "ruin r2";
  ruins.style.opacity = state.hall ? "0.18" : "0.35";
  els.settlement.appendChild(ruins);

  state.huts = Math.max(0, state.huts);
  SLOTS.hut.slice(0, state.huts).forEach((left) => addBldg("hut", left));
  SLOTS.shelter.slice(0, state.shelters).forEach((left) => addBldg("shelter", left));
  if (state.well) addBldg("well", SLOTS.well[0]);
  if (state.barn) addBldg("barn", SLOTS.barn[0]);
  if (state.forge) addBldg("forge", SLOTS.forge[0]);
  if (state.tower) addBldg("watchtower", SLOTS.tower[0]);
  if (state.hall) addBldg("townhall", SLOTS.townhall[0]);

  const count = Math.min(state.people, 10);
  for (let i = 0; i < count; i += 1) {
    const p = document.createElement("div");
    p.className = "person";
    p.style.left = `${8 + ((i * 13) % 78)}%`;
    p.style.animationDuration = `${9 + (i % 5)}s`;
    p.style.animationDelay = `${i * 0.4}s`;
    els.settlement.appendChild(p);
  }

  if (state.forge || state.hall || state.shelters > 0) {
    const smoke = document.createElement("div");
    smoke.className = "smoke";
    smoke.style.left = state.forge ? "20%" : "46%";
    smoke.style.bottom = "70px";
    els.settlement.appendChild(smoke);
  }

  document.body.classList.toggle("walled", state.palisade > 0);
}

function showBuildButtons() {
  const play = [
    els.wood,
    els.brick,
    els.look,
    els.metal,
    els.hut,
    els.shelter,
    els.well,
    els.palisade,
    els.barn,
    els.forge,
    els.tower,
    els.hall,
  ];
  if (state.flags.over || !state.flags.introDone) {
    play.forEach((b) => {
      b.hidden = true;
    });
    return;
  }
  els.wood.hidden = false;
  els.brick.hidden = false;
  els.look.hidden = false;
  els.metal.hidden = !state.flags.metal;
  els.hut.hidden = state.huts >= SLOTS.hut.length;
  els.shelter.hidden = state.shelters >= 4;
  els.well.hidden = state.well > 0 || state.shelters < 1;
  els.palisade.hidden = state.palisade > 0 || state.shelters < 1;
  els.barn.hidden = state.barn > 0 || !state.well;
  els.forge.hidden = state.forge > 0 || !state.flags.metal;
  els.tower.hidden = state.tower > 0 || !state.palisade || !state.flags.metal;
  els.hall.hidden =
    state.hall > 0 || !(state.palisade && state.well && state.people >= 6);
}

function refresh() {
  renderResources();
  renderStatus();
  renderTown();
  showBuildButtons();
  save();
}

function cooldown(btn, done) {
  if (!btn || btn.classList.contains("cooldown")) return;
  btn.classList.add("cooldown");
  btn.style.setProperty("--cd", `${COOLDOWN}ms`);
  setTimeout(() => {
    btn.classList.remove("cooldown");
    done();
  }, COOLDOWN);
}

function gather(kind, btn) {
  if (state.flags.over) return;
  sfx.boot();
  sfx.beep(kind === "metal" ? 180 : 130, 0.08, "sawtooth", 0.02);
  cooldown(btn, () => {
    const amt = yieldOf(kind === "metal" ? 4 : 12);
    state[kind] += amt;
    const word = kind === "brick" ? "brick" : kind;
    note(`You gathered ${amt} ${word}`);
    sfx.beep(300, 0.09, "triangle", 0.028);
    maybeUnlock();
    refresh();
  });
}

function maybeUnlock() {
  if (!state.flags.hintShelter && state.wood >= 100 && state.brick >= 70 && state.shelters === 0) {
    state.flags.hintShelter = true;
    tell("You have enough to build a proper shelter now", { kind: "good" });
  }
}

function need(text) {
  tell(text);
  sfx.beep(105, 0.16, "square", 0.03);
}

function build(btn, cost, apply, lines) {
  if (state.flags.over || btn.classList.contains("cooldown")) return;
  for (const [k, v] of Object.entries(cost)) {
    if (state[k] < v) {
      const parts = Object.entries(cost).map(([key, n]) => `${n} ${key}`);
      need(`You'll need ${parts.join(" and ")}`);
      return;
    }
  }
  Object.entries(cost).forEach(([k, v]) => {
    state[k] -= v;
  });
  refresh();
  cooldown(btn, () => {
    apply();
    sfx.chord([262, 330, 392]);
    tell(lines, { kind: "good" });
    afterBuild();
    refresh();
  });
}

function afterBuild() {
  if (state.shelters >= 3 && !state.flags.threeShelter) {
    state.flags.threeShelter = true;
    const space = Math.max(0, housing() - state.people);
    const coming = Math.min(4, space);
    setTimeout(() => {
      const arrival =
        coming >= 4
          ? "Four more wanderers arrive"
          : coming > 0
            ? `${coming} wanderer${coming === 1 ? "" : "s"} squeeze in. The rest keep walking.`
            : "Four wanderers look in, but every bunk is taken";
      tell(["You have 3 shelters now", "The Square is looking much better", arrival], { kind: "good" });
      state.people += coming;
      refresh();
    }, 800);
  }
  if (state.people >= 6 && state.palisade && state.well && !state.hall) {
    els.hall.hidden = false;
    tell("The bones of a town are here. You could raise a hall.", { kind: "good" });
  }
}

function clearEvent() {
  pendingEvent = null;
  state.flags.eventOpen = false;
  els.event1.hidden = true;
  els.event2.hidden = true;
  els.event1.className = "event";
  els.event2.className = "event";
  els.event1.onclick = null;
  els.event2.onclick = null;
  if (eventTimer) {
    clearTimeout(eventTimer);
    eventTimer = null;
  }
}

function openEvent(cfg) {
  if (state.flags.over || state.flags.eventOpen) return;
  state.flags.eventOpen = true;
  pendingEvent = cfg;
  tell(cfg.story, { kind: cfg.kind || "" });
  sfx.beep(cfg.kind === "danger" ? 90 : 240, 0.2, "square", 0.04);

  const bind = (btn, choice, bad) => {
    if (!choice) {
      btn.hidden = true;
      return;
    }
    btn.hidden = false;
    btn.className = bad ? "event bad" : "event";
    btn.innerHTML = `<span>${choice.label}</span>`;
    btn.onclick = () => {
      clearEvent();
      choice.fn();
      refresh();
    };
  };

  bind(els.event1, cfg.a, cfg.a && cfg.a.bad);
  bind(els.event2, cfg.b, cfg.b && cfg.b.bad);

  if (cfg.timeout) {
    eventTimer = setTimeout(() => {
      if (!state.flags.eventOpen) return;
      clearEvent();
      cfg.timeout();
      refresh();
    }, cfg.wait || DAY);
  }
}

function losePerson(why) {
  state.people -= 1;
  tell(why, { kind: "danger" });
  if (state.people <= 0) {
    state.people = 0;
    gameOver();
  }
}

function gameOver() {
  state.flags.over = true;
  state.token = "dead";
  document.body.classList.add("dead");
  clearEvent();
  tell([
    "No one is left to keep the fires",
    "Rain takes the Square again",
    "The Town is silent.",
  ], { kind: "danger" });
  els.restart.hidden = false;
  hidePlayButtons();
  save();
  sfx.beep(80, 0.5, "sawtooth", 0.04);
}

function win() {
  state.flags.over = true;
  state.token = "won";
  state.hall = 1;
  document.body.classList.add("won");
  clearEvent();
  tell([
    "You raise the hall on the old foundations",
    "Smoke climbs from new chimneys",
    "Someone laughs. It startles You.",
    "The river is only a river now",
    "The Town lives.",
  ], { kind: "good", pace: TICK + 400 });
  els.restart.hidden = false;
  hidePlayButtons();
  refresh();
  sfx.chord([262, 330, 392, 523]);
}

function hidePlayButtons() {
  [
    els.wood,
    els.brick,
    els.metal,
    els.look,
    els.hut,
    els.shelter,
    els.well,
    els.palisade,
    els.barn,
    els.forge,
    els.tower,
    els.hall,
  ].forEach((b) => {
    b.hidden = true;
  });
}

function resetTown() {
  [
    "token",
    "wood",
    "brick",
    "metal",
    "huts",
    "shelters",
    "people",
    "day",
    "well",
    "palisade",
    "barn",
    "forge",
    "tower",
    "hall",
    "townFlags",
    "farmingSpeed",
  ].forEach((k) => localStorage.removeItem(k));
  window.location.href = "main.html";
}

const looks = [
  "Rain ticks on the ruined roofs",
  "The river is quieter than it was",
  "Crows watch from the mill beam",
  "Mud still holds the shape of a street",
  "You find a child's shoe and set it on a sill",
  "Wind moves through empty windows",
  "Somewhere a hinge squeaks like a voice",
  "The mountains are the same. That helps.",
  "A lantern still hangs over nobody's door",
  "You count the living. You count them again.",
];
let lookIndex = 0;

function lookAround() {
  if (state.flags.over) return;
  cooldown(els.look, () => {
    note(looks[lookIndex % looks.length], "quiet");
    lookIndex += 1;
    sfx.beep(190, 0.08, "sine", 0.02);
  });
}

function wolves() {
  const walls = state.palisade > 0;
  const tower = state.tower > 0;
  const dogs = state.flags.dogs === "friend";
  openEvent({
    kind: "danger",
    story: walls
      ? "Wolves test the palisade in the dark"
      : "A pack of wolves at the tree line",
    a: {
      label: tower ? "The tower sees them first" : "Drive them off",
      fn: () => {
        const chance = 0.45 + (walls ? 0.25 : 0) + (tower ? 0.2 : 0) + (dogs ? 0.2 : 0) + Math.min(0.15, state.people * 0.03);
        if (Math.random() < chance) {
          tell(dogs
            ? "The dogs go wild. The wolves break and run."
            : "You shout and throw brands. The pack peels away.");
        } else {
          losePerson("A pack of wolves killed one of the wanderers");
          tell(["This will slow down your gathering", "This town just got smaller"]);
        }
      },
    },
    b: walls
      ? { label: "Trust the palisade", fn: () => tell("Claws on wood. Then nothing. The wall holds.") }
      : null,
    timeout: () => {
      if (walls) {
        tell("The wolves leave tooth-marks in the posts and vanish");
      } else {
        losePerson("A pack of wolves killed one of the wanderers");
        tell(["This will slow down your gathering", "You'll need more help or you won't survive"], { kind: "danger" });
      }
    },
    wait: FAST ? 4000 : 16000,
  });
}

function dogsEvent() {
  openEvent({
    story: "Wild dogs sniff around the huts",
    a: {
      label: "Take them in",
      fn: () => {
        state.flags.dogs = "friend";
        tell(["They sleep under the eaves", "Something in the dark will think twice now"], { kind: "good" });
      },
    },
    b: {
      label: "Run them off",
      bad: true,
      fn: () => {
        state.flags.dogs = "gone";
        if (state.huts > 0 && Math.random() < 0.5) {
          state.huts -= 1;
          tell("They tear a hut to boards before they go", { kind: "danger" });
          if (state.people > housing()) {
            tell("Someone is sleeping in the rain now");
          }
        } else {
          tell("They scatter toward the orchards");
        }
      },
    },
    timeout: () => {
      if (state.huts > 0) {
        state.huts -= 1;
        state.flags.dogs = "gone";
        tell("The dogs bring down a hut in the night", { kind: "danger" });
      }
    },
  });
}

function scrapEvent() {
  openEvent({
    story: ["Metal juts from the mud near the mill", "Nails. A hinge. A shovel head."],
    kind: "good",
    a: {
      label: "Salvage the metal",
      fn: () => {
        state.flags.metal = true;
        state.metal += 10;
        els.metal.hidden = false;
        tell(["You can work metal now", "The Square just got louder"], { kind: "good" });
      },
    },
    timeout: () => {
      state.flags.metal = true;
      state.metal += 6;
      els.metal.hidden = false;
      tell("You pull a shovel from the mill mud. Metal will help.");
    },
    wait: FAST ? 3500 : 14000,
  });
}

function wanderers() {
  const space = housing() - state.people;
  openEvent({
    story: "Figures on the drowned road. They look hungry.",
    kind: "good",
    a: {
      label: space > 0 ? "Invite them in" : "We have no beds",
      fn: () => {
        if (space <= 0) {
          tell("They look at the full huts and keep walking");
          return;
        }
        const n = Math.min(space, 1 + Math.floor(Math.random() * 3));
        state.people += n;
        tell(n === 1
          ? "One wanderer takes a bunk and nods to You"
          : `${n} wanderers move in and start stacking brick`, { kind: "good" });
      },
    },
    b: {
      label: "Send them on",
      bad: true,
      fn: () => tell("They follow the river. The Square feels bigger."),
    },
    timeout: () => tell("By morning the road is empty again"),
    wait: FAST ? 3500 : 14000,
  });
}

function storm() {
  document.body.classList.add("storm");
  openEvent({
    kind: "danger",
    story: "The sky turns black over the water",
    a: {
      label: state.shelters >= 2 ? "Batten the shelters" : "Hold on",
      fn: () => {
        document.body.classList.remove("storm");
        if (state.shelters >= 2) {
          tell("The roofs complain, then hold.");
        } else {
          const loss = Math.min(state.wood, 30 + Math.floor(Math.random() * 30));
          state.wood -= loss;
          tell(`The wind takes ${loss} wood and a night of sleep`, { kind: "danger" });
        }
      },
    },
    timeout: () => {
      document.body.classList.remove("storm");
      if (state.shelters < 2 && state.huts > 1) {
        state.huts -= 1;
        tell("A hut goes over in the gale", { kind: "danger" });
      } else {
        tell("Dawn. The Square is soaked and still Yours.");
      }
    },
  });
}

function sickness() {
  if (state.well) {
    tell("Fever moves through the bunks. The well water keeps it small.", { kind: "good" });
    return;
  }
  openEvent({
    kind: "danger",
    story: "Someone wakes burning. There is no clean water.",
    a: {
      label: "Sit with them",
      fn: () => {
        if (Math.random() < 0.5) tell("By noon the fever breaks. Barely.");
        else losePerson("By night You are one fewer");
      },
    },
    timeout: () => losePerson("The fever takes someone before dawn"),
    wait: FAST ? 3500 : 12000,
  });
}

function quietDay() {
  const lines = [
    "Nothing hunts You today. That is a kind of luck.",
    "You stack brick until your hands remember being people.",
    "A clean wind. Gulls. The smell of wet pine.",
    "Someone finds a spoon and will not put it down.",
  ];
  tell(lines[state.day % lines.length], { kind: "quiet", pace: TICK });
}

const agenda = FAST
  ? [
      [3, scrapEvent],
      [5, dogsEvent],
      [7, wolves],
      [9, wanderers],
      [11, storm],
      [13, sickness],
      [15, wolves],
      [17, wanderers],
    ]
  : [
      [2, scrapEvent],
      [3, dogsEvent],
      [4, wolves],
      [5, wanderers],
      [6, storm],
      [7, quietDay],
      [8, sickness],
      [9, wanderers],
      [11, wolves],
      [12, quietDay],
      [13, wanderers],
      [15, storm],
    ];

function nextDay() {
  if (state.flags.over) return;
  state.day += 1;
  if (state.people > housing()) {
    if (Math.random() < 0.45) {
      state.people -= 1;
      tell("Someone leaves. There was no roof for them.", { kind: "danger" });
    }
  }
  const hit = agenda.find(([d]) => d === state.day);
  if (hit && !state.flags.eventOpen) hit[1]();
  else if (!state.flags.eventOpen && state.day > 4 && Math.random() < (state.barn ? 0.32 : 0.18)) {
    wanderers();
  }
  refresh();
}

els.wood.addEventListener("click", () => gather("wood", els.wood));
els.brick.addEventListener("click", () => gather("brick", els.brick));
els.metal.addEventListener("click", () => gather("metal", els.metal));
els.look.addEventListener("click", lookAround);

els.hut.addEventListener("click", () => {
  build(els.hut, { wood: 40 }, () => { state.huts += 1; }, "You knock together another hut");
});

els.shelter.addEventListener("click", () => {
  if (state.shelters >= 4) {
    need("The Square cannot hold another shelter");
    return;
  }
  const first = state.shelters === 0;
  build(els.shelter, { wood: 100, brick: 70 }, () => { state.shelters += 1; }, [
    first ? "You built a proper shelter" : "You built another shelter",
    "It should hold for a bit",
  ]);
});

els.well.addEventListener("click", () => {
  build(els.well, { brick: 50 }, () => { state.well = 1; }, [
    "You brick a well in the old square",
    "The water comes up cold and almost sweet",
  ]);
});

els.palisade.addEventListener("click", () => {
  build(els.palisade, { wood: 160, brick: 40 }, () => { state.palisade = 1; }, [
    "Posts in the mud. A spine for the Square.",
    "The tree line looks farther off now",
  ]);
});

els.barn.addEventListener("click", () => {
  build(els.barn, { wood: 90, brick: 70 }, () => { state.barn = 1; }, [
    "The barn stands like it remembers harvests",
    "Wanderers will see it from the road",
  ]);
});

els.forge.addEventListener("click", () => {
  build(els.forge, { brick: 70, metal: 25 }, () => { state.forge = 1; }, [
    "The forge takes. Sparks like a second flood.",
    "Tools make every pair of hands mean more",
  ]);
});

els.tower.addEventListener("click", () => {
  build(els.tower, { wood: 80, brick: 60, metal: 15 }, () => { state.tower = 1; }, [
    "The watchtower sticks out of the fog",
    "Tonight somebody will keep the lamp",
  ]);
});

els.hall.addEventListener("click", () => {
  if (state.people < 6) {
    need("A hall needs a town. You'll want at least 6 people.");
    return;
  }
  if (!state.palisade || !state.well) {
    need("Raise a palisade and a well before the hall");
    return;
  }
  build(els.hall, { wood: 280, brick: 220, metal: 50 }, () => win(), []);
});

els.restart.addEventListener("click", resetTown);

function start() {
  if (state.token === "won" && state.hall) {
    document.body.classList.add("won");
    refresh();
    tell("The Town still stands. Chimneys. Footsteps. Yours.");
    els.restart.hidden = false;
    hidePlayButtons();
    return;
  }

  if (!state.flags.introDone) {
    refresh();
    tell([
      "You now have 2 huts",
      "Two wanderers move into the other hut",
      "They say they will help you rebuild",
    ]);
    setTimeout(() => {
      state.flags.introDone = true;
      refresh();
    }, TICK * 3);
  } else {
    refresh();
    tell("The Square is still here. So are You.");
  }

  setInterval(nextDay, DAY);
}

start();
