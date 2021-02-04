export { tr }

const trDictionary = {
    'CREATE_INSTANT_INVITE': 'Создание приглашения',
    'KICK_MEMBERS': 'Выгонять участников',
    'BAN_MEMBERS': 'Банить участников',
    'ADMINISTRATOR': 'Администратор',
    'MANAGE_CHANNELS': 'Управлять каналами',
    'MANAGE_GUILD': 'Управлять сервером',
    'ADD_REACTIONS': 'Добавлять реакции',
    'VIEW_AUDIT_LOG': 'Просматривать журнал аудита',
    'PRIORITY_SPEAKER': 'Приоритетный режим',
    'STREAM': 'Видео',
    'VIEW_CHANNEL': 'Читать текстовые каналы и видеть голосовые каналы',
    'SEND_MESSAGES': 'Отправлять сообщения',
    'SEND_TTS_MESSAGES': 'Отправлять TTS сообщения',
    'MANAGE_MESSAGES': 'Управлять сообщениями',
    'EMBED_LINKS': 'Встраивать ссылки',
    'ATTACH_FILES': 'Прикреплять файлы',
    'READ_MESSAGE_HISTORY': 'Читать историю сообщений',
    'MENTION_EVERYONE': 'Упоминание @everyone, @here и всех ролей',
    'USE_EXTERNAL_EMOJIS': 'Использовать внешние эмодзи',
    'VIEW_GUILD_INSIGHTS': 'Просмотр аналитики сервера',
    'CONNECT': 'Подключаться',
    'SPEAK': 'Говорить',
    'MUTE_MEMBERS': 'Отключать участникам микрофон',
    'DEAFEN_MEMBERS': 'Отключать участникам звук',
    'MOVE_MEMBERS': 'Перемещать участников',
    'USE_VAD': 'Приоритетный режим',
    'CHANGE_NICKNAME': 'Изменять никнейм',
    'MANAGE_NICKNAMES': 'Управлять никнеймами',
    'MANAGE_ROLES': 'Управлять ролями',
    'MANAGE_WEBHOOKS': 'Управлять вебхуками (webhooks)',
    'MANAGE_EMOJIS': 'Управлять эмодзи'
}

function tr(key: string): string {
    if (trDictionary.hasOwnProperty(key)) return trDictionary[key]
    return key
}