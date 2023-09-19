export const MODULE = 'boneyard-template-tools';
export const SETTINGS = Object.freeze({
    TARGETING_MODE: 'TARGETING_MODE',
    TOLERANCE: 'TOLERANCE',
    PERCENTAGE_OUTPUT: 'PERCENTAGE_OUTPUT',
    TOKEN_COLLISION_SHAPE: 'TOKEN_COLLISION_SHAPE',
    CONSIDER_TEMPLATE_RATIO: 'CONSIDER_TEMPLATE_RATIO',
});

const targetingModeStrings = ['POINTS_CENTER', 'GRID_SPACES_POINTS', 'AREA_INTERSECTION'];
export const TARGETING_MODE = Object.freeze(Object.fromEntries(targetingModeStrings.map((v) => [v, v])));

const tokenCollisionShapeStrings = ['CIRCLE', 'RECTANGLE'];
export const TOKEN_COLLISION_SHAPE = Object.freeze(Object.fromEntries(tokenCollisionShapeStrings.map((v) => [v, v])));
