import * as CONST from '../constants.js';
import { BySimpleTokenDocument } from './ByTokenDocument.js';

/** @inheritdoc */
export class ByMeasuredTemplateDocument extends CONFIG.MeasuredTemplate.documentClass {
    // -------------------- Private Class Fields --------------------

    /**
     * Initialize class fields and override the core class.
     */
    static _init() {
        ByMeasuredTemplateDocument._overrideMeasuredTemplateDocument();
        ByMeasuredTemplateDocument._defaultTargetingMode = game.settings.get(
            CONST.MODULE,
            CONST.SETTINGS.TARGETING_MODE
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

    /**
     *
     * @param {TokenDocument} tokenDoc
     * @param {string} targetingMode
     * @returns
     */
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

    /**
     *
     * @param {string} targetingMode
     * @returns
     */
    getTokens(targetingMode) {
        return this.parent.tokens.filter((token) => this.containsToken(token, targetingMode));
    }
}
