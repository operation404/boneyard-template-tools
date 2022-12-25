import {
    MODULE,
    TARGET_MODE,
    TARGETING_MODES
} from "./constants.js";

export function prepare_settings() {

    game.settings.register(MODULE, TARGET_MODE, {
        name: "SETTINGS.Targeting_Mode_Name",
        hint: "SETTINGS.Targeting_Mode_Hint",
        scope: 'world', // "world" = sync to db, "client" = local storage
        config: true, // false if you dont want it to show in module config
        type: String, // Number, Boolean, String, Object

        default: TARGETING_MODES.SPACE,
        choices: {
            [TARGETING_MODES.CENTER]: "SETTINGS.TARGETING_MODES.CENTER",
            [TARGETING_MODES.SPACE]: "SETTINGS.TARGETING_MODES.SPACE",
            [TARGETING_MODES.REGION]: "SETTINGS.TARGETING_MODES.REGION"
        },
        //requiresReload: false,
        //onChange: value => {}, // value is the new value of the setting
    });

}