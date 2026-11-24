import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';

// Shared across sends; holds the in-flight login so concurrent sends reuse it.
let botClientPromise: Promise<Client> | null = null;

export const getBotClient = async () => {
  if (!botClientPromise) {
    const botClient = new Client({ intents: [GatewayIntentBits.Guilds] });

    // botClient.once(Events.ClientReady, (c: { user: { tag: any } }) => {
    //   console.log(`Ready! Logged in as ${c.user.tag}`);
    // });

    botClientPromise = botClient.login(process.env.DISCORD_BOT_TOKEN).then(
      () => botClient,
      (error) => {
        // login() cleans up after itself; clear the cache so a later send retries
        botClientPromise = null;
        throw error;
      },
    );
  }

  return botClientPromise;
};

interface DiscordUserMessage {
  id: string;
  message: string;
}
export const messageDiscordUser = async ({
  id,
  message,
}: DiscordUserMessage) => {
  if (!id) {
    console.debug('Discord message not sent: no user ID provided');
    return;
  }
  
  try {
    const botClient = await getBotClient();
    await botClient.users.send(id, message);
  } catch (error) {
    console.error(`Failed to send Discord message to user ${id}:`, error);
  }
};
