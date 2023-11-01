/**
 * A helper class for previewing and adjusting MeasuredTemplates before creating them.
 */
export class PreviewTemplate extends MeasuredTemplate {
    /**
     * Track the timestamp when the last mouse move event was captured.
     * @type {number}
     */
    #moveTime = 0;

    /**
     * The initially active CanvasLayer to re-activate after the workflow is complete.
     * @type {CanvasLayer}
     */
    #initialLayer;

    /**
     * Track the bound event handlers so they can be properly canceled later.
     * @type {object}
     */
    #events;

    static #templateDefaults() {
        /*
        Standard MeasuredTemplate schema:
            _id: DocumentIdField
            user: ForeignDocumentField
            t: StringField
            x: NumberField
            y: NumberField
            distance: NumberField
            direction: AngleField
            angle: AngleField
            width: NumberField
            borderColor: ColorField
            fillColor: ColorField
            texture: FilePathField
            hidden: BooleanField
            flags: ObjectField
        */
        return {
            direction: 0,
            distance: canvas.dimensions.distance,
            width: canvas.dimensions.distance,
            user: game.user.id,
            fillColor: game.user.color,
            angle: CONFIG.MeasuredTemplate.defaults.angle,
        };
    }

    static #configDefaults(templateData, config) {
        return {
            // Larger the interval, the more legal positions between grid units
            // An interval of 2 allows placing on a vertex and halfway to next one
            // An interval of 0.5 would only allow every other vertex
            interval:
                canvas.grid.type === CONST.GRID_TYPES.GRIDLESS
                    ? 0
                    : canvas.grid.type === CONST.GRID_TYPES.SQUARE
                    ? 2
                    : 5,
            // If a lock is ever set to true, restriction is ignored if passed
            lockPosition: false,
            restrictPosition: config.restrictPosition
                ? {
                      min: 0,
                      max: 0,
                      // TODO restricted angle support
                      // other shapes besides circles? Could do actual pixi shapes
                  }
                : null,
            lockSize: true,
            restrictSize: config.restrictSize
                ? {
                      min: templateData.distance,
                      max: templateData.distance,
                  }
                : null,
            lockRotation: false,
            restrictRotation: config.restrictRotation
                ? {
                      min: 0,
                      max: 0,
                  }
                : null,
            rememberControlled: false,
            callbacks: {},
        };
    }

    /*

    TODO

    Also, for the template itself, the shape is a simple pixi graphics object.
    If I make a pixi container and put multiple shapes in it, I should be able
    to make custom composite templates. The container seems to test all children for stuff like
    a point being inside of it - even if it doesn't, I could easily override the method
    and make it do that.
    So like 3 overlapping circles all as one template. 

    */

    /**
     *
     * @param {Object} templateData
     * @param {Object} config
     * @returns {PreviewTemplate|null}
     */
    static async createPreview(templateData, config) {
        if (!templateData.hasOwnProperty('t')) return null;

        mergeObject(templateData, PreviewTemplate.#templateDefaults(), { overwrite: false });
        mergeObject(config, PreviewTemplate.#configDefaults(templateData, config), { overwrite: false });
        if (!templateData.hasOwnProperty('x') || !templateData.hasOwnProperty('y')) {
            // canvas.app.renderer.events.pointer.getLocalPosition(canvas.app.stage) is identical to 'canvas.mousePosition'
            let mouseLoc = canvas.mousePosition;
            mouseLoc = canvas.grid.getSnappedPosition(mouseLoc.x, mouseLoc.y, config.interval);
            templateData.x = mouseLoc.x;
            templateData.y = mouseLoc.y;
        }

        // Validate and check for redundancy
        {
            let { lockPosition, lockSize, lockRotation, restrictPosition, restrictRotation, restrictSize } = config;

            // Position
            if (lockPosition && restrictPosition) config.restrictPosition = null;
            if (config.restrictPosition) {
                if (restrictPosition.max <= 0) {
                    config.lockPosition = true;
                    config.restrictPosition = null;
                } else {
                    restrictPosition.min = Math.clamped(restrictPosition.min, 0, restrictPosition.max);
                    restrictPosition.origin = { x: templateData.x, y: templateData.y };
                }
            }

            // Size
            if (lockSize && restrictSize) config.restrictSize = null;
            if (config.restrictSize && restrictSize.min === restrictSize.max) {
                config.lockSize = true;
                config.restrictSize = null;
            }

            // Rotation
            if (lockRotation && restrictRotation) config.restrictRotation = null;
            if (config.restrictRotation && (restrictRotation.max - restrictRotation.min) % 360 === 0) {
                config.lockRotation = true;
                config.restrictRotation = null;
            }
        }

        // Remember controlled tokens to restore control after preview.
        const controlled = config.rememberControlled ? canvas.tokens.controlled : null;

        const cls = CONFIG.MeasuredTemplate.documentClass;
        const templateDoc = new cls(templateData, { parent: canvas.scene }); // Constructor modifies passed templateData obj
        let templateObj = new PreviewTemplate(templateDoc);
        mergeObject(templateObj, config, { overwrite: false });

        // Update starting values based on config constraints
        {
            const { x, y } = templateDoc;
            templateDoc.updateSource({
                ...templateObj._updatePosition({ x, y }),
                direction: templateObj._updateRotation(0),
                distance: templateObj._updateSize(0),
            });
        }

        templateObj = await templateObj.drawPreview();
        if (templateObj) templateObj = templateObj[0];

        // Return control of tokens if saved
        controlled?.forEach((token) => token.control({ releaseOthers: false }));

        return templateObj;
    }

    /**
     * Creates a preview of the template.
     * @returns {Promise}  A promise that resolves with the final measured template if created.
     */
    drawPreview() {
        // Save active layer before previewing template placement
        this.#initialLayer = canvas.activeLayer;

        // Draw the template and switch to the template layer
        this.draw();
        this.layer.activate();
        this.layer.preview.addChild(this);

        // Activate interactivity
        return this.activatePreviewListeners();
    }

    /** @override */
    async _draw() {
        super._draw();

        // Template placement bounds
        if (this.restrictPosition) this.placementBounds = this.addChild(new PIXI.Graphics());
    }

    /** @override */
    async _refreshTemplate() {
        super._refreshTemplate();

        // Draw the bounds for where the template is allowed to be placed.
        if (this.restrictPosition) {
            const t = this.placementBounds.clear();
            const { origin, min, max } = this.restrictPosition;

            // Shift origin of bounds circles so they don't move with the template
            const x = origin.x - this.document.x;
            const y = origin.y - this.document.y;

            t.lineStyle(this._borderThickness, 0x000000, 0.5)
                .beginFill(0x00ff00, 0.1)
                .drawCircle(x, y, max * canvas.dimensions.distancePixels);

            if (min > 0) t.beginFill(0xff0033, 0.1).drawCircle(x, y, min * canvas.dimensions.distancePixels);

            t.endFill();
        }
    }

    /**
     * Activate listeners for the template preview
     * @returns {Promise<MeasuredTemplate|undefined>}   A promise that resolves with the final measured template if created.
     */
    activatePreviewListeners() {
        return new Promise((resolve, reject) => {
            this.#events = {
                cancel: this._onCancelPlacement.bind(this),
                confirm: this._onConfirmPlacement.bind(this),
                move: this._onMovePlacement.bind(this),
                resolve,
                reject,
                rotate: this._onRotatePlacement.bind(this),
            };

            // Activate listeners
            canvas.stage.on('mousemove', this.#events.move);
            canvas.stage.on('mousedown', this.#events.confirm);
            canvas.app.view.oncontextmenu = this.#events.cancel;
            canvas.app.view.onwheel = this.#events.rotate;
        });
    }

    /**
     * Shared code for when template placement ends by being confirmed or canceled.
     * @param {Event} event  Triggering event that ended the placement.
     */
    async _finishPlacement(event) {
        this.layer._onDragLeftCancel(event);
        canvas.stage.off('mousemove', this.#events.move);
        canvas.stage.off('mousedown', this.#events.confirm);
        canvas.app.view.oncontextmenu = null;
        canvas.app.view.onwheel = null;
        this.#initialLayer.activate();
    }

    /**
     * Move the template preview when the mouse moves.
     * @param {Event} event  Triggering mouse event.
     */
    _onMovePlacement(event) {
        event.stopPropagation();
        if (this.lockPosition) return;

        const now = Date.now(); // Apply a 20ms throttle
        if (now - this.#moveTime <= 20) return;

        const center = event.data.getLocalPosition(this.layer);
        const update = this._updatePosition(center);

        this.document.updateSource(update);
        this.refresh();
        this.#moveTime = now;
    }

    _updatePosition({ x, y }) {
        let snapped = canvas.grid.getSnappedPosition(x, y, this.interval);

        // Clamp position
        if (this.restrictPosition && !this._validPosition(snapped)) {
            const { origin, min, max } = this.restrictPosition;

            // If snapped pos not in bounds, try new position along same ray from origin
            const distance = canvas.grid.measureDistance(origin, snapped);
            const ray = new Ray(origin, { x, y: y + (origin.x === x && origin.y === y ? 1 : 0) });
            const rayLen = (ray.distance / canvas.dimensions.size) * canvas.dimensions.distance;

            let scalar = (distance < min ? min : max) / rayLen;
            snapped = ray.project(scalar);
            snapped = canvas.grid.getSnappedPosition(snapped.x, snapped.y, this.interval);

            // If first scaled snap position not in bounds,
            // adjust scalar by one interval unit length and try again
            if (!this._validPosition(snapped)) {
                scalar += (((distance < min ? 1 : -1) / this.interval) * canvas.dimensions.distance) / rayLen;
                snapped = ray.project(scalar);
                snapped = canvas.grid.getSnappedPosition(snapped.x, snapped.y, this.interval);

                // If still not valid, revert to last accepted position.
                if (!this._validPosition(snapped)) snapped = { x: this.document.x, y: this.document.y };
            }
        }

        return snapped;
    }

    _validPosition(position) {
        if (!this.restrictPosition) return true;

        const { origin, min, max } = this.restrictPosition;
        const distance = canvas.grid.measureDistance(origin, position);
        return distance >= min && distance <= max;
    }

    /**
     * Rotate the template preview by 3˚ increments when the mouse wheel is rotated.
     * @param {Event} event  Triggering mouse event.
     */
    _onRotatePlacement(event) {
        if (event.ctrlKey) event.preventDefault(); // Avoid zooming the browser window
        event.stopPropagation();
        const update = {};

        // Rotate template
        if (!this.lockRotation && !event.ctrlKey) {
            const rotateDeg = event.shiftKey ? 5 : canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15;
            const delta = rotateDeg * Math.sign(event.deltaY);
            update.direction = this._updateRotation(delta);
        }
        // Resize template
        else if (!this.lockSize && event.ctrlKey) {
            const amount = (event.shiftKey ? 0.5 : 1) * canvas.dimensions.distance;
            const delta = -amount * Math.sign(event.deltaY);
            update.distance = this._updateSize(delta);
        }

        this.document.updateSource(update);
        this.refresh();
    }

    _updateRotation(delta) {
        let direction = this.document.direction + delta;

        // Clamp rotation
        if (this.restrictRotation) {
            const { min, max } = this.restrictRotation;
            if (min < max) {
                if (delta > 0 && direction > max) direction = max;
                else if (direction < min) direction = min;
            } else {
                if (delta > 0 && direction > max && direction < min) direction = max;
                else if (direction < min && direction > max) direction = min;
            }
        }

        return direction;
    }

    _updateSize(delta) {
        let distance = this.document.distance + delta;

        // Clamp size
        if (this.restrictSize) {
            const { min, max } = this.restrictSize;
            if (delta > 0 && distance > max) distance = max;
            else if (distance < min) distance = min;
        }

        return distance;
    }

    /**
     * Confirm placement when the left mouse button is clicked.
     * @param {Event} event  Triggering mouse event.
     */
    async _onConfirmPlacement(event) {
        await this._finishPlacement(event);
        if (this._validPosition({ x: this.document.x, y: this.document.y }))
            this.#events.resolve(canvas.scene.createEmbeddedDocuments('MeasuredTemplate', [this.document.toObject()]));
        else this.#events.reject();
    }

    /**
     * Cancel placement when the right mouse button is clicked.
     * @param {Event} event  Triggering mouse event.
     */
    async _onCancelPlacement(event) {
        await this._finishPlacement(event);
        this.#events.reject();
    }
}
