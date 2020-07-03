import {
    Message, MessageEmbed
} from 'discord.js'
import {client} from '../bot'
import {hyphenation, print} from '../py'

module.exports = {
    'module': async (message: Message, args: string[]) => {
        if (message.author.id !== client.owner) return;
        let commands = {
            on: [],
            off: []
        },
            files = {
                on: [],
                off: []
        }

        for (let item in client.commands) {
            if (client.commands[item].on) {
                commands.on.push(item)
                files.on.push(client.commands[item].file.name)
            } else {
                commands.off.push(item)
                files.off.push(client.commands[item].file.name)
            }
        }

        const embed = new MessageEmbed()
            .addFields(
                {name: 'Loaded cmd',
                value: '```css\n' + hyphenation(commands.on, 30) + '```'
                },
                {name: 'Unloaded cmd', 
                value: '```css\n' + hyphenation(commands.off, 30) + '```'
                },
                {name: 'Loaded files',
                value: '```css\n' + hyphenation(Array.from(new Set(files.on)), 30) + '```'
                },
                {name: 'Unloaded files', 
                value: '```css\n' + hyphenation(Array.from(new Set(files.off)), 30) + '```'
                }
            )
        message.channel.send(embed)
    },
    'load': async (message: Message, args: string[]) => {

        //file handler
        if (args[1].includes('.ts')) {
            const usedFile = Object.keys(client.commands).filter((k) => client.commands[k].file.name == args[1] && !client.commands[k].on)

            if (!usedFile) {
                message.channel.send('Файл `' + args[1] + '` не найден.')
                return
            };

            usedFile.forEach((v, i, a) => {
                let command
                try {
                    command = require(`./${client.commands[v].file.name}`)[v]
                } catch (error) {
                    command = false
                }
                client.commands[v].on = true
                client.commands[v].file.run = command
            })

            message.channel.send('Файл `' + args[1] + '` загружен.')
            return
        }

        //cmd only
        let command
        try {
            command = require(`./${client.commands[args[1]].file.name}`)[args[1]]
        } catch (error) {
            command = false
        }

        if (client.commands[args[1]].on) {
            message.channel.send('Модуль `' + args[1] + '` уже загружен.')
            return
        }
        if (!command) {
            message.channel.send('Модуль `' + args[1] + '` не найден.')
            return
        }

        client.commands[args[1]].file.run = command
        client.commands[args[1]].on = true
        message.channel.send('Модуль `' + args[1] + '` загружен.')
    },
    'unload': async (message: Message, args: string[]) => {

        //file handler
        if (args[1].includes('.ts')) {
            const usedFile = Object.keys(client.commands).filter((k) => client.commands[k].file.name == args[1] && client.commands[k].on)

            if (!usedFile) {
                message.channel.send('Файл `' + args[1] + '` не найден.')
                return
            };

            usedFile.forEach((v, i, a) => client.commands[v].on = false)

            delete require.cache[require.resolve(`./${client.commands[usedFile[0]].file.name}`)]
            message.channel.send('Файл `' + args[1] + '` выгружен.')
            return
        }

        //cmd only
        if (!client.commands[args[1]].on) {
            message.channel.send('Модуль `' + args[1] + '` уже выгружен.')
            return
        }
        if (!client.commands[args[1]]) {
            message.channel.send('Модуль `' + args[1] + '` не найден.')
            return
        }

        client.commands[args[1]].on = false
        delete require.cache[require.resolve(`./${client.commands[args[1]].file.name}`)]
        message.channel.send('Модуль `' + args[1] + '` выгружен.')
    },
    'reload': async (message: Message, args: string[]) => {

        //file handler
        if (args[1].includes('.ts')) {
            const usedFile = Object.keys(client.commands).filter((k) => client.commands[k].file.name == args[1] && client.commands[k].on)

            if (!usedFile) {
                message.channel.send('Файл `' + args[1] + '` не найден.')
                return
            };

            usedFile.forEach((v, i, a) => {
                delete require.cache[require.resolve(`./${client.commands[v].file.name}`)]
                client.commands[v].file.run = require(`./${client.commands[v].file.name}`)[v]
            })

            message.channel.send('Файл `' + args[1] + '` перезагружен.')
            return
        }

        //cmd only
        if (!client.commands[args[1]].on) {
            message.channel.send('Модуль `' + args[1] + '` уже выгружен.')
            return
        }

        if (!client.commands[args[1]]) {
            message.channel.send('Модуль `' + args[1] + '` не найден.')
            return
        }

        //Удаляем кеш модуля и обновляем значение в commands
        delete require.cache[require.resolve(`./${client.commands[args[1]].file.name}`)]
        client.commands[args[1]].file.run = require(`./${client.commands[args[1]].file.name}`)[args[1]]
        message.channel.send('Модуль `' + args[1] + '` перезагружен.')
    }
}
