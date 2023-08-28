import { registerSettings } from './scripts/settings.js';
import { ByMeasuredTemplateDocument } from './scripts/core classes/ByMeasuredTemplateDocument.js';

Hooks.once('init', registerSettings);
Hooks.once('init', ByMeasuredTemplateDocument.overrideMeasuredTemplateDocument);
ByMeasuredTemplateDocument.init();
