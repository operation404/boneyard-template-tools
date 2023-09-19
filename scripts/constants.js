export const MODULE = 'boneyard-template-tools';
export const SETTINGS = Object.freeze({
    TARGETING_MODE: 'TARGETING_MODE',
    TOLERANCE: 'TOLERANCE',
    PERCENTAGE_OUTPUT: 'PERCENTAGE_OUTPUT',
});

const targetingModeStrings = ['POINTS_CENTER', 'POINTS_SPACES', 'POINTS_REGION', 'CIRCLE_AREA', 'RECTANGLE_AREA'];
export const TARGETING_MODE = Object.freeze(Object.fromEntries(targetingModeStrings.map((v) => [v, v])));

const tokenCollisionShapeStrings = ['CIRCLE', 'RECTANGLE'];
export const TOKEN_COLLISION_SHAPE = Object.freeze(Object.fromEntries(tokenCollisionShapeStrings.map((v) => [v, v])));
