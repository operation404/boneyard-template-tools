import * as CONST from './constants.js';
import { ByMeasuredTemplateDocument } from './core classes/MeasuredTemplate.js';

export function prepare_settings() {
    game.settings.register(CONST.MODULE, CONST.SETTINGS.TARGETING_MODE, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.TARGETING_MODE}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.TARGETING_MODE}`,
        scope: 'world',
        config: true,
        type: String,
        default: CONST.TARGETING_MODE.POINTS_SPACES,
        choices: Object.fromEntries(
            Object.keys(CONST.TARGETING_MODE).map((key) => [key, `SETTINGS.CHOICES.${key}.POINTS_CENTER`])
        ),
        onChange: (value) => {
            ByMeasuredTemplate._defaultTargetingMode = value;
        },
    });
}
