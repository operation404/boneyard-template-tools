import * as CONST from './constants.js';
import { ByMeasuredTemplateDocument } from './core classes/ByMeasuredTemplateDocument.js';
import { ByTokenDocument } from './core classes/ByTokenDocument.js';

export function registerSettings() {
    game.settings.register(CONST.MODULE, CONST.SETTINGS.TARGETING_MODE, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.TARGETING_MODE}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.TARGETING_MODE}`,
        scope: 'world',
        config: true,
        type: String,
        default: CONST.TARGETING_MODE.POINTS_SPACES,
        choices: Object.fromEntries(Object.keys(CONST.TARGETING_MODE).map((key) => [key, `SETTINGS.CHOICES.${key}`])),
        onChange: (value) => {
            ByMeasuredTemplateDocument._defaultTargetingMode = value;
        },
    });

    game.settings.register(CONST.MODULE, CONST.SETTINGS.TOKEN_COLLISION_SHAPE, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.TOKEN_COLLISION_SHAPE}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.TOKEN_COLLISION_SHAPE}`,
        scope: 'world',
        config: true,
        type: String,
        default: CONST.TOKEN_COLLISION_SHAPE.RECTANGLE,
        choices: Object.fromEntries(
            Object.keys(CONST.TOKEN_COLLISION_SHAPE).map((key) => [key, `SETTINGS.CHOICES.${key}`])
        ),
        onChange: (value) => {
            ByTokenDocument._defaultTokenCollisionShape = value;
        },
    });

    // Cannot be less than or equal to zero
    game.settings.register(CONST.MODULE, CONST.SETTINGS.TOLERANCE, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.TOLERANCE}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.TOLERANCE}`,
        scope: 'world',
        config: true,
        type: Number,
        default: Number.MIN_VALUE,
        onChange: (value) => {
            if (value <= 0) value = Number.MIN_VALUE;
            ByMeasuredTemplateDocument._defaultTolerance = value;
        },
    });

    game.settings.register(CONST.MODULE, CONST.SETTINGS.PERCENTAGE_OUTPUT, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.PERCENTAGE_OUTPUT}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.PERCENTAGE_OUTPUT}`,
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        onChange: (value) => {
            ByMeasuredTemplateDocument._defaultPercentageOutput = value;
        },
    });
}
