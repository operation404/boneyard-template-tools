import * as CONST from './scripts/constants.js';
import { registerSettings } from './scripts/settings.js';
import { ByMeasuredTemplateDocument } from './scripts/core classes/ByMeasuredTemplateDocument.js';
import { BySimpleTokenDocument } from './scripts/core classes/ByTokenDocument.js';

Hooks.once('init', () => {
    window.Boneyard = window.Boneyard ?? {};
    window.Boneyard.TemplateTools = {
        targetingModes: CONST.TARGETING_MODE,
    };
    registerSettings();
    ByMeasuredTemplateDocument._init();
    BySimpleTokenDocument._init();
});
