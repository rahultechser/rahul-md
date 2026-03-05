const { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const config = require('./config');

async function startRahulMD() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    // সেশন আইডি থেকে লগইন ডাটা রিকভার করা
    if (config.sessionID && config.sessionID.includes("RAHUL-MD;;;")) {
        const sessionData = config.sessionID.split("RAHUL-MD;;;")[1];
        const creds = JSON.parse(Buffer.from(sessionData, "base64").toString());
        fs.writeFileSync("./auth_info/creds.json", JSON.stringify(creds, null, 2));
        console.log("✅ সেশন আইডি লোড হয়েছে!");
    }

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: [config.botName, "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startRahulMD();
        } else if (connection === 'open') {
            console.log(`🚀 ${config.botName} অনলাইনে আছে!`);
            sock.sendMessage(sock.user.id, { text: `*Rahul-MD সফলভাবে কানেক্ট হয়েছে!* ✅\n\nওনার: ${config.ownerName}` });
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        if (body.startsWith(config.prefix)) {
            const command = body.slice(config.prefix.length).trim().toLowerCase();
            if (command === 'ping') {
                await sock.sendMessage(msg.key.remoteJid, { text: "বট কাজ করছে! 🚀" });
            }
        }
    });
}

startRahulMD();
