import * as CONST from './scripts/constants.js';
import { registerSettings } from './scripts/settings.js';
import { ByMeasuredTemplateDocument } from './scripts/core classes/ByMeasuredTemplateDocument.js';
import { ByTokenDocument } from './scripts/core classes/ByTokenDocument.js';
import { initActions } from './scripts/automation presets/generic.js';

Hooks.once('init', () => {
    registerSettings();
    ByMeasuredTemplateDocument._init();
    ByTokenDocument._init();
    window.Boneyard = window.Boneyard ?? {};
    window.Boneyard.TemplateTools = {
        collisionMethods: CONST.COLLISION_METHOD,
        collisionShapes: CONST.TOKEN_COLLISION_SHAPE,
        actions: initActions(),
    };
});

// TODO need to set up the socket handler function
//game.socket.on(CONST.SOCKET, () => {});
