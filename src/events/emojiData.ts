import { Guild, GuildEmoji } from 'discord.js'
import { client } from '../bot'

export let emojis: GuildEmoji[] = []

async function emoijCallback(eventType: string, firstEmoji?: GuildEmoji, secondEmoji?: GuildEmoji, guild?: Guild): Promise<void> {
    switch (eventType) {
        case 'ready': {
            for (const emoji of client.emojis.cache.values()) emojis.push(emoji)
            break
        }

        case 'emojiCreate': {
            emojis.push(firstEmoji)
            break
        }

        case 'emojiDelete': {
            const index = emojis.indexOf(firstEmoji)
            if (index >= 0) emojis.splice(index, 1)
            break
        }

        case 'emojiUpdate': {
            const index = emojis.indexOf(firstEmoji)
            if (index >= 0) emojis.splice(index, 1)
            
            emojis.push(secondEmoji)
            break
        }

        case 'guildCreate': {
            emojis.push(...guild.emojis.cache.values())
            break
        }

        case 'guildDelete': {
            for (const emoji of guild.emojis.cache.values()) emojis.splice(emojis.indexOf(emoji), 1)
            break
        }
    }
}

client.on('ready', async()=>{ emoijCallback('ready') })
client.on('emojiCreate', async(emoji: GuildEmoji)=>{ emoijCallback('emojiCreate', emoji) })
client.on('emojiDelete', async(emoji: GuildEmoji)=>{ emoijCallback('emojiDelete', emoji) })
client.on('emojiUpdate', async(oldEmoji: GuildEmoji, newEmoji: GuildEmoji)=>{ emoijCallback('emojiUpdate', oldEmoji, newEmoji) })
client.on('guildCreate', async(guild: Guild)=>{ emoijCallback('guildCreate', undefined, undefined, guild) })
client.on('guildDelete', async(guild: Guild)=>{ emoijCallback('guildDelete', undefined, undefined, guild) })