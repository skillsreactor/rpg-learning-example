/**
 * Fight an enemy sub-routine
 */

// randomly select an enemy type
// fighting is health - attack, repeat until player or enemy health <= 0
// award gold based on enemy strength
const attack = (character) => {
    // Naive enemy implementation...
    const damage = Math.floor(Math.random() * 10 + 1); // 1 - 10 damage
    const health = Math.floor(Math.random() * 10 + 21); // 10 - 30 health
    const gold = health + damage;
    

    const enemy = { damage, health, gold, };

    while (character.profession.health > 0 && enemy.health > 0) {
        const prevEnemyHealth = enemy.health;
        character.doDamage(enemy);
        console.log(`You hit the enemy for ${prevEnemyHealth - enemy.health} damage.`);
        character.receiveDamage(enemy.damage);
        console.log(`The enemy hits you for ${enemy.damage} damage.`)
        console.log(`You have ${character.profession.health} hitpoints remaining.`);
    }

    if (character.profession.health <= 0) {
        console.log("You have died.");
        return null;
    } else {
        console.log(`You have defeated the enemy and received ${gold} gold!`)
        character.gainXP();
        character.gold += enemy.gold;
        console.log(`You now have ${character.profession.health} health. ${character.gold} gold and ${character.xp} XP.`);
    }

    if(character.xp >= character.nextLevelAt) {
        character.levelUp();
    }

    return character;
}



/**
 * Rest sub-routine
 */
const rest = (character) => {
    character.gold -= 50;
    character.profession.health += 25;
    character.xp += 10;
    console.log("You have gained 25 health for 10 gold and 10 XP.");
    console.log(`You now have ${character.profession.health} health, ${character.gold} gold and ${character.xp} XP.`);

    if(character.xp >= character.nextLevelAt) {
        character.levelUp();
    }
    
    return character;
}
// subtract gold, give health


/**
 * View character stats sub-routine
 */
const printStats = (character) => {
    const recursivePrint = (obj) => {
        for (var key in obj) {
            if (typeof obj[key] === 'object') {
                recursivePrint(obj[key])
            } else if (typeof obj[key] !== 'function') {
                console.log(`${key}: ${obj[key]}`);
            }
        }
    }

    console.log("Character Stats");
    console.log("---------------");
    recursivePrint(character);

    return character;
}

module.exports = {
    attack,
    rest,
    printStats
};