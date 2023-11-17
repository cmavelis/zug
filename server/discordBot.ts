require('dotenv/config');
const { Client, Events, GatewayIntentBits } = require('discord.js');

export const botClient = new Client({ intents: [GatewayIntentBits.Guilds] });

// We use 'c' for the event parameter to keep it separate from the already defined 'client'
botClient.once(Events.ClientReady, (c: { user: { tag: any } }) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

botClient.login(process.env.DISCORD_BOT_TOKEN);
