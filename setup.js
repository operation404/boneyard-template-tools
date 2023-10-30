import * as CONST from './scripts/constants.js';
import { registerSettings } from './scripts/settings.js';
import { ByMeasuredTemplateDocument } from './scripts/core classes/ByMeasuredTemplateDocument.js';
import { ByTokenDocument } from './scripts/core classes/ByTokenDocument.js';
import { initActions } from './scripts/actions/handler.js';
import { PreviewTemplate } from './scripts/core classes/ByPreviewMeasuredTemplate.js';
import { initSocket } from './scripts/socket.js';

Hooks.once('init', () => {
    registerSettings();
    ByMeasuredTemplateDocument._init();
    ByTokenDocument._init();
    

    window.Boneyard = window.Boneyard ?? {};
    window.Boneyard.TemplateTools = {
        collisionMethods: CONST.COLLISION_METHOD,
        collisionShapes: CONST.TOKEN_COLLISION_SHAPE,
        actions: initActions(),
        preview: PreviewTemplate.createPreview,
    };
});
initSocket();
