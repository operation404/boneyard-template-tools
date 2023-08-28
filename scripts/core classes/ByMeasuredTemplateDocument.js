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

    static _templateContainsPoints(measuredTemplateDoc, points) {
        const { x, y } = measuredTemplateDoc;
        return points.some((point) => measuredTemplateDoc.object.shape.contains(point.x - x, point.y - y));
    }

    // -------------------- Class Methods --------------------

    static templateContainsToken(measuredTemplateDoc, tokenDoc, targetingMode) {}

    static templateGetTokens(measuredTemplateDoc, targetingMode) {}

    // -------------------- Instance Methods --------------------

    containsToken(tokenDoc, targetingMode) {
        return false;
    }

    getTokens(targetingMode) {
        return [];
    }
}
