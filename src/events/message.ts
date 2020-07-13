import {client} from '../bot'
import {
    Client as TextChannel, Message, GuildMember, VoiceChannel, MessageEmbed, User
} from 'discord.js'
import { print, translatePerm, arrayTypeChange } from '../py';

const rollReg = /(\d*)?d(\d+)([-+*/])?(\d+)?( _\d+)?( .+)?/i
client.on('message', async (message: Message) => {
    //mention bot
    if (message.content == '<@!608154725338185738>') {
        client.commands.help.run(message)
        return
    }
    
    if (!message.content.startsWith(client.prefix)) return;
    if (message.author.bot) return;

    if (message.content.match(rollReg)) {
        let rollargs = message.content.match(rollReg)
        rollargs.shift()
        client.commands.roll.run(message, rollargs)
        return
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
    const cmdArguments = cmd.propertes.args
    let transferArgs = []
    transferArgs.push(message)

    cmdArguments.forEach(async(arg, i, a) => {
        if (a[i - 1] == '*') i--;
        const argContent = messageArgs[i]

        //optional arguments
        let opt: boolean = false
        if (arg.endsWith('?')) {
            arg = arg.replace('?', '')
            opt = true
        }
        switch (arg) {
            default:
                transferArgs.push(argContent)
                break;

            case '*':
                messageArgs[i] = (messageArgs.splice(i).join(' '))
                break;

            case 'string[]':
                messageArgs.splice(i-1, 1)
                transferArgs.push(messageArgs)
                break;

            case 'User':
                try {
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
                        if (opt) {
                            transferArgs.push(argContent)
                            break;
                        }
                        transferArgs.push(client.users.cache.find(u => u.username.toLowerCase() == argContent.toLowerCase()))
                    }
    
                } catch (error) {
                    transferArgs.push(undefined)
                }
                break;
                
            case 'GuildMember':
                try {
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
                        if (opt) {
                            transferArgs.push(argContent)
                            break;
                        }
                        transferArgs.push(message.guild.members.cache.find(m => m.user.username.toLowerCase() == argContent.toLowerCase()))
                    }

                } catch (error) {
                    transferArgs.push(undefined)
                }
                break;

            case 'TextChannel':
                try {
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
                        if (opt) {
                            transferArgs.push(argContent)
                            break;
                        }
                        transferArgs.push(client.channels.cache.find(c => c['name'] == argContent))
                    }

                } catch (error) {
                    transferArgs.push(undefined)
                }
                break;

            case 'VoiceChannel':
                try {
                    //id
                    if (argContent.match(/\d+/)) {
                        transferArgs.push(
                            await client.channels.fetch(argContent) as VoiceChannel
                        )
                    }
                    //name
                    else {
                        if (opt) {
                            transferArgs.push(argContent)
                            break;
                        }
                        transferArgs.push(client.channels.cache.find(c => c['name'] == argContent))
                    }
    
                } catch (error) {
                    transferArgs.push(undefined)
                }
                break;
        }
    })
    cmd.run(...await transferArgs)
})