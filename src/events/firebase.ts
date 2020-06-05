import * as firebase from 'firebase-admin';
import {print} from '../py'

const serviceAccount = require('../../fire_account.json')
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

export const database = firebase.database().ref()
export let data = {
    webhooks: {},
    bans: []
}

database.child('/webhooks').once('value').then(v => {data.webhooks = v.val()})
database.child('/bans').once('value').then(v => {data.bans = v.val()})