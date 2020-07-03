import * as firebase from 'firebase-admin';
import {print} from '../py'

const serviceAccount = require('../../fire_account.json')
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

export const database = firebase.database().ref()

class Data {
    bans: string[];
    guildbans: string[];
    moderators: string[];
    webhooks: {
        [webhook: string]: {
            channelID: string;
            id: string;
            token: string;
        }
    };
    messages: {
        [originalID: string]: {
            [channelID: string]: string
        }
    }
    queue: {
        [guildID: string]: {
            create: string;
            channelID: string;
            id: string;
            token: string;
        }
    }
    bumptimer: {
        [guildID: string]: {
            sdc?: string;
            smon?: string;
            channel: string;
        }
    };

    constructor(fullData: object) {
        this.webhooks = fullData['webhooks'] || {}
        this.messages = fullData['nmessages'] || {}
        this.bans = Object.values(fullData['bans'] || [])
        this.queue = fullData['nqueue'] || {}
        this.guildbans = Object.keys(fullData['guildbans'] || [])
        this.moderators = Object.keys(fullData['moderators'] || [])
        this.bumptimer = fullData['bumptimer'] || {}
    }
}

export let data: Data
(async () => {
    const fullData = await database.child('/').once('value')
    data = new Data(await fullData.val())
})();