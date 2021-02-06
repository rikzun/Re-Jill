import { client } from '../bot'
import { DMChannel, Message } from 'discord.js'
import { MessageEmbed } from '../utils/classes'
import { tr } from '../utils/translate'
import { MemberMention, MemberUsernameHash } from '../utils/regex'

client.on('message', async (message: Message) => {
    if (message.author.bot) return
    if (!message.content.startsWith(client.prefix)) return

    const [messageCommandName, ...messageArgs] = message.content.substring(client.prefix.length).split(' ')

    const clientCommand = client.commands.find(cmd => cmd.aliases.includes(messageCommandName))
    if (!clientCommand) return

    if (!clientCommand.parameters.empty) {
        let rt: boolean | undefined
        const aliases = []

        clientCommand.parameters.forEach(v => aliases.push(...v.aliases))
        for (const parameter of messageArgs.filter(v => aliases.includes(v))) {
            messageArgs.splice(messageArgs.indexOf(parameter), 1)
            rt = clientCommand.parameters.find(v => v.aliases.includes(parameter)).execute(message)
        }
        if (rt) return
    }

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
    let messageCommandArgument
    for (const clientArgument of clientCommand.args) {
        messageCommandArgument = messageArgs[messageCommandArgIndex]

        switch(clientArgument.features) {
            case 'array': {
                messageCommandArgument = messageArgs.splice(messageCommandArgIndex, messageArgs.length)
                break
            }

            case 'join': {
                messageCommandArgument = messageArgs.splice(messageCommandArgIndex, messageArgs.length).join(' ')
                break
            }
        }

        switch (clientArgument.type) {
            case 'string': {
                if (Array.isArray(messageCommandArgument)) {
                    transferArgs.push(messageCommandArgument.map(v => typeof v == 'string' ? v : String(v)))
                    break
                }
                transferArgs.push(typeof messageCommandArgument == 'string' ? messageCommandArgument : String(messageCommandArgument))
                break
            }

            case 'number': {
                if (Array.isArray(messageCommandArgument)) {
                    transferArgs.push(messageCommandArgument.map(v => typeof v == 'number' ? v : Number(v)))
                    break
                }
                transferArgs.push(typeof messageCommandArgument == 'number' ? messageCommandArgument : Number(messageCommandArgument))
                break
            }

            case 'GuildMember[]': {
                if (!messageCommandArgument) { transferArgs.push([undefined]); break }

                const matches = []
                const members = await message.guild.members.fetch()

                //id
                if (messageCommandArgument.isNumber) matches.push(members.get(messageCommandArgument))

                //mention
                const mention = messageCommandArgument.match(MemberMention)
                if (mention !== null) matches.push(members.get(mention[1]))

                //usernameHashTag
                const usernameHashTag = messageCommandArgument.match(MemberUsernameHash)
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
    clientCommand.clear()
})