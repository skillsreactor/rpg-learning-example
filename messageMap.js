module.exports = new Map([
  [
    "game.name",
    "RPG Game"  // Make this more exciting...
  ],
  [
    "welcome.new",
    "It looks like you are new here.\nLet's make your character"
  ],
  [
    "welcome.returning",
    ({ name }) => `Welcome back, ${name}`
  ],
  [
    "character.level",
    ({ level, health, attack }) => `You are now level ${level}! You now have ${health} health and ${attack} attack.`
  ],
  [
    "character.level.next",
    ({ nextLevelAt }) => `Reach the next level at ${nextLevelAt} XP!`
  ],
  [
    "combat.damage.dealt",
    ({ amount }) => `You hit the enemy for ${amount} damage.`
  ],
  [
    "combat.damage.receive",
    ({ amount }) => `The enemy hits you for ${amount} damage.`
  ],
  [
    "combat.hitpoints",
    ({ amount }) => `You have ${amount} hitpoints remaining.`
  ],
  [
    "death",
    "You have died. :-X Your final stats were..."
  ],
  [
    "combat.result.enemyDefeated",
    ({drop}) => "You have defeated the enemy" + drop!=null?`The enemy droped ${drop.qtd} ${drop.name}.`:""
  ],
  [
    "combat.result.loot",
    ({ gold }) => `You have received ${gold} gold!`
  ],
  [
    "combat.result.xp",
    ({ xp }) => `You gained ${xp} XP!`
  ],
  [
    "combat.result.stats",
    ({ health, gold, xp }) => `You now have ${health} health and ${gold} gold and ${xp} XP.`
  ],
  [
    "rest.result.change",
    ({ healthGain, goldCost }) =>
      `You have gained ${healthGain} health for ${goldCost} gold.`
  ],
  [
    "rest.result.stats",
    ({ health, gold }) => `You now have ${health} health and ${gold} gold.`
  ],
  [
    "rest.result.notEnoughGold",
    ({ gold }) => `${gold} gold is not enough to rest. You need 10 gold.`
  ],
  [
    "rest.result.noHealNeeded",
    "You do not need to rest right now."
  ],
  [
    "viewCharacter.header",
    "Character Stats\n---------------"
  ],
  [
    "viewInventory.header",
    "Inventory\n---------------"
  ]
]);