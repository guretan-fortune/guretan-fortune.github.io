const STORAGE_KEY = "little-fate-archive-state";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const starfield = document.getElementById("starfield");
const choiceGrid = document.getElementById("choiceGrid");
const dailyStatusTitle = document.getElementById("dailyStatusTitle");
const todayDate = document.getElementById("todayDate");
const sigilCore = document.getElementById("sigilCore");
const dailyResultLabel = document.getElementById("dailyResultLabel");
const dailyResultTitle = document.getElementById("dailyResultTitle");
const dailyResultText = document.getElementById("dailyResultText");
const dailyImpact = document.getElementById("dailyImpact");
const hiddenHint = document.getElementById("hiddenHint");

const heroWorldPhase = document.getElementById("heroWorldPhase");
const heroWorldNote = document.getElementById("heroWorldNote");
const heroTitle = document.getElementById("heroTitle");
const heroElement = document.getElementById("heroElement");

const rewardCard = document.getElementById("rewardCard");
const rewardCardRarity = document.getElementById("rewardCardRarity");
const rewardCardName = document.getElementById("rewardCardName");
const rewardCardAttribute = document.getElementById("rewardCardAttribute");
const rewardCardDescription = document.getElementById("rewardCardDescription");
const cardRewardStatus = document.getElementById("cardRewardStatus");
const collectionGrid = document.getElementById("collectionGrid");
const collectionRate = document.getElementById("collectionRate");
const collectionPercent = document.getElementById("collectionPercent");

const statusTitle = document.getElementById("statusTitle");
const statusElement = document.getElementById("statusElement");
const totalVisits = document.getElementById("totalVisits");
const visitStreak = document.getElementById("visitStreak");
const worldStageLabel = document.getElementById("worldStageLabel");
const worldCycleLabel = document.getElementById("worldCycleLabel");
const traitMeters = document.getElementById("traitMeters");
const achievementList = document.getElementById("achievementList");

const worldName = document.getElementById("worldName");
const worldDescription = document.getElementById("worldDescription");
const worldProgressBar = document.getElementById("worldProgressBar");
const worldNextHint = document.getElementById("worldNextHint");
const stageList = document.getElementById("stageList");

const revealTargets = document.querySelectorAll("[data-reveal]");
const parallaxTargets = document.querySelectorAll("[data-depth]");

const diffDays = (from, to) => {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  return Math.round((end - start) / 86400000);
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const todayKey = formatDateKey(new Date());

const defaultState = () => ({
  visitorId: `fate-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  totalVisits: 0,
  visitStreak: 0,
  lastVisitDate: null,
  worldCycle: 0,
  elementAffinity: {
    light: 0,
    moon: 1,
    star: 0,
    wind: 0,
    dream: 0,
    silence: 0,
    spark: 0,
  },
  traits: {
    kindness: 1,
    courage: 1,
    intuition: 1,
    focus: 1,
    harmony: 1,
    curiosity: 1,
  },
  cardsOwned: [],
  dailyAction: null,
});

const loadState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState();
    }

    const parsed = JSON.parse(raw);
    return {
      ...defaultState(),
      ...parsed,
      elementAffinity: { ...defaultState().elementAffinity, ...parsed.elementAffinity },
      traits: { ...defaultState().traits, ...parsed.traits },
      cardsOwned: Array.isArray(parsed.cardsOwned) ? parsed.cardsOwned : [],
    };
  } catch {
    return defaultState();
  }
};

const saveState = (state) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const state = loadState();

const registerVisit = () => {
  if (state.lastVisitDate === todayKey) {
    return;
  }

  if (!state.lastVisitDate) {
    state.totalVisits = 1;
    state.visitStreak = 1;
  } else {
    const gap = diffDays(state.lastVisitDate, todayKey);
    state.totalVisits += 1;
    state.visitStreak = gap === 1 ? state.visitStreak + 1 : 1;
  }

  state.lastVisitDate = todayKey;
  state.worldCycle = Math.floor(Math.max(state.visitStreak - 1, 0) / 7);
};

registerVisit();

const getWorldStage = () => Math.min(Math.max(state.visitStreak, 1), 7);

const hashString = (value) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const rarityWeight = (rarity) => {
  const streakBonus = Math.min(state.visitStreak, 7);
  const cycleBonus = state.worldCycle;
  switch (rarity) {
    case "common":
      return 50 - streakBonus * 2;
    case "rare":
      return 28 + streakBonus * 2;
    case "epic":
      return 14 + streakBonus + cycleBonus;
    case "legend":
      return state.visitStreak >= 5 ? 6 + cycleBonus : 2;
    case "mythic":
      return state.visitStreak >= 7 ? 2 + cycleBonus : 0;
    default:
      return 0;
  }
};

const getElementMeta = (id) => FATE_ELEMENTS.find((item) => item.id === id) || FATE_ELEMENTS[0];

const getDominantElement = () => {
  return Object.entries(state.elementAffinity).sort((a, b) => b[1] - a[1])[0][0];
};

const getTopTrait = () => {
  return Object.entries(state.traits).sort((a, b) => b[1] - a[1])[0][0];
};

const titleByElementAndTrait = (elementId, traitId) => {
  const titles = {
    moon: {
      intuition: "月影の案内人",
      harmony: "宵月の調律者",
      focus: "群青の観測者",
      kindness: "月灯の守り手",
      courage: "夜明け前の歩行者",
      curiosity: "月舟の探索者",
    },
    star: {
      intuition: "星図の予感者",
      harmony: "星屑の収集家",
      focus: "星読みの記録者",
      kindness: "遠星の語り手",
      courage: "流星の追跡者",
      curiosity: "星廊の冒険者",
    },
    wind: {
      intuition: "風紋の感知者",
      harmony: "風渡る調停者",
      focus: "風見の設計者",
      kindness: "風花の案内役",
      courage: "追風の越境者",
      curiosity: "風路の採集家",
    },
    dream: {
      intuition: "夢界の翻訳者",
      harmony: "夢紡ぎの園丁",
      focus: "微睡の観測者",
      kindness: "夢灯の保護者",
      courage: "白昼夢の開拓者",
      curiosity: "夢湖の漂流者",
    },
    silence: {
      intuition: "静寂の採譜者",
      harmony: "深夜の調和者",
      focus: "静夜の建築家",
      kindness: "沈黙の看守人",
      courage: "無音の冒険者",
      curiosity: "静謐の探索者",
    },
    spark: {
      intuition: "火花の感応者",
      harmony: "灯火の媒介者",
      focus: "閃光の鍛錬者",
      kindness: "微熱の配達人",
      courage: "火花の先導者",
      curiosity: "残光の採掘者",
    },
    light: {
      intuition: "光輪の読解者",
      harmony: "黎明の祝祭者",
      focus: "白光の整備者",
      kindness: "祝福の守人",
      courage: "曙光の開門者",
      curiosity: "光庭の旅人",
    },
  };

  return titles[elementId]?.[traitId] || "夜の旅人";
};

const getCurrentTitle = () => titleByElementAndTrait(getDominantElement(), getTopTrait());

const getCurrentWorld = () => WORLD_STAGES[getWorldStage() - 1];

const pickDailyChoices = () => {
  const seed = hashString(`${state.visitorId}|${todayKey}|choices`);
  const pool = [...DAILY_CHOICES];
  const selected = [];

  while (selected.length < 3 && pool.length > 0) {
    const index = (seed + selected.length * 7) % pool.length;
    selected.push(pool.splice(index, 1)[0]);
  }

  return selected;
};

const rarityLabel = {
  common: "common",
  rare: "rare",
  epic: "epic",
  legend: "legend",
  mythic: "mythic",
};

const pickCard = (choice) => {
  const eligible = CARD_LIBRARY.filter((card) => card.unlockStage <= getWorldStage());
  const seed = hashString(`${state.visitorId}|${todayKey}|${choice.id}|${state.totalVisits}|${state.visitStreak}`);

  const weighted = eligible.map((card) => ({
    card,
    weight: rarityWeight(card.rarity) + (card.element === choice.element ? 8 : 0) + (card.element === getDominantElement() ? 5 : 0),
  })).filter((entry) => entry.weight > 0);

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = seed % totalWeight;

  for (const entry of weighted) {
    cursor -= entry.weight;
    if (cursor < 0) {
      return entry.card;
    }
  }

  return weighted[0].card;
};

const buildImpactTags = (choice, card, newCard) => {
  const tags = [];
  tags.push(`属性: ${getElementMeta(choice.element).label} +2`);
  Object.entries(choice.effects).forEach(([key, value]) => {
    tags.push(`${TRAIT_LABELS[key]} +${value}`);
  });
  tags.push(`カード: ${card.name}`);
  tags.push(newCard ? "新規カード獲得" : "既知カードを再発見");
  return tags;
};

const renderImpactTags = (items) => {
  dailyImpact.innerHTML = items.map((item) => `<span class="impact-tag">${item}</span>`).join("");
};

const renderRewardCard = (card, isNew = false) => {
  if (!card) {
    rewardCard.classList.add("is-empty");
    rewardCard.dataset.rarity = "";
    rewardCardRarity.textContent = "FATE";
    rewardCardName.textContent = "まだカードは届いていません";
    rewardCardAttribute.textContent = "属性: 未定";
    rewardCardDescription.textContent = "今日の運命を選ぶと、その結果に応じた一枚がここに記録されます。";
    cardRewardStatus.textContent = "未獲得";
    return;
  }

  rewardCard.classList.remove("is-empty");
  rewardCard.dataset.rarity = card.rarity;
  rewardCardRarity.textContent = rarityLabel[card.rarity];
  rewardCardName.textContent = card.name;
  rewardCardAttribute.textContent = `属性: ${getElementMeta(card.element).label}`;
  rewardCardDescription.textContent = card.description;
  cardRewardStatus.textContent = isNew ? "新規獲得" : "本日の記録";
};

const renderCollection = () => {
  const owned = new Set(state.cardsOwned);
  collectionGrid.innerHTML = CARD_LIBRARY.map((card) => {
    const unlocked = owned.has(card.id);
    return `
      <article class="collection-item ${unlocked ? "" : "is-locked"}">
        <div>
          <p class="card-rarity">${unlocked ? rarityLabel[card.rarity] : "unknown"}</p>
          <h4>${unlocked ? card.name : "未取得カード"}</h4>
        </div>
        <p>${unlocked ? card.description : "影だけが残っています。"}</p>
      </article>
    `;
  }).join("");

  const count = state.cardsOwned.length;
  collectionRate.textContent = `${count} / ${CARD_LIBRARY.length}`;
  collectionPercent.textContent = `${Math.round((count / CARD_LIBRARY.length) * 100)}%`;
};

const renderTraits = () => {
  const entries = Object.entries(state.traits);
  const maxValue = Math.max(...entries.map(([, value]) => value), 1);

  traitMeters.innerHTML = entries.map(([key, value]) => `
    <div class="trait-item">
      <div class="trait-head">
        <span>${TRAIT_LABELS[key]}</span>
        <span>${value}</span>
      </div>
      <div class="trait-bar">
        <span class="trait-fill" style="width: ${(value / maxValue) * 100}%"></span>
      </div>
    </div>
  `).join("");
};

const renderAchievements = () => {
  achievementList.innerHTML = ACHIEVEMENTS.map((achievement) => {
    const earned = achievement.condition(state);
    return `
      <article class="achievement-card ${earned ? "is-earned" : ""}">
        <h4>${achievement.label}</h4>
        <p>${earned ? "達成済み" : "未達成"}</p>
      </article>
    `;
  }).join("");
};

const renderWorld = () => {
  const current = getCurrentWorld();
  const stage = getWorldStage();
  const progress = (stage / 7) * 100;

  document.body.dataset.stage = String(stage);
  document.body.dataset.element = getDominantElement();

  heroWorldPhase.textContent = `phase 0${stage}`;
  heroWorldNote.textContent = current.description;
  heroTitle.textContent = getCurrentTitle();
  heroElement.textContent = `属性: ${getElementMeta(getDominantElement()).label}`;

  worldName.textContent = current.name;
  worldDescription.textContent = current.description;
  worldProgressBar.style.width = `${progress}%`;
  worldNextHint.textContent = current.nextHint;

  worldStageLabel.textContent = `第${stage}段階`;
  worldCycleLabel.textContent = `${state.worldCycle}周`;

  stageList.innerHTML = WORLD_STAGES.map((item) => `
    <article class="stage-card ${item.stage === stage ? "is-active" : ""}">
      <h4>${item.name}</h4>
      <p>${item.description}</p>
    </article>
  `).join("");
};

const renderStatus = () => {
  const element = getElementMeta(getDominantElement());
  statusTitle.textContent = getCurrentTitle();
  statusElement.textContent = `属性: ${element.label}`;
  totalVisits.textContent = `${state.totalVisits}日`;
  visitStreak.textContent = `${state.visitStreak}日`;
};

const renderHints = () => {
  if (state.visitStreak >= 7) {
    hiddenHint.textContent = "7日を超えた世界では、伝説級と神話級のカードが現れ始めます。";
  } else if (state.visitStreak >= 4) {
    hiddenHint.textContent = "第四夜以降は塔の影とともに、上位カードの出現率がわずかに上がります。";
  } else {
    hiddenHint.textContent = "連続訪問が続くほど、光の深いカードが出やすくなります。";
  }
};

const formattedToday = new Date().toLocaleDateString("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

todayDate.textContent = formattedToday;

const renderDailyAction = () => {
  const choices = pickDailyChoices();
  const daily = state.dailyAction && state.dailyAction.date === todayKey ? state.dailyAction : null;

  choiceGrid.innerHTML = choices.map((choice) => `
    <button class="choice-card ${daily ? "is-used" : ""}" type="button" data-choice-id="${choice.id}">
      <p class="choice-sigil">${choice.sigil}</p>
      <h4>${choice.title}</h4>
      <p>${choice.text}</p>
      <small>属性: ${getElementMeta(choice.element).label}</small>
    </button>
  `).join("");

  if (!daily) {
    dailyStatusTitle.textContent = "今日の選択はまだです。";
    sigilCore.textContent = "未";
    renderRewardCard(null);
    renderImpactTags(["一日一度の選択", "育成結果を保存", "カード獲得あり"]);
    return;
  }

  const chosen = DAILY_CHOICES.find((item) => item.id === daily.choiceId);
  const card = CARD_LIBRARY.find((item) => item.id === daily.cardId);

  dailyStatusTitle.textContent = "今日の運命は記録済みです。";
  sigilCore.textContent = chosen?.sigil || "記";
  dailyResultLabel.textContent = "Recorded";
  dailyResultTitle.textContent = chosen?.title || "今日の運命";
  dailyResultText.textContent = daily.resultText;
  renderImpactTags(daily.impactTags || []);
  renderRewardCard(card, daily.newCard);
};

const applyDailyChoice = (choiceId) => {
  if (state.dailyAction && state.dailyAction.date === todayKey) {
    return;
  }

  const choice = DAILY_CHOICES.find((item) => item.id === choiceId);
  if (!choice) {
    return;
  }

  state.elementAffinity[choice.element] += 2;
  Object.entries(choice.effects).forEach(([key, value]) => {
    state.traits[key] += value;
  });

  const card = pickCard(choice);
  const newCard = !state.cardsOwned.includes(card.id);
  if (newCard) {
    state.cardsOwned.push(card.id);
  }

  const resultText = `${choice.fortune} その余韻のなかで、${card.name} があなたの図鑑へ加わりました。`;
  const impactTags = buildImpactTags(choice, card, newCard);

  state.dailyAction = {
    date: todayKey,
    choiceId: choice.id,
    cardId: card.id,
    newCard,
    resultText,
    impactTags,
  };

  saveState(state);
  renderAll();
};

choiceGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-choice-id]");
  if (!button) {
    return;
  }

  applyDailyChoice(button.dataset.choiceId);
});

const renderAll = () => {
  renderWorld();
  renderStatus();
  renderTraits();
  renderAchievements();
  renderHints();
  renderCollection();
  renderDailyAction();

  const daily = state.dailyAction && state.dailyAction.date === todayKey ? state.dailyAction : null;
  if (daily) {
    dailyResultLabel.textContent = "Destiny Fixed";
    const chosen = DAILY_CHOICES.find((item) => item.id === daily.choiceId);
    dailyResultTitle.textContent = chosen?.title || "今日の運命";
    dailyResultText.textContent = daily.resultText;
    renderImpactTags(daily.impactTags || []);
  } else {
    dailyResultLabel.textContent = "Awaiting";
    dailyResultTitle.textContent = "今日の運命は、選択のあとに立ち上がります。";
    dailyResultText.textContent = "一度選んだ運命は、日付が変わるまで保存されます。静かな気持ちで一つ選んでみてください。";
  }
};

const buildStarfield = () => {
  const countByStage = {
    1: 22,
    2: 38,
    3: 54,
    4: 72,
    5: 92,
    6: 108,
    7: 126,
  };
  const count = countByStage[getWorldStage()] || 38;
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < count; index += 1) {
    const star = document.createElement("span");
    star.className = "star";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 6}s`;
    star.style.opacity = `${0.3 + Math.random() * 0.7}`;
    fragment.appendChild(star);
  }
  starfield.appendChild(fragment);
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.14,
    rootMargin: "0px 0px -10% 0px",
  }
);

revealTargets.forEach((element) => {
  if (prefersReducedMotion.matches) {
    element.classList.add("is-visible");
    return;
  }
  revealObserver.observe(element);
});

let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;
let pointerFrame = null;

const updateCursor = () => {
  document.documentElement.style.setProperty("--cursor-x", `${pointerX}px`);
  document.documentElement.style.setProperty("--cursor-y", `${pointerY}px`);
  pointerFrame = null;
};

window.addEventListener("pointermove", (event) => {
  if (prefersReducedMotion.matches) {
    return;
  }

  pointerX = event.clientX;
  pointerY = event.clientY;
  if (pointerFrame === null) {
    pointerFrame = window.requestAnimationFrame(updateCursor);
  }
});

const applyParallax = () => {
  if (prefersReducedMotion.matches) {
    parallaxTargets.forEach((element) => {
      element.style.transform = "";
    });
    return;
  }

  parallaxTargets.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const depth = Number(element.dataset.depth || 0);
    const offsetY = rect.top + rect.height / 2 - window.innerHeight / 2;
    const x = (pointerX - window.innerWidth / 2) * depth * 0.018;
    const y = offsetY * depth * -0.14;
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });
};

window.addEventListener("scroll", applyParallax, { passive: true });
window.addEventListener("resize", applyParallax);
window.addEventListener("load", applyParallax);

buildStarfield();
renderAll();
saveState(state);
applyParallax();
