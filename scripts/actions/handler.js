import { actions } from './generic.js';
import * as WWN from './systems/wwn.js';

/**
 * @returns {object}    The creation methods and options for available preset actions.
 */
export function initActions() {
    switch (game.system.id) {
        case WWN.systemId:
            actions = { ...actions, ...WWN.actions };
            break;
    }
    const actionsAPI = Object.fromEntries(
        Object.entries(actions).map(([k, v]) => [k, { create: v.create, options: v.options }])
    );
    actionsAPI.resolveHandler = resolveHandler;
    return actionsAPI;
}

// TODO need to do some checking here to see if this needs to be done
// as a GM.
/**
 * @param {Document} document
 * @param {Action} action
 */
export function resolveHandler(document, action) {
    (Array.isArray(action) ? action : [action]).forEach(({ type, data }) => {
        actions[type].resolve(document, data);
    });
}
