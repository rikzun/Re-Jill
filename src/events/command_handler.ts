import { DMChannel, Message } from 'discord.js'
import { MessageEmbed, Argument, Command, Command_Args, Command_Pars } from '../utils/classes'
import { member_mention, member_username_hash } from '../utils/regex'
import { tr } from '../utils/translate'
import { client } from '../bot'
import { wait } from '../utils/functions'

class CommandHandler {
    message: Message
    command: Command

    message_args: string[]
    used_pars: string[]

    transfer_args: Command_Args
    transfer_pars: Command_Pars

    async receive(message: Message) {
        if (message.author.bot) return
        if (!message.content.startsWith(client.prefix)) return

        this.message_args = message.content.substring(client.prefix.length).split(' ')
        this.command = client.commands.find(v => v.names.includes(this.message_args[0].toLocaleLowerCase()))

        if (!this.command) return
        this.message_args.shift()
        this.message = message
        this.used_pars = this.command.pars.filter(v => this.message_args.find(vv => v.names.includes(vv))).map(v => v.names).flat()
        this.transfer_args = {message: message}
        this.transfer_pars = {}

        //per handler
        for (let i = 0; i < this.command.pars.length; i++) {
            const par = this.command.pars[i]
            let par_index = this.message_args.findIndex(v => par.names.includes(v))

            if (par_index == -1 && !par.args.find(v => v.value !== undefined)) continue
            this.transfer_pars[par.names[0]] = {}

            for (let ii = 0; ii < par.args.length; ii++) {
                const par_arg = par.args[ii]
                let value = this.message_args[par_index + ii + 1]
                
                if (!par_arg.value && par_index == -1) continue
                if (this.used_pars.includes(value) || par_index == -1) value = undefined
                if (par_index >=0 && par.args.find(v => v.value !== undefined) && !value) par_index = Infinity

                try {
                    this.transfer_pars[par.names[0]][par_arg.name] = await this.arg_handler(par_arg, value, par_index + ii + 1)
                } catch(error) {
                    return
                }
            }
        }

        for (const [par, par_args] of Object.entries(this.transfer_pars)) {
            switch (par) {
                case '--help': {
                    return this.command.send_help(this.message)
                }
                case '--delete': {
                    if (this.message.channel instanceof DMChannel) break
                    if (!this.message.channel.permissionsFor(message.client.user).has('MANAGE_MESSAGES')) break
                    await wait(100)
                    await message.delete()
                    break
                }
            }
        }

        if (!await this.check_requirements()) return

        //arg handler
        for (let i = 0; i < this.command.args.length; i++) {
            const arg = this.command.args[i]
            let value = this.message_args[i]

            if (this.used_pars.includes(value)) value = undefined

            try {
                this.transfer_args[arg.name] = await this.arg_handler(arg, value, i)
            } catch(error) {
                return
            }
        }

        this.command.execute(this.transfer_args, this.transfer_pars)
    }

    async arg_handler(argument: Argument, value: string, index: number) {
        if (!value && argument.value !== undefined && isFinite(index)) return argument.value
        if (!value && argument.required) {
            const Embed = new MessageEmbed()
                .setDescription(`🚫 Вы пропустили обязательный аргумент \`${argument.name}\``)
            this.message.channel.send(Embed)
            
            throw new Error()
        }
        if (argument.values_array && !argument.values_array.includes(value)) {
            const Embed = new MessageEmbed()
                .setDescription(`🚫 Аргументу \`${argument.name}\` передано неверное значение`)
            this.message.channel.send(Embed)
            
            throw new Error()
        }

        if (argument.features) {
            let end_index = Math.min(...this.used_pars.map(v => this.message_args.indexOf(v)).filter(v => index <= v))
            if (!isFinite(end_index)) end_index = this.message_args.length

            const message_slice = this.message_args.slice(index, end_index)
            switch (argument.features) {
                case 'array': {
                    return message_slice
                }

                case 'join': {
                    value = message_slice.join(' ')
                    break
                }
            }
        }

        switch (argument.type) {
            default: return value
            case 'Number': return Number(value)
            case 'GuildMembers': {
                if (!value) return [undefined]

                const matches = []
                const members = (await this.message.guild.members.fetch()).array()

                //<@!id>
                const mention = value.match(member_mention)
                if (mention) matches.push(...members.filter(v => v.id == mention[1]))

                //name#tag
                const username_hash = value.match(member_username_hash)
                if (username_hash) matches.push(...members.filter(v => 
                    v.user.username.toLocaleLowerCase() == username_hash[1].toLocaleLowerCase()
                    &&
                    v.user.discriminator == username_hash[2]
                ))

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

    async check_requirements() {
        const client_perms = this.command.client_perms
        const member_perms = this.command.member_perms
        if (!(this.message.channel instanceof DMChannel) && (!client_perms.empty || !member_perms.empty)) {

            if (!client_perms.empty) {
                const channel_perms = this.message.channel.permissionsFor(client.user)

                if (!channel_perms.has(client_perms)) {
                    const Embed = new MessageEmbed()
                        .setTitle('Боту не хватает следующих прав')
                        .setDescription('```\n' + channel_perms.missing(client_perms).map(v => tr(v)).join('\n') + '```')

                    this.message.channel.send(Embed)
                    return false
                }
            }

            if (!member_perms.empty) {
                const channel_perms = this.message.channel.permissionsFor(this.message.member)

                if (!channel_perms.has(member_perms)) {
                    const Embed = new MessageEmbed()
                        .setTitle('Вам не хватает следующих прав')
                        .setDescription('```\n' + channel_perms.missing(member_perms).map(v => tr(v)).join('\n') + '```')

                    this.message.channel.send(Embed)
                    return false
                }
            }
        }

        if (this.command.owner_only && this.message.author.id !== client.owner) {
            const Embed = new MessageEmbed()
                .setDescription('🚫 Данная команда доступна только создателю бота')
            this.message.channel.send(Embed)
            return false
        }

        if (this.command.guild_only && this.message.guild == null) {
            const Embed = new MessageEmbed()
                .setDescription('🚫 Данная команда доступна только на сервере')
            this.message.channel.send(Embed)
            return false
        }

        return true
    }
}
const handler = new CommandHandler()
client.on('message', (message: Message) => handler.receive(message))