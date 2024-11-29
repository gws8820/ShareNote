const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const app = express();
const port = 3000;

const logStream = fs.createWriteStream(path.join(__dirname, 'server_log.txt'), { flags: 'a' });
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function (...args) {
    const logMessage = args.join(' ') + '\n';
    logStream.write(logMessage);
    originalConsoleLog.apply(console, args);
};

console.error = function (...args) {
    const errorMessage = 'ERROR: ' + args.join(' ') + '\n';
    logStream.write(errorMessage);
    originalConsoleError.apply(console, args);
};

// Create a MySQL connection pool
require('dotenv').config();
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;

const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    connectionLimit: 10
  });

const rateLimit = 40; // Number of requests allowed per minute
const banThreshold = 10;
const interval = 60000;
const banDuration = 600000; // Ban duration in milliseconds (10 minutes)
const requestCount = {};
const bannedRequestCount = {};
const bannedIPs = {};
let RemoveRequest = [];

function addToBlacklist(clientIP) {
    const blacklistFilePath = path.join(__dirname, './blacklist.txt');
    const blacklistEntry = `${clientIP}\n`;
    const date = new Date();

    fs.appendFile(blacklistFilePath, blacklistEntry, (err) => {
        if (err) {
            console.error('An Error Occured While Adding Blacklist:', err);
        } 
        else {
            console.log(`${date} ${clientIP} : Banned Permanently.`);
        }
    });
}

function isBlacklisted(clientIP) {
    const blacklistFilePath = path.join(__dirname, './blacklist.txt');
    const blacklist = fs.readFileSync(blacklistFilePath, 'utf8').split('\n').map(line => line.trim()).filter(line => line.length > 0);
    return blacklist.includes(clientIP);
}

function cleanupTimestampTable() {
    const HourAgo = Date.now() - 3600000;
    const date = new Date();

    const deleteTimestampQuery = 'DELETE FROM timestamp WHERE UNIX_TIMESTAMP(last_logged_time) * 1000 < ?';
    const deleteDataQuery = 'DELETE FROM data WHERE pin NOT IN (SELECT DISTINCT pin FROM timestamp)';

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error Getting Connection from Pool:', err);
            return res.status(500).json({ success: false, error: 'Failed to Update Timestamp.' });
        }
        connection.query(deleteTimestampQuery, [HourAgo], (err, timeStampResult) => {
            if (err) {
                connection.release();
                console.error('Error Cleaning Up Timestamp:', err);
            } 
            else {
                connection.query(deleteDataQuery, (err, dataResult) => {
                    connection.release();
                    if (err) {
                        console.error('Error Retrieving Affected PINs:', err);
                    } 
                    else if (dataResult.affectedRows !== 0) {
                        console.log(`${date} ${dataResult.affectedRows} Note(s) Removed Due to Inactivity`);
                    }
                });
            }
        });
    });
}

app.use(express.json());
app.use(cors({ origin: 'https://sharenote.kr' }));

app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
});

app.use((req, res, next) => {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();
    const date = new Date();
  
    // Check if the client IP is in the request count storage; if not, initialize it
    if (!requestCount[clientIP]) {
        requestCount[clientIP] = {
            requests: [],
        };
    }

    if (!bannedRequestCount[clientIP]) {
        bannedRequestCount[clientIP] = {
            requests: [],
        };
    }
    
    // Remove old requests that are outside of the rate limit window
    requestCount[clientIP].requests = requestCount[clientIP].requests.filter(
        (timestamp) => now - timestamp <= interval
    );

    bannedRequestCount[clientIP].requests = bannedRequestCount[clientIP].requests.filter(
        (timestamp) => now - timestamp <= banDuration
    );

    if (isBlacklisted(clientIP)) {
        return res.status(403).json({ error: 'IP Banned Permanently.' });
    }

    else if (bannedIPs[clientIP]) {
        // Check if the request count exceeds the ban threshold
        if (bannedRequestCount[clientIP].requests.length >= banThreshold) {
            addToBlacklist(clientIP);
            delete bannedIPs[clientIP];
            return res.status(403) .json({ error: 'IP Banned Permanently.' });
        }
        
        else if (now < bannedIPs[clientIP]) {
            console.log(`${date} ${clientIP} : Invalid Request`);
            bannedRequestCount[clientIP].requests.push(now);
            return res.status(400).json({ error: 'Invalid Request' });
        }
        
        else {
            delete bannedIPs[clientIP];
            bannedRequestCount[clientIP].requests = [];
        }
    }

    else if (requestCount[clientIP].requests.length >= rateLimit) {
        bannedIPs[clientIP] = now + banDuration;
        console.log(`${date} ${clientIP} : Banned for 10 Minutes.`);
        return res.status(429).json({ error: 'IP Banned Temporarily.' });
    }
    requestCount[clientIP].requests.push(now);
  
    next();
});

app.post('/login', (req, res) => {
    const { pin } = req.body;
    const loginQuery = 'INSERT INTO timestamp (pin, last_logged_time) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE last_logged_time = NOW()';
    const loadNotesQuery = 'SELECT id, note FROM data WHERE pin = ?';

    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();
    const date = new Date();

    if (typeof pin === 'string' && /^[0-9]+$/.test(pin) && pin.length >= 6 && pin.length <= 15) {
        // Use the pool to get a connection from the pool
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error Getting Connection from Pool:', err);
                return res.status(500).json({ success: false, error: 'Failed to Update Timestamp.' });
            }

            connection.query(loginQuery, [pin], (err, result) => {
                connection.release(); // Release the connection back to the pool

                if (err) {
                    console.error('Error Updating Timestamp:', err);
                    return res.status(500).json({ success: false, error: 'Failed to Update Timestamp.' });
                }
                else {
                    connection.query(loadNotesQuery, [pin], (loadErr, loadResult) => {
                        connection.release(); // Release the connection back to the pool

                        if (loadErr) {
                            console.error('Error Loading Notes:', loadErr);
                            return res.status(500).json({ success: false, error: 'Failed to Load Notes.' });
                        }
                        else {
                            console.log(`${date} ${clientIP} : Successfully Logged In with ${pin}.`);
                            const notes = loadResult.map(row => ({ id: row.id, content: row.note }));
                            res.json({ success: true, notes: notes });
                        }
                    });
                }
            });
        });
    }

    else {
        bannedIPs[clientIP] = now + banDuration;
        console.log(`${date} ${clientIP} : Banned for 10 Minutes due to Invalid Request : Manipulated PIN to ${pin}.`);
        return res.status(400).json({ error: 'IP Banned Temporarily.' });
    }
});

app.post('/add-note', (req, res) => {
    const { pin, note } = req.body;
    const countNoteQuery = 'SELECT COUNT(*) AS noteCount FROM data WHERE pin = ?';
    const addNoteQuery = 'INSERT INTO data (pin, note) VALUES (?, ?)';

    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();
    const date = new Date();

    if (typeof pin === 'string' && /^[0-9]+$/.test(pin) && pin.length >= 6 && pin.length <= 15 && typeof note === 'string' && note.trim() !== "" && note.length <= 10000) {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error Getting Connection from Pool:', err);
                return res.status(500).json({ success: false, error: 'Failed to Add Note.' });
            }

            connection.query(countNoteQuery, [pin], (countErr, countResult) => {
                if (countErr) {
                    connection.release(); // Release the connection back to the pool
                    console.error('Error Counting Notes:', countErr);
                    return res.status(500).json({ success: false, error: 'Failed to Add Note.' });
                }

                const noteCount = countResult[0].noteCount;
                
                if (noteCount >= 200) {
                    connection.release(); // Release the connection back to the pool
                    bannedIPs[clientIP] = now + banDuration;
                    console.log(`${date} ${clientIP} : Banned for 10 Minutes due to Invalid Request : Manipulated PIN to ${pin}.`);
                    return res.status(400).json({ error: 'IP Banned Temporarily.' });
                }

                connection.query(addNoteQuery, [pin, note], (addErr, result) => {
                    connection.release(); // Release the connection back to the pool

                    if (addErr) {
                        console.error('Error Adding Note:', addErr);
                        res.status(500).json({ success: false, error: 'Failed to Add Note.' });
                    } 
                    else {
                        res.json({ success: true, noteId: result.insertId });
                    }
                });
            });
        });
    }

    else {
        bannedIPs[clientIP] = now + banDuration;
        console.log(`${date} ${clientIP} : Banned for 10 Minutes due to Invalid Request.`);
        return res.status(400).json({ error: 'IP Banned Temporarily.' });
    }
});

app.post('/remove-note', (req, res) => {
    const { noteId } = req.body;
    const removeNoteQuery = 'DELETE FROM data WHERE id = ?';

    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();
    const date = new Date();

    if (typeof noteId === 'string' && /^[0-9]+$/.test(noteId)) {
        // Use the pool to get a connection from the pool
        pool.getConnection((err, connection) => {
            if (err) {
                connection.release(); // Release the connection back to the pool
                console.error('Error Getting Connection from Pool:', err);
                return res.status(500).json({ success: false, error: 'Failed to Remove Note.' });
            }

            connection.query(removeNoteQuery, [noteId], (err, result) => {
                connection.release(); // Release the connection back to the pool

                if (err) {
                    console.error('Error Removing Note:', err);
                    return res.status(500).json({ success: false, error: 'Failed to Remove Note.' });
                } 
                else {
                    res.json({ success: true });
                }
            });
        });
    }

    else {
        bannedIPs[clientIP] = now + banDuration;
        console.log(`${date} ${clientIP} : Banned for 10 Minutes due to Invalid Request.`);
        return res.status(400).json({ error: 'IP Banned Temporarily.' });
    }
});

app.post('/remove-all-notes', (req, res) => {
    const { pin } = req.body;
    const removeNoteQuery = 'DELETE FROM data WHERE pin = ?';

    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();
    const date = new Date();

    RemoveRequest = RemoveRequest.filter(request => {
        return now - request.now <= 300000;
    });    
    
    if (typeof pin === 'string' && /^[0-9]+$/.test(pin) && pin.length >= 6 && pin.length <= 15 && !RemoveRequest.find(request => request.clientIP === clientIP)) {
        // Use the pool to get a connection from the pool
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error Removing All Notes:', err);
                return res.status(500).json({ success: false, error: 'Failed to Remove Notes.' });
            }

            connection.query(removeNoteQuery, [pin], (err, result) => {
                connection.release(); // Release the connection back to the pool

                if (err) {
                    console.error('Error Removing All Notes:', err);
                    return res.status(500).json({ success: false, error: 'Failed to Remove Notes.' });
                } 
                else {
                    RemoveRequest.push({ clientIP, now });
                    console.log(`${date} ${clientIP} : Removing All Notes Performed.`);
                    res.json({ success: true });
                }
            });
        });
    }

    else {
        bannedIPs[clientIP] = now + banDuration;
        console.log(`${date} ${clientIP} : Banned for 10 Minutes due to Invalid Request.`);
        return res.status(400).json({ error: 'IP Banned Temporarily.' });
    }
});

app.listen(port, () => {
    const date = new Date();
    console.log(`${date} Server is Running on Port ${port}`);
    cron.schedule('* * * * *', cleanupTimestampTable);
});
