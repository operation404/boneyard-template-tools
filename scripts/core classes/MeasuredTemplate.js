import * as CONST from './constants.js';

/** @inheritdoc */
export class ByMeasuredTemplateDocument extends CONFIG.MeasuredTemplate.documentClass {
    /**
     * Attempt to override the core MeasuredTemplateDocument class.
     * If the targeting mode setting cannot be read, the core class is not overriden.
     */
    static overrideMeasuredTemplateDocument() {
        ByMeasuredTemplateDocument._defaultTargetingMode = game.settings.get(
            CONST.MODULE,
            CONST.SETTINGS.TARGETING_MODE
        );
        if (ByMeasuredTemplateDocument._defaultTargetingMode) {
            CONFIG.MeasuredTemplate.documentClass = ByMeasuredTemplateDocument;
        } else {
            console.error(
                `Failed to read '${CONST.SETTINGS.TARGETING_MODE}' setting. MeasuredTemplateDocument will not be extended.`
            );
        }
    }

    static _defaultTargetingMode;

    constructor(...args) {
        super(...args);
        console.log('BY successful override');
    }

    containsToken(tokenDocument) {
        return false;
    }

    containedTokens() {
        return [];
    }
}
