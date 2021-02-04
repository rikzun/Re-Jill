export { ClientOptions, ClientCommand, RawCommand, MessageEmbed, GuildMemberRT }
import { PermissionString, MessageEmbed as OldMessageEmbed, ClientOptions as OldClientOptions, GuildMember } from 'discord.js'

type Constructors =
| ''
| 'Number'
| 'GuildMemberRT'

interface Argument {
    [arg: string]: Constructors
}

interface ClientOptions extends OldClientOptions {
    token: string
}

class ClientCommand {
    execute: Function
    args?: Argument

    clientPerms?: PermissionString[]
    memberPerms?: PermissionString[]

    ownerOnly?: boolean
    guildOnly?: boolean
    
    constructor(rawcmd: RawCommand) {
        this.execute = rawcmd.execute
        this.args = rawcmd.args ?? {}

        this.clientPerms = rawcmd.clientPerms ?? []
        this.memberPerms = rawcmd.memberPerms ?? []

        this.ownerOnly = rawcmd.ownerOnly ?? false
        this.guildOnly = rawcmd.guildOnly ?? false
    }
}

class RawCommand extends ClientCommand {
    aliases: string[]
}

class MessageEmbed extends OldMessageEmbed {
    constructor() {
        super()
        this.color = 3092790
    }
}

class GuildMemberRT {
    notFound: boolean
    missingArg: boolean
    matches: GuildMember[]

    constructor() {
        this.notFound = false
        this.missingArg = false
        this.matches = []
    }
}