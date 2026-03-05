const axios = require('axios');

module.exports = {
    name: 'ai',
    alias: ['gpt', 'ask'],
    category: 'tools',
    async execute(sock, msg, args) {
        const from = msg.key.remoteJid;
        const text = args.join(" ");

        if (!text) return sock.sendMessage(from, { text: "বলো রাহুল, আমি তোমাকে কীভাবে সাহায্য করতে পারি?" });

        try {
            // সিম্পল ফ্রি AI API কল
            const res = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(text)}&lc=bn`);
            const reply = res.data.success;
            await sock.sendMessage(from, { text: `🤖 Rahul-MD AI: ${reply}` });
        } catch (e) {
            await sock.sendMessage(from, { text: "AI সার্ভারে সমস্যা হচ্ছে, পরে চেষ্টা করো।" });
        }
    }
};
