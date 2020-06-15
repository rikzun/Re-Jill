import * as firebase from 'firebase-admin';
import {print} from '../py'

const serviceAccount = require('../../fire_account.json')
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

export const database = firebase.database().ref()

class Data {
    webhooks: {
        channel: string;
        id: string;
        token: string;
    };
    bans: string[];
    guildbans: string[];
    messages: object;
    moderators: string[];
    queue: {
        create: string;
        channel: string;
        id: string;
        token: string;
    };

    constructor(fullData: object) {
        this.webhooks = fullData['webhooks']
        this.messages = fullData['nmessages']
        this.bans = fullData['bans']
        this.queue = fullData['nqueue'] || {}
        this.guildbans = fullData['guildbans'] || []
        this.moderators = Object.values(fullData['moderators'])
    }
}

export let data: Data
(async () => {
    const fullData = await database.child('/').once('value')
    data = new Data(await fullData.val())
})();