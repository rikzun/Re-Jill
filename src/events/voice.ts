import {VoiceState} from 'discord.js'
import {client} from '../bot'
import { print } from '../py';

client.on('voiceStateUpdate', async (before: VoiceState, after: VoiceState) => {
    if (before.guild.id !== '606996193733640202') return;
    if (after.guild.id !== '606996193733640202') return;

    if (after.channelID == null) {
        after.member.roles.remove(['666374501151539243'])
        return
    }
    
    after.member.roles.add(['666374501151539243'])
})