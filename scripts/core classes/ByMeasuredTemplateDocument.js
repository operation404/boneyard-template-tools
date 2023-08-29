import * as CONST from '../constants.js';
import { ByTokenDocument } from './ByTokenDocument.js';

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

    _getBounds() {
        return this.object.bounds;
    }

    _boundsOverlap(doc) {
        if (!(doc instanceof ByTokenDocument || doc instanceof ByMeasuredTemplateDocument)) {
            const msg = `Argument doc not instance of BySimpleTokenDocument or ByMeasuredTemplateDocument.`;
            return console.error(msg, doc);
        }
        const b1 = this._getBounds();
        const b2 = doc._getBounds();
        const l1 = { x: b1.x, y: b1.y },
            r1 = { x: b1.x + b1.width, y: b1.y + b1.height },
            l2 = { x: b2.x, y: b2.y },
            r2 = { x: b2.x + b2.width, y: b2.y + b2.height };

        // if rectangles have no area, no overlap
        if (l1.x === r1.x || l1.y === l2.y || l2.x === r2.x || l2.y === r2.y) return false;

        // if one rectangle is to the left of the other
        if (l1.x > r2.x || l2.x > r1.x) return false;

        // if one rectangle is above the other
        if (r1.y > l2.y || r2.y > l1.y) return false;

        return true;
    }

    // -------------------- Instance Fields --------------------

    /**
     *
     * @param {TokenDocument} tokenDoc
     * @param {string} targetingMode
     * @returns
     */
    containsToken(tokenDoc, targetingMode = ByMeasuredTemplateDocument._defaultTargetingMode) {
        if (tokenDoc instanceof ByTokenDocument) {
            if (tokenDoc.parent !== this.parent) return false;
            switch (targetingMode) {
                case CONST.TARGETING_MODE.POINTS_CENTER:
                    return this._containsPoints(tokenDoc._centerPoint());
                case CONST.TARGETING_MODE.POINTS_SPACES:
                    return this._containsPoints(tokenDoc._spacesPoints());
                case CONST.TARGETING_MODE.POINTS_REGION:
                    return this._containsPoints(tokenDoc._regionPoints());
                default:
                    const msg = `Invalid targeting mode: ${targetingMode}`;
                    return console.error(msg, targetingMode);
            }
        } else {
            const msg = `Argument tokenDoc not instance of BySimpleTokenDocument.`;
            return console.error(msg, tokenDoc);
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
