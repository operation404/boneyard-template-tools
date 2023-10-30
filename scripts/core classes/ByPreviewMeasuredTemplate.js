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

    static #templateDefaults() {
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
            tag: 'previewTemplate',
            // Larger the interval, the more legal positions between grid units
            // An interval of 2 allows placing on a vertex and halfway to next one
            // An interval of 0.5 would only allow every other vertex
            interval:
                canvas.grid.type === CONST.GRID_TYPES.GRIDLESS
                    ? 0
                    : canvas.grid.type === CONST.GRID_TYPES.SQUARE
                    ? 2
                    : 5,
            lockPosition:
                typeof config.lockPosition === 'object'
                    ? {
                          min: 0,
                          max: 0,
                          // TODO restricted angle support
                      }
                    : false,
            lockSize:
                typeof config.lockSize === 'object'
                    ? {
                          min: templateData.distance,
                          max: templateData.distance,
                      }
                    : true,
            lockRotation:
                typeof config.lockSize === 'object'
                    ? {
                          min: 0,
                          max: 0,
                      }
                    : false,
            rememberControlled: false,
            callbacks: {},
        };
    }

    /**
     *
     * @param {Object} templateData
     * @param {Object} config
     * @returns {PreviewTemplate|null}
     */
    static async createPreview(templateData, config) {
        if (!templateData.hasOwnProperty('t')) return null;

        mergeObject(templateData, PreviewTemplate.#templateDefaults(), { overwrite: false });
        if (!templateData.hasOwnProperty('x') || !templateData.hasOwnProperty('y')) {
            // canvas.app.renderer.events.pointer.getLocalPosition(canvas.app.stage) is identical to 'canvas.mousePosition'
            const mouseLoc = PreviewTemplate.getSnappedPosition(canvas.mousePosition, templateData.interval);
            templateData.x = mouseLoc.x;
            templateData.y = mouseLoc.y;
        }

        mergeObject(config, PreviewTemplate.#configDefaults(templateData, config), { overwrite: false });
        // Validate and check for redundancy
        {
            let { lockPosition, lockSize, lockRotation } = config;
            if (typeof lockPosition === 'object') {
                if (lockPosition.max <= 0) config.lockPosition = true;
                lockPosition.min = Math.max(lockPosition.min, 0);
                if (lockPosition.min + canvas.dimensions.distance > lockPosition.max)
                    lockPosition.min = lockPosition.max - canvas.dimensions.distance;
                lockPosition.origin = { x: templateData.x, y: templateData.y };
            }
            if (typeof lockSize === 'object' && lockSize.min === lockSize.max) {
                config.lockSize = true;
            }
            if (typeof lockRotation === 'object' && (lockRotation.max - lockRotation.min) % 360 === 0) {
                config.lockRotation = true;
            }
        }

        // Remember controlled tokens to restore control after preview.
        const controlled = config.rememberControlled ? canvas.tokens.controlled : null;

        const cls = CONFIG.MeasuredTemplate.documentClass;
        const templateDoc = new cls(templateData, { parent: canvas.scene }); // Constructor modifies passed templateData obj
        const templateObj = new PreviewTemplate(templateDoc);
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

        await templateObj.drawPreview();

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
        if (typeof this.lockPosition === 'object') this.placementBounds = this.addChild(new PIXI.Graphics());
    }

    /** @override */
    async _refreshTemplate() {
        super._refreshTemplate();

        // Draw the bounds for where the template is allowed to be placed.
        if (typeof this.lockPosition === 'object') {
            const t = this.placementBounds.clear();
            const { origin, min, max } = this.lockPosition;
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
     * @returns {Promise}   A promise that resolves with the final measured template if created.
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
        if (this.lockPosition === true) return;

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
        if (typeof this.lockPosition === 'object') {
            const { origin, min, max } = this.lockPosition;
            let distance = canvas.grid.measureDistance(origin, snapped);

            // If snapped pos not in range, try new position along same ray from origin
            if (distance < min || distance > max) {
                // Check if new position is same as origin
                // If so, shift new position 1 to the right to avoid a ray of length 0
                const ray =
                    origin.x === x && origin.y === y
                        ? new Ray(origin, { x: origin.x + 1, y })
                        : new Ray(origin, { x, y });

                const rayLen = (ray.distance / canvas.dimensions.size) * canvas.dimensions.distance;
                let scalar = (distance < min ? min : max) / rayLen;

                snapped = ray.project(scalar);
                snapped = canvas.grid.getSnappedPosition(snapped.x, snapped.y, this.interval);
                distance = canvas.grid.measureDistance(origin, snapped);

                // If first scaled snap pos still not in range, adjust scalar by one interval unit length
                if (distance < min || distance > max) {
                    scalar += (((distance < min ? 1 : -1) / this.interval) * canvas.dimensions.distance) / rayLen;
                    snapped = ray.project(scalar);
                    snapped = canvas.grid.getSnappedPosition(snapped.x, snapped.y, this.interval);
                }
            }
        }

        return snapped;
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
        if (this.lockRotation !== true && !event.ctrlKey) {
            const rotateDeg = event.shiftKey ? 5 : canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15;
            const delta = rotateDeg * Math.sign(event.deltaY);
            update.direction = this._updateRotation(delta);
        }
        // Resize template
        else if (this.lockSize !== true && event.ctrlKey) {
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
        if (typeof this.lockRotation === 'object') {
            const { min, max } = this.lockRotation;
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
        if (typeof this.lockSize === 'object') {
            const { min, max } = this.lockSize;
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
        this.#events.resolve(canvas.scene.createEmbeddedDocuments('MeasuredTemplate', [this.document.toObject()]));
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
