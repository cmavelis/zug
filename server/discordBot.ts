require('dotenv/config');
import { Client, Events, GatewayIntentBits } from 'discord.js';

export const getBotClient = async () => {
  const botClient = new Client({ intents: [GatewayIntentBits.Guilds] });

  // botClient.once(Events.ClientReady, (c: { user: { tag: any } }) => {
  //   console.log(`Ready! Logged in as ${c.user.tag}`);
  // });

  await botClient.login(process.env.DISCORD_BOT_TOKEN);

  return botClient;
};

interface DiscordUserMessage {
  id: string;
  message: string;
}
export const messageDiscordUser = async ({
  id,
  message,
}: DiscordUserMessage) => {
  const botClient = await getBotClient();
  botClient.users.send(id, message).catch(console.error);
};
