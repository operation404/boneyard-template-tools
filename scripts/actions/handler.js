import * as CONST from '../constants.js';
import { socket } from '../socket.js';
import { actions as genericActions, Action } from './generic.js';
import * as WWN from './systems/wwn.js';
import * as DND5E from './systems/dnd5e.js';

let actionMap;

/**
 * @returns {object}    The creation methods and options for available preset actions.
 */
export function initActions() {
    switch (game.system.id) {
        case WWN.systemId:
            actionMap = { ...genericActions, ...WWN.actions };
            break;
        case DND5E.systemId:
            actionMap = { ...genericActions, ...DND5E.actions };
            break;
        default:
            actionMap = genericActions;
            break;
    }

    const actionsAPI = {
        options: Object.fromEntries(Object.entries(actionMap).map(([k, v]) => [k, v.options])),
        types: Object.fromEntries(Object.keys(actionMap).map((k) => [k, k])),
        create: createAction,
        resolve: resolveActions,
    };
    return actionsAPI;
}

function createAction(type, data) {
    const action = actionMap[type];
    if (!action) throw `Invalid Action type.`;
    return action.create(data);
}

/**
 * @param {Document|string} document    A document or the UUID of a document.
 * @param {Action|Action[]} actions     The actions to perform on the document.
 */
export async function resolveActions(document, actions) {
    if (typeof document === 'string') {
        document = await fromUuid(document);
        if (document === undefined) throw `Invalid Document UUID.`;
    }

    if (game.user.isGM) {
        _resolveParse(document, actions);
    } else {
        if (game.settings.get(CONST.MODULE, CONST.SETTINGS.PLAYERS_CAN_USE_ACTIONS)) {
            socket.executeAsGM('resolveActions', document.uuid, actions);
        } else throw `Setting allowing players to use Preset Actions is false.`;
    }
}

/**
 * @param {Document|string} document    A document or the UUID of a document.
 * @param {Action|Action[]} actions     The actions to perform on the document.
 */
export function _resolveParse(document, actions) {
    (Array.isArray(actions) ? actions : [actions]).forEach(({ type, data }) => {
        actionMap[type].resolve(document, data);
    });
}
