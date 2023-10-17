export const MODULE = 'boneyard-template-tools';
export const SOCKET = 'module.boneyard-template-tools';

export const SETTINGS = Object.freeze(
    Object.fromEntries(
        [
            'COLLISION_METHOD',
            'TOLERANCE',
            'PERCENTAGE_OUTPUT',
            'TOKEN_COLLISION_SHAPE',
            'CONSIDER_TEMPLATE_RATIO',
            'UPDATE_REQUIRES_OWNERSHIP',
        ].map((v) => [v, v])
    )
);

export const COLLISION_METHOD = Object.freeze(
    Object.fromEntries(['POINTS_CENTER', 'GRID_SPACES_POINTS', 'AREA_INTERSECTION'].map((v) => [v, v]))
);
export const TOKEN_COLLISION_SHAPE = Object.freeze(Object.fromEntries(['CIRCLE', 'RECTANGLE'].map((v) => [v, v])));
