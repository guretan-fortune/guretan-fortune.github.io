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
    "今日は、まだ見えていない運の輪郭が少しずつ立ち上がる日です。",
    "おみくじの結果を手がかりに、今日の流れを丁寧に読み解いてみてください。",
    "運勢は固定された答えではなく、今日のあなたに合うヒントとして現れます。",
    "小さな選択が一日の空気を変える。そんな前提で運勢を受け取ると面白い日です。",
    "派手な奇跡より、静かな追い風を見つけやすい一日になりそうです。",
  ],
  summary: [
    "最短距離を狙うより、気分のいい選択を重ねた方が結果的に前へ進めます。",
    "今日は真面目さに、少しだけ軽さを混ぜると魅力が増します。",
    "頑張るより整える。そんな温度感がちょうど噛み合います。",
    "ひらめきは突然来るので、余白を少しだけ確保しておくのがおすすめです。",
    "人と比べるより、自分のテンポを守る方が運が安定します。",
  ],
  love: [
    "心が自然に通じ合う日",
    "優しいひと言が距離を縮める",
    "思いがけない嬉しい接点あり",
    "素直さが魅力になる",
    "焦らず待つほど良い流れに",
    "さりげない気配りが好印象",
    "笑顔が恋を引き寄せる",
    "小さな会話にチャンスが宿る",
    "相手の良さを再発見できる",
    "いつもより甘い空気が流れる",
    "誠実な態度が恋を育てる",
    "一歩踏み出す勇気が実る",
    "懐かしい縁が動き出す",
    "連絡のタイミングに恵まれる",
    "想像以上に好反応を得られる",
    "自分らしさがいちばんの武器",
    "優しさが恋の追い風になる",
    "ふとした偶然が恋のきっかけに",
    "期待しすぎない姿勢が吉",
    "安心感が愛情を深める",
    "新しい出会いに胸が高鳴る",
    "会えない時間が想いを強くする",
    "駆け引きより素直さが勝つ",
    "相手を尊重する姿勢が鍵",
    "温かな会話が心をほどく",
    "恋の迷いが晴れていく",
    "一緒に笑う時間が増える",
    "ふんわりした魅力が輝く",
    "小さな親切が大きな進展に",
    "恋愛面で意外な収穫あり",
    "目と目が合う瞬間に意味がある",
    "さみしさが愛しさに変わる",
    "ゆっくり進む恋ほど本物",
    "思い切った一言が流れを変える",
    "心の整理が恋の好転を呼ぶ",
    "自然体のあなたに惹かれる人あり",
    "何気ない共有が絆になる",
    "優先順位を見直すと恋運上昇",
    "想いを言葉にするほど伝わる",
    "ぬくもりを感じやすい日",
    "再会が恋の予感を運ぶ",
    "相手の本音に気づける",
    "愛される準備が整う日",
    "ときめきが日常に紛れ込む",
    "恋のヒントは身近な場所にある",
    "落ち着いた関係が育ちやすい",
    "信頼が恋を前進させる",
    "心の壁が少しずつ薄くなる",
    "やわらかな雰囲気が好感度アップ",
    "恋に追い風が吹く一日",
  ],
  work: [
    "集中力が冴えて成果が出る",
    "地道な努力が評価される",
    "周囲との連携がスムーズ",
    "段取りの良さが光る",
    "新しい発想が活かされる",
    "丁寧さが信頼につながる",
    "小さな成功が大きな自信に",
    "相談ごとに良い答えが見つかる",
    "苦手分野にも前向きに向き合える",
    "報連相が運を開く",
    "目の前の仕事に福あり",
    "タイミングよく助けが入る",
    "判断力が冴える日",
    "柔軟な対応が高評価に",
    "コツコツ積み上げた力が実る",
    "新しい役割に縁がある",
    "誠実な姿勢が武器になる",
    "ひと工夫で大きく改善",
    "先回りの行動が吉",
    "頼られる場面が増える",
    "意外なチャンスが巡ってくる",
    "話し合いが良い方向に進む",
    "迷ったら基本に戻ると正解",
    "仕事の流れを整えやすい",
    "周囲の期待に応えられる",
    "新しい学びが今後に活きる",
    "努力が目に見える形になる",
    "慎重さがミスを防ぐ",
    "人脈が仕事運を押し上げる",
    "整理整頓で効率アップ",
    "交渉ごとに追い風あり",
    "発言が良い影響を与える",
    "忍耐が結果につながる",
    "責任感が評価される",
    "やるべきことが明確になる",
    "一歩引いて見ると道が開ける",
    "得意分野で存在感を発揮",
    "継続の力を実感できる",
    "無理なく進めることが成功の鍵",
    "サポート役として活躍できる",
    "新しい視点が突破口になる",
    "課題解決の糸口が見える",
    "説明力が高まる日",
    "周囲との温度感が合いやすい",
    "落ち着いた対応が信頼を呼ぶ",
    "仕上げの丁寧さで差がつく",
    "責任ある仕事が成長を促す",
    "前向きな姿勢が評価を集める",
    "小さな改善が大きな成果に",
    "仕事運は安定上昇中",
  ],
  money: [
    "無駄遣いを防げる日",
    "小さな得が積み重なる",
    "計画的なお金の使い方が吉",
    "節約意識が冴える",
    "思わぬお得情報に出会う",
    "堅実さが金運アップの鍵",
    "必要なものにだけ使うと吉",
    "買い物は比較すると成功",
    "財布の整理で運気上昇",
    "小さな貯蓄が未来を助ける",
    "見直しで家計が整う",
    "衝動買いに注意すると安定",
    "得するタイミングを見極められる",
    "予算管理がうまくいく",
    "貯める喜びを感じられる",
    "堅実な選択が正解になる",
    "使い道を考えるほど運が育つ",
    "お金に感謝すると巡りが良くなる",
    "先を見据えた判断が吉",
    "出費のバランスが整いやすい",
    "思いがけない節約チャンスあり",
    "必要経費は惜しまないのが吉",
    "安物買いより納得重視が正解",
    "貯金計画を立てるのに良い日",
    "金運は守り重視で安定",
    "賢い選択が未来の余裕を作る",
    "欲しい物は一晩考えて吉",
    "情報収集がお金を守る",
    "支払い管理がスムーズ",
    "気前の良さはほどほどが吉",
    "ポイントや特典を活かせる",
    "手持ちの見直しで安心感アップ",
    "家計の改善点が見つかる",
    "大きな買い物は慎重に",
    "節度ある楽しみ方が金運を守る",
    "収支の流れが読みやすい日",
    "貯める力が高まる",
    "必要な投資は前向きに",
    "使うより整えるが吉",
    "細かな管理が実を結ぶ",
    "金運は堅実さに味方する",
    "欲張らない姿勢が安定を呼ぶ",
    "小銭にも福が宿る日",
    "見栄の出費を抑えると好調",
    "価値ある使い方ができる",
    "将来のための準備が進む",
    "費用対効果を意識すると吉",
    "お金の流れを整えやすい",
    "地に足のついた判断が光る",
    "着実に豊かさを育てられる日",
  ],
  health: [
    "無理をしなければ快調",
    "休息が運気回復の鍵",
    "体を温めると調子が上がる",
    "睡眠を大切にしたい日",
    "深呼吸が心身を整える",
    "軽い運動が良い刺激になる",
    "水分補給を意識して吉",
    "食生活を整えると安定",
    "心の余裕が体調にも好影響",
    "今日は早めの休憩が大切",
    "姿勢を意識すると疲れにくい",
    "自分をいたわるほど元気が出る",
    "小さな不調を見逃さないで",
    "リラックス時間が運気を上げる",
    "ぬるめのお風呂でリフレッシュ",
    "動きすぎず休みすぎずが吉",
    "生活リズムを整えやすい日",
    "心の疲れをケアすると好調",
    "無理な我慢は禁物",
    "朝の過ごし方が一日を左右する",
    "体の声に耳を傾けたい日",
    "バランスの良い食事が味方",
    "やさしいペースで過ごすと吉",
    "目や肩の疲れに注意",
    "気分転換が健康運アップにつながる",
    "今日は質の良い休息が最優先",
    "体をほぐすと流れが良くなる",
    "冷え対策で快適に過ごせる",
    "頑張りすぎないことが健康法",
    "心を軽くすると体も軽くなる",
    "穏やかに過ごすほど整う",
    "軽い散歩が気分転換に最適",
    "食べすぎ飲みすぎに注意",
    "こまめなストレッチが吉",
    "疲れたらすぐ休む判断が大切",
    "ゆったりした音楽が癒やしに",
    "早寝早起きが効果的",
    "体調管理の意識が高まる日",
    "心身のメンテナンスに最適",
    "体をいたわる行動が福を呼ぶ",
    "今日は癒やしを優先して吉",
    "やさしい食事で整いやすい",
    "緊張をほどくと楽になる",
    "マイペースを守るほど好調",
    "ほんの少しの運動で十分効果あり",
    "体のサインを見逃さないで",
    "気持ちの安定が健康運を支える",
    "穏やかな習慣が力になる",
    "こまめな休憩が明日を助ける",
    "健康運は回復基調",
  ],
  keyword: [
    "ひらめき",
    "ご縁",
    "やさしさ",
    "直感",
    "整える",
    "一歩前進",
    "素直",
    "余白",
    "挑戦",
    "安心感",
    "笑顔",
    "再発見",
    "調和",
    "勇気",
    "ぬくもり",
    "好奇心",
    "深呼吸",
    "光",
    "リセット",
    "感謝",
    "会話",
    "ときめき",
    "集中",
    "信頼",
    "めぐりあい",
    "リラックス",
    "成長",
    "変化",
    "柔軟さ",
    "きらめき",
    "誠実",
    "小さな幸せ",
    "前向き",
    "自然体",
    "温存",
    "決断",
    "休息",
    "清潔感",
    "チャンス",
    "積み重ね",
    "ひと休み",
    "追い風",
    "閃光",
    "包容力",
    "福音",
    "回復",
    "彩り",
    "静けさ",
    "飛躍",
    "願い",
  ],
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
