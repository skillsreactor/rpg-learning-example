const events = require('events');
const Machine = require('xstate').Machine;
const assign = require('xstate').assign;
const interpret = require('xstate').interpret;
const Character = require('./Character');
const ActionTypes = require('./ActionTypes');
const EventTypes = require("./EventTypes");
const SentimentTypes = require("./SentimentTypes");

let machine;
let game;
let gameService;

class Game extends events.EventEmitter {

    start() {
        if (gameService) return;
        gameService = interpret(machine)
            // .onTransition(state => console.log(state.value))
            .start();
    }
    handlePlayerResponse(responses) {
        gameService.send({ type: EventTypes.PROMPT_RESPONSE, responses });
    }
}

function createGame(gameState) {
    if (game) return game;

    if (gameState) {
        gameState.character = new Character(
            gameState.character.name,
            gameState.character.profession.profession,
            gameState.character.gold,
            gameState.character.health,
            gameState.character.maxHealth,
            gameState.character.profession.attack,
            gameState.character.level,
            gameState.character.xp,
            gameState.character.nextLevelAt,
            gameState.character.inventory
        );
    }

    game = new Game();

    machine = Machine(
        {
            id: 'game',
            context: {
                gameState,
                game,
            },
            initial: 'welcome',
            states: {
                // Transient state that displays our welcome message
                // and immediate transitions to the main menu or
                // the character creation.
                welcome: {
                    // Immediate transition this state after our entry/exit actions...
                    always: [
                        // If we have a current gameState, then we have a valid character.
                        { target: 'mainMenu', cond: (context, event) => context.gameState },
                        // If we don't have a gameState, we need to create a character.
                        { target: 'createCharacter', cond: (context, event) => !context.gameState }
                    ],
                    entry: [
                        // Send our welcome message when we enter this state.
                        (context, event) => context.game.emit(EventTypes.MESSAGE, { key: 'game.name' }),
                    ]
                },
                createCharacter: {
                    // This is a nested state, and we start with the prompt sub-state, so
                    // that we can send our prompts to the interface and wait for the 
                    // response.
                    initial: 'createCharacterPrompt',
                    states: {
                        createCharacterPrompt: {
                            on: {
                                // Transition when we get a response back from the interface.
                                [EventTypes.PROMPT_RESPONSE]: 'createCharacterHandleResponse'
                            },
                            entry: [
                                // First send them the welcome message for new characters.
                                (context, event) => context.game.emit(EventTypes.MESSAGE, {
                                    key: "welcome.new",
                                    sentiment: SentimentTypes.POSITIVE
                                }),
                                // Then send over the prmopts we need filled.
                                (context, event) => context.game.emit(EventTypes.PROMPTS, [
                                    {
                                        key: 'name',
                                        type: 'input',
                                    },
                                    {
                                        key: 'profession',
                                        type: 'list',
                                        choices: ['Warrior', 'Thief', 'Mage']
                                    }
                                ])
                            ]
                        },
                        createCharacterHandleResponse: {
                            // Once we handle the responses, we can end these sub-states.
                            type: 'final',
                            entry: [
                                // Update the game state with the new character we've created.
                                assign((context, { responses: [{ name }, { profession }] }) => {
                                    context.gameState = context.gameState || {};
                                    context.gameState.character = new Character(name, profession);
                                    return context;
                                }),
                                (context, event) => {
                                    // Emit a clone of the current state with the character updated!
                                    context.game.emit(EventTypes.UPDATE_STATE, Object.assign({}, context.gameState))
                                }
                            ]
                        },
                    },
                    // When our sub-states are done, we go back to the welcome state.
                    // Now that we have a character, it'll send us on to the main menu.
                    onDone: 'welcome'
                },
                mainMenu: {
                    // This is a nested state, and we start it out by prompting the player
                    // for the action they want to take.
                    initial: 'mainMenuPrompt',
                    states: {
                        mainMenuPrompt: {
                            // We transition when we get their response.
                            // We conditionally send them to one of our action states
                            // depending on the response to the "main" prompt.
                            on: {
                                [EventTypes.PROMPT_RESPONSE]: [
                                    {
                                        target: 'combat',
                                        cond: (context, { responses: [{ main }] }) => main === ActionTypes.FIGHT_ENEMY
                                    },
                                    {
                                        target: 'rest',
                                        cond: (context, { responses: [{ main }] }) => main === ActionTypes.REST
                                    },
                                    {
                                        target: 'viewCharacter',
                                        cond: (context, { responses: [{ main }] }) => main === ActionTypes.VIEW_CHARACTER
                                    },
                                    {
                                        target: 'viewInventory',
                                        cond: (context, { responses: [{ main }] }) => main === ActionTypes.VIEW_INVENTORY
                                    },
                                    {
                                        target: 'death',
                                        cond: (context, { responses: [{ main }] }) => main === ActionTypes.SUICIDE
                                    }
                                ]
                            },
                            entry: [
                                // Send our main menu prompt to the interface which is the list
                                // of actions that the player can select from a list.
                                (context, event) => context.game.emit(EventTypes.PROMPTS, [
                                    {
                                        key: 'main',
                                        type: 'list',
                                        choices: [
                                            ActionTypes.FIGHT_ENEMY,
                                            ActionTypes.REST,
                                            ActionTypes.VIEW_CHARACTER,
                                            ActionTypes.VIEW_INVENTORY,
                                            //Debug only
                                            ActionTypes.SUICIDE,
                                        ]
                                    }
                                ]),
                            ]
                        },
                        combat: {
                            // This state is a transient state, it will always transition
                            // after taking it's entry/exit actions. Since the entry actions
                            // occur immediately on entering the state, we let the result of
                            // those alter the game state, and then inside of our "always" possible
                            // states, we look at the player health, which was changed in the entry
                            // action which occurred first.
                            always: [
                                // As long as we're still alive, take another turn.
                                {
                                    target: 'mainMenuPrompt',
                                    cond: (context, event) => context.gameState.character.health > 0,
                                },
                                // If we're after the entry action, go to the death state.
                                {
                                    target: 'death',
                                    cond: (context, event) => context.gameState.character.health <= 0,
                                }
                            ],
                            entry: [
                                // Run the combat, and update the context gameState. Since we are modifying the
                                // gameState of the context, we need to use the assign function.
                                assign(async (context, event) => {
                                    const gameState = context.gameState;

                                    // Naive enemy implementation...
                                    const damage = Math.floor(Math.random() * 10 + 1); // 1 - 10 damage
                                    const health = Math.floor(Math.random() * 10 + 21); // 10 - 30 health
                                    const gold = health + damage;
                                    const xp = health;

                                    const enemy = { damage, health, gold, xp };


                                    while (gameState.character.health > 0 && enemy.health > 0) {
                                        const prevEnemyHealth = enemy.health;

                                        enemy.health -= gameState.character.profession.attack;
                                        context.game.emit(EventTypes.MESSAGE, {
                                            key: 'combat.damage.dealt',
                                            meta: { amount: prevEnemyHealth - enemy.health },
                                            sentiment: SentimentTypes.BRUTAL
                                        });

                                        gameState.character.health -= enemy.damage;
                                        context.game.emit(EventTypes.MESSAGE, {
                                            key: 'combat.damage.receive',
                                            meta: { amount: enemy.damage },
                                            sentiment: SentimentTypes.PAIN
                                        });

                                        context.game.emit(EventTypes.MESSAGE, {
                                            key: `combat.hitpoints`,
                                            meta: {
                                                amount: gameState.character.health
                                            }
                                        });
                                    }

                                    if (gameState.character.health <= 0) {
                                        // We didn't make it...
                                        // Always return the context inside of an 'assign' call
                                        return context;
                                    } else {
                                        // We won!
                                        var drop = null;
                                        if (Math.random() > 0.5)
                                            drop = { name: 'Raw Meat', qtd: Math.floor(Math.random() * 3 + 1) };
                                        else
                                            drop = { name: 'Bone', qtd: Math.floor(Math.random() * 2 + 1) };

                                        if (drop != null)
                                            context.gameState.character.inventory.addItem(drop);

                                        context.game.emit(EventTypes.MESSAGE, {
                                            key: "combat.result.enemyDefeated",
                                            meta: { drop },
                                        });

                                        context.game.emit(EventTypes.MESSAGE, {
                                            key: "combat.result.loot",
                                            meta: { gold },
                                            sentiment: SentimentTypes.INFORMATIONAL
                                        });

                                        gameState.character.gold += enemy.gold;
                                        gameState.character.gainXP(enemy.xp)

                                        context.game.emit(EventTypes.MESSAGE, {
                                            key: "combat.result.xp",
                                            meta: { xp: enemy.xp },
                                            sentiment: SentimentTypes.INFORMATIONAL
                                        });

                                        if (gameState.character.xp >= gameState.character.nextLevelAt) {
                                            gameState.character.levelUp();

                                            context.game.emit(EventTypes.MESSAGE, {
                                                key: "character.level",
                                                meta: {
                                                    level: gameState.character.level,
                                                    health: gameState.character.health,
                                                    attack: gameState.character.profession.attack
                                                },
                                                sentiment: SentimentTypes.INFORMATIONAL
                                            });

                                            context.game.emit(EventTypes.MESSAGE, {
                                                key: "character.level.next",
                                                meta: { nextLevelAt: gameState.character.nextLevelAt },
                                                sentiment: SentimentTypes.INFORMATIONAL
                                            });
                                        }

                                        context.game.emit(EventTypes.MESSAGE, {
                                            key: "combat.result.stats",
                                            meta: {
                                                health: gameState.character.health,
                                                gold: gameState.character.gold,
                                                xp: gameState.character.xp
                                            }
                                        });
                                    }
                                    // Always return the context inside of an 'assign' call.
                                    return context;
                                }),
                                // Emit a clone of the current state after combat
                                async (context, event) =>
                                    context.game.emit(EventTypes.UPDATE_STATE, await Object.assign({}, context.gameState))

                            ]
                        },
                        rest: {
                            // After resting, always return to the main menu.
                            // This is a transient state, we just modify the gameState in the
                            // entry action and send out messages to the interface.
                            always: 'mainMenuPrompt',
                            entry: [
                                // Update the gameState with our rested character
                                // Since we're updating the context, we wrap with 'assign' call
                                assign((context, event) => {
                                    gameState = Object.assign({}, context.gameState);

                                    if (gameState.character.gold < 10) {
                                        context.game.emit(EventTypes.MESSAGE, {
                                            key: "rest.result.notEnoughGold",
                                            meta: {
                                                gold: gameState.character.gold
                                            }
                                        })
                                    } else {

                                        gameState.character.gold -= 10;
                                        var needHealth = gameState.character.maxHealth - gameState.character.health;

                                        if (needHealth <= 0) {
                                            context.game.emit(EventTypes.MESSAGE, {
                                                key: "rest.result.noHealNeeded"
                                            });
                                            return context;
                                        }

                                        var healthGained = Math.min(needHealth, 25);


                                        gameState.character.health += healthGained;

                                        context.game.emit(EventTypes.MESSAGE, {
                                            key: "rest.result.change",
                                            meta: {
                                                healthGain: healthGained,
                                                goldCost: 10
                                            }
                                        });

                                        context.game.emit(EventTypes.MESSAGE, {
                                            key: "rest.result.stats",
                                            meta: {
                                                health: gameState.character.health,
                                                gold: gameState.character.gold
                                            }
                                        });
                                    }
                                    return context;
                                }),
                                // Emit a clone of the current state after resting
                                (context, event) =>
                                    context.game.emit(EventTypes.UPDATE_STATE, Object.assign({}, context.gameState))
                            ]
                        },
                        viewCharacter: {
                            // Always go back to the main menu afterwards
                            // Should view character be a prompt type?
                            // This is a really simple transient state that send the view character
                            // event to the interface and immediately transition to the main menu.
                            always: 'mainMenuPrompt',
                            entry: [
                                (context, event) => context.game.emit(EventTypes.VIEW_CHARACTER, context.gameState.character)
                            ]
                        },
                        viewInventory: {
                            // Always go back to the main menu afterwards
                            always: 'mainMenuPrompt',
                            entry: [
                                (context, event) => context.game.emit(EventTypes.VIEW_INVENTORY, context.gameState.character.inventory)
                            ]
                        },
                        // A final state of our main menu nested state. When we enter this state we emit
                        // the character death event.
                        death: {
                            type: 'final',
                            entry: [
                                (context, event) => context.game.emit(EventTypes.CHARACTER_DEATH, context.gameState.character),
                            ]
                        }
                    }
                },
            }
        }
    )

    return game;
}

module.exports = createGame;