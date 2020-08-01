import {client} from '../bot'
import {
    Client as TextChannel, Message, GuildMember, VoiceChannel, MessageEmbed, User
} from 'discord.js'
import { print, translatePerm, arrayTypeChange } from '../py';

const rollReg = /(\d*)?d(\d+)([-+*/])?(\d+)?( _\d+)?( .+)?/i
const types = {
    'string': String,
    'number': Number
}

client.on('message', async (message: Message) => {
    //mention bot
    if (message.content == '<@!608154725338185738>') {
        message.content = './help'
    }
    
    if (!message.content.startsWith(client.prefix)) return;
    if (message.author.bot) return;

    //roll
    if (message.content.match(rollReg)) {
        let rollContent = message.content.match(rollReg)
        rollContent.shift()
        message.content = `./roll ${rollContent[0] ?? ''} ${rollContent[1]} ${rollContent[2] ?? ''} ${rollContent[3] ?? ''}${(rollContent[4] ?? ' ').replace('_', '')}${rollContent[5] ?? ' '}`
    }
    const content = message.content.substring(client.prefix.length).split(' ')
    const commandName = String(content.slice(0, 1))
    let messageArgs = content.splice(1)
    
    if (!client.commands.hasOwnProperty(commandName) || !client.commands[commandName].on) return;
    const cmd = client.commands[commandName]

    //message author perm check
    if (cmd.propertes.perms.length > 0) {
        if (!message.guild) {
            cmd.propertes.guild = true
        }
        else if (!message.member.hasPermission(cmd.propertes.perms)) {
            message.channel.send(translatePerm(cmd.propertes.perms, 'Вам требуются следующие права:'))
            return;
        }
    }

    //guild check
    if (cmd.propertes.guild && !message.guild) {
        const Embed = new MessageEmbed()
            .setDescription('Guild only 🚫')
        message.channel.send(Embed)
        return;
    }

    //owner check
    if (cmd.propertes.owner && message.author.id !== client.owner) {
        const Embed = new MessageEmbed()
            .setDescription('Owner only 🚫')
        message.channel.send(Embed)
        return;
    }

    //arguments
    const cmdArgs = cmd.propertes.args
    const cmdArgsKeys = Object.keys(cmd.propertes.args)
    let transferArgs = []
    transferArgs.push(message)

    for (let argName in cmdArgs) {
        const argIndex = cmdArgsKeys.indexOf(argName)
        let optional = false

        const identifier = argName.match(/\w+(\[\]|\*|\?)/)
        if (identifier) {
            switch (identifier[1]) {
                case '*':
                    messageArgs[argIndex] = messageArgs.splice(argIndex).join(' ')
                    break;
    
                case '[]':
                    messageArgs = messageArgs.splice(argIndex, messageArgs.length)
                    transferArgs.push(messageArgs)
                    continue;
                
                case '?':
                    optional = true
                    break;
            }
        }

        const argContent = messageArgs[argIndex]
        switch (cmdArgs[argName]) {

            case '':
                transferArgs.push(argContent)
                break;

            case 'number':
            case 'string':
                if (!argContent) {
                    transferArgs.push(undefined)
                    break}

                if (typeof argContent == cmdArgs[argName]) {
                    transferArgs.push(argContent)
        
                } else {
                    transferArgs.push(types[cmdArgs[argName]](argContent))
                }
                break;

            case 'User':
                try {
                    if (!argContent) {
                        transferArgs.push(undefined)
                        break;
                    }
    
                    //@mention
                    if (argContent.match(/<@!\d+>/)) {
                        transferArgs.push(
                            await client.users.fetch(argContent.match(/<@!(\d*)>/)[1]) as User
                        )
                    }
                    //id
                    else if (argContent.match(/\d+/)) {
                        transferArgs.push(
                            await client.users.fetch(argContent) as User
                        )
                    }
                    //username
                    else {
                        const user = client.users.cache.find(u => u.username.toLowerCase() == argContent.toLowerCase()) ?? null
                        if (optional && !user) {
                            transferArgs.push(argContent)
                        }
                        transferArgs.push(user)
                    }
        
                } catch (error) {
                    transferArgs.push(undefined)
                }
                break;

            case 'GuildMember':
                try {
                    if (!argContent) {
                        transferArgs.push(undefined)
                        break;
                    }

                    //@mention
                    if (argContent.match(/<@!\d+>/)) {
                        transferArgs.push(
                            await message.guild.members.fetch(argContent.match(/<@!(\d*)>/)[1]) as GuildMember
                        )
                    }
                    //id
                    else if (argContent.match(/\d+/)) {
                        transferArgs.push(
                            await message.guild.members.fetch(argContent) as GuildMember
                        )
                    }
                    //username
                    else {
                        const member = message.guild.members.cache.find(m => m.user.username.toLowerCase() == argContent.toLowerCase()) ?? null
                        if (optional && !member) {
                            transferArgs.push(argContent)
                        }
                        transferArgs.push(member)
                    }
                } catch (error) {
                    transferArgs.push(undefined)
                }
                break;

            case 'TextChannel':
                try {
                    if (!argContent) {
                        transferArgs.push(undefined)
                        break;
                    }

                    //#mention
                    if (argContent.match(/<#\d+>/)) {
                        transferArgs.push(message.mentions.channels.get(argContent.match(/<#(\d*)>/)[1]))
                    }
                    //id
                    else if (argContent.match(/\d+/)) {
                        transferArgs.push(
                            await client.channels.fetch(argContent) as unknown as TextChannel
                        )
                    }
                    //name
                    else {
                        const channel = client.channels.cache.find(c => c['name'] == argContent) ?? null
                        if (optional && !channel) {
                            transferArgs.push(argContent)
                        }
                        transferArgs.push(channel)
                    }
    
                } catch (error) {
                    transferArgs.push(undefined)
                }
                break;
    
            case 'VoiceChannel':
                try {
                    if (!argContent) {
                        transferArgs.push(undefined)
                        break;
                    }

                    //id
                    if (argContent.match(/\d+/)) {
                        transferArgs.push(
                            await client.channels.fetch(argContent) as VoiceChannel
                        )
                    }
                    //name
                    else {
                        const channel = client.channels.cache.find(c => c['name'] == argContent) ?? null
                        if (optional && !channel) {
                            transferArgs.push(argContent)
                        }
                        transferArgs.push(channel)
                    }
        
                } catch (error) {
                    transferArgs.push(undefined)
                }
                break;
        }
    }
    cmd.run(...await transferArgs)
})