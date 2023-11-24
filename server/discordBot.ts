require('dotenv/config');
const { Client, Events, GatewayIntentBits } = require('discord.js');

export const botClient = new Client({ intents: [GatewayIntentBits.Guilds] });

// We use 'c' for the event parameter to keep it separate from the already defined 'client'
botClient.once(Events.ClientReady, (c: { user: { tag: any } }) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

botClient.login(process.env.DISCORD_BOT_TOKEN);
// export const zugDiscordServer = botClient.guilds
//   .fetch('1123769624719265922')
//   .then(async (guild) => {
//     await guild.members.fetch();
//     return guild;
//   });
//
// const doit = async () => {
//   const b = await zugDiscordServer;
//   const a = await b.members.list();
//   console.log(a);
// };
//
// doit().then(() => {
//   throw new Error('stop');
// });
