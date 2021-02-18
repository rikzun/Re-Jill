import { DMChannel, Message } from 'discord.js'
import { MessageEmbed, Client_Argument } from '../utils/classes'
import { member_mention, member_username_hash } from '../utils/regex'
import { tr } from '../utils/translate'
import { client } from '../bot'

client.on('message', async (message: Message) => await message_handler(message))

async function message_handler(message: Message): Promise<unknown> {
    if (message.author.bot) return
    if (!message.content.startsWith(client.prefix)) return

    const [message_cmd_name, ...message_args] = message.content.substring(client.prefix.length).split(' ')
    const client_cmd = client.commands.find(v => v.names.includes(message_cmd_name.toLocaleLowerCase()))

    if (!client_cmd) return
    const transfer_args = {}
    const transfer_pars = {}
    const pars_names = []
    let args_end = false
    let arg_message = false
    let pars_indices = []

    //check perms
    const client_perms = client_cmd.client_perms
    const member_perms = client_cmd.member_perms
    if (!(message.channel instanceof DMChannel) && (!client_perms.empty || !member_perms.empty)) {

        if (!client_perms.empty) {
            const channel_permissions = message.channel.permissionsFor(client.user)

            if (!channel_permissions.has(client_perms)) {
                const Embed = new MessageEmbed()
                    .setTitle('Боту не хватает следующих прав')
                    .setDescription('```\n' + channel_permissions.missing(client_perms).map(v => tr(v)).join('\n') + '```')

                return message.channel.send(Embed)
            }
        }

        if (!member_perms.empty) {
            const channel_permissions = message.channel.permissionsFor(message.member)

            if (!channel_permissions.has(member_perms)) {
                const Embed = new MessageEmbed()
                    .setTitle('Вам не хватает следующих прав')
                    .setDescription('```\n' + channel_permissions.missing(member_perms).map(v => tr(v)).join('\n') + '```')

                return message.channel.send(Embed)
            }
        }
    }

    if (client_cmd.owner_only && message.author.id !== client.owner) {
        const Embed = new MessageEmbed()
            .setDescription('🚫 Данная команда доступна только создателю бота')
        return message.channel.send(Embed)
    }

    if (client_cmd.guild_only && message.guild == null) {
        const Embed = new MessageEmbed()
            .setDescription('🚫 Данная команда доступна только на сервере')
        return message.channel.send(Embed)
    }

    //collecting pars names
    for (const par of client_cmd.pars) {
        pars_names.push(...par.names)

        const index = message_args.findIndex(v => par.names.includes(v))
        if (index < 0) continue
        pars_indices.push(index)
    }

    //arg handler
    for (let i = 0; i < client_cmd.args.length; i++) {
        let ii = i
        if (arg_message) ii = ii - 1

        const client_cmd_arg = client_cmd.args[i]
        const value = message_args[ii]

        if (client_cmd_arg.type == 'Message') arg_message = true
        if (pars_names.includes(value) && client_cmd_arg.type !== 'Message') args_end = true
        if (args_end) {
            transfer_args[client_cmd_arg.name] = undefined
            continue
        }

        try {
            transfer_args[client_cmd_arg.name] = await transfer_handler(message, client_cmd_arg, value, ii)
        } catch(error) {
            return
        }
    }

    //per handler
    for (let i = 0; i < client_cmd.pars.length; i++) {
        const client_cmd_par = client_cmd.pars[i]
        const par_index = message_args.findIndex(v => client_cmd_par.names.includes(v))

        if (par_index < 0) continue
        transfer_pars[client_cmd_par.names[0]] = {}

        for (let ii = 0; ii < client_cmd_par.args.length; ii++) {
            const client_cmd_par_arg = client_cmd_par.args[ii]
            let value = message_args[par_index + ii + 1]

            if (pars_names.includes(value)) value = undefined
            
            try {
                transfer_pars[client_cmd_par.names[0]][client_cmd_par_arg.name] = await transfer_handler(message, client_cmd_par_arg, value, par_index + ii + 1)
            } catch(error) {
                return
            }
        }
    }

    //constructor
    async function transfer_handler(message: Message, client_arg: Client_Argument, value: string, index: number): Promise<unknown> {
        if (client_arg.required && !value) {
            const Embed = new MessageEmbed()
                .setDescription(`🚫 Вы пропустили обязательный аргумент \`${client_arg.name}\``)
            message.channel.send(Embed)
            
            throw new Error()
        }

        if (client_arg.features) {
            let end_index = Math.min(...pars_indices.filter(v => index <= v))
            if (!isFinite(end_index)) end_index = message_args.length

            const message_slice = message_args.slice(index, end_index)

            switch (client_arg.features) {
                case 'join': {
                    value = message_slice.join(' ')
                    break
                }

                case 'array': {
                    return message_slice
                }
            }
        }

        switch (client_arg.type) {
            default: return value
            case 'Message': return message
            case 'Number': return Number(value)
            case 'GuildMembers': {
                if (!value) return [undefined]

                const matches = []
                const members = (await message.guild.members.fetch()).array()

                //mention
                const mention = value.match(member_mention)
                if (mention) {
                    matches.push(...members.filter(v => 
                        v.id == mention[1]
                    ))
                }

                //username_hash_tag
                const username_hash = value.match(member_username_hash)
                if (username_hash) {
                    matches.push(...members.filter(v => 
                        v.user.username.toLocaleLowerCase() == username_hash[1].toLocaleLowerCase()
                        &&
                        v.user.discriminator == username_hash[2]
                    ))
                }

                //other
                matches.push(...members.filter(v => 
                    v.nickname?.toLocaleLowerCase() == value.toLocaleLowerCase() ||
                    v.user.username.toLocaleLowerCase() == value.toLocaleLowerCase() ||
                    v.id == value
                ))

                return matches
            }

            case 'Guilds': {
                if (!value) return [undefined]
                return client.guilds.cache.array().filter(v => v.name == value || v.id == value)
            }
        }
    }
    
    await client_cmd.execute(transfer_args, transfer_pars)
}