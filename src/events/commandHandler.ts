import { client } from '../bot'
import { DMChannel, Message } from 'discord.js'
import { MessageEmbed } from '../utils/classes'
import { tr } from '../utils/translate'

client.on('message', async (message: Message) => {
    if (message.author.bot) return
    if (!message.content.startsWith(client.prefix)) return

    const [messageCommandName, ...messageArgs] = message.content.substring(client.prefix.length).split(' ')

    if (!client.commands.hasOwnProperty(messageCommandName)) return
    const clientCommand = client.commands[messageCommandName]

    if (!(message.channel instanceof DMChannel) && (!clientCommand.clientPerms.empty || !clientCommand.memberPerms.empty)) {

        //client permissions
        if (!clientCommand.clientPerms.empty) {
            const channelPermissions = message.channel.permissionsFor(client.user)
            
            if (!channelPermissions.has(clientCommand.clientPerms)) {
                const Embed = new MessageEmbed()
                    .setTitle('Боту не хватает следующих прав')
                    .setDescription('```\n' + channelPermissions.missing(clientCommand.clientPerms).map(v => tr(v)).join('\n') + '```')

                return message.channel.send(Embed)
            }
        }

        //member permissions
        if (!clientCommand.memberPerms.empty) {
            const channelPermissions = message.channel.permissionsFor(message.member)
            
            if (!channelPermissions.has(clientCommand.memberPerms)) {
                const Embed = new MessageEmbed()
                    .setTitle('Вам не хватает следующих прав')
                    .setDescription('```\n' + channelPermissions.missing(clientCommand.memberPerms).map(v => tr(v)).join('\n') + '```')

                return message.channel.send(Embed)
            }
        }
    }

    if (clientCommand.ownerOnly && message.author.id !== client.owner) {
        const Embed = new MessageEmbed()
            .setDescription('🚫 Данная команда разрешена к использованию только создателю бота')
        return message.channel.send(Embed)
    }

    if (clientCommand.guildOnly && message.guild == null) {
        const Embed = new MessageEmbed()
            .setDescription('🚫 Данная команда разрешена к использованию только на сервере')
        return message.channel.send(Embed)
    }

    const transferArgs: any[] = [message]
    let messageCommandArgIndex = 0
    let messageCommandArgument = messageArgs[messageCommandArgIndex]
    for (const [clientCommandArgName, constructor] of Object.entries(clientCommand.args)) {

        //kwargs check
        if (clientCommandArgName.endsWith('*')) {
            messageCommandArgument = messageArgs.splice(messageCommandArgIndex, messageArgs.length).join(' ')
        } else if (clientCommandArgName.startsWith('...')) {
            transferArgs.push(messageArgs.splice(messageCommandArgIndex, messageArgs.length))
            continue
        }

        switch (constructor) {
            case '': {
                transferArgs.push(messageCommandArgument)
                break
            }

            case 'Number': {
                transferArgs.push(Number(messageCommandArgument))
            }

            case 'GuildMember': {
                const matches = []

                if (!messageCommandArgument) { transferArgs.push([undefined]); break }
                const members = await message.guild.members.fetch()

                //id
                if (messageCommandArgument.isNumber()) matches.push(members.get(messageCommandArgument))

                //mention
                const mention = messageCommandArgument.match(/<@!?(\d+)>/)
                if (mention !== null) matches.push(members.get(mention[1]))

                //usernameHashTag
                const usernameHashTag = messageCommandArgument.match(/(.+)\n?#(\d{4})/)
                if (usernameHashTag !== null) {
                    members.filter(member => 
                        member.user.username.toLocaleLowerCase() == usernameHashTag[1].toLocaleLowerCase()
                        &&
                        member.user.discriminator == usernameHashTag[2]
                    ).forEach(member => matches.push(member))
                }

                //nickname
                members.filter(member => 
                    member.nickname?.toLocaleLowerCase() == messageCommandArgument.toLocaleLowerCase()
                ).forEach(member => matches.push(member))

                //username
                members.filter(member => 
                    member.user.username.toLocaleLowerCase() == messageCommandArgument.toLocaleLowerCase()
                ).forEach(member => matches.push(member))

                transferArgs.push(matches)
                break
            }
        }

        messageCommandArgIndex++
    }

    await clientCommand.execute(...transferArgs)
})