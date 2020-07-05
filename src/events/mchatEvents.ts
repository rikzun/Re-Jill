import {data, database} from './firebase'
import { get, print } from '../py';

setInterval(() => {
    (async() => {

        //Очистка очереди серверов через неделю
        if ( get(data, 'queue', false) ) {
            for (const guild in data.queue) {
                const create = Number(get(get(data.queue, guild), 'create'))
                const now = Number(Date.now())
                if ( now - create >= 604800000) {
                    delete data.queue[guild]
                    database.child(`/nqueue/${guild}`).remove()
                }
            }
        }
        
        //Отчистка сообщений при превышении количества в 100 штук
        if ( Object.keys(get(data, 'messages')).length > 100 ) {
            let count = Object.keys(data.messages).length
            while (count > 100) {
                const idmsg = Object.keys(data.messages)[0]
                delete data.messages[idmsg]
                database.child(`/nmessages/${idmsg}`).remove()
                count--
            }
        }
    })()
}, 60000)