const { SlashCommandBuilder } = require('discord.js')
const moment = require('moment')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('enable')
		.setDescription('Быстрое включение бота'),
	async execute(interaction, db) {
		try {
			await db.run("UPDATE Status SET value = 1 WHERE key = 'active'")
			global.active = 1
			interaction.reply('Success (?)')
			console.log('Включение бота')
		} catch (e) {
			interaction.reply('Error: ' + e.stack)
		}
	},
};