import * as CONST from '../constants.js';

/** @inheritdoc */
export class ByMeasuredTemplateDocument extends CONFIG.MeasuredTemplate.documentClass {
    // -------------------- Private Class Fields --------------------

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

    // -------------------- Private Instance Fields --------------------

    _containsPoints(points) {
        const { x, y } = this;
        return points.some((point) => this.object.shape.contains(point.x - x, point.y - y));
    }

    // -------------------- Instance Fields --------------------

    containsToken(tokenDoc, targetingMode = ByMeasuredTemplateDocument._defaultTargetingMode) {
        if (tokenDoc instanceof TokenDocument) {
            switch (targetingMode) {
                case CONST.TARGETING_MODE.POINTS_CENTER:
                    return this._containsPoints(tokenDoc._centerPoint());
                case CONST.TARGETING_MODE.POINTS_SPACES:
                    return this._containsPoints(tokenDoc._spacesPoints());
                case CONST.TARGETING_MODE.POINTS_REGION:
                    return this._containsPoints(tokenDoc._regionPoints());
                default:
                    const msg = `Invalid targeting mode: ${targetingMode}`;
                    console.log(msg, targetingMode);
                    return ui.notifications.error(msg);
            }
        } else {
            const msg = `Function parameter tokenDoc not instance of TokenDocument.`;
            console.log(msg, tokenDoc);
            return ui.notifications.error(msg);
        }
    }

    getTokens(targetingMode) {
        return this.parent.tokens.filter((token) => this.containsToken(token, targetingMode));
    }
}
