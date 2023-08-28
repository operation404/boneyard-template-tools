import * as CONST from './constants.js';

export function prepare_settings() {
    game.settings.register(CONST.MODULE, CONST.TARGET_MODE, {
        name: 'SETTINGS.Targeting_Mode_Name',
        hint: 'SETTINGS.Targeting_Mode_Hint',
        scope: 'world', // "world" = sync to db, "client" = local storage
        config: true, // false if you dont want it to show in module config
        type: String, // Number, Boolean, String, Object

        default: CONST.TARGETING_MODES.SPACE,
        choices: {
            [CONST.TARGETING_MODES.CENTER]: 'SETTINGS.TARGETING_MODES.CENTER',
            [CONST.TARGETING_MODES.SPACE]: 'SETTINGS.TARGETING_MODES.SPACE',
            [CONST.TARGETING_MODES.REGION]: 'SETTINGS.TARGETING_MODES.REGION',
        },
    });
}
