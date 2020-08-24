import {data, database} from './firebase'
import {client} from '../bot'
import {VoiceState, VoiceChannel} from 'discord.js'
import { get, print, arrayDelValue } from '../py';

client.on('voiceStateUpdate', async (before: VoiceState, after: VoiceState) => {
    if (!get(data.privates, after.guild.id, false)) return
    if (data.privates[after.guild.id].original !== after.channelID) return;
    if (!after.guild.me.hasPermission(['MANAGE_CHANNELS', 'MOVE_MEMBERS'])) return;

    try {
        const category = (await client.channels.fetch(data.privates[after.guild.id].original) as VoiceChannel).parent
        const channel = await after.guild.channels.create(
            after.member.user.username, {
                type: 'voice', userLimit: 1, parent: category
            })
        await channel.lockPermissions()
        await channel.updateOverwrite(after.member.id, {'MANAGE_CHANNELS': true, 'MANAGE_ROLES': true})

        data.privates[after.guild.id].createdChannels.push(channel.id)
        database.child(`/privates/${after.guild.id}/createdChannels`).update({[channel.id]: "0"})
    
        try {
            await after.setChannel(channel)
        } catch (error) {}

    } catch (error) {}
})

setInterval(() => {
    (async() => {

        //delete created channels
        for (let guild in data.privates) {

            //check main channel
            try {
                await client.channels.fetch(data.privates[guild].original) as VoiceChannel
            } catch (error) {
                switch (error['code']) {
                    case '10003':
                        delete data.privates[guild]
                        database.child(`/privates/${guild}`).remove()
                        continue

                }
            }

            if (!get(data.privates[guild], 'createdChannels', false)) continue;

            //delete channels
            data.privates[guild].createdChannels.forEach((v, i, a) => {
                (async()=> {
                    try {
                        const channel = await client.channels.fetch(v) as VoiceChannel
                        if (channel.members.array().length > 0) return;

                        arrayDelValue(data.privates[guild].createdChannels, v)
                        database.child(`/privates/${guild}/createdChannels/${v}`).remove()
                        channel.delete()
                    } catch (error) {
                        switch (error['code']) {
                            case '10003':
                                arrayDelValue(data.privates[guild].createdChannels, v)
                                database.child(`/privates/${guild}/createdChannels/${v}`).remove()
                                break;
                        }
                    }
                })()
            })
        }
    })()
}, 20000)