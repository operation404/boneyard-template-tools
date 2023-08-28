import { registerSettings } from './scripts/settings.js';
import { ByMeasuredTemplateDocument } from './scripts/core classes/ByMeasuredTemplateDocument.js';
import { BySimpleTokenDocument } from './scripts/core classes/ByTokenDocument.js';

Hooks.once('init', () => {
    registerSettings();
    ByMeasuredTemplateDocument._init();
    BySimpleTokenDocument._init();
});
