const { SlashCommandBuilder } = require('discord.js')
const moment = require('moment')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('disable')
		.setDescription('Быстрое выключение бота'),
	async execute(interaction, db) {
		try {
			await db.run("UPDATE Status SET value = 0 WHERE key = 'active'")
			global.active = 0
			interaction.reply('Success (?)')
		} catch (e) {
			interaction.reply('Error: ' + e.stack)
		}
	},
};