export { DISCORD_TOKEN }

const DISCORD_TOKEN = process.env.DISCORD_TOKEN ?? require('../config.json').DISCORD_TOKEN