const events = require("events");
const chalk = require("chalk");
const inquirer = require("inquirer");
const { app, BrowserWindow, ipcMain } = require('electron');
const EventTypes = require("./EventTypes");
const SentimentTypes = require("./SentimentTypes");
const messageMap = require("./messageMap");

const promptMessageMap = new Map([
    ["name", "What is your name?"],
    ["main", "Choose your action!"],
    ["profession", "What is your profession?"]
]);

const sentimentMap = new Map([
    [SentimentTypes.BRUTAL, chalk.bold.red],
    [SentimentTypes.PAIN, chalk.bold.magenta],
    [SentimentTypes.SERIOUS, chalk.inverse],
    [SentimentTypes.POSITIVE, chalk.green],
    [SentimentTypes.INFORMATIONAL, chalk.yellow],
]);

class CommandLineInterface extends events.EventEmitter {
    constructor() {
        super();
        process.nextTick(() => {
            this.emit(EventTypes.INTERFACE_READY);
        })
    }

    async promptPlayer(prompts) {
        let answers = [];
        for (let prompt of prompts) {
            switch (prompt.type) {
                case 'list':
                    answers.push(await inquirer.prompt([
                        {
                            name: prompt.key,
                            type: "list",
                            message: promptMessageMap.get(prompt.key),
                            choices: prompt.choices
                        }
                    ]));
                    break;
                case 'input':
                    answers.push(await inquirer.prompt([
                        {
                            name: prompt.key,
                            type: "input",
                            message: promptMessageMap.get(prompt.key),
                        }
                    ]));
                    break;
                default:
                    throw new Error(`Unhandled prompt type: ${prompt.type}`);
            }
        }
        this.emit(EventTypes.PROMPT_RESPONSE, answers)
    }

    viewCharacter(character) {
        const recursivePrint = (obj) => {
            for (var key in obj) {
                if (typeof obj[key] === 'object') {
                    recursivePrint(obj[key])
                } else if (typeof obj[key] !== 'function') {
                    // TODO: Make map entries for the stats!
                    this.handleMessage({ key: `${key}: ${obj[key]}` });
                }
            }
        }

        this.handleMessage({ key: "viewCharacter.header" });
        recursivePrint(character.viewCharacter());
    }

    viewInventory(inventory) {
        const recursivePrint = (obj) => {
            for (var key in obj) {
                if (typeof obj[key] === 'object') {
                    recursivePrint(obj[key])
                } else if (typeof obj[key] !== 'function') {
                    // TODO: Make map entries for the stats!
                    this.handleMessage({ key: `${key}: ${obj[key]}` });
                }
            }
        }

        this.handleMessage({ key: "viewInventory.header" });
        recursivePrint(inventory);
    }

    handleMessage({ key, meta, sentiment }) {
        if (messageMap.has(key)) {

            // Get the message to log from our map, if it is a template
            // function, give it the meta data to make the string.
            let message = messageMap.get(key);
            if (typeof message === 'function') {
                message = message(meta);
            }

            // If the message has a sentiment with it, lets get the
            // corresponding chalk method to use, otherwise stick with
            // regular console.log text
            if (sentimentMap.has(sentiment)) {
                const sentimentWrapper = sentimentMap.get(sentiment);
                message = sentimentWrapper(message);
            }
            console.log(message);

        } else {
            // We don't have an entry for that key in our map
            // We should take some alerting action here...
            console.log(key);
        }
    }

    handleDeath(character) {
        this.handleMessage({ key: "death" });
        this.viewCharacter(character);
    }
}

class ElectronInterface extends events.EventEmitter {
    constructor() {
        super();
        this.win = null;
        const createWindow = () => {
            this.win = new BrowserWindow({
                width: 800,
                height: 600,
                webPreferences: {
                    nodeIntegration: true
                }
            });

            this.win.loadFile('index.html');

            this.win.webContents.on('did-finish-load', () => {
                this.emit(EventTypes.INTERFACE_READY);
            });
        }

        app.whenReady().then(createWindow);

        app.on('window-all-closed', () => {
            if (process.platfor !== 'darwin') {
                app.quit();
            }
        });

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        })
    }

    promptPlayer(prompts) {
        let responses = [];
        const handleResponse = (event, response) => {
            // We want to ensure we put the responses in the same order
            // that they were sent to the renderer.
            let promptIndex = prompts.findIndex(prompt => response.hasOwnProperty(prompt.key));
            responses[promptIndex] = response;

            // Use object.keys because length could count indices without
            // values, and object.keys considers only populated indices.
            // Once we have a response for each prompt, we clean up our
            // main process handler, so we don't have any memory leaks!
            if (Object.keys(responses).length === prompts.length) {
                ipcMain.removeHandler(EventTypes.PROMPT_RESPONSE);
                this.emit(EventTypes.PROMPT_RESPONSE, responses);
            }
        }
        // Before we send our prompts message to the renderer process
        // We set up a handler for the responses it should send back to
        // us. We should get a response for each prompt, so we'll need
        // to keep track of how many responses we get, and remove the
        // handler when we get them all.
        ipcMain.handle(EventTypes.PROMPT_RESPONSE, handleResponse);
        this.win.webContents.send(EventTypes.PROMPTS, prompts);
    }

    viewCharacter(character) {
        this.win.webContents.send(EventTypes.VIEW_CHARACTER, character.viewCharacter());
    }

    handleMessage({ key, meta, sentiment }) {
        this.win.webContents.send(EventTypes.MESSAGE, { key, meta, sentiment });
    }

    handleDeath(character) {
        this.win.webContents.send(EventTypes.CHARACTER_DEATH, character);
    }
}

module.exports = {
    CommandLineInterface,
    ElectronInterface,
};