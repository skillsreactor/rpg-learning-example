const fs = require('fs');
const util = require('util');
const events = require("events");
const path = require('path');
const EventTypes = require("./EventTypes");
const package = require('./package.json');

// We want to save our state in a directory where we will have write/read
// access. Each platform has a slightly different directory, so we handle
// that here. Or fail. This function does not need to be a member of our
// State class, since it's only used internally.
const getPath = () => {
    switch (process.platform) {
        case "darwin": {
          return path.join(process.env.HOME, "Library", "Application Support", package.name);
        }
        case "win32": {
          return path.join(process.env.APPDATA, package.name);
        }
        case "linux": {
          return path.join(process.env.HOME, `.${package.name}`);
        }
        default: {
          console.log("This platform is not supported for file system storage.");
          process.exit(1);
        }
      }
}

class FileSystemState extends events.EventEmitter {
    read() {
        // We'll return a promise from this method, as well as emit
        // events. This will give calling code more options.
        return new Promise((resolve, reject) => {
            const appDataPath = getPath();

            if (!fs.existsSync(appDataPath)) {
                fs.mkdirSync(appDataPath);
            }

            const filePath = path.join(appDataPath, 'save.json');

            // Attempt to read the state file, and parse it into an object and emit the STATE_UPDATED event.
            fs.readFile(filePath, (err, state) => {
                if (err) {
                    // File not found
                    if (err.code === 'ENOENT') {
                        resolve(null);
                        return this.emit(EventTypes.STATE_UPDATED, null);
                    }
                    // File could not be read... bad permissions, out of file descriptors on OS...
                    reject(err);
                    return this.emit('error', err);
                }
                try {
                    // Attempt to parse the contents of the state file.
                    const parsedState = JSON.parse(state);
                    resolve(parsedState);
                    return this.emit(EventTypes.STATE_UPDATED, parsedState);
                } catch (err) {
                    // Unable to parse, return the error to caller.
                    reject(err);
                    return this.emit('error', err);
                }
            })
        })

    }

    // Write the stringified state object to the save file.
    write(state) {
        const appDataPath = getPath();

        if (!fs.existsSync(appDataPath)) {
            fs.mkdirSync(appDataPath);
        }

        const filePath = path.join(appDataPath, 'save.json');

        fs.writeFile(filePath, JSON.stringify(state, null, 2), (err) => {
            if (err) {
                this.emit('error', err);
            }
        });
    }

    // Delete the save file.
    del(cb) {
        const appDataPath = getPath();

        if (!fs.existsSync(appDataPath)) {
            fs.mkdirSync(appDataPath);
        }

        const filePath = path.join(appDataPath, 'save.json');

        fs.unlink(filePath, (err) => {
            cb(err)
        });
    }
}

module.exports = {
    FileSystemState
};
