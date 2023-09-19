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
        ByMeasuredTemplateDocument._defaultPercentageOutput = game.settings.get(
            CONST.MODULE,
            CONST.SETTINGS.PERCENTAGE_OUTPUT
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

    /**
     * The tolerance to use when no explicit tolerance is given.
     */
    static _defaultTolerance;

    /**
     * Whether to output a percentage or boolean if not explicit output mode is given.
     */
    static _defaultPercentageOutput;

    // -------------------- Private Instance Fields --------------------

    /**
     *
     * @param {Point[]} points      Array of points to test for being contained in the template shape
     * @returns {Boolean}           Whether the template shape contains any of the points
     */
    _containsPoints(points) {
        const { x, y } = this;
        const containedCount = points.reduce(
            (counter, p) => (counter += this.object.shape.contains(p.x - x, p.y - y) ? 1 : 0),
            0
        );
        return containedCount / points.length;
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

    /**
     *
     * @param {PIXI.Polygon} tokenPoly                      The polygon tested for intersection
     * @param {boolean} [options.considerTemplateRatio]     Whether to account for the ratio of the intersection and template areas
     * @returns {number}                                    The ratio of the intersection and token areas, or if considerTemplateRatio is true, the ratio
     *                                                      of the intersection and template areas if it results in a larger value.
     */
    _polyIntersection(tokenPoly, { considerTemplateRatio = false }) {
        const templatePoly = this._polyForm();
        const intersectionArea = templatePoly.intersectPolygon(tokenPoly).signedArea();
        return (
            intersectionArea /
            (considerTemplateRatio
                ? Math.min(templatePoly.signedArea(), tokenPoly.signedArea())
                : tokenPoly.signedArea())
        );
    }

    // -------------------- Instance Fields --------------------

    /**
     *
     * @param {ByTokenDocument} tokenDoc                The Token being tested on whether the template contains it
     * @param {object} [options]                        Options to configure how collision is calculated
     * @param {number} [options.tolerance]              Percentage of overlap needed to be considered inside template
     * @param {string} [options.targetingMode]          Targeting mode to use for collision detection
     * @param {boolean} [options.percentateOutput]      Whether to return a boolean representing collision result or the area of the collision intersection
     * @param {boolean} [options.considerTemplateRatio] Whether to account for the ratio of the intersection and template areas
     * @returns
     */
    containsToken(tokenDoc, options = {}) {
        const {
            tolerance = ByMeasuredTemplateDocument._defaultTolerance,
            targetingMode = ByMeasuredTemplateDocument._defaultTargetingMode,
            percentateOutput = ByMeasuredTemplateDocument._defaultPercentageOutput,
        } = options;

        // Check for invalid input errors
        {
            if (!(tokenDoc instanceof ByTokenDocument)) {
                const msg = `Argument tokenDoc not instance of BySimpleTokenDocument.`;
                return console.error(msg, tokenDoc);
            }
            if (tolerance <= 0) {
                const msg = `Argument tolerance must be greater than or equal to 0: ${tolerance}`;
                return console.error(msg, tolerance);
            }
            if (CONST.TARGETING_MODE[targetingMode] === undefined) {
                const msg = `Invalid targeting mode: ${targetingMode}`;
                return console.error(msg, targetingMode);
            }
            if (this.parent !== tokenDoc.parent) {
                const msg = `Argument tokenDoc not on same scene as measured template.`;
                return console.error(msg, tokenDoc);
            }
        }

        // Test for token-template collision
        let collisionRatio = 0;
        if (this._boundsOverlap(tokenDoc)) {
            switch (targetingMode) {
                case CONST.TARGETING_MODE.POINTS_CENTER:
                    collisionRatio = this._containsPoints(tokenDoc._centerPoint(), options);
                    break;
                case CONST.TARGETING_MODE.POINTS_SPACES:
                    collisionRatio = this._containsPoints(tokenDoc._spacesPoints(), options);
                    break;
                case CONST.TARGETING_MODE.POINTS_REGION:
                    collisionRatio = this._containsPoints(tokenDoc._regionPoints(), options);
                    break;
                case CONST.TARGETING_MODE.CIRCLE_AREA:
                    collisionRatio = this._polyIntersection(tokenDoc._circlePoly(), options);
                    break;
                case CONST.TARGETING_MODE.RECTANGLE_AREA:
                    collisionRatio = this._polyIntersection(tokenDoc._rectanglePoly(), options);
                    break;
            }
        }

        return percentateOutput ? collisionRatio : collisionRatio >= tolerance;
    }

    /**
     *
     * @param {object} options
     * @returns
     */
    getTokens(options) {
        return this.parent.tokens.filter((token) => this.containsToken(token, options));
    }
}
