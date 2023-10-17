import * as CONST from './constants.js';
import { ByMeasuredTemplateDocument } from './core classes/ByMeasuredTemplateDocument.js';
import { ByTokenDocument } from './core classes/ByTokenDocument.js';

export function registerSettings() {
    game.settings.register(CONST.MODULE, CONST.SETTINGS.COLLISION_METHOD, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.COLLISION_METHOD}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.COLLISION_METHOD}`,
        scope: 'world',
        config: true,
        type: String,
        default: CONST.COLLISION_METHOD.POINTS_SPACES,
        choices: Object.fromEntries(Object.keys(CONST.COLLISION_METHOD).map((key) => [key, `SETTINGS.CHOICES.${key}`])),
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

    game.settings.register(CONST.MODULE, CONST.SETTINGS.CONSIDER_TEMPLATE_RATIO, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.CONSIDER_TEMPLATE_RATIO}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.CONSIDER_TEMPLATE_RATIO}`,
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        onChange: (value) => {
            ByMeasuredTemplateDocument._defaultConsiderTemplateRatio = value;
        },
    });

    game.settings.register(CONST.MODULE, CONST.SETTINGS.UPDATE_REQUIRES_OWNERSHIP, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.UPDATE_REQUIRES_OWNERSHIP}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.UPDATE_REQUIRES_OWNERSHIP}`,
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
    });
}
