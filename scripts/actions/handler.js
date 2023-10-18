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

// TODO need to do some checking here to see if this needs to be done
// as a GM.
/**
 * @param {Document} document
 * @param {Action|Action[]} actions
 */
export function resolveActions(document, actions) {
    (Array.isArray(actions) ? actions : [actions]).forEach(({ type, data }) => {
        actionMap[type].resolve(document, data);
    });
}
