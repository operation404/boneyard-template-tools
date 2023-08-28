export const MODULE = 'boneyard-template-tools';
export const TARGET_MODE = 'targetMode';
export const TARGETING_MODES = {
    CENTER: 'pointsTokenCenter',
    SPACE: 'pointsTokenSpaces',
    REGION: 'pointsTokenRegion',
};

export const SETTINGS = Object.freeze({
    TARGETING_MODE: 'TARGETING_MODE',
});

const targetingModeStrings = ['POINTS_CENTER', 'POINTS_SPACES', 'POINTS_REGION'];
export const TARGETING_MODE = Object.freeze(Object.fromEntries(targetingModeStrings.map((v) => [v, v])));
