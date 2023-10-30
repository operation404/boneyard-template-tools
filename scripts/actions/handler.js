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

    const actionsAPI = Object.fromEntries(
        Object.entries(actionMap).map(([k, v]) => [k, { create: v.create, options: v.options }])
    );
    actionsAPI.resolveActions = resolveActions;
    return actionsAPI;
}

/**
 * @param {Document|string} document    The Document itself or its UUID.
 * @param {Action|Action[]} actions
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

export function _resolveParse(document, actions) {
    (Array.isArray(actions) ? actions : [actions]).forEach(({ type, data }) => {
        actionMap[type].resolve(document, data);
    });
}
