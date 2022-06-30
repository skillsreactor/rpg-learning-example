function Character(name, profession, gold, health, maxHealth, attack, level, xp, nextLevelAt) {
    this.name = name;
    this.gold = gold || 100;
    this.level = level || 1;
    this.xp = xp || 0;
    this.nextLevelAt = nextLevelAt || 100;


    switch (profession) {
        case 'Warrior':
            this.profession = new WarriorBehavior(health, attack);
            this.maxHealth = maxHealth || 100;
            this.health = health || 100;
            break;
        case 'Thief':
            this.profession = new ThiefBehavior(health, attack);
            this.maxHealth = maxHealth || 75;
            this.health = health || 75;
            break;
        case 'Mage':
            this.profession = new MageBehavior(health, attack);
            this.maxHealth = maxHealth || 50;
            this.health = health || 50;
            break;
        default:
            throw new Error(`${profession} is not an implemented class`);
    }


}

Character.prototype.doDamage = function (enemy) {
    // Delegate the doDamage method to it's specialized profession doDamage
    this.profession.doDamage(enemy)
}

Character.prototype.receiveDamage = function (amount) {
    this.health -= amount;
}

Character.prototype.gainXP = function (xp) {
    const multiplier = Math.min(1 + this.level / 10, 3);
    const xpGained = ~~(xp * multiplier);
    this.xp += xpGained;
}

Character.prototype.levelUp = function () {
    this.level += 1;
    this.profession.attack += 2;
    addedHealth = (this.level - 1) * 20;

    this.maxHealth += addedHealth;
    this.maxHealth += addedHealth;

    this.nextLevelAt = Math.floor(this.nextLevelAt + (this.nextLevelAt * 2) - (this.level * 50));
}

// Creation of an object that represents the stats of the character
Character.prototype.viewCharacter = function () {
    return {
        'Name': this.name,
        'Gold': this.gold,
        'XP': this.xp + '/' + this.nextLevelAt,
        'Health': this.health + '/' + this.maxHealth,
        'Attack': this.profession.attack,
        'Profession': this.profession.profession
    };
}

/**
 * Warrior
 */

function WarriorBehavior(health, attack) {
    this.baseHealth = health || 100;
    this.attack = attack || 10;
    this.profession = "Warrior";
}

WarriorBehavior.prototype.doDamage = function (enemy) {
    enemy.health -= this.attack;
}


/**
 * Thief
 */

function ThiefBehavior(health, attack) {
    this.baseHealth = health || 75;
    this.attack = attack || 10;
    this.criticalChance = 0.15
    this.criticalModifier = 3;
    this.profession = "Thief";
}

ThiefBehavior.prototype.doDamage = function (enemy) {
    const damage = Math.random() <= this.criticalChance
        ? this.attack * this.criticalModifier
        : this.attack;
    enemy.health -= damage;
}


/**
 * Mage
 */

function MageBehavior(health, attack) {
    this.baseHealth = health || 50;
    this.attack = attack || 15;
    this.profession = "Mage";
}

MageBehavior.prototype.doDamage = function (enemy) {
    enemy.health -= this.attack;
}

module.exports = Character