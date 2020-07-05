import { print, arrayTypeChange, get } from '../py';
import {Message, TextChannel} from 'discord.js'
import {data, database} from './firebase'
import {
    client
} from '../bot'

client.on('message', async (message: Message) => {
    if (!get(get(data.bumptimer, message.guild.id, {}), 'channel', false)) return;
    if (!['315926021457051650', '464272403766444044'].includes(message.author.id)) return;

    //sd.c
    if (get(message.embeds[0], 'description', '').includes('Нравится сервер?')) {
        const time = String(Date.now() + 14395000)
        database.child(`/bumptimer/${message.guild.id}`).update({
            sdc: time
        })
        data.bumptimer[message.guild.id].sdc = time
    }

    //discord server
    if (get(message.embeds[0], 'description', '').includes('Server bumped by')) {
        const time = String(Date.now() + 14395000)
        database.child(`/bumptimer/${message.guild.id}`).update({
            smon: time
        })
        data.bumptimer[message.guild.id].smon = time
    }
});

setInterval(() => {
    if ( !get(data, 'bumptimer', false) ) return;
    for (const guild in data.bumptimer) {
        const now = Date.now(),
            sdc = Number(get(data.bumptimer[guild], 'sdc', 'a')),
            smon = Number(get(data.bumptimer[guild], 'smon', 'a'))
            
        //sd.c
        if ((now + 600000) - sdc >= 0) {
            setTimeout(() => {
                
                (async() => {
                    try {
                        //send
                        const bumpChannel = await client.channels.fetch(data.bumptimer[guild].channel) as TextChannel
                        bumpChannel.send('Время для `s.up`')
                        //del db
                        delete data.bumptimer[guild].sdc
                        database.child(`/bumptimer/${guild}/sdc`).remove()
                    } catch (error) {
                        switch (error['code']) {
                            case '10003':
                                delete data.bumptimer[guild]
                                database.child(`/bumptimer/${guild}`).remove()
                                break;
                        }
                    }
                    
                })();
            }, (now + 600000) - sdc);
        }
        //discord server
        if ((now + 600000) - smon >= 0) {
            setTimeout(() => {
                
                (async() => {
                    try {
                        //send
                        const bumpChannel = await client.channels.fetch(data.bumptimer[guild].channel) as TextChannel
                        bumpChannel.send('Время для `!bump`')
                        //del db
                        delete data.bumptimer[guild].smon
                        database.child(`/bumptimer/${guild}/smon`).remove()
                    } catch (error) {
                        switch (error['code']) {
                            case '10003':
                                delete data.bumptimer[guild]
                                database.child(`/bumptimer/${guild}`).remove()
                                break;
                        }
                    }
                })();
            }, (now + 600000) - smon);
        }
    }
}, 600000)