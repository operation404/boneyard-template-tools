import * as CONST from '../constants.js';

/** @inheritdoc */
export class ByMeasuredTemplateDocument extends CONFIG.MeasuredTemplate.documentClass {
    // -------------------- Private Class Methods --------------------

    /**
     * Attach init hooks to set class fields and override the core class.
     */
    static _init() {
        Hooks.once('init', ByMeasuredTemplateDocument._overrideMeasuredTemplateDocument);
        Hooks.once(
            'init',
            () =>
                (ByMeasuredTemplateDocument._defaultTargetingMode = game.settings.get(
                    CONST.MODULE,
                    CONST.SETTINGS.TARGETING_MODE
                ))
        );
    }

    /**
     * Override the core MeasuredTemplateDocument class.
     */
    static _overrideMeasuredTemplateDocument() {
        CONFIG.MeasuredTemplate.documentClass = ByMeasuredTemplateDocument;
        console.log(`====== Boneyard ======\n - ByMeasuredTemplateDocument override complete`);
    }

    /**
     * The targeting mode to use when no explicit mode is given.
     */
    static _defaultTargetingMode;

    // -------------------- Class Methods --------------------

    static templateContainsToken(measuredTemplateDoc, tokenDoc) {}

    static templateGetTokens() {}

    // -------------------- Instance Methods --------------------

    //constructor(...args) {super(...args);}

    containsToken(tokenDoc) {
        return false;
    }

    getTokens() {
        return [];
    }
}
