const { SlashCommandBuilder } = require('discord.js')
const { EmbedBuilder } = require('discord.js');

const sta = {
	0: "-",
	1: "finished",
	2: "cancelled"
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('Вывести очередь')
		.addStringOption(option => option // Can we trust this?
			.setName('section')
			.setDescription('?')
			.setRequired(true)
			.addChoices(
				{ name: 'блог', value: 'Blogs' },
				{ name: 'лента', value: 'Sniff' },
			))
		.addIntegerOption(option => option
			.setName('page')
			.setDescription('?')
			.setRequired(true)),
	async execute(interaction, db) {
		try {
			let page = interaction.options.getInteger('page')-1
			let t = await db.all(`SELECT * FROM ${interaction.options.getString('section')} WHERE status = 0 ORDER BY incr LIMIT ${page*10}, ${page*10+10}`)
			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setFooter({ text: `Страница ${page+1}/?`, iconURL: 'https://i.imgur.com/AfFp7pu.png' })

			for (k of t) {
				embed.addFields({ name: ` = ${k.incr} = `, value: `**id**: ${k.id}\n**text**: ${k.text}\n**anon**: ${k.anon}\n**start_time**: ${k.start_time}\n**end_time**: ${k.end_time}\n**status**: ${sta[k.status] ?? k.status}`, inline: false })
			}
			interaction.reply({ embeds: [embed] })
			//interaction.reply('k')
		} catch (e) {
			console.log(e)
			interaction.reply('Error: ' + e.stack)
		}
	},
};