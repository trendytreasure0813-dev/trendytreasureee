const fs = require('fs').promises;
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

// Simple in-memory mutex to prevent race conditions on file writes
const locks = {};

const getLock = (fileName) => {
    if (!locks[fileName]) {
        locks[fileName] = Promise.resolve();
    }
    return locks[fileName];
};

const readData = async (fileName) => {
    try {
        const filePath = path.join(dataDir, fileName);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
};

const writeData = async (fileName, content) => {
    const lock = getLock(fileName);
    const newLock = lock.then(async () => {
        try {
            const filePath = path.join(dataDir, fileName);
            await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8');
        } catch (error) {
            console.error(`Error writing to ${fileName}:`, error);
            throw error;
        }
    });
    locks[fileName] = newLock; // Update the lock chain
    return newLock;
};

module.exports = { readData, writeData };
