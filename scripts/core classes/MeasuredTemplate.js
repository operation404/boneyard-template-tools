import * as CONST from './constants.js';

/** @inheritdoc */
export class ByMeasuredTemplate extends CONFIG.MeasuredTemplate.objectClass {
    /**
     * Attempt to override the core MeasuredTemplate class.
     * If the targeting mode setting cannot be read, the core class is not overriden.
     */
    static overrideMeasuredTemplate() {
        ByMeasuredTemplate._defaultTargetingMode = game.settings.get(CONST.MODULE, CONST.SETTINGS.TARGETING_MODE);
        if (ByMeasuredTemplate._defaultTargetingMode) {
            CONFIG.MeasuredTemplate.objectClass = ByMeasuredTemplate;
        } else {
            console.error(
                `Failed to read '${CONST.SETTINGS.TARGETING_MODE}' setting. MeasuredTemplates will not be extended.`
            );
        }
    }

    static _defaultTargetingMode;

    containsToken(tokenDocument) {
        return false;
    }

    containedTokens() {
        return [];
    }
}
