import * as CONST from '../constants.js';

/** @inheritdoc */
export class ByMeasuredTemplateDocument extends CONFIG.MeasuredTemplate.documentClass {

    // -------------------- Private Class Methods --------------------

    static _init() {
        Hooks.once('init', ByMeasuredTemplateDocument._overrideMeasuredTemplateDocument);
    }

    /**
     * Attempt to override the core MeasuredTemplateDocument class.
     * If the targeting mode setting cannot be read, the core class is not overriden.
     */
    static _overrideMeasuredTemplateDocument() {
        ByMeasuredTemplateDocument._defaultTargetingMode = game.settings.get(
            CONST.MODULE,
            CONST.SETTINGS.TARGETING_MODE
        );
        if (ByMeasuredTemplateDocument._defaultTargetingMode) {
            CONFIG.MeasuredTemplate.documentClass = ByMeasuredTemplateDocument;
            console.log(`====== Boneyard ======\n - ByMeasuredTemplateDocument override success`);
        } else {
            console.error(
                `====== Boneyard ======\n - Failed to read '${CONST.SETTINGS.TARGETING_MODE}' setting. MeasuredTemplateDocument not extended.`
            );
        }
    }

    static _defaultTargetingMode;

    // -------------------- Class Methods --------------------

    static templateContainsToken(measuredTemplateDocument, tokenDocument) {
        
    }

    // -------------------- Instance Methods --------------------

    //constructor(...args) {super(...args);}

    containsToken(tokenDocument) {
        return false;
    }

    containedTokens() {
        return [];
    }
}
