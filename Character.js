function Character(name, profession, gold, health, attack, level, xp, nextLevelAt) {
    this.name = name;
    this.gold = gold || 100;
    this.level = level || 1;
    this.xp = xp || 0;
    this.nextLevelAt = nextLevelAt || 100;
    

    switch (profession) {
        case 'Warrior':
            this.profession = new WarriorBehavior(health, attack);
            break;
        case 'Thief':
            this.profession = new ThiefBehavior(health, attack);
            break;
        case 'Mage':
            this.profession = new MageBehavior(health, attack);
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

Character.prototype.gainXP = function(xp) {
    const multiplier = Math.min(1 + this.level/10, 3);
    const xpGained = ~~(xp * multiplier);
    this.xp += xpGained;
}

Character.prototype.levelUp = function() {
    this.level += 1;
    this.profession.attack += 2;
    addedHealth =  (this.level - 1) * 20;

    switch (this.profession.profession) {
        case "Warrior":
            this.profession.health = 100 + addedHealth;
            break;
        case "Thief":
            this.profession.health = 75 + addedHealth;
            break;
        case "Mage":
            this.profession.health = 50 + addedHealth;
            break;
        default: console.log("You health was not increased");
    }

    this.nextLevelAt = Math.floor(this.nextLevelAt + (this.nextLevelAt * 2) - (this.level * 50));
}

/**
 * Warrior
 */

function WarriorBehavior(health, attack) {
    this.health = health || 100;
    this.attack = attack || 10;
    this.profession = "Warrior";
}

WarriorBehavior.prototype.doDamage = function(enemy) {
    enemy.health -= this.attack;
}


/**
 * Thief
 */

function ThiefBehavior(health, attack) {
    this.health = health || 75;
    this.attack = attack || 10;
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

function MageBehavior(health, attack) {
    this.health = health || 50;
    this.attack = attack || 15;
    this.profession = "Mage";
}

MageBehavior.prototype.doDamage = function(enemy) {
    enemy.health -= this.attack;
}

module.exports = Character