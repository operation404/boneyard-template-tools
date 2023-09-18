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
        ByMeasuredTemplateDocument._defaultTolerance = game.settings.get(CONST.MODULE, CONST.SETTINGS.TOLERANCE);
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

    /**
     * The tolerance to use when no explicit tolerance is given.
     */
    static _defaultTolerance;

    // -------------------- Private Instance Fields --------------------

    /**
     *
     * @param {Point[]} points      Array of points to test for being contained in the template shape
     * @returns {Boolean}           Whether the template shape contains any of the points
     */
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
            console.error(msg, doc);
            return false;
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
        if (r1.y < l2.y || r2.y < l1.y) return false;

        return true;
    }

    /**
     * Translate a PIXI rectangle or circle to the template's location and convert to polygon
     * @returns {PIXI.Polygon} The translated polygon form of the shape
     */
    _2dShape() {
        const shapeCopy = this.object.shape.clone();
        shapeCopy.x += this.x;
        shapeCopy.y += this.y;
        return shapeCopy.toPolygon();
    }

    /**
     * Translate a PIXI polygon to the template's location
     * @returns {PIXI.Polygon} The translated polygon
     */
    _polygon(options = { scalingFactor: 100 }) {
        let { x, y } = this;
        x *= options.scalingFactor;
        y *= options.scalingFactor;
        const clipperPolygon = this.object.shape.toClipperPoints(options);
        clipperPolygon.forEach((p) => {
            p.X += x;
            p.Y += y;
        });
        return PIXI.Polygon.fromClipperPoints(clipperPolygon, options);
    }

    /**
     * Translate shape to the template's location and convert to PIXI polygon
     * @returns {PIXI.Polygon} The translated polygon form of the shape
     */
    _polyForm() {
        switch (this.object.shape.type) {
            case 0: // generic poly
                return this._polygon();
            case 1: // rect
            case 2: // circle
                return this._2dShape();
            default:
                const msg = `Unkown PIXI object type: ${this.object.shape.type}`;
                return console.error(msg, this.object.shape.type);
        }
    }

    _polyIntersection(tokenPoly) {
        const templatePoly = this._polyForm();
        return templatePoly.intersectPolygon(tokenPoly).signedArea() > 0;
    }

    // -------------------- Instance Fields --------------------

    /**
     *
     * @param {TokenDocument} tokenDoc
     * @param {string} targetingMode
     * @returns
     */
    containsToken(
        tokenDoc,
        tolerance = ByMeasuredTemplateDocument._defaultTolerance,
        targetingMode = ByMeasuredTemplateDocument._defaultTargetingMode
    ) {
        if (tokenDoc instanceof ByTokenDocument) {
            if (this.parent !== tokenDoc.parent) return false;
            if (!this._boundsOverlap(tokenDoc)) return false;
            switch (targetingMode) {
                case CONST.TARGETING_MODE.POINTS_CENTER:
                    return this._containsPoints(tokenDoc._centerPoint());
                case CONST.TARGETING_MODE.POINTS_SPACES:
                    return this._containsPoints(tokenDoc._spacesPoints());
                case CONST.TARGETING_MODE.POINTS_REGION:
                    return this._containsPoints(tokenDoc._regionPoints());
                case CONST.TARGETING_MODE.CIRCLE_AREA:
                    return this._polyIntersection(tokenDoc._circlePoly());
                case CONST.TARGETING_MODE.RECTANGLE_AREA:
                    return this._polyIntersection(tokenDoc._rectanglePoly());
                default:
                    const msg = `Invalid targeting mode: ${targetingMode}`;
                    return console.error(msg, targetingMode);
            }
        } else {
            const msg = `Argument tokenDoc not instance of BySimpleTokenDocument.`;
            console.error(msg, tokenDoc);
            return false;
        }
    }

    /**
     *
     * @param {string} targetingMode
     * @returns
     */
    getTokens(tolerance, targetingMode) {
        return this.parent.tokens.filter((token) => this.containsToken(token, tolerance, targetingMode));
    }
}
