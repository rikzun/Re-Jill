import { client } from '../bot'
import { Message, MessageEmbed } from 'discord.js'
import { print, newEmbed } from '../utils'

client.on('message', async (message: Message) => {
    if (message.author.bot) return
    if (!message.content.startsWith(client.prefix)) return

    const messageArray = message.content.split(' ')
    const messageCommandName = messageArray[0].replace(client.prefix, '')

    messageArray.shift()
    const messageArgs = messageArray

    if (!client.commands.hasOwnProperty(messageCommandName)) return
    const command = client.commands[messageCommandName]

    if (!command.status) return
    if (message.guild == null && command.guildOnly) {
        const Embed = newEmbed()
            .setDescription('🚫 Только для сервера.')

        message.channel.send(Embed)
        return
    }
    if (message.author.id !== client.owner && command.ownerOnly) {
        const Embed = newEmbed()
            .setDescription('🚫 Только для создателя бота.')

        message.channel.send(Embed)
        return
    }

    //argument handler
    let argIndex = 0
    const transferArgs = []
    let argContent = messageArgs[argIndex]
    for (const [argName, consturtor] of Object.entries(command.args)) {

        const kwargs = argName.match(/\w+(\*|\[\])/)
        if (kwargs) {
            switch (kwargs[1]) {
                case '*':
                    let spliced = messageArgs.splice(argIndex).join(' ')
                    if (spliced == '') spliced = undefined

                    argContent = spliced
                    break
    
                case '[]':
                    transferArgs.push(messageArgs.splice(argIndex, messageArgs.length))
                    continue
            }
        }

        switch (consturtor) {
            case '':
                transferArgs.push(argContent)
                break

            case 'string':
                transferArgs.push(String(argContent))
                break

            case 'number':
                transferArgs.push(Number(argContent))
                break

            case 'GuildMember':
                if (!argContent) { transferArgs.push(argContent); break }
                const users = await message.guild.members.fetch()
                let matches = []

                if (argContent.match(/^\d+$/m) !== null) {//id
                    try {
                        const member = await message.guild.members.fetch(argContent)
                        matches.push(member)
                    } catch (error) {}
                }

                const mention = argContent.match(/^<@!?(\d+)>$/m)
                if (mention !== null) {
                    try {
                        const member = await message.guild.members.fetch(mention[1])
                        matches.push(member)
                    } catch (error) {}
                }

                const usernamePlusTag = argContent.match(/^([\s\S]*)#(\d{4})$/m)
                if (usernamePlusTag !== null) {
                    const member = users.filter(
                        m => m.user.username.toLowerCase() == usernamePlusTag[1].toLowerCase() && m.user.discriminator == usernamePlusTag[2]
                    ).array()

                    member.forEach(gm => {
                        matches.push(gm)
                    })
                }

                const nickname = users.filter(m => m.nickname && m.nickname.toLowerCase() == argContent.toLowerCase()).array()
                nickname.forEach(gm => {
                    matches.push(gm)
                })

                const username = users.filter(m => m.user.username.toLowerCase() == argContent.toLowerCase()).array()
                username.forEach(gm => {
                    matches.push(gm)
                })

                if (matches.length == 0) matches = null
                transferArgs.push(matches)
                break
        }
        argIndex++
    }
    
    await command.run(message, ...transferArgs)
})