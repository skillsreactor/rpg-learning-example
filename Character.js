function Character(name, profession, gold, health, level, xp) {
    this.name = name;
    this.gold = gold || 100;
    this.level = level || 1;
    this.xp = xp || 0;
    this.nextLevelAt = 100;

    switch (profession) {
        case 'Warrior':
            this.profession = new WarriorBehavior(health);
            break;
        case 'Thief':
            this.profession = new ThiefBehavior(health);
            break;
        case 'Mage':
            this.profession = new MageBehavior(health);
            break;
        default:
            throw new Error(`${profession} is not an implemented class`);
    }
}

Character.prototype.doDamage = function(enemy) {
    // Delegate the doDamage method to it's specialized profession doDamage
    this.profession.doDamage(enemy)
}

Character.prototype.receiveDamage = function(amount) {
    this.profession.health -= amount;
}

Character.prototype.gainXP = function() {
    const multiplier = Math.floor(1 + this.level/10);
    const xp = Math.floor(Math.random() * 10 + 21) * multiplier;
    const maxXpGain = Math.floor(Math.random() * 10 + 21) * 2;

    if (this.level === 20) {
        this.xp += maxXpGain;
        console.log(`You gained ${maxXpGain} XP!`)
    } else {
        this.xp += xp;
        console.log(`You gained ${xp} XP!`)
    }
}

Character.prototype.levelUp = function() {
    this.level += 1;
    this.nextLevelAt = Math.floor(this.nextLevelAt + (this.nextLevelAt * 2) - (this.level * 50));
    console.log(`Reach the next level at ${this.nextLevelAt} XP!`);
}

/**
 * Warrior
 */

function WarriorBehavior(health) {
    this.health = health || 100;
    this.attack = 10;
    this.profession = "Warrior";
}

WarriorBehavior.prototype.doDamage = function(enemy) {
    enemy.health -= this.attack;
}


/**
 * Thief
 */

function ThiefBehavior(health) {
    this.health = health || 75;
    this.attack = 10;
    this.criticalChance = 0.15
    this.criticalModifier = 3;
    this.profession = "Thief";
}

ThiefBehavior.prototype.doDamage = function(enemy) {
    const damage = Math.random() <= this.criticalChance
        ? this.attack * this.criticalModifier
        : this.attack;
    enemy.health -= damage;
}


/**
 * Mage
 */

function MageBehavior(health) {
    this.health = health || 50;
    this.attack = 15;
    this.profession = "Mage";
}

MageBehavior.prototype.doDamage = function(enemy) {
    enemy.health -= this.attack;
}

module.exports = Character