import * as firebase from 'firebase-admin';

const serviceAccount = require('../../fire_account.json')
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const database = firebase.database().ref()
export let data:object

database.child('/').once('value').then(v => {data = v.val()})



