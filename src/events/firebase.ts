import * as firebase from 'firebase-admin';
import {get} from '../py'
import {print} from '../py'

firebase.initializeApp({
    credential: firebase.credential.cert({
        projectId: "bot-jill",
        clientEmail: "firebase-adminsdk-ossz9@bot-jill.iam.gserviceaccount.com",
        privateKey: process.env.FIREBASE_TOKEN.replace(/\\n/g, '\n')
    }),
    databaseURL: `https://bot-jill.firebaseio.com`
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
    }
    privates: {
        [guildID: string]: {
            original: string;
            createdChannels?: string[]
        }
    };

    constructor(fullData: object) {
        this.webhooks = fullData['webhooks'] || {}
        this.messages = fullData['nmessages'] || {}
        this.privates = fullData['privates'] || {}
        for (let guild in this.privates) {
            if (!get(this.privates[guild], 'createdChannels', false)){
                this.privates[guild].createdChannels = []
                continue
            }

            this.privates[guild].createdChannels = Object.keys(this.privates[guild].createdChannels)
        }
        this.bans = Object.keys(fullData['bans'] || [])
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