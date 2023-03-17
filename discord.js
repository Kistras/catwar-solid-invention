// https://github.com/discordjs/guide/tree/main/code-samples/creating-your-bot/command-handling
// This thing is good enough so I'm yoinking it

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, WebhookClient } = require('discord.js');
const { token, webhook } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
}

const {open, OPEN_READWRITE} = require('promised.sqlite')
let db
let whitelist = {} // Пока так
//open('catwar.sql', OPEN_READWRITE).then((_) => db = _)

client.once(Events.ClientReady, async () => {
	db = await open('catwar.sql', OPEN_READWRITE)
	await client.application.fetch()
	whitelist[client.application.owner.id] = true
	console.log(whitelist)
	console.log('Ready!');
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	if (!whitelist[interaction.user.id]) {
		await interaction.reply({ content: 'Недостаточно прав', ephemeral: true })
		return
	}

	try {
		await command.execute(interaction, db);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.login(token);

try {
	const wb = new WebhookClient({url: webhook})
	const _log = console.log
	console.log = (...data) => {
		s = ""
		for (d of data) s += d.toString()
		_log(...data)
		wb.send(s)
	}
} catch (e) {
	console.log('Вебхук не был привязан. Отправка логов в дс неактивна.')
}