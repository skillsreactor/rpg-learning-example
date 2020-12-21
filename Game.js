const events = require('events');
const Character = require('./Character');
const ActionTypes = require('./ActionTypes');
const EventTypes = require("./EventTypes");
const SentimentTypes = require("./SentimentTypes");

class Game extends events.EventEmitter {
    constructor() {
        super();
        this.state = null;
    }

    setState(state) {
        if (!state) return;

        this.state = state;
        this.state.character = new Character(
            state.character.name,
            state.character.profession.profession,
            state.character.gold,
            state.character.profession.health,
            state.character.attack,
            state.character.level,
            state.character.xp,
            state.character.nextLevelAt
        );
    }

    start() {
        this.emit(EventTypes.MESSAGE, { key: 'game.name' });

        if (!this.state) {
            return this.createCharacter()
        }
        this.emit(EventTypes.MESSAGE, {
            key: 'welcome.returning',
            meta: { name: this.state.character.name },
            sentiment: SentimentTypes.POSITIVE
        });
        this.emit(EventTypes.PROMPTS, [
            {
                key: 'main',
                type: 'list',
                choices: [
                    ActionTypes.FIGHT_ENEMY,
                    ActionTypes.REST,
                    ActionTypes.VIEW_CHARACTER
                ]
            }
        ]);

        // Listen for the response to come in once.
        this.once(EventTypes.PROMPT_RESPONSE, ([{ main }]) => {
            switch(main) {
                case ActionTypes.FIGHT_ENEMY:
                    return this.attack();
                case ActionTypes.REST:
                    return this.rest();
                case ActionTypes.VIEW_CHARACTER:
                    return this.viewCharacter();
                default:
                    throw new Error("Action not yet implemented.");
            }
        });
    }

    // randomly select an enemy type
    // fighting is health - attack, repeat until player or enemy health <= 0
    // award gold based on enemy strength
    attack() {
        // Make a clone of the current state which we'll emit at the end of the action.
        const state = Object.assign({}, this.state);

        // Naive enemy implementation...
        const damage = Math.floor(Math.random() * 10 + 1); // 1 - 10 damage
        const health = Math.floor(Math.random() * 10 + 21); // 10 - 30 health
        const gold = health + damage;
        const xp = health;
        
        const enemy = { damage, health, gold, xp };

        while (state.character.profession.health > 0 && enemy.health > 0) {
            const prevEnemyHealth = enemy.health;
            
            state.character.doDamage(enemy);
            this.emit(EventTypes.MESSAGE, {
                key: 'combat.damage.dealt',
                meta: { amount: prevEnemyHealth - enemy.health },
                sentiment: SentimentTypes.BRUTAL
            });
            
            state.character.receiveDamage(enemy.damage);
            this.emit(EventTypes.MESSAGE, {
                key: 'combat.damage.receive',
                meta: { amount: enemy.damage },
                sentiment: SentimentTypes.PAIN
            });

            this.emit(EventTypes.MESSAGE, {
                key: `combat.hitpoints`,
                meta: {
                    amount: state.character.profession.health
                }
            });
        }

        if (state.character.profession.health <= 0) {
            // We didn't make it...
            return this.emit(EventTypes.CHARACTER_DEATH, state.character)
        } else {
            // We won!
            this.emit(EventTypes.MESSAGE, {
                key: "combat.result.enemyDefeated"
            });
            
            this.emit(EventTypes.MESSAGE, {
                key: "combat.result.loot",
                meta: { gold },
                sentiment: SentimentTypes.INFORMATIONAL
            });
            
            state.character.gold += enemy.gold;
            state.character.gainXP(enemy.xp)

            this.emit(EventTypes.MESSAGE, {
                key: "combat.result.xp",
                meta: { xp: enemy.xp },
                sentiment: SentimentTypes.INFORMATIONAL
            });

            if(state.character.xp >= state.character.nextLevelAt) {
                state.character.levelUp();
            }

            this.emit(EventTypes.MESSAGE, {
                key: "combat.result.stats",
                meta: {
                    health: state.character.profession.health,
                    gold: state.character.gold,
                    xp: state.character.xp
                }
            });
        }

        // Emit updated state.
        this.emit(EventTypes.UPDATE_STATE, state);
    }

    rest() {
        // Make a clone of the current state which we'll emit
        // at the end of the action.
        const state = Object.assign({}, this.state);

        state.character.gold -= 50;
        state.character.profession.health += 25;
    
        this.emit(EventTypes.MESSAGE, {
            key: "rest.result.change",
            meta: {
                healthGain: 25,
                goldCost: 10
            }
        });

        this.emit(EventTypes.MESSAGE, {
            key: "rest.result.stats",
            meta: {
                health: state.character.profession.health,
                gold: state.character.gold
            }
        });

        // Emit updated state.
        this.emit(EventTypes.UPDATE_STATE, state);
    }

    viewCharacter() {
        this.emit(EventTypes.VIEW_CHARACTER, this.state.character);
    }

    createCharacter() {
        // Emit an event asking for answers for these prompts.
        this.emit(EventTypes.MESSAGE, {
            key: "welcome.new",
            sentiment: SentimentTypes.POSITIVE
        });

        this.emit(EventTypes.PROMPTS, [
            {
                key: 'name',
                type: 'input',
            },
            {
                key: 'profession',
                type: 'list',
                choices: ['Warrior', 'Thief', 'Mage']
            }
        ]);
        // Listen for the response to come in once.
        this.once(EventTypes.PROMPT_RESPONSE, ([{ name }, { profession }]) => {
            this.state = this.state || {};
            this.state.character = new Character(name, profession);
            // Emit a clone of the current state with the character updated!
            this.emit(EventTypes.UPDATE_STATE, Object.assign({}, this.state))

            this.start();
        });
    }
}


module.exports = Game;