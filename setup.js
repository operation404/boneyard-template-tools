import { prepare_settings } from './scripts/settings.js';
import { Template_Tools } from './scripts/template_tools.js';
import { ByMeasuredTemplateDocument } from './scripts/core classes/MeasuredTemplate.js';

Hooks.once('init', prepare_settings);
//Hooks.once('setup', Template_Tools.init);
Hooks.once('setup', ByMeasuredTemplateDocument.overrideMeasuredTemplateDocument);
