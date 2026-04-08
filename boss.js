(function () {
  const byId = (id) => document.getElementById(id);

  const nodes = {
    particleField: byId("particleField"),
    bossFloorTag: byId("bossFloorTag"),
    bossName: byId("bossName"),
    bossDescription: byId("bossDescription"),
    bossVisualLabel: byId("bossVisualLabel"),
    bossImageNote: byId("bossImageNote"),
    playerBattleTitle: byId("playerBattleTitle"),
    playerBattleLevel: byId("playerBattleLevel"),
    playerStatHp: byId("playerStatHp"),
    playerStatAttack: byId("playerStatAttack"),
    playerStatDefense: byId("playerStatDefense"),
    playerStatSpeed: byId("playerStatSpeed"),
    playerStatLuck: byId("playerStatLuck"),
    coinTotal: byId("coinTotal"),
    turnLabel: byId("turnLabel"),
    playerHpValue: byId("playerHpValue"),
    playerHpFill: byId("playerHpFill"),
    bossHpValue: byId("bossHpValue"),
    bossHpFill: byId("bossHpFill"),
    attackButton: byId("attackButton"),
    guardButton: byId("guardButton"),
    focusButton: byId("focusButton"),
    battleItems: byId("battleItems"),
    battleLog: byId("battleLog"),
    announcement: byId("battleAnnouncement"),
    announcementTitle: byId("announcementTitle"),
    announcementText: byId("announcementText"),
    restartButton: byId("restartButton"),
  };

  const experienceToNext = (level) => 12 + (level - 1) * 6;

  const createDefaultState = () => ({
    player: JSON.parse(JSON.stringify(INITIAL_PLAYER)),
    collection: [],
    cardHistory: [],
    items: Object.values(ITEM_DEFS).reduce((acc, item) => { acc[item.id] = item.id === "potion" ? 1 : 0; return acc; }, {}),
    economy: { ocoin: 0, equipment: { weapon: 0, armor: 0 } },
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

  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      const parsed = JSON.parse(raw);
      const base = createDefaultState();
      return {
        ...base,
        ...parsed,
        player: {
          ...base.player,
          ...(parsed.player || {}),
          stats: {
            ...base.player.stats,
            ...((parsed.player && parsed.player.stats) || {}),
          },
        },
        items: { ...base.items, ...(parsed.items || {}) },
        economy: {
          ...base.economy,
          ...(parsed.economy || {}),
          equipment: { ...base.economy.equipment, ...((parsed.economy && parsed.economy.equipment) || {}) },
        },
        progress: { ...base.progress, ...(parsed.progress || {}) },
        daily: { ...base.daily, ...(parsed.daily || {}) },
      };
    } catch {
      return createDefaultState();
    }
  };

  const state = loadState();
  const saveState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  const getEquipmentBonuses = () => ({
    hp: state.economy.equipment.armor * 12,
    attack: state.economy.equipment.weapon * 6,
    defense: state.economy.equipment.armor * 6,
    speed: 0,
    luck: 0,
  });

  const effectiveStats = () => {
    const bonus = getEquipmentBonuses();
    return Object.keys(state.player.stats).reduce((acc, key) => {
      acc[key] = state.player.stats[key] + (bonus[key] || 0);
      return acc;
    }, {});
  };

  const boss = BOSSES.find((entry) => entry.floor === state.progress.currentFloor) || BOSSES[BOSSES.length - 1];
  const playerStats = effectiveStats();

  const battle = {
    turn: 1,
    playerHp: playerStats.hp,
    playerMaxHp: playerStats.hp,
    bossHp: boss.hp,
    bossMaxHp: boss.hp,
    playerGuard: false,
    playerAttackBuffTurns: 0,
    playerDefenseBuffTurns: 0,
    playerRegenTurns: 0,
    playerCritFocus: 0,
    finished: false,
  };

  const createParticles = () => {
    const stars = [];
    for (let index = 0; index < 46; index += 1) {
      stars.push(`<span style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${Math.random() * 6}s;animation-duration:${4 + Math.random() * 6}s"></span>`);
    }
    nodes.particleField.innerHTML = stars.join("");
  };

  const log = (turnText, text) => {
    const entry = document.createElement("article");
    entry.className = "log-entry";
    entry.innerHTML = `<div class="log-turn">${turnText}</div><div>${text}</div>`;
    nodes.battleLog.prepend(entry);
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const playerAttackPower = () => playerStats.attack + (battle.playerAttackBuffTurns > 0 ? 8 : 0);
  const playerDefensePower = () => playerStats.defense + (battle.playerDefenseBuffTurns > 0 ? 8 : 0);

  const updateAnnouncement = (title, text, stateClass = "") => {
    nodes.announcementTitle.textContent = title;
    nodes.announcementText.textContent = text;
    nodes.announcement.className = "glass battle-announcement";
    if (stateClass) nodes.announcement.classList.add(stateClass);
  };

  const updateGauges = () => {
    nodes.turnLabel.textContent = `Turn ${battle.turn}`;
    nodes.playerHpValue.textContent = `${Math.max(0, battle.playerHp)} / ${battle.playerMaxHp}`;
    nodes.bossHpValue.textContent = `${Math.max(0, battle.bossHp)} / ${battle.bossMaxHp}`;
    nodes.playerHpFill.style.width = `${clamp((battle.playerHp / battle.playerMaxHp) * 100, 0, 100)}%`;
    nodes.bossHpFill.style.width = `${clamp((battle.bossHp / battle.bossMaxHp) * 100, 0, 100)}%`;
  };

  const renderStaticInfo = () => {
    nodes.bossFloorTag.textContent = `Basement ${boss.floor}`;
    nodes.bossName.textContent = boss.name;
    nodes.bossDescription.textContent = boss.description;
    nodes.bossVisualLabel.textContent = boss.imageLabel;
    nodes.bossImageNote.textContent = `${boss.reward} ocoin を抱えるこの階層の支配者。勝てば次の地下階が開きます。`;
    nodes.playerBattleTitle.textContent = state.player.title;
    nodes.playerBattleLevel.textContent = `Lv${state.player.level} / EXP ${state.player.exp} / 次 ${experienceToNext(state.player.level)}`;
    nodes.playerStatHp.textContent = playerStats.hp;
    nodes.playerStatAttack.textContent = playerStats.attack;
    nodes.playerStatDefense.textContent = playerStats.defense;
    nodes.playerStatSpeed.textContent = playerStats.speed;
    nodes.playerStatLuck.textContent = playerStats.luck;
    nodes.coinTotal.textContent = `${state.economy.ocoin} ocoin`;
  };

  const renderItems = () => {
    const battleItems = Object.values(ITEM_DEFS).filter((item) => item.kind === "battle");
    nodes.battleItems.innerHTML = battleItems.map((item) => `
      <button class="battle-item-button" data-item-id="${item.id}" type="button" ${state.items[item.id] > 0 && !battle.finished ? "" : "disabled"}>
        <div class="panel-heading-row">
          <div>
            <h4>${item.name}</h4>
            <p class="card-copy">${item.description}</p>
          </div>
          <strong>x${state.items[item.id] || 0}</strong>
        </div>
      </button>
    `).join("");
    nodes.battleItems.querySelectorAll("[data-item-id]").forEach((button) => {
      button.addEventListener("click", () => useItem(button.dataset.itemId));
    });
  };

  const setButtonsDisabled = (disabled) => {
    nodes.attackButton.disabled = disabled;
    nodes.guardButton.disabled = disabled;
    nodes.focusButton.disabled = disabled;
    renderItems();
  };

  const finishBattle = (won) => {
    battle.finished = true;
    setButtonsDisabled(true);

    if (won) {
      const reward = boss.reward;
      state.economy.ocoin += reward;
      state.progress.bossClears += 1;
      state.progress.bossLastResult = `win-floor-${boss.floor}`;
      if (boss.floor < 10) {
        state.progress.currentFloor = boss.floor + 1;
        state.progress.highestUnlockedFloor = Math.max(state.progress.highestUnlockedFloor, boss.floor + 1);
      }
      if (Math.random() < 0.65) state.items.regen_drop += 1;
      saveState();

      updateAnnouncement(
        "階層突破",
        `${boss.name} を撃破。${reward} ocoin を獲得し、地下${Math.min(boss.floor + 1, 10)}階への道が開きました。`,
        "announcement-win reward-burst"
      );
      log(`Turn ${battle.turn}`, `守護者が崩れ、硬貨の雨が床を打つ。${reward} ocoin を回収。`);
      if (boss.floor < 10) {
        log(`Turn ${battle.turn}`, `深層の扉が軋み、地下${boss.floor + 1}階が解放された。`);
      } else {
        log(`Turn ${battle.turn}`, "地下10階を制覇。終末の中心で、旅人の記録が完成した。");
      }
    } else {
      state.progress.bossLastResult = `lose-floor-${boss.floor}`;
      saveState();
      updateAnnouncement("敗北", "押し切られました。カード、装備、アイテム、ocoinの使い道を見直して再挑戦できます。", "announcement-lose");
      log(`Turn ${battle.turn}`, "旅人は退き、深層の重圧だけが残った。");
    }
  };

  const endTurnStatus = () => {
    if (battle.playerRegenTurns > 0 && battle.playerHp > 0) {
      const heal = 10;
      battle.playerHp = Math.min(battle.playerMaxHp, battle.playerHp + heal);
      log(`Turn ${battle.turn}`, `再生効果でHPが${heal}回復。`);
      battle.playerRegenTurns -= 1;
    }
    if (battle.playerAttackBuffTurns > 0) battle.playerAttackBuffTurns -= 1;
    if (battle.playerDefenseBuffTurns > 0) battle.playerDefenseBuffTurns -= 1;
    if (battle.playerCritFocus > 0) battle.playerCritFocus -= 1;
    battle.playerGuard = false;
    battle.turn += 1;
    updateGauges();
  };

  const playerHit = () => {
    const critChance = clamp(0.08 + playerStats.luck * 0.008 + (battle.playerCritFocus > 0 ? 0.32 : 0), 0.08, 0.72);
    const isCrit = Math.random() < critChance;
    const damageBase = playerAttackPower() + randomInt(6, 14) - Math.floor(boss.defense * 0.55);
    const damage = Math.max(8, isCrit ? Math.floor(damageBase * 1.7) : damageBase);
    battle.bossHp -= damage;
    log(`Turn ${battle.turn}`, isCrit ? `会心の一撃。${boss.title}に${damage}ダメージ。` : `${boss.title}に${damage}ダメージ。`);
  };

  const bossHit = () => {
    const special = Math.random() < 0.24;
    const raw = boss.attack + randomInt(5, 13) - Math.floor(playerDefensePower() * 0.52);
    let damage = Math.max(7, special ? raw + 10 : raw);
    if (battle.playerGuard) damage = Math.floor(damage * 0.52);
    battle.playerHp -= damage;
    log(`Turn ${battle.turn}`, special ? `${boss.title}の深層波。${damage}ダメージを受けた。` : `${boss.title}の一撃。${damage}ダメージを受けた。`);
  };

  const resolveTurn = (playerAction) => {
    if (battle.finished) return;
    const playerFirst = playerStats.speed + randomInt(0, 4) >= boss.speed + randomInt(0, 4);
    const actions = playerFirst ? [playerAction, "boss"] : ["boss", playerAction];
    actions.forEach((action) => {
      if (battle.finished || battle.playerHp <= 0 || battle.bossHp <= 0) return;
      if (action === "attack") playerHit();
      if (action === "boss") bossHit();
    });

    updateGauges();
    if (battle.bossHp <= 0) return finishBattle(true);
    if (battle.playerHp <= 0) return finishBattle(false);
    endTurnStatus();
    renderItems();
  };

  const attack = () => {
    updateAnnouncement("攻撃", "育成と装備で伸ばした攻撃力がそのまま反映されます。");
    resolveTurn("attack");
  };

  const guard = () => {
    battle.playerGuard = true;
    log(`Turn ${battle.turn}`, "旅人は防御姿勢を取り、衝撃に備えた。");
    updateAnnouncement("防御", "このターンの被ダメージを大きく軽減します。");
    resolveTurn("guard");
  };

  const focus = () => {
    battle.playerCritFocus = 1;
    log(`Turn ${battle.turn}`, "旅人は集中し、次の一撃に星の焦点を合わせた。");
    updateAnnouncement("集中", "次の攻撃の会心率が大きく上がります。");
    resolveTurn("focus");
  };

  const useItem = (itemId) => {
    if (battle.finished || !state.items[itemId]) return;
    const item = ITEM_DEFS[itemId];
    state.items[itemId] -= 1;
    if (item.battleEffect.type === "heal") {
      battle.playerHp = Math.min(battle.playerMaxHp, battle.playerHp + item.battleEffect.amount);
      log(`Turn ${battle.turn}`, `${item.name}を使用。HPが${item.battleEffect.amount}回復。`);
      updateAnnouncement(item.name, "体勢を立て直しました。");
    }
    if (item.battleEffect.type === "buffAttack") {
      battle.playerAttackBuffTurns = item.battleEffect.turns;
      log(`Turn ${battle.turn}`, `${item.name}を使用。${item.battleEffect.turns}ターン攻撃力が上昇。`);
      updateAnnouncement(item.name, "攻撃の押し込みが強くなります。");
    }
    if (item.battleEffect.type === "buffDefense") {
      battle.playerDefenseBuffTurns = item.battleEffect.turns;
      log(`Turn ${battle.turn}`, `${item.name}を使用。${item.battleEffect.turns}ターン防御力が上昇。`);
      updateAnnouncement(item.name, "長期戦に耐えやすくなります。");
    }
    if (item.battleEffect.type === "focusCrit") {
      battle.playerCritFocus = 2;
      log(`Turn ${battle.turn}`, `${item.name}を使用。会心狙いの態勢に入った。`);
      updateAnnouncement(item.name, "次の一撃が重くなりやすくなります。");
    }
    if (item.battleEffect.type === "regen") {
      battle.playerHp = Math.min(battle.playerMaxHp, battle.playerHp + item.battleEffect.heal);
      battle.playerRegenTurns = item.battleEffect.turns;
      log(`Turn ${battle.turn}`, `${item.name}を使用。HPが${item.battleEffect.heal}回復し、再生を得た。`);
      updateAnnouncement(item.name, "回復と再生で粘り強く戦えます。");
    }
    saveState();
    renderStaticInfo();
    updateGauges();
    resolveTurn("item");
  };

  const restartBattle = () => window.location.reload();

  nodes.attackButton.addEventListener("click", attack);
  nodes.guardButton.addEventListener("click", guard);
  nodes.focusButton.addEventListener("click", focus);
  nodes.restartButton.addEventListener("click", restartBattle);

  createParticles();
  renderStaticInfo();
  renderItems();
  updateGauges();
  log("Turn 0", `${boss.name} が深層より出現。旅人は地下${boss.floor}階で戦闘態勢に入った。`);
  updateAnnouncement("地下への扉は開いています。", "勝てば ocoin を獲得し、次の地下階へ進行します。");
})();
