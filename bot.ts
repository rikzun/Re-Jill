import {config} from 'dotenv'
import {data} from './events/firebase'
import {print} from './py'
import * as fs from 'fs' 
import {
    Client as BasicClient
} from 'discord.js'

//Определяем тип команды, на всякий случай
interface commandType {
	name: string;
	execute: Function;
}

//Наследуем класс добавляя ебучий commands
class Client extends BasicClient {
    public commands: Map<string, commandType>
    public unloadedCommands: Map<string, commandType>
    public events: string[]
    public unloadedEvents: string[]
    public owner: string
}

config();
const token = process.env.DISCORD_TOKEN
export const prefix = process.env.PREFIX
export const client: Client = new Client();
client.commands = new Map()
client.unloadedCommands = new Map()
client.events = new Array()
client.unloadedEvents = new Array()
client.owner = '532935768918982656'


//Обработчик команд
const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('.ts'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`)
    client.commands.set(command.name, command)
}

//Обработчик ивентов
const eventFiles = fs.readdirSync(__dirname + '/events').filter(file => file.endsWith('.ts'));
for (const file of eventFiles) {
    require(`./events/${file}`)

    client.events.push('.' + file.replace('.ts', ''))
}

client.on('ready', () =>{
    console.log('Jill готова к работе!')
})

client.login(token)