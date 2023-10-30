import * as CONST from './constants.js';
import { resolveActions } from './actions/handler.js';

export let socket;

export function initSocket() {
    Hooks.once('socketlib.ready', () => {
        socket = socketlib.registerModule(CONST.MODULE);
        socket.register('resolveActions', resolveActions);
    });
}
