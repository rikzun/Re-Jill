import {
    Message, MessageEmbed
} from 'discord.js'
import {client} from '../bot'
import {wordTransfer} from '../py'

module.exports = {
    name: 'module',
    execute(message: Message, args: string[]) {
        if (message.author.id = client.owner) {
            switch (args[1]) {

                case undefined:
                    let loaded: string,
                        unloaded: string

                    //Создание строк из ключей
                    client.commands.forEach((val, key, map) => {
                        if (!loaded) {
                            loaded = `\`${key}\` `
                            return
                        }
                        loaded += `\`${key}\` `
                    })
                    client.unloadedCommands.forEach((val, key, map) => {
                        if (!unloaded) {
                            unloaded = `\`${key}\` `
                            return
                        }
                        unloaded += `\`${key}\` `
                    })
                    client.events.forEach((val, key, map) => {
                        if (!loaded) {
                            loaded = `\`${val}\` `
                            return
                        }
                        loaded += `\`${val}\` `
                    })
                    client.unloadedEvents.forEach((val, key, map) => {
                        if (!unloaded) {
                            unloaded = `\`${val}\` `
                            return
                        }
                        unloaded += `\`${val}\` `
                    })
                    loaded = wordTransfer(loaded)
                    unloaded = wordTransfer(unloaded)

                    const embed = new MessageEmbed()
                        .addFields(
                            {name: 'Загружены',
                            value: loaded, 
                            inline: true},
                            {name: 'Выгружены', 
                            value: unloaded, 
                            inline: true})

                    message.channel.send(embed)
                    break;
                
                case '1':
                case 'load':

                    //Если модуль уже загружен
                    if (client.commands.get(args[2]) || client.events.includes(args[2])) {
                        message.channel.send(`Модуль \`${args[2]}\` уже загружен.`)
                        break;
                    }

                    //Для обработки ивентов
                    if (args[2].startsWith('.')) {

                        //Перенос из выгруженных ивентов в загруженные
                        client.unloadedEvents.splice(client.unloadedEvents.findIndex(key => key == args[2]), 1)
                        client.events.push(args[2])

                        message.channel.send(`Модуль \`${args[2]}\` загружен.`)
                        args[2] = args[2].replace('.', '')

                        //Загрузка ивента
                        require(`../events/${args[2]}`)
                        break;
                    }

                    //Перенос из выгруженных команд в загруженные
                    client.commands.set(args[2], client.unloadedCommands.get(args[2]))
                    client.unloadedCommands.delete(args[2])
                    message.channel.send(`Модуль \`${args[2]}\` загружен.`)
                    break;

                case '0':
                case 'unload':

                    //Если модуль уже выгружен
                    if (client.unloadedCommands.get(args[2]) || client.unloadedEvents.includes(args[2])) {
                        message.channel.send(`Модуль \`${args[2]}\` уже выгружен.`)
                        break;
                    }

                    //Для обработки ивентов
                    if (args[2].startsWith('.')) {

                        //Перенос из загруженных ивентов в выгруженные
                        client.events.splice(client.events.findIndex(key => key == args[2]), 1)
                        client.unloadedEvents.push(args[2])

                        message.channel.send(`Модуль \`${args[2]}\` выгружен.`)
                        args[2] = args[2].replace('.', '')

                        //Удаление кеша ивента
                        delete require.cache[require.resolve(`../events/${args[2]}`)]
                        break;
                    }

                    //Перенос из загруженных команд в выгруженные
                    client.unloadedCommands.set(args[2], client.commands.get(args[2]))
                    client.commands.delete(args[2])
                    message.channel.send(`Модуль \`${args[2]}\` выгружен.`)
                    break;

                case '2':
                case 'reload':

                    //Если модуль не загружен
                    if (!(client.commands.get(args[2]) || client.events.includes(args[2]))) {
                        message.channel.send(`Модуль \`${args[2]}\` не загружен.`)
                        break;
                    }
                    
                    //Обработка ивентов
                    if (args[2].startsWith('.')) {
                        message.channel.send(`Модуль \`${args[2]}\` перезагружен.`)
                        args[2] = args[2].replace('.', '')

                        //Удаление кеша и загрузка ивента
                        delete require.cache[require.resolve(`../events/${args[2]}`)]
                        require(`../events/${args[2]}`)
                        break;
                    }

                    //Удаляем кеш модуля и обновляем значение в commands
                    delete require.cache[require.resolve(`./${args[2]}`)]
                    client.commands.set(args[2], require(`./${args[2]}`))
                    message.channel.send(`Модуль \`${args[2]}\` перезагружен.`)
                    break;
            }
        }
    }
}
