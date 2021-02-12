import { Guild, GuildEmoji } from 'discord.js'
import { client } from '../bot'

export let emojis: GuildEmoji[] = []

async function emoij_callback(event_type: string, first_emoji?: GuildEmoji, second_emoji?: GuildEmoji, guild?: Guild): Promise<void> {
    switch (event_type) {
        case 'ready': {
            for (const emoji of client.emojis.cache.values()) emojis.push(emoji)
            break
        }

        case 'emojiCreate': {
            emojis.push(first_emoji)
            break
        }

        case 'emojiDelete': {
            const index = emojis.indexOf(first_emoji)
            if (index >= 0) emojis.splice(index, 1)
            break
        }

        case 'emojiUpdate': {
            const index = emojis.indexOf(first_emoji)
            if (index >= 0) emojis.splice(index, 1)
            
            emojis.push(second_emoji)
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

client.on('ready', async()=>{ emoij_callback('ready') })
client.on('emojiCreate', async(emoji: GuildEmoji)=>{ emoij_callback('emojiCreate', emoji) })
client.on('emojiDelete', async(emoji: GuildEmoji)=>{ emoij_callback('emojiDelete', emoji) })
client.on('emojiUpdate', async(oldEmoji: GuildEmoji, newEmoji: GuildEmoji)=>{ emoij_callback('emojiUpdate', oldEmoji, newEmoji) })
client.on('guildCreate', async(guild: Guild)=>{ emoij_callback('guildCreate', undefined, undefined, guild) })
client.on('guildDelete', async(guild: Guild)=>{ emoij_callback('guildDelete', undefined, undefined, guild) })