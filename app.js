const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

let state = {
    IDLE: 'idle',
    WAITING: 'waiting',
    BAN1: 'Ban 1',
    PICK1: 'Pick 1',
    BAN23: 'Ban 2 & 3 (enter in same line separated by comma)',
    PICK2: 'Pick 2',
    BAN45: 'Ban 4 & 5 (enter in same line separated by comma)',
    PICK3: 'Pick 3'
}
let currentState = state.IDLE;
let captain1, captain2;
let draft;
let timers = [];
let validShips = ['aegis', 'basilisk', 'black widow', 'brawler', 'centurion',
    'colossus', 'destroyer', 'displacer', 'disruptor', 'endeavor', 'enforcer',
    'equalizer', 'executioner', 'furion', 'ghost', 'gladiator', 'guardian',
    'hunter', 'infiltrator', 'interceptor', 'leviathan', 'overseer', 'paladin',
    'paragon', 'persecutor', 'pioneer', 'protector', 'punisher', 'raider',
    'ranger', 'raven', 'reaper', 'sentinel', 'superlifter', 'venturer',
    'watchman'
];
let privilegedUsers = ['175802984192671744'];
let draftChannel = '448543636523843596';

client.on('message', msg => {
    if (msg.author.id === client.user.id) {
        // bot sent this message, ignore
        return;
    } else if (msg.channel.type !== 'dm') {
        return;
    }

    if (handleCommands(msg) === 'exit') {
        return;
    }

    switch (currentState) {
        case state.IDLE:
            if (msg.content.toLowerCase() === 'start') {
                msg.reply('[INFO] Starting draft! Next 2 users to talk to me are captains!');
                reset();
                currentState = state.WAITING;
            } else {
                msg.reply('[ERROR] Drafting has not started yet!');
            }
            break;
        case state.WAITING:
            if (!captain1) {
                captain1 = msg.author;
                msg.reply('[INFO] You are registered as captain 1. Waiting for captain 2 to register.');
            } else if (!captain2 && captain1.id !== msg.author.id) {
                captain2 = msg.author;
                msg.reply('You are registered as captain 2. Draft starting. Ban 1?');
                captain1.send('Captain 2 has registered. Draft starting. Ban 1?');
                currentState = state.BAN1;
                timeWarnings();
            } else {
                msg.reply('[ERROR] You have already registered as captain 1!');
            }
            break;
        case state.BAN1:
            handlePickOrBan(msg, draft.ban1, state.PICK1);
            break;
        case state.PICK1:
            handlePickOrBan(msg, draft.pick1, state.BAN23);
            break;
        case state.BAN23:
            handlePickOrBan(msg, draft.ban23, state.PICK2);
            break;
        case state.PICK2:
            handlePickOrBan(msg, draft.pick2, state.BAN45);
            break;
        case state.BAN45:
            handlePickOrBan(msg, draft.ban45, state.PICK3);
            break;
        case state.PICK3:
            handlePickOrBan(msg, draft.pick3);
            break;
    }
});

function handleSelection() {
    switch (currenState) {
        case state.BAN1:
            handlePickOrBan(msg, draft.ban1, state.PICK1);
            break;
        case state.PICK1:
            handlePickOrBan(msg, draft.pick1, state.BAN23);
            break;
        case state.BAN23:
            handlePickOrBan(msg, draft.ban23, state.PICK2);
            break;
        case state.PICK2:
            handlePickOrBan(msg, draft.pick2, state.BAN45);
            break;
        case state.BAN45:
            handlePickOrBan(msg, draft.ban45, state.PICK3);
            break;
        case state.PICK3:
            handlePickOrBan(msg, draft.pick3);
            break;
    }
}

function reset() {
    draft = {
        ban1: {
            'team1': '',
            'team2': '',
            'text': 'Ban 1'
        },
        pick1: {
            'team1': '',
            'team2': '',
            'text': 'Pick 1'
        },
        ban23: {
            'team1': '',
            'team2': '',
            'text': 'Ban 2 & 3'
        },
        pick2: {
            'team1': '',
            'team2': '',
            'text': 'Pick 2'
        },
        ban45: {
            'team1': '',
            'team2': '',
            'text': 'Ban 4 & 5'
        },
        pick3: {
            'team1': '',
            'team2': '',
            'text': 'Pick 3'
        }
    };

    captain1 = '';
    captain2 = '';

    timers.forEach(timer => {
        clearTimeout(timer);
    });
    timers = [];
}

function handleCommands(msg) {
    let message = msg.content.toLowerCase();
    switch (message) {
        case 'help':
            let helpText = '**How to use:**\n';
            helpText += 'Type "start" to start, then have the 2 captains message anything to the bot to register themselves, and follow the messages.\n\n';

            helpText += '**Bot Commands:**\n';
            helpText += 'start: Starts the drafting process\n';
            helpText += 'stop: Stops and reset the drafting process\n';
            helpText += 'reset: Does the same thing as stop\n';
            helpText += 'status: Shows current drafting status\n';
            helpText += 'ships: Shows all valid ship selections\n';
            helpText += 'help: Show help info page\n\n';

            helpText += '**Bot Status:**\n'
            helpText += `Uptime: ${msToTime(client.uptime)}\n\n`;

            helpText += '*Created by rukqoa*';

            msg.reply(helpText);

            return 'exit';
            break;
        case 'status':
            msg.reply('__Current Draft Status:__\n' + printDraft());
            return 'exit'
            break;
        case 'ships':
            msg.reply('__All Ships:__\n' + validShips);
            return 'exit'
            break;
        case 'reset':
        case 'stop':
            msg.reply('Resetting draft.');
            currentState = state.IDLE;
            reset();
            return 'exit'
            break;
        case 'test':
            if (privilegedUsers.includes(msg.author.id)) {
                msg.reply('Hello, Admin');
                client.channels.forEach(ch => {
                    console.log(ch.name + ch.id);
                });
            }
            return 'exit'
            break;

    }
}

function broadcast(message) {
    captain1.send(message);
    captain2.send(message);
}

function validateSelection(msg) {
    let message = msg.content.toLowerCase().trim();
    let ships = message.split(',');

    let errors = '';
    ships.forEach(ship => {
        ship = ship.trim();

        if (!validShips.includes(ship)) {
            errors += `[ERROR] Invalid ship: ${ship}! Check your spelling or formatting. Make sure to separate multiple bans with a comma.\n`;
        } else if (isPicking()) {
            // check if banned
            if (ship === draft.ban1.team1 || ship === draft.ban1.team2) {
                errors += `[ERROR] Invalid pick: ${ship} has already been banned!\n`;
            } else if (draft.ban23.team1.indexOf(ship) >= 0 || draft.ban23.team2.indexOf(ship) >= 0) {
                errors += `[ERROR] Invalid pick: ${ship} has already been banned!\n`;
            } else if (draft.ban45.team1.indexOf(ship) >= 0 || draft.ban45.team2.indexOf(ship) >= 0) {
                errors += `[ERROR] Invalid pick: ${ship} has already been banned!\n`;
            }

            // check if already picked
            if (msg.author.id === captain1.id) {
                if (ship === draft.pick1.team1 || ship === draft.pick2.team1) {
                    errors += `[ERROR] Invalid pick: your team has already picked ${ship}!\n`;
                }
            } else if (msg.author.id === captain2.id) {
                if (ship === draft.pick1.team2 || ship === draft.pick2.team2) {
                    errors += `[ERROR] Invalid pick: your team has already picked ${ship}!\n`;
                }
            } else {
                errors += '[ERROR] You are not a registered captain.';
            }
        }
    });

    if (isTwoBans() && ships.length !== 2) {
        errors += '[ERROR] Two bans required!\n'
    } else if (!isTwoBans() && ships.length !== 1) {
        errors += '[ERROR] Only 1 selection allowed in this phase!\n'
    }

    if (errors) {
        return errors;
    } else {
        return 'success';
    }
}

function isPicking() {
    return currentState === state.PICK1 || currentState === state.PICK2 || currentState === state.PICK3;
}

function isTwoBans() {
    return currentState === state.BAN23 || currentState === state.BAN45;
}

function handlePickOrBan(msg, phase, nextPhase) {
    let validation = validateSelection(msg);
    if (validation !== 'success') {
        msg.reply(validation);
        return;
    }

    if (msg.author.id === captain1.id) {
        phase.team1 = msg.content.toLowerCase().trim();
    } else if (msg.author.id === captain2.id) {
        phase.team2 = msg.content.toLowerCase().trim();
    } else {
        msg.reply('[ERROR] You are not a registered captain.')
    }

    if (phase.team1 && phase.team2) {
        triggerNextPhase(phase, nextPhase);
    } else {
        msg.reply('[INFO] Your selection has been registered. You can change it before time runs out by entering a new message.')
    }
}

function triggerNextPhase(phase, nextPhase) {
    timers.forEach(timer => {
        clearTimeout(timer);
    });
    timers = [];

    if (nextPhase) {
        broadcast(`**${phase.text}:** \n${captain1.username}: ${phase.team1}\n${captain2.username}: ${phase.team2}\n${nextPhase}?`);
        currentState = nextPhase;
        timeWarnings();
    } else {
        currentState = state.IDLE;
        broadcast(`[INFO] All bans and picks complete!\n${printDraft()}`);
        client.channels.get(draftChannel).send(`__Draft between ${captain1.username} & ${captain2.username}:__\n${printDraft()}`);
    }
}

function printDraft() {
    let currentDraft = '';
    let phasesToPrint = [];
    switch (currentState) {
        case state.IDLE:
            phasesToPrint = [draft.ban1, draft.pick1, draft.ban23, draft.pick2, draft.ban45, draft.pick3];
            break;
        case state.WAITING:
            phasesToPrint = [];
            break;
        case state.BAN1:
            phasesToPrint = [];
            break;
        case state.PICK1:
            phasesToPrint = [draft.ban1];
            break;
        case state.BAN23:
            phasesToPrint = [draft.ban1, draft.pick1];
            break;
        case state.PICK2:
            phasesToPrint = [draft.ban1, draft.pick1, draft.ban23];
            break;
        case state.BAN45:
            phasesToPrint = [draft.ban1, draft.pick1, draft.ban23, draft.pick2];
            break;
        case state.PICK3:
            phasesToPrint = [draft.ban1, draft.pick1, draft.ban23, draft.pick2, draft.ban45];
            break;
    }

    phasesToPrint.forEach(v => {
        currentDraft += `**${v.text}**\n`;
        currentDraft += `${captain1.username}: ${v.team1}\n`;
        currentDraft += `${captain2.username}: ${v.team2}\n`;
    });
    return currentDraft;
}

function sendIfUndecided(message, phase) {
    if (!phase.team1) {
        captain1.send(message);
    }
    if (!phase.team2) {
        captain2.send(message);
    }
}

function timeWarnings() {
    let phase, nextPhase;
    switch (currentState) {
        case state.BAN1:
            phase = draft.ban1;
            nextPhase = state.PICK1;
            break;
        case state.PICK1:
            phase = draft.pick1;
            nextPhase = state.BAN23;
            break;
        case state.BAN23:
            phase = draft.ban23;
            nextPhase = state.PICK2;
            break;
        case state.PICK2:
            phase = draft.pick2;
            nextPhase = state.BAN45;
            break;
        case state.BAN45:
            phase = draft.ban45;
            nextPhase = state.PICK3;
            break;
        case state.PICK3:
            phase = draft.pick3;
            break;
    }

    let warning90 = setTimeout(() => {
        sendIfUndecided('[WARNING] 90 seconds remaining in this selection period.', phase)
    }, 30 * 1000);
    let warning60 = setTimeout(() => {
        sendIfUndecided('[WARNING] 60 seconds remaining in this selection period.', phase)
    }, 60 * 1000);
    let warning30 = setTimeout(() => {
        sendIfUndecided('[WARNING] 30 seconds remaining in this selection period.', phase)
    }, 90 * 1000);
    let warning10 = setTimeout(() => {
        sendIfUndecided('[WARNING] 10 seconds remaining in this selection period.', phase)
    }, 110 * 1000);
    let done = setTimeout(() => {
        sendIfUndecided('[INFO] Time has run out. Moving onto the next phase.', phase);

        // set to undecided
        if (!phase.team1) {
            phase.team1 = 'skipped';
        }
        if (!phase.team2) {
            phase.team2 = 'skipped';
        }

        triggerNextPhase(phase, nextPhase);
    }, 120 * 1000);

    timers = [warning90, warning60, warning30, warning10, done];
}

function msToTime(s) {
    let pad = (n, z = 2) => ('00' + n).slice(-z);
    return pad(s / 3.6e6 | 0) + ':' + pad((s % 3.6e6) / 6e4 | 0) + ':' + pad((s % 6e4) / 1000 | 0) + '.' + pad(s % 1000, 3);
}

client.login('NDQ4NTQzOTg5MzY1MzQyMjA4.DeXqrw.mgthr_iDiww5VwlXgAHl59g0vOc');
