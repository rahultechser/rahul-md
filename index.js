const { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const config = require('./config');

// প্লাগইনগুলো জমা রাখার জন্য একটি অবজেক্ট
const plugins = new Map();

// প্লাগইন লোড করার ফাংশন
function loadPlugins() {
    const pluginFolder = path.join(__dirname, 'plugins');
    const pluginFiles = fs.readdirSync(pluginFolder).filter(file => file.endsWith('.js'));

    for (const file of pluginFiles) {
        const plugin = require(path.join(pluginFolder, file));
        plugins.set(plugin.name, plugin);
        console.log(`✅ প্লাগইন লোড হয়েছে: ${file}`);
    }
}

async function startRahulMD() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
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
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        
        if (!body.startsWith(config.prefix)) return;

        const args = body.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // প্লাগইন খুঁজে বের করা (নাম বা অ্যালিয়াস দিয়ে)
        const plugin = [...plugins.values()].find(p => p.name === commandName || (p.alias && p.alias.includes(commandName)));

        if (plugin) {
            try {
                await plugin.execute(sock, msg, args);
            } catch (error) {
                console.error(error);
                await sock.sendMessage(from, { text: "❌ এই কমান্ডটি কাজ করছে না।" });
            }
        }
    });
}

// প্লাগইন লোড করে বট স্টার্ট করা
loadPlugins();
startRahulMD();

