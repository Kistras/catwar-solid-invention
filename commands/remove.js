const { SlashCommandBuilder } = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Удалить блог/ленту из очереди')
		.addStringOption(option => option // Can we trust this?
			.setName('section')
			.setDescription('?')
			.setRequired(true)
			.addChoices(
				{ name: 'блог', value: 'Blogs' },
				{ name: 'лента', value: 'Sniff' },
			))
		.addIntegerOption(option => option
			.setName('id')
			.setDescription('id блога')
			.setRequired(true)),
	async execute(interaction, db) {
		try {
			let sec = interaction.options.getString('section')
			let id = interaction.options.getInteger('id')
			await db.run(`DELETE FROM ${sec} WHERE incr = ${id}`)
			//db.run(`UPDATE ${interaction.options.getString('section')} SET status = 2 WHERE incr = ${interaction.options.getInteger('id')}`)
			interaction.reply('k')
			console.log(`Удален ${sec} (${id})`)
		} catch (e) {
			interaction.reply('Error: ' + e.stack)
		}
	},
};