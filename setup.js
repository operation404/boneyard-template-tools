import { registerSettings } from './scripts/settings.js';
import { ByMeasuredTemplateDocument } from './scripts/core classes/ByMeasuredTemplateDocument.js';

Hooks.once('init', registerSettings);
ByMeasuredTemplateDocument._init();
