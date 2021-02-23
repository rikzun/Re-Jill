import { Guild, GuildEmoji } from 'discord.js'
import { client } from '../bot'

export let emojis: GuildEmoji[] = []
client.on('ready', async() => emojis.push(...client.emojis.cache.values()))
client.on('emojiCreate', async(emoji: GuildEmoji) => emojis.push(emoji))
client.on('emojiDelete', async(emoji: GuildEmoji) => emojis.delValue(emoji))
client.on('emojiUpdate', async(oldEmoji: GuildEmoji, newEmoji: GuildEmoji) => {
    emojis.delValue(emojis.find(v => v.id == oldEmoji.id))
    emojis.push(newEmoji)
})
client.on('guildCreate', async(guild: Guild) => emojis.push(...guild.emojis.cache.values()))
client.on('guildDelete', async(guild: Guild) => emojis.delValue(...guild.emojis.cache.values()))