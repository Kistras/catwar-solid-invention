const { SlashCommandBuilder } = require('discord.js')
const moment = require('moment')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Добавить блог/ленту в очередь')
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
			.setDescription('id')
			.setRequired(true))
		.addStringOption(option => option
			.setName('text')
			.setDescription('Содержимое комментария')
			.setRequired(true))
		.addStringOption(option => option
			.setName('start_time')
			.setDescription('Должно соответствовать формату YYYY-MM-DD HH-mm-ss')
			.setRequired(true))
		.addStringOption(option => option
			.setName('end_time')
			.setDescription('Должно соответствовать формату YYYY-MM-DD HH-mm-ss')
			.setRequired(true))
		.addStringOption(option => option
			.setName('anon')
			.setDescription('Псевдоним (если разрешено)')
			.setRequired(false)),
	async execute(interaction, db) {
		try {
			//console.log(interaction.options.getString('start_time').split('-').length)
			if (interaction.options.getString('start_time').split('-').length != 5) {
				interaction.reply('Неверный формат start_time')
				return
			}
			if (interaction.options.getString('end_time').split('-').length != 5) {
				interaction.reply('Неверный формат end_time')
				return
			}
			let sec = interaction.options.getString('section')
			let id = interaction.options.getInteger('id')
			let text = interaction.options.getString('text')
			let anon = interaction.options.getString('anon') ?? ""
			let start = interaction.options.getString('start_time')
			let end = interaction.options.getString('end_time')

			await db.run(`INSERT INTO ${sec} (id, text, anon, start_time, end_time, status) VALUES (?,?,?,?,?,0)`, 
				[id, text, anon, 
				// Escaping any errors that might come
				moment(start, 'YYYY-MM-DD HH-mm-ss').format("YYYY-MM-DD HH-mm-ss"), 
				moment(end, 'YYYY-MM-DD HH-mm-ss').format("YYYY-MM-DD HH-mm-ss")])
			console.log(`Добавлен ${sec}:\n**id**: ${id}\n**text**: ${text}\n**anon**: ${anon}\n**start**: ${start}\n**end**: ${end}`)
			interaction.reply('Success (?)')
		} catch (e) {
			interaction.reply('Error: ' + e.stack)
		}
	},
};