import * as CONST from './constants';
import { resolveActions } from './actions/handler';

export let socket;

Hooks.once('socketlib.ready', () => {
    socket = socketlib.registerModule(CONST.MODULE);
    socket.register('resolveActions', resolveActions);
});
