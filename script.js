const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealTargets = document.querySelectorAll("[data-reveal]");
const parallaxTargets = document.querySelectorAll("[data-depth]");
const cursorAura = document.querySelector(".cursor-aura");

const drawButton = document.getElementById("drawOmikuji");
const fortuneStage = document.getElementById("fortuneStage");
const fortuneShell = document.getElementById("fortuneShell");
const resultRank = document.querySelector(".result-rank");
const resultHeading = document.querySelector(".fortune-result h3");
const resultMessage = document.querySelector(".result-message");
const resultItem = document.querySelector(".result-meta div:first-child dd");
const resultAction = document.querySelector(".result-meta div:last-child dd");
const machineSub = document.querySelector(".machine-sub");

const todayDateLabel = document.getElementById("todayDateLabel");
const todayHeadline = document.getElementById("todayHeadline");
const todaySummary = document.getElementById("todaySummary");
const fortuneLove = document.getElementById("fortuneLove");
const fortuneWork = document.getElementById("fortuneWork");
const fortuneMoney = document.getElementById("fortuneMoney");
const fortuneHealth = document.getElementById("fortuneHealth");
const fortuneKeyword = document.getElementById("fortuneKeyword");
const todayPanel = document.getElementById("todayPanel");
const todayLockTitle = document.getElementById("todayLockTitle");
const todayLockMessage = document.getElementById("todayLockMessage");

const omikujiResults = [
  {
    id: "daikichi",
    rank: "大吉",
    title: "今日は勢いのある当たり日です。",
    message: "遠慮していると運が先に行きます。少し大胆なくらいの一歩が、空気を一気に変えてくれそうです。",
    item: "つやのあるイヤホン",
    action: "気になっていた連絡を一つ返す",
    tone: "linear-gradient(135deg, #ff4f93, #ffbf40)",
    symbol: "大",
  },
  {
    id: "chukichi",
    rank: "中吉",
    title: "素直さが、そのまま追い風になります。",
    message: "派手な展開ではなくても、丁寧に選んだ行動が良い結果へつながります。今日は整える日です。",
    item: "お気に入りのノート",
    action: "机の上を3分だけ整える",
    tone: "linear-gradient(135deg, #59b8ff, #4dcaa8)",
    symbol: "中",
  },
  {
    id: "shokichi",
    rank: "小吉",
    title: "静かなラッキーが潜んでいます。",
    message: "目立つ幸運ではなくても、小さな納得感が何度か訪れそうです。焦らず拾うと満足度が上がります。",
    item: "白いマグカップ",
    action: "ひとつ予定に余白を残す",
    tone: "linear-gradient(135deg, #785bff, #59b8ff)",
    symbol: "小",
  },
  {
    id: "kichi",
    rank: "吉",
    title: "肩の力を抜いた方がうまくいきます。",
    message: "今日は完璧主義より、軽やかな着手が正解です。まず始めるだけで十分流れが変わります。",
    item: "軽いスニーカー",
    action: "5分だけ散歩する",
    tone: "linear-gradient(135deg, #ff8a3d, #ffbf40)",
    symbol: "吉",
  },
  {
    id: "suekichi",
    rank: "末吉",
    title: "後半に向けてじわじわ上向く日です。",
    message: "朝のペースが鈍くても問題ありません。午後から突然リズムが合ってくる気配があります。",
    item: "オレンジ色の小物",
    action: "昼以降に本命タスクを置く",
    tone: "linear-gradient(135deg, #ffbf40, #ff8a3d)",
    symbol: "末",
  },
  {
    id: "kyo",
    rank: "凶",
    title: "今日は無理に勝ちにいかない方が賢い日です。",
    message: "運勢が低めの日は、雑に使うと減りやすいだけです。守りを固めるとむしろ明日が強くなります。",
    item: "温かい飲み物",
    action: "重要な判断はひと呼吸置く",
    tone: "linear-gradient(135deg, #43355f, #785bff)",
    symbol: "凶",
  },
];

const VISITOR_KEY = "fortune-playground-visitor-id";
const OMIKUJI_KEY = "fortune-playground-omikuji";

const dailyPools = {
  headline: [
    "今日は「勢い」より「ノリ」が効く日です。",
    "丁寧に始めるほど、後半がきれいに伸びる日です。",
    "偶然に見える出来事が、意外と味方してくれる日です。",
    "少し遊び心を足すだけで、空気がぐっと良くなる日です。",
    "周囲より、自分の気分のチューニングが大切な日です。",
  ],
  summary: [
    "最短距離を狙うより、気分のいい選択を重ねた方が結果的に前へ進めます。",
    "今日は真面目さに、少しだけ軽さを混ぜると魅力が増します。",
    "頑張るより整える。そんな温度感がちょうど噛み合います。",
    "ひらめきは突然来るので、余白を少しだけ確保しておくのがおすすめです。",
    "人と比べるより、自分のテンポを守る方が運が安定します。",
  ],
  love: ["急上昇", "やわらか好調", "会話運あり", "自然体が正解", "意外な展開あり"],
  work: ["集中力高め", "丁寧さ勝ち", "再調整向き", "ひらめき強め", "コツコツ最強"],
  money: ["小さく得する", "計画的に吉", "衝動買い注意", "自己投資向き", "節約が光る"],
  health: ["睡眠優先", "水分補給で安定", "軽い運動が吉", "休憩で回復", "肩の力を抜く日"],
  keyword: ["余白", "反応速度", "ごきげん", "ひと呼吸", "遊び心", "直感", "整える"],
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
    threshold: 0.16,
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

const randomFrom = (items, seed) => items[Math.abs(seed) % items.length];

const hashString = (value) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const getVisitorId = () => {
  const saved = window.localStorage.getItem(VISITOR_KEY);
  if (saved) {
    return saved;
  }

  const seedSource = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    window.screen.width,
    window.screen.height,
    Math.random().toString(36).slice(2, 10),
  ].join("|");

  const visitorId = `vp-${hashString(seedSource)}-${Date.now().toString(36)}`;
  window.localStorage.setItem(VISITOR_KEY, visitorId);
  return visitorId;
};

const getTodayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const getDailySeed = () => {
  const todayKey = getTodayKey();
  const visitorSeed = hashString(getVisitorId());
  return hashString(`${todayKey}|${visitorSeed}`);
};

const renderDailyFortune = () => {
  const today = new Date();
  const seed = getDailySeed();
  const formattedDate = today.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  todayDateLabel.textContent = formattedDate;
  todayHeadline.textContent = randomFrom(dailyPools.headline, seed);
  todaySummary.textContent = randomFrom(dailyPools.summary, seed + 3);
  fortuneLove.textContent = randomFrom(dailyPools.love, seed + 5);
  fortuneWork.textContent = randomFrom(dailyPools.work, seed + 7);
  fortuneMoney.textContent = randomFrom(dailyPools.money, seed + 11);
  fortuneHealth.textContent = randomFrom(dailyPools.health, seed + 13);
  fortuneKeyword.textContent = randomFrom(dailyPools.keyword, seed + 17);
};

const lockTodayFortune = () => {
  if (!todayPanel) {
    return;
  }

  todayPanel.classList.add("is-locked");
  todayPanel.classList.remove("is-unlocked");
  if (todayLockTitle) {
    todayLockTitle.textContent = "まずはおみくじを引いてください。";
  }
  if (todayLockMessage) {
    todayLockMessage.textContent = "今日の運勢はまだ封印中です。先におみくじを引くと、その結果をヒントに今日の流れが解放されます。";
  }
};

const unlockTodayFortune = (result, options = {}) => {
  const { animate = true } = options;
  if (!todayPanel) {
    return;
  }

  if (todayLockTitle) {
    todayLockTitle.textContent = `${result.rank}を受信。今日の運勢を解放します。`;
  }
  if (todayLockMessage) {
    todayLockMessage.textContent = result.rank === "凶"
      ? "慎重モードで読み解く一日です。守りの運勢も、見方を変えれば立派な武器になります。"
      : `${result.rank}の流れをもとに、今日の5つの運勢を展開します。気になる項目から眺めてください。`;
  }

  if (!animate || prefersReducedMotion.matches) {
    todayPanel.classList.remove("is-locked");
    todayPanel.classList.add("is-unlocked");
    return;
  }

  window.setTimeout(() => {
    todayPanel.classList.remove("is-locked");
    todayPanel.classList.add("is-unlocked");
  }, 460);
};

const clearFortuneRankClasses = () => {
  const rankClasses = [
    "rank-daikichi",
    "rank-chukichi",
    "rank-shokichi",
    "rank-kichi",
    "rank-suekichi",
    "rank-kyo",
  ];

  fortuneStage.classList.remove(...rankClasses);
  fortuneShell.classList.remove(...rankClasses);
  resultRank.classList.remove(...rankClasses);
};

const setFortuneVisual = (result) => {
  const rankClass = `rank-${result.id}`;

  clearFortuneRankClasses();
  fortuneStage.classList.add(rankClass);
  fortuneShell.classList.add(rankClass);
  resultRank.classList.add(rankClass);
  fortuneShell.style.background = result.tone;
  fortuneShell.querySelector(".shell-core").textContent = result.symbol;
  resultRank.textContent = result.rank;
  resultHeading.textContent = result.title;
  resultMessage.textContent = result.message;
  resultItem.textContent = result.item;
  resultAction.textContent = result.action;
  if (machineSub) {
    machineSub.textContent = result.rank === "凶" ? "波を静かに整えています" : `${result.rank}のシグナルを受信しました`;
  }
};

const runFortuneAnimation = (result, options = {}) => {
  const { skipDrawLock = false } = options;
  fortuneShell.classList.remove("is-shaking", "is-revealed");
  fortuneStage.classList.remove("is-bursting");

  void fortuneShell.offsetWidth;

  fortuneShell.classList.add("is-shaking");
  if (drawButton) {
    drawButton.disabled = true;
    drawButton.textContent = "運勢を生成中...";
  }

  window.setTimeout(() => {
    setFortuneVisual(result);
    fortuneStage.classList.add("is-bursting");
    fortuneShell.classList.remove("is-shaking");
    fortuneShell.classList.add("is-revealed");
  }, 520);

  window.setTimeout(() => {
    if (!drawButton) {
      return;
    }

    if (skipDrawLock) {
      drawButton.disabled = false;
      drawButton.textContent = "おみくじを引く";
      return;
    }

    drawButton.disabled = true;
    drawButton.textContent = "今日は引き済みです";
    fortuneStage.classList.remove("is-bursting");
  }, 1100);
};

const saveTodayOmikuji = (result) => {
  window.localStorage.setItem(
    OMIKUJI_KEY,
    JSON.stringify({
      date: getTodayKey(),
      resultId: result.id,
    })
  );
};

const getSavedTodayOmikuji = () => {
  const raw = window.localStorage.getItem(OMIKUJI_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) {
      return null;
    }

    return omikujiResults.find((item) => item.id === parsed.resultId) || null;
  } catch {
    return null;
  }
};

const restoreTodayOmikuji = () => {
  const savedResult = getSavedTodayOmikuji();

  if (!savedResult) {
    if (drawButton) {
      drawButton.disabled = false;
      drawButton.textContent = "おみくじを引く";
    }
    lockTodayFortune();
    return;
  }

  setFortuneVisual(savedResult);
  fortuneShell.classList.add("is-revealed");
  unlockTodayFortune(savedResult, { animate: false });
  if (drawButton) {
    drawButton.disabled = true;
    drawButton.textContent = "今日は引き済みです";
  }
};

if (drawButton) {
  drawButton.addEventListener("click", () => {
    const alreadyDrawn = getSavedTodayOmikuji();
    if (alreadyDrawn) {
      restoreTodayOmikuji();
      return;
    }

    const visitorSeed = hashString(`${getVisitorId()}|${getTodayKey()}|omikuji`);
    const index = visitorSeed % omikujiResults.length;
    const result = omikujiResults[index];

    saveTodayOmikuji(result);
    runFortuneAnimation(result);
    unlockTodayFortune(result);
  });
}

let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 3;
let pointerFrame = null;

const updateCursorAura = () => {
  document.documentElement.style.setProperty("--cursor-x", `${pointerX}px`);
  document.documentElement.style.setProperty("--cursor-y", `${pointerY}px`);
  pointerFrame = null;
};

window.addEventListener("pointermove", (event) => {
  if (!cursorAura || prefersReducedMotion.matches) {
    return;
  }

  pointerX = event.clientX;
  pointerY = event.clientY;

  if (pointerFrame === null) {
    pointerFrame = window.requestAnimationFrame(updateCursorAura);
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
    const depth = Number(element.dataset.depth || "0");
    const offsetY = rect.top + rect.height / 2 - window.innerHeight / 2;
    const x = (pointerX - window.innerWidth / 2) * depth * 0.018;
    const y = offsetY * depth * -0.16;
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });
};

window.addEventListener("scroll", applyParallax, { passive: true });
window.addEventListener("resize", applyParallax);
window.addEventListener("load", applyParallax);

renderDailyFortune();
restoreTodayOmikuji();
applyParallax();
