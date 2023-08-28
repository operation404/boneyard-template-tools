import { prepare_settings } from './scripts/settings.js';
import { Template_Tools } from './scripts/template_tools.js';

Hooks.once('init', prepare_settings);
Hooks.once('setup', Template_Tools.init);
