/**
 * Player creates a character and then fights enemies of random
 * strength receiving gold for each enemy defeated. Player can
 * recover character health by resting, at the cost of gold.
 */

const Game = require("./Game");
const { CommandLineInterface, ElectronInterface } = require("./interface");
const { FileSystemState } = require("./state");
const EventTypes = require('./EventTypes');

let interface;
if (process.argv[2] === "cli") {
    interface = new CommandLineInterface();
} else {
    interface = new ElectronInterface();
}
const state = new FileSystemState();

// Load the save file.
interface.on(EventTypes.INTERFACE_READY, () => {
    state.read().then(data => {
        const game = Game(data);

        game.on(EventTypes.PROMPTS, (prompts) => {
            // When the game needs prompts, prompt the player.
            interface.promptPlayer(prompts)
            // And then listen for the response from the interface, and emit it back
            // to the game, which is listening to itself for a single response.
            interface.once(
                EventTypes.PROMPT_RESPONSE,
                (responses) => game.handlePlayerResponse(responses)
            );
        });

        // When the game updates the state, we save it.
        game.on(EventTypes.UPDATE_STATE, (newState) => state.write(newState));

        // When a message from the game comes in, ask the interface to handle it.
        game.on(EventTypes.MESSAGE, (message) => interface.handleMessage(message));

        // When the player want's to view their character, ask the interface to do it.
        game.on(EventTypes.VIEW_CHARACTER, (character) => interface.viewCharacter(character));

        game.on(EventTypes.VIEW_INVENTORY, (inventory) => interface.viewInventory(inventory));

        // When the character has died. View their character one last time, and then delete the save.
        game.on(EventTypes.CHARACTER_DEATH, (character) => {
            interface.handleDeath(character);
            // If there is an error, console error it.
            state.del(err => { if (err) console.error(err) });
        });

        process.nextTick(() => {
            game.start();
        })
    });
});
