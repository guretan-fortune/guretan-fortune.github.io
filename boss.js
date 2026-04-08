(function () {
  const byId = (id) => document.getElementById(id);
  const particleField = byId("particleField");

  const nodes = {
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
    itemTotal: byId("itemTotal"),
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

  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      const parsed = JSON.parse(raw);
      return {
        ...createDefaultState(),
        ...parsed,
        player: {
          ...INITIAL_PLAYER,
          ...(parsed.player || {}),
          stats: {
            ...INITIAL_PLAYER.stats,
            ...((parsed.player && parsed.player.stats) || {}),
          },
        },
        items: {
          ...createDefaultState().items,
          ...(parsed.items || {}),
        },
        progress: {
          ...createDefaultState().progress,
          ...(parsed.progress || {}),
        },
      };
    } catch {
      return createDefaultState();
    }
  };

  const saveState = (state) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const state = loadState();
  const boss = BOSSES[0];

  const battle = {
    turn: 1,
    playerHp: state.player.stats.hp,
    playerMaxHp: state.player.stats.hp,
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
    if (!particleField) return;
    const stars = [];
    for (let index = 0; index < 46; index += 1) {
      stars.push(`<span style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${Math.random() * 6}s;animation-duration:${4 + Math.random() * 6}s"></span>`);
    }
    particleField.innerHTML = stars.join("");
  };

  const totalItems = () => Object.values(state.items).reduce((sum, value) => sum + value, 0);

  const log = (turnText, text) => {
    const entry = document.createElement("article");
    entry.className = "log-entry";
    entry.innerHTML = `<div class="log-turn">${turnText}</div><div>${text}</div>`;
    nodes.battleLog.prepend(entry);
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const playerAttackPower = () => state.player.stats.attack + (battle.playerAttackBuffTurns > 0 ? 8 : 0);
  const playerDefensePower = () => state.player.stats.defense + (battle.playerDefenseBuffTurns > 0 ? 8 : 0);

  const updateAnnouncement = (title, text, stateClass = "") => {
    nodes.announcementTitle.textContent = title;
    nodes.announcementText.textContent = text;
    nodes.announcement.className = "glass battle-announcement";
    if (stateClass) nodes.announcement.classList.add(stateClass);
  };

  const updateGauges = () => {
    const playerRate = clamp((battle.playerHp / battle.playerMaxHp) * 100, 0, 100);
    const bossRate = clamp((battle.bossHp / battle.bossMaxHp) * 100, 0, 100);
    nodes.turnLabel.textContent = `Turn ${battle.turn}`;
    nodes.playerHpValue.textContent = `${Math.max(0, battle.playerHp)} / ${battle.playerMaxHp}`;
    nodes.playerHpFill.style.width = `${playerRate}%`;
    nodes.bossHpValue.textContent = `${Math.max(0, battle.bossHp)} / ${battle.bossMaxHp}`;
    nodes.bossHpFill.style.width = `${bossRate}%`;
  };

  const renderStaticInfo = () => {
    nodes.bossName.textContent = boss.name;
    nodes.bossDescription.textContent = boss.description;
    nodes.bossVisualLabel.textContent = boss.imageLabel;
    nodes.bossImageNote.textContent = `${boss.imageNote} 差し替え先は boss.html の .boss-visual です。`;

    nodes.playerBattleTitle.textContent = state.player.title;
    nodes.playerBattleLevel.textContent = `Lv${state.player.level} / EXP ${state.player.exp} / 次 ${experienceToNext(state.player.level)}`;
    nodes.playerStatHp.textContent = state.player.stats.hp;
    nodes.playerStatAttack.textContent = state.player.stats.attack;
    nodes.playerStatDefense.textContent = state.player.stats.defense;
    nodes.playerStatSpeed.textContent = state.player.stats.speed;
    nodes.playerStatLuck.textContent = state.player.stats.luck;
    nodes.itemTotal.textContent = totalItems();
  };

  const renderItems = () => {
    nodes.battleItems.innerHTML = Object.values(ITEM_DEFS).map((item) => `
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
      state.progress.bossClears += 1;
      state.progress.bossLastResult = "win";
      if (Math.random() < 0.65) state.items.regen_drop += 1;
      saveState(state);
      updateAnnouncement("勝利", "深層の守護者を打ち破りました。育成の成果がそのまま勝因になっています。", "announcement-win");
      log(`Turn ${battle.turn}`, "守護者は崩れ、深層に新たな記録が刻まれた。");
    } else {
      state.progress.bossLastResult = "lose";
      saveState(state);
      updateAnnouncement("敗北", "押し切られました。育成を重ね、アイテムを整えて再挑戦できます。", "announcement-lose");
      log(`Turn ${battle.turn}`, "旅人は退き、運命の記録だけを持って帰還した。");
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
    const critChance = clamp(0.08 + state.player.stats.luck * 0.008 + (battle.playerCritFocus > 0 ? 0.32 : 0), 0.08, 0.72);
    const isCrit = Math.random() < critChance;
    const damageBase = playerAttackPower() + randomInt(6, 14) - Math.floor(boss.defense * 0.55);
    const damage = Math.max(8, isCrit ? Math.floor(damageBase * 1.7) : damageBase);
    battle.bossHp -= damage;
    log(`Turn ${battle.turn}`, isCrit
      ? `会心の一撃。${boss.name}に${damage}ダメージ。`
      : `${boss.name}に${damage}ダメージ。`);
  };

  const bossHit = () => {
    const special = Math.random() < 0.24;
    const raw = boss.attack + randomInt(5, 13) - Math.floor(playerDefensePower() * 0.52);
    let damage = Math.max(7, special ? raw + 10 : raw);

    if (battle.playerGuard) damage = Math.floor(damage * 0.52);
    battle.playerHp -= damage;
    log(`Turn ${battle.turn}`, special
      ? `${boss.name}の重圧波。${damage}ダメージを受けた。`
      : `${boss.name}の一撃。${damage}ダメージを受けた。`);
  };

  const resolveTurn = (playerAction) => {
    if (battle.finished) return;

    const playerFirst = state.player.stats.speed + randomInt(0, 4) >= boss.speed + randomInt(0, 4);
    const actions = playerFirst ? [playerAction, "boss"] : ["boss", playerAction];

    actions.forEach((action) => {
      if (battle.finished || battle.playerHp <= 0 || battle.bossHp <= 0) return;
      if (action === "attack") playerHit();
      if (action === "boss") bossHit();
    });

    updateGauges();

    if (battle.bossHp <= 0) {
      finishBattle(true);
      return;
    }

    if (battle.playerHp <= 0) {
      finishBattle(false);
      return;
    }

    endTurnStatus();
    renderItems();
  };

  const attack = () => {
    updateAnnouncement("攻撃", "育成した攻撃力と運がダメージに反映されます。");
    resolveTurn("attack");
  };

  const guard = () => {
    battle.playerGuard = true;
    log(`Turn ${battle.turn}`, "旅人は防御姿勢を取った。被ダメージが軽減される。");
    updateAnnouncement("防御", "このターンは被ダメージが大きく軽減されます。");
    resolveTurn("guard");
  };

  const focus = () => {
    battle.playerCritFocus = 1;
    log(`Turn ${battle.turn}`, "旅人は集中し、次の一撃に星の焦点を合わせた。");
    updateAnnouncement("集中", "次の攻撃で会心率が大きく上がります。");
    resolveTurn("focus");
  };

  const useItem = (itemId) => {
    if (battle.finished || !state.items[itemId]) return;
    const item = ITEM_DEFS[itemId];
    state.items[itemId] -= 1;

    if (item.battleEffect.type === "heal") {
      battle.playerHp = Math.min(battle.playerMaxHp, battle.playerHp + item.battleEffect.amount);
      log(`Turn ${battle.turn}`, `${item.name}を使用。HPが${item.battleEffect.amount}回復。`);
      updateAnnouncement(item.name, "回復して立て直しました。");
    }

    if (item.battleEffect.type === "buffAttack") {
      battle.playerAttackBuffTurns = item.battleEffect.turns;
      log(`Turn ${battle.turn}`, `${item.name}を使用。${item.battleEffect.turns}ターン攻撃力が上昇。`);
      updateAnnouncement(item.name, "攻撃力上昇で押し切る準備が整いました。");
    }

    if (item.battleEffect.type === "buffDefense") {
      battle.playerDefenseBuffTurns = item.battleEffect.turns;
      log(`Turn ${battle.turn}`, `${item.name}を使用。${item.battleEffect.turns}ターン防御力が上昇。`);
      updateAnnouncement(item.name, "防御力上昇で長期戦に強くなりました。");
    }

    if (item.battleEffect.type === "focusCrit") {
      battle.playerCritFocus = 2;
      log(`Turn ${battle.turn}`, `${item.name}を使用。会心狙いの態勢に入った。`);
      updateAnnouncement(item.name, "次の攻撃が強烈になりやすくなります。");
    }

    if (item.battleEffect.type === "regen") {
      battle.playerHp = Math.min(battle.playerMaxHp, battle.playerHp + item.battleEffect.heal);
      battle.playerRegenTurns = item.battleEffect.turns;
      log(`Turn ${battle.turn}`, `${item.name}を使用。HPが${item.battleEffect.heal}回復し、再生を得た。`);
      updateAnnouncement(item.name, "回復と再生で粘り強く戦えます。");
    }

    saveState(state);
    renderStaticInfo();
    updateGauges();
    resolveTurn("item");
  };

  const restartBattle = () => {
    window.location.reload();
  };

  nodes.attackButton.addEventListener("click", attack);
  nodes.guardButton.addEventListener("click", guard);
  nodes.focusButton.addEventListener("click", focus);
  nodes.restartButton.addEventListener("click", restartBattle);

  createParticles();
  renderStaticInfo();
  renderItems();
  updateGauges();
  log("Turn 0", `${boss.name} が深層より出現。旅人は戦闘態勢に入った。`);
  updateAnnouncement("深層への扉は開いています。", "まずは行動を選んでください。素早さによって先手後手が変化します。");
})();
