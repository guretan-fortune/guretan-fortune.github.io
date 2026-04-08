(function () {
  const byId = (id) => document.getElementById(id);

  const nodes = {
    particleField: byId("particleField"),
    ritualTrigger: byId("ritualTrigger"),
    todayDate: byId("todayDate"),
    drawStatusTitle: byId("drawStatusTitle"),
    drawCard: byId("drawCard"),
    drawRarity: byId("drawRarity"),
    drawName: byId("drawName"),
    drawDescription: byId("drawDescription"),
    statEcho: byId("statEcho"),
    drawButton: byId("drawButton"),
    ticketButton: byId("ticketButton"),
    ticketCountLabel: byId("ticketCountLabel"),
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
    worldPhaseDescription: byId("worldPhaseDescription"),
    currentFloorLabel: byId("currentFloorLabel"),
    worldProgressText: byId("worldProgressText"),
    bossAdvice: byId("bossAdvice"),
    nextMilestone: byId("nextMilestone"),
    ocoinValue: byId("ocoinValue"),
    weaponLevel: byId("weaponLevel"),
    armorLevel: byId("armorLevel"),
    bossProgressSummary: byId("bossProgressSummary"),
    toast: byId("toast"),
  };

  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const today = new Date();
  const todayKey = dateKey(today);
  const experienceToNext = (level) => 12 + (level - 1) * 6;
  const daysBetween = (from, to) => Math.round((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000);

  const createDefaultState = () => ({
    player: JSON.parse(JSON.stringify(INITIAL_PLAYER)),
    collection: [],
    cardHistory: [],
    items: Object.values(ITEM_DEFS).reduce((acc, item) => {
      acc[item.id] = item.id === "potion" ? 1 : 0;
      return acc;
    }, {}),
    economy: {
      ocoin: 0,
      equipment: {
        weapon: 0,
        armor: 0,
        boots: 0,
        charm: 0,
      },
    },
    progress: {
      totalVisits: 0,
      visitStreak: 0,
      lastVisitDate: null,
      totalCards: 0,
      bossClears: 0,
      bossLastResult: null,
      currentFloor: 1,
      highestUnlockedFloor: 1,
    },
    daily: {
      lastDrawDate: null,
      lastCardId: null,
      lastResult: null,
      extraDrawDate: null,
      extraDrawsAvailable: 0,
      hiddenTapCount: 0,
      ticketDrawDate: null,
      ticketDrawsUsed: 0,
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
      items: { ...base.items, ...(loaded.items || {}) },
      economy: {
        ...base.economy,
        ...(loaded.economy || {}),
        equipment: {
          ...base.economy.equipment,
          ...((loaded.economy && loaded.economy.equipment) || {}),
        },
      },
      progress: { ...base.progress, ...(loaded.progress || {}) },
      daily: { ...base.daily, ...(loaded.daily || {}) },
      collection: Array.isArray(loaded.collection) ? loaded.collection : [],
      cardHistory: Array.isArray(loaded.cardHistory) ? loaded.cardHistory : [],
    };
  };

  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? mergeState(JSON.parse(raw)) : createDefaultState();
    } catch {
      return createDefaultState();
    }
  };

  const state = loadState();
  const saveState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  const hydrateState = () => {
    const fresh = loadState();
    Object.keys(state).forEach((key) => delete state[key]);
    Object.assign(state, fresh);
  };

  const getEquipmentBonuses = () => ({
    hp: state.economy.equipment.armor * 12,
    attack: state.economy.equipment.weapon * 6,
    defense: state.economy.equipment.armor * 6,
    speed: state.economy.equipment.boots * 4,
    luck: state.economy.equipment.charm * 4,
  });

  const getEffectiveStats = () => {
    const bonus = getEquipmentBonuses();
    return Object.keys(state.player.stats).reduce((acc, key) => {
      acc[key] = state.player.stats[key] + (bonus[key] || 0);
      return acc;
    }, {});
  };

  const getCurrentBoss = () => BOSSES.find((boss) => boss.floor === state.progress.currentFloor) || BOSSES[BOSSES.length - 1];

  const titleForLevel = (level) => {
    if (level >= 20) return "地下終端の継承者";
    if (level >= 15) return "深層運命の観測者";
    if (level >= 10) return "月輪を越えた旅人";
    if (level >= 6) return "運命を鍛える巡礼者";
    if (level >= 3) return "星灯を継ぐ旅人";
    return "月下の新人";
  };

  const getWorldPhase = () => {
    if (state.progress.currentFloor >= 8 || state.player.level >= 14) return WORLD_PHASES[3];
    if (state.progress.currentFloor >= 5 || state.player.level >= 9) return WORLD_PHASES[2];
    if (state.progress.currentFloor >= 3 || state.player.level >= 5) return WORLD_PHASES[1];
    return WORLD_PHASES[0];
  };

  const syncDaily = () => {
    if (state.daily.extraDrawDate !== todayKey) {
      state.daily.extraDrawDate = todayKey;
      state.daily.extraDrawsAvailable = 0;
      state.daily.hiddenTapCount = 0;
    }
    if (state.daily.ticketDrawDate !== todayKey) {
      state.daily.ticketDrawDate = todayKey;
      state.daily.ticketDrawsUsed = 0;
    }
  };

  const registerVisit = () => {
    const last = state.progress.lastVisitDate;
    if (last === todayKey) return;
    state.progress.totalVisits += 1;
    state.progress.visitStreak = !last ? 1 : (daysBetween(last, todayKey) === 1 ? state.progress.visitStreak + 1 : 1);
    state.progress.lastVisitDate = todayKey;
    if (state.progress.visitStreak > 0 && state.progress.visitStreak % 7 === 0) state.items.regen_drop += 1;
  };

  registerVisit();
  syncDaily();

  const toast = (message) => {
    nodes.toast.textContent = message;
    nodes.toast.classList.add("is-visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => nodes.toast.classList.remove("is-visible"), 2200);
  };

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
  const pickCard = () => {
    const rarity = weightedRandomRarity();
    const pool = CARD_LIBRARY.filter((card) => card.rarity === rarity);
    return pool[randInt(0, pool.length - 1)];
  };

  const canDailyDraw = () => state.daily.lastDrawDate !== todayKey || state.daily.extraDrawsAvailable > 0;
  const canTicketDraw = () => (state.items.card_ticket || 0) > 0;

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

  const applyCardGrowth = (card, source) => {
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
    if (!state.collection.includes(card.id)) state.collection.push(card.id);
    if (card.itemReward) state.items[card.itemReward] += 1;

    const bonusRoll = Math.random();
    if (bonusRoll < 0.12) state.items.potion += 1;
    if (state.progress.visitStreak >= 3 && bonusRoll > 0.82 && bonusRoll < 0.92) state.items.power_tonic += 1;

    const levelUps = applyLevelUps();
    if (source === "daily" && state.daily.lastDrawDate === todayKey && state.daily.extraDrawsAvailable > 0) state.daily.extraDrawsAvailable -= 1;
    if (source === "ticket") {
      state.items.card_ticket -= 1;
      state.daily.ticketDrawsUsed += 1;
    }

    const result = {
      cardId: card.id,
      rarity: card.rarity,
      applied,
      itemReward: card.itemReward || null,
      levelUps,
      source,
      drawnAt: todayKey,
    };

    if (source === "daily") state.daily.lastDrawDate = todayKey;
    state.daily.lastCardId = card.id;
    state.daily.lastResult = result;
    state.cardHistory.unshift(result);
    state.cardHistory = state.cardHistory.slice(0, 60);
    saveState();
    return result;
  };

  const setCardView = (card, result) => {
    nodes.drawCard.className = "draw-card";
    if (card) nodes.drawCard.classList.add(`rarity-${RARITY_META[card.rarity].className}`);
    else nodes.drawCard.classList.add("is-idle");

    nodes.drawRarity.textContent = card ? card.rarity : "FATE";
    nodes.drawName.textContent = card ? card.name : "封じられた運命札";
    nodes.drawDescription.textContent = card ? card.description : "儀式を始めると、今日の一枚がここに姿を見せます。";
    nodes.statEcho.innerHTML = result && result.applied.length
      ? result.applied.map((entry) => `<span>${STAT_LABELS[entry.stat]} +${entry.delta}</span>`).join("")
      : "<span>HP ???</span><span>ATK ???</span><span>DEF ???</span><span>SPD ???</span><span>LUK ???</span>";
  };

  const setResultView = (card, result) => {
    if (!card || !result) {
      nodes.resultTag.textContent = "Awaiting Fate";
      nodes.resultHeadline.textContent = "カードを引くと、ここに成長結果が表示されます。";
      nodes.resultEffects.innerHTML = "";
      nodes.resultItem.textContent = "アイテム報酬はまだありません。";
      return;
    }
    nodes.resultTag.textContent = `${card.rarity} Draw`;
    nodes.resultHeadline.textContent = `${card.name} を獲得。旅人の運命が前進しました。`;
    nodes.resultEffects.innerHTML = result.applied.map((entry) => `<span class="delta-pill">${STAT_LABELS[entry.stat]} +${entry.delta}</span>`).join("");
    const itemText = result.itemReward ? `${ITEM_DEFS[result.itemReward].name} を1個獲得。` : "今回はカード成長のみです。";
    const sourceText = result.source === "ticket" ? "カードチケットを使って追加抽選しました。" : "";
    nodes.resultItem.textContent = `${itemText}${result.levelUps > 0 ? ` Lvが${result.levelUps}上がりました。` : ""}${sourceText}`;
  };

  const renderStats = () => {
    const effective = getEffectiveStats();
    const base = state.player.stats;
    nodes.statsList.innerHTML = Object.entries(effective).map(([key, value]) => {
      const percentage = Math.min(100, Math.round((value / 220) * 100));
      const bonus = value - base[key];
      return `
        <div class="stat-row">
          <strong>${STAT_LABELS[key]}</strong>
          <div class="gauge-track"><span class="gauge-fill" style="width:${percentage}%"></span></div>
          <span>${value}${bonus > 0 ? ` (+${bonus})` : ""}</span>
        </div>
      `;
    }).join("");
  };

  const renderInventory = () => {
    nodes.inventoryList.innerHTML = Object.values(ITEM_DEFS).map((item) => `
      <article class="inventory-item">
        <div class="panel-heading-row">
          <div>
            <h4>${item.name}</h4>
            <p class="card-copy">${item.description}</p>
          </div>
          <strong>x${state.items[item.id] || 0}</strong>
        </div>
      </article>
    `).join("");
  };

  const renderCollection = () => {
    nodes.collectionMeta.textContent = `${state.collection.length} / ${CARD_LIBRARY.length}`;
    nodes.cardCollection.innerHTML = CARD_LIBRARY.map((card) => {
      const owned = state.collection.includes(card.id);
      return `
        <article class="card-tile ${owned ? "" : "locked"}">
          <p class="card-meta">${card.rarity}</p>
          <h4>${owned ? card.name : "未知のカード"}</h4>
          <p class="card-copy">${owned ? card.description : "まだ記録されていません。毎日の儀式で見つかります。"}</p>
          <p class="subtle">${owned ? Object.keys(card.statEffects).map((stat) => STAT_LABELS[stat]).join(" / ") : "???"}</p>
        </article>
      `;
    }).join("");
  };

  const updateButtons = () => {
    nodes.drawButton.disabled = false;
    nodes.drawButton.textContent = canDailyDraw()
      ? state.daily.lastDrawDate === todayKey && state.daily.extraDrawsAvailable > 0
        ? `隠し解放でもう一度引く (${state.daily.extraDrawsAvailable})`
        : "今日のカードを引く"
      : "今日はすでに引きました";
    nodes.ticketButton.disabled = !canTicketDraw();
    nodes.ticketButton.textContent = `カードチケットを使う (${state.items.card_ticket || 0})`;
    nodes.ticketCountLabel.textContent = `所持カードチケット: ${state.items.card_ticket || 0}枚`;
  };

  const renderOverview = () => {
    const phase = getWorldPhase();
    const effective = getEffectiveStats();
    const nextNeed = experienceToNext(state.player.level);
    const xpPercent = Math.min(100, Math.round((state.player.exp / nextNeed) * 100));
    const boss = getCurrentBoss();
    const collectionRate = Math.round((state.collection.length / CARD_LIBRARY.length) * 100);

    nodes.todayDate.textContent = today.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
    nodes.drawStatusTitle.textContent = canDailyDraw()
      ? state.daily.lastDrawDate === todayKey && state.daily.extraDrawsAvailable > 0
        ? `隠された余光が残っています。あと${state.daily.extraDrawsAvailable}回、追加で引けます。`
        : "まだ今日の運命は開かれていません。"
      : "今日の運命はすでに開かれています。チケットか明日の儀式を待ちましょう。";

    nodes.playerTitle.textContent = state.player.title;
    nodes.playerName.textContent = state.player.name;
    nodes.playerLevel.textContent = state.player.level;
    nodes.xpFill.style.width = `${xpPercent}%`;
    nodes.xpValue.textContent = `${state.player.exp} EXP`;
    nodes.xpNext.textContent = `次のLvまで ${Math.max(nextNeed - state.player.exp, 0)}`;
    nodes.totalGrowth.textContent = state.player.totalGrowth;
    nodes.totalVisits.textContent = `${state.progress.totalVisits}日`;
    nodes.visitStreak.textContent = `${state.progress.visitStreak}日`;
    nodes.streakDays.textContent = state.progress.visitStreak;
    nodes.bossStatus.textContent = `${state.progress.bossClears}体撃破 / 地下${state.progress.currentFloor}階`;
    nodes.phaseName.textContent = phase.title;
    nodes.phaseIndex.textContent = `Phase ${phase.phase} / ${WORLD_PHASES.length}`;
    nodes.phaseDetail.textContent = phase.description;
    nodes.phaseFill.style.width = `${Math.max((phase.phase / WORLD_PHASES.length) * 100, 10)}%`;
    nodes.totalCards.textContent = `${state.progress.totalCards}枚`;
    nodes.collectionRate.textContent = `${collectionRate}%`;
    nodes.worldPhaseDescription.textContent = phase.description;
    nodes.currentFloorLabel.textContent = `地下${boss.floor}階 解放中`;
    nodes.worldProgressText.textContent = `現在の挑戦先は地下${boss.floor}階「${boss.title}」。累計撃破数 ${state.progress.bossClears}。`;
    nodes.bossAdvice.textContent = `次の敵は「${boss.title}」。報酬は ${boss.reward} ocoin。`;
    nodes.nextMilestone.textContent = state.progress.currentFloor >= 10 ? "地下10階を制覇する" : `地下${Math.min(state.progress.currentFloor + 1, 10)}階を解放する`;
    nodes.ocoinValue.textContent = String(state.economy.ocoin || 0);
    nodes.weaponLevel.textContent = `${state.economy.equipment.weapon}`;
    nodes.armorLevel.textContent = `${state.economy.equipment.armor}`;
    nodes.bossProgressSummary.textContent = state.progress.currentFloor >= 10
      ? "地下10階のラスボスが待っています。装備とアイテムを整えて最後の戦いへ。"
      : `地下${state.progress.currentFloor}階が開放中です。勝利すれば次の地下階層が現れます。`;

    const lastCard = CARD_LIBRARY.find((card) => card.id === state.daily.lastCardId) || null;
    setCardView(lastCard, state.daily.lastResult);
    setResultView(lastCard, state.daily.lastResult);
    renderStats();
    renderInventory();
    renderCollection();
    updateButtons();
  };

  const drawCard = (source) => {
    if (source === "daily" && !canDailyDraw()) {
      toast("今日はすでにカードを引いています。");
      return;
    }
    if (source === "ticket" && !canTicketDraw()) {
      toast("カードチケットがありません。");
      return;
    }
    const card = pickCard();
    nodes.drawCard.classList.remove("legendary-flare");
    nodes.drawCard.classList.add("is-flipping");

    setTimeout(() => {
      const result = applyCardGrowth(card, source);
      setCardView(card, result);
      setResultView(card, result);
      renderOverview();
      if (card.rarity === "Legendary") nodes.drawCard.classList.add("legendary-flare");
      nodes.drawCard.classList.remove("is-flipping");
      toast(source === "ticket" ? `${card.name} を追加抽選で獲得。` : `${card.name} を獲得。`);
    }, 620);
  };

  const handleHiddenTrigger = () => {
    syncDaily();
    state.daily.hiddenTapCount += 1;
    if (state.daily.hiddenTapCount % 5 === 0) {
      state.daily.extraDrawsAvailable += 1;
      saveState();
      renderOverview();
      toast("隠し儀式が開きました。追加で1回引けます。");
      return;
    }
    saveState();
  };

  const createParticles = () => {
    const stars = [];
    for (let index = 0; index < 42; index += 1) {
      stars.push(`<span style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${Math.random() * 6}s;animation-duration:${4 + Math.random() * 6}s"></span>`);
    }
    nodes.particleField.innerHTML = stars.join("");
  };

  const renderAll = () => renderOverview();

  nodes.drawButton.addEventListener("click", () => drawCard("daily"));
  nodes.ticketButton.addEventListener("click", () => drawCard("ticket"));
  nodes.ritualTrigger.addEventListener("click", handleHiddenTrigger);
  window.addEventListener("pageshow", () => {
    hydrateState();
    renderAll();
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    hydrateState();
    renderAll();
  });

  createParticles();
  renderAll();
  saveState();
})();
