const fs = require('fs');
const util = require('util');
const events = require("events");
const EventTypes = require("./EventTypes");

class FileSystemState extends events.EventEmitter {
    read() {
        // Attempt to read the state file, and parse it into an object and emit the STATE_UPDATED event.
        fs.readFile("save.json", (err, state) => {
            if (err) {
                // File not found
                if (err.code === 'ENOENT') {
                    return this.emit(EventTypes.STATE_UPDATED, null);
                }
                // File could not be read... bad permissions, out of file descriptors on OS...
                return this.emit('error', err);
            }
            try {
                // Attempt to parse the contents of the state file.
                this.emit(EventTypes.STATE_UPDATED, JSON.parse(state));
            } catch (err) {
                // Unable to parse, return the error to caller.
                return this.emit('error', err);
            }
        })
    }

    // Write the stringified state object to the save file.
    write(state) {
        fs.writeFile("save.json", JSON.stringify(state, null, 2), (err) => {
            if (err) {
                this.emit('error', err);
            }
        });
    }

    // Delete the save file.
    del(cb) {
        fs.unlink("save.json", (err) => {
            cb(err)
        });
    }
}

module.exports = {
    FileSystemState
};
