(function () {
  const byId = (id) => document.getElementById(id);
  const particleField = byId("particleField");

  const homeNodes = {
    todayDate: byId("todayDate"),
    drawStatusTitle: byId("drawStatusTitle"),
    drawCard: byId("drawCard"),
    drawRarity: byId("drawRarity"),
    drawName: byId("drawName"),
    drawDescription: byId("drawDescription"),
    statEcho: byId("statEcho"),
    drawButton: byId("drawButton"),
    resultTag: byId("resultTag"),
    resultHeadline: byId("resultHeadline"),
    resultEffects: byId("resultEffects"),
    resultItem: byId("resultItem"),
    playerTitle: byId("playerTitle"),
    playerName: byId("playerName"),
    playerLevel: byId("playerLevel"),
    xpFill: byId("xpFill"),
    xpValue: byId("xpValue"),
    xpNext: byId("xpNext"),
    totalGrowth: byId("totalGrowth"),
    totalVisits: byId("totalVisits"),
    visitStreak: byId("visitStreak"),
    streakDays: byId("streakDays"),
    bossStatus: byId("bossStatus"),
    statsList: byId("statsList"),
    phaseName: byId("phaseName"),
    phaseIndex: byId("phaseIndex"),
    phaseDetail: byId("phaseDetail"),
    phaseFill: byId("phaseFill"),
    totalCards: byId("totalCards"),
    collectionRate: byId("collectionRate"),
    collectionMeta: byId("collectionMeta"),
    inventoryList: byId("inventoryList"),
    cardCollection: byId("cardCollection"),
    worldPhaseTitle: byId("worldPhaseTitle"),
    worldPhaseDescription: byId("worldPhaseDescription"),
    nextMilestone: byId("nextMilestone"),
    worldProgressText: byId("worldProgressText"),
    bossAdvice: byId("bossAdvice"),
    toast: byId("toast"),
  };

  const dateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const today = new Date();
  const todayKey = dateKey(today);

  const daysBetween = (from, to) => {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    return Math.round((end - start) / 86400000);
  };

  const experienceToNext = (level) => 12 + (level - 1) * 6;

  const titleForLevel = (level) => {
    if (level >= 15) return "終端星界の継承者";
    if (level >= 12) return "運命深層の観測者";
    if (level >= 9) return "月輪を越えた旅人";
    if (level >= 6) return "運命を鍛える巡礼者";
    if (level >= 3) return "星灯を継ぐ旅人";
    return "月下の新人";
  };

  const getWorldPhase = (state) => {
    if (state.progress.totalCards >= 24 || state.player.level >= 12) return WORLD_PHASES[3];
    if (state.progress.totalCards >= 16 || state.player.level >= 8) return WORLD_PHASES[2];
    if (state.progress.totalCards >= 8 || state.player.level >= 4) return WORLD_PHASES[1];
    return WORLD_PHASES[0];
  };

  const createDefaultState = () => ({
    player: JSON.parse(JSON.stringify(INITIAL_PLAYER)),
    collection: [],
    cardHistory: [],
    items: {
      potion: 1,
      power_tonic: 0,
      ward_talisman: 0,
      crit_charm: 0,
      regen_drop: 0,
    },
    progress: {
      totalVisits: 0,
      visitStreak: 0,
      lastVisitDate: null,
      totalCards: 0,
      bossClears: 0,
      bossLastResult: null,
    },
    daily: {
      lastDrawDate: null,
      lastCardId: null,
      lastResult: null,
    },
  });

  const mergeState = (loaded) => {
    const base = createDefaultState();
    return {
      ...base,
      ...loaded,
      player: {
        ...base.player,
        ...(loaded.player || {}),
        stats: {
          ...base.player.stats,
          ...((loaded.player && loaded.player.stats) || {}),
        },
      },
      collection: Array.isArray(loaded.collection) ? loaded.collection : [],
      cardHistory: Array.isArray(loaded.cardHistory) ? loaded.cardHistory : [],
      items: {
        ...base.items,
        ...(loaded.items || {}),
      },
      progress: {
        ...base.progress,
        ...(loaded.progress || {}),
      },
      daily: {
        ...base.daily,
        ...(loaded.daily || {}),
      },
    };
  };

  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      return mergeState(JSON.parse(raw));
    } catch {
      return createDefaultState();
    }
  };

  const saveState = (state) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const state = loadState();

  const registerVisit = () => {
    const last = state.progress.lastVisitDate;
    if (last === todayKey) return;

    state.progress.totalVisits += 1;
    if (!last) {
      state.progress.visitStreak = 1;
    } else {
      state.progress.visitStreak = daysBetween(last, todayKey) === 1 ? state.progress.visitStreak + 1 : 1;
    }

    state.progress.lastVisitDate = todayKey;

    if (state.progress.visitStreak > 0 && state.progress.visitStreak % 7 === 0) {
      state.items.regen_drop += 1;
    }
  };

  registerVisit();

  const weightedRandomRarity = () => {
    const streakBonus = Math.min(state.progress.visitStreak * 0.005, 0.03);
    const adjusted = {
      Common: Math.max(0.34, RARITY_META.Common.rate - streakBonus),
      Rare: RARITY_META.Rare.rate + streakBonus * 0.5,
      Epic: RARITY_META.Epic.rate + streakBonus * 0.35,
      Legendary: RARITY_META.Legendary.rate + streakBonus * 0.15,
    };

    const roll = Math.random();
    let cursor = 0;
    for (const key of ["Common", "Rare", "Epic", "Legendary"]) {
      cursor += adjusted[key];
      if (roll <= cursor) return key;
    }
    return "Common";
  };

  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const cloneEffects = (effects) => Object.entries(effects).reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});

  const pickCard = () => {
    const rarity = weightedRandomRarity();
    const pool = CARD_LIBRARY.filter((card) => card.rarity === rarity);
    return pool[randInt(0, pool.length - 1)];
  };

  const ensureCollectionCard = (cardId) => {
    if (!state.collection.includes(cardId)) state.collection.push(cardId);
  };

  const addItem = (itemId, amount = 1) => {
    if (!itemId) return;
    state.items[itemId] = (state.items[itemId] || 0) + amount;
  };

  const applyLevelUps = () => {
    let leveled = 0;
    while (state.player.exp >= experienceToNext(state.player.level)) {
      state.player.exp -= experienceToNext(state.player.level);
      state.player.level += 1;
      leveled += 1;
      state.player.stats.hp += 6;
      state.player.stats.attack += 1;
      state.player.stats.defense += 1;
      state.player.stats.speed += 1;
      if (state.player.level % 2 === 0) state.player.stats.luck += 1;
    }
    state.player.title = titleForLevel(state.player.level);
    return leveled;
  };

  const applyCardGrowth = (card) => {
    const rarity = RARITY_META[card.rarity];
    const applied = [];
    let totalGrowth = 0;

    Object.entries(card.statEffects).forEach(([stat, base]) => {
      const delta = base * randInt(rarity.growthMin, rarity.growthMax);
      state.player.stats[stat] += delta;
      totalGrowth += delta;
      applied.push({ stat, delta });
    });

    state.player.exp += rarity.exp + Math.floor(totalGrowth / 2);
    state.player.totalGrowth += totalGrowth;
    state.progress.totalCards += 1;
    ensureCollectionCard(card.id);
    if (card.itemReward) addItem(card.itemReward, 1);

    const bonusRoll = Math.random();
    if (bonusRoll < 0.12) addItem("potion", 1);
    if (state.progress.visitStreak >= 3 && bonusRoll > 0.82 && bonusRoll < 0.92) addItem("power_tonic", 1);

    const levelUps = applyLevelUps();

    const result = {
      cardId: card.id,
      rarity: card.rarity,
      effects: cloneEffects(card.statEffects),
      applied,
      itemReward: card.itemReward || null,
      levelUps,
      drawnAt: todayKey,
    };

    state.daily.lastDrawDate = todayKey;
    state.daily.lastCardId = card.id;
    state.daily.lastResult = result;
    state.cardHistory.unshift(result);
    state.cardHistory = state.cardHistory.slice(0, 60);

    saveState(state);
    return result;
  };

  const getLastCard = () => CARD_LIBRARY.find((card) => card.id === state.daily.lastCardId) || null;

  const toast = (message) => {
    if (!homeNodes.toast) return;
    homeNodes.toast.textContent = message;
    homeNodes.toast.classList.add("is-visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      homeNodes.toast.classList.remove("is-visible");
    }, 2200);
  };

  const setCardView = (card, result) => {
    const rarityMeta = card ? RARITY_META[card.rarity] : null;
    const drawCard = homeNodes.drawCard;
    drawCard.className = "draw-card";
    if (card) {
      drawCard.classList.add(`rarity-${rarityMeta.className}`);
    } else {
      drawCard.classList.add("is-idle");
    }

    homeNodes.drawRarity.textContent = card ? card.rarity : "FATE";
    homeNodes.drawName.textContent = card ? card.name : "封じられた運命札";
    homeNodes.drawDescription.textContent = card
      ? card.description
      : "まだ何も引かれていません。儀式を始めると、今日の一枚が姿を見せます。";

    const stats = result && result.applied.length
      ? result.applied.map((entry) => `<span>${STAT_LABELS[entry.stat]} +${entry.delta}</span>`).join("")
      : "<span>HP ???</span><span>ATK ???</span><span>DEF ???</span><span>SPD ???</span><span>LUK ???</span>";

    homeNodes.statEcho.innerHTML = stats;
  };

  const setResultView = (card, result) => {
    if (!card || !result) {
      homeNodes.resultTag.textContent = "Awaiting Fate";
      homeNodes.resultHeadline.textContent = "カードを引くと、ここに今日の成長結果が表示されます。";
      homeNodes.resultEffects.innerHTML = "";
      homeNodes.resultItem.textContent = "アイテム報酬はまだありません。";
      return;
    }

    homeNodes.resultTag.textContent = `${card.rarity} Draw`;
    homeNodes.resultHeadline.textContent = `${card.name} を獲得。旅人が確かに強くなりました。`;
    homeNodes.resultEffects.innerHTML = result.applied
      .map((entry) => `<span class="delta-pill">${STAT_LABELS[entry.stat]} +${entry.delta}</span>`)
      .join("");

    const itemText = result.itemReward
      ? `${ITEM_DEFS[result.itemReward].name} を1個獲得しました。`
      : "今回はカードの成長のみです。";

    homeNodes.resultItem.textContent = result.levelUps > 0
      ? `${itemText} Lvが${result.levelUps}上がりました。`
      : itemText;
  };

  const renderStats = () => {
    homeNodes.statsList.innerHTML = Object.entries(state.player.stats)
      .map(([key, value]) => {
        const percentage = Math.min(100, Math.round((value / 180) * 100));
        return `
          <div class="stat-row">
            <strong>${STAT_LABELS[key]}</strong>
            <div class="gauge-track"><span class="gauge-fill" style="width:${percentage}%"></span></div>
            <span>${value}</span>
          </div>
        `;
      })
      .join("");
  };

  const renderInventory = () => {
    homeNodes.inventoryList.innerHTML = Object.values(ITEM_DEFS)
      .map((item) => `
        <article class="inventory-item">
          <div class="panel-heading-row">
            <div>
              <h4>${item.name}</h4>
              <p class="card-copy">${item.description}</p>
            </div>
            <strong>x${state.items[item.id] || 0}</strong>
          </div>
        </article>
      `)
      .join("");
  };

  const renderCollection = () => {
    homeNodes.collectionMeta.textContent = `${state.collection.length} / ${CARD_LIBRARY.length}`;
    homeNodes.cardCollection.innerHTML = CARD_LIBRARY.map((card) => {
      const owned = state.collection.includes(card.id);
      return `
        <article class="card-tile ${owned ? "" : "locked"}">
          <p class="card-meta">${card.rarity}</p>
          <h4>${owned ? card.name : "未知のカード"}</h4>
          <p class="card-copy">${owned ? card.description : "まだ記録されていません。毎日の儀式で発見できます。"}</p>
          <p class="subtle">${owned ? Object.keys(card.statEffects).map((stat) => STAT_LABELS[stat]).join(" / ") : "???"}</p>
        </article>
      `;
    }).join("");
  };

  const renderOverview = () => {
    const nextNeed = experienceToNext(state.player.level);
    const xpPercent = Math.min(100, Math.round((state.player.exp / nextNeed) * 100));
    const phase = getWorldPhase(state);
    const collectionRate = Math.round((state.collection.length / CARD_LIBRARY.length) * 100);

    homeNodes.todayDate.textContent = today.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    homeNodes.drawStatusTitle.textContent = state.daily.lastDrawDate === todayKey
      ? "今日の運命はすでに開かれています。明日また新しい一枚を。"
      : "まだ今日の運命は開かれていません。";

    homeNodes.playerTitle.textContent = state.player.title;
    homeNodes.playerName.textContent = state.player.name;
    homeNodes.playerLevel.textContent = state.player.level;
    homeNodes.xpFill.style.width = `${xpPercent}%`;
    homeNodes.xpValue.textContent = `${state.player.exp} EXP`;
    homeNodes.xpNext.textContent = `次のLvまで ${Math.max(nextNeed - state.player.exp, 0)}`;
    homeNodes.totalGrowth.textContent = state.player.totalGrowth;
    homeNodes.totalVisits.textContent = `${state.progress.totalVisits}日`;
    homeNodes.visitStreak.textContent = `${state.progress.visitStreak}日`;
    homeNodes.streakDays.textContent = state.progress.visitStreak;
    homeNodes.bossStatus.textContent = state.progress.bossClears > 0
      ? `${state.progress.bossClears}回撃破`
      : "未踏破";

    homeNodes.phaseName.textContent = phase.title;
    homeNodes.phaseIndex.textContent = `Phase ${phase.phase} / ${WORLD_PHASES.length}`;
    homeNodes.phaseDetail.textContent = phase.description;
    homeNodes.phaseFill.style.width = `${Math.max(phase.phase / WORLD_PHASES.length * 100, 8)}%`;
    homeNodes.totalCards.textContent = `${state.progress.totalCards}枚`;
    homeNodes.collectionRate.textContent = `${collectionRate}%`;
    homeNodes.worldPhaseTitle.textContent = phase.title;
    homeNodes.worldPhaseDescription.textContent = phase.description;
    homeNodes.worldProgressText.textContent = `現在は「${phase.title}」。カード累計 ${state.progress.totalCards} 枚で世界が進行します。`;

    const nextMilestone = state.player.level < 5 ? "Lv5 到達"
      : state.player.level < 8 ? "Lv8 到達"
      : state.player.level < 12 ? "Lv12 到達"
      : "最終深層の踏破";
    homeNodes.nextMilestone.textContent = nextMilestone;

    homeNodes.bossAdvice.textContent = state.player.level >= 10
      ? "かなり挑みやすい状態です。護符と回復薬があれば勝率が上がります。"
      : state.player.level >= 6
        ? "戦えますが油断は禁物です。防御札を持ち込むと安定します。"
        : "まずは数日カードを重ね、HPと防御力を伸ばすのが安全です。";

    const lastCard = getLastCard();
    setCardView(lastCard, state.daily.lastResult);
    setResultView(lastCard, state.daily.lastResult);
    renderStats();
    renderInventory();
    renderCollection();
  };

  const performDraw = () => {
    if (state.daily.lastDrawDate === todayKey) {
      toast("今日はすでにカードを引いています。");
      return;
    }

    const card = pickCard();
    homeNodes.drawCard.classList.remove("legendary-flare");
    homeNodes.drawCard.classList.add("is-flipping");

    window.setTimeout(() => {
      const result = applyCardGrowth(card);
      setCardView(card, result);
      setResultView(card, result);
      renderOverview();
      homeNodes.drawButton.disabled = true;

      if (card.rarity === "Legendary") {
        homeNodes.drawCard.classList.add("legendary-flare");
      }

      toast(card.rarity === "Legendary" ? "Legendaryカード出現。" : `${card.name} を獲得。`);
      homeNodes.drawCard.classList.remove("is-flipping");
    }, 620);
  };

  const renderButtonState = () => {
    homeNodes.drawButton.disabled = state.daily.lastDrawDate === todayKey;
    homeNodes.drawButton.textContent = state.daily.lastDrawDate === todayKey
      ? "今日はすでに引きました"
      : "今日のカードを引く";
  };

  const createParticles = () => {
    if (!particleField) return;
    const total = 42;
    const stars = [];
    for (let index = 0; index < total; index += 1) {
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 6;
      const duration = 4 + Math.random() * 6;
      stars.push(`<span style="left:${left}%;top:${top}%;animation-delay:${delay}s;animation-duration:${duration}s"></span>`);
    }
    particleField.innerHTML = stars.join("");
  };

  homeNodes.drawButton.addEventListener("click", performDraw);

  createParticles();
  renderButtonState();
  renderOverview();
  saveState(state);
})();
