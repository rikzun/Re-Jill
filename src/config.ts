export { CLIENT_TOKEN, CLIENT_PREFIX, CLIENT_OWNER, OSU_SECRET, OSU_ID }
const CLIENT_TOKEN = process.env.CLIENT_TOKEN ?? require('../config.json').CLIENT_TOKEN
const CLIENT_PREFIX = process.env.CLIENT_PREFIX ?? require('../config.json').CLIENT_PREFIX
const CLIENT_OWNER = process.env.CLIENT_OWNER ?? require('../config.json').CLIENT_OWNER
const OSU_SECRET = process.env.OSU_SECRET ?? require('../config.json').OSU_SECRET
const OSU_ID = process.env.OSU_ID ?? require('../config.json').OSU_ID