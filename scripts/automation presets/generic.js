import * as CONST from '../const.js';

// Socket methods

/**
 * Perform updates on one or more documents.
 * @param {UpdatePackage} updatePackage     What documents to update and how.
 */
export function performPackagedUpdates({ documentName, parentUuid, updates }) {
    getDocumentClass(documentName).updateDocuments(updates, parentUuid ? { parent: fromUuid(parentUuid) } : undefined);
}

// Helper methods for making effects and such

/**
 * Contains all of the data needed to update documents.
 * @typedef {Object} UpdatePackage
 * @property {string} documentName          Type of the documents to update.
 * @property {string|undefined} parentUuid  Uuid of the parent containing the documents if they are embedded.
 * @property {Object[]} updates             Array of differential data objects, each used to update a single document.
 */

/**
 * A tuple containing a Document and a map of the values to update it with.
 * @typedef {Object} UpdateTuple
 * @property {Document} document
 * @property {Object} updates
 */

/**
 * Update one or more documents with the corresponding new values.
 * @param {UpdateTuple|UpdateTuple[]} updateTuples
 * @throws Documents must all be the same type.
 * @throws Documents must all have either the same parent or no parent.
 * @throws Owner Required setting is enabled and user lacks permission to update a document.
 * @throws A GM is required to update a document but none are online.
 */
export function updateDocuments(updateTuples) {
    const requiresOwnership = game.settings.get(CONST.MODULE, CONST.SETTINGS.UPDATE_REQUIRES_OWNERSHIP);
    updateTuples = Array.isArray(updateTuples) ? updateTuples : [updateTuples];
    const updatePackage = {
        documentName: updateTuples[0].document.documentName,
        parentUuid: updateTuples[0].document.parent?.uuid,
    };

    let executeAsGM = false;
    updatePackage.updates = updateTuples.map(({ document, updates }) => {
        if (updatePackage.documentName !== document.documentName) throw new Error(`Document types must all match.`);
        if (updatePackage.parentUuid !== document.parent?.uuid) throw new Error(`Document parents must all match.`);
        if (document.permission !== CONST.DOCUMENT_PERMISSION_LEVELS.OWNER) {
            if (requiresOwnership) throw new Error(`Document ownership required to update.`);
            else if (!executeAsGM) executeAsGM = true;
        }
        return { _id: document.id, ...updates };
    });

    if (executeAsGM) {
        // TODO implement socket handler, or just use socketlib...
        game.socket.emit(CONST.SOCKET, {
            sender: game.user.id,
            mode: 'asGM',
            action: 'performPackagedUpdates',
            updatePackage: updatePackage,
        });
    } else performPackagedUpdates(updatePackage);
}

// --------------------------------------------------------------

/**
 * @class
 * @abstract
 * @property {string} type
 * @property {object} data
 * @property {boolean} needGM
 */
class Action {
    type;
    data;
    needGM;

    /**
     * @abstract
     * @param {object} data
     */
    constructor(data) {
        throw `Cannot instantiate abstract class.`;
    }

    /**
     * @abstract
     * @param {object} data
     */
    static validateData() {
        throw `Cannot call abstract method.`;
    }

    /**
     * @abstract
     * @param {Action} action
     */
    static resolve(action) {
        throw `Cannot call abstract method.`;
    }
}

class Comparison extends Action {
    static operations = {
        '=': (a, b) => a === b,
        '!=': (a, b) => a !== b,
        '>': (a, b) => a > b,
        '<': (a, b) => a < b,
        '>=': (a, b) => a >= b,
        '<=': (a, b) => a <= b,
    };

    constructor(data) {
        data.passAction = Array.isArray(data.passAction) ? data.passAction : [data.passAction];
        Comparison.validateData(data);
        this.type = 'Comparison';
        this.data = data;
        this.needGM = data.passAction.some((a) => a.needGM);
    }

    /**
     * @param {object} data
     * @param {string} data.operation
     * @param {string} data.attributePath
     * @param {!*} data.value
     * @param {Action[]} data.passAction
     * @throws 'operation' invalid.
     * @throws 'attributePath' must be string.
     * @throws 'value' must be non-null
     * @throws 'passAction' must be instance(s) of Action.
     */
    static validateData({ operation, attributePath, value, passAction }) {
        if (!Object.keys(Comparison.operations).includes(operation)) throw `'operation' invalid.`;
        if (!Comparison.options.operations.includes(operation)) throw `'operation' invalid type.`;
        if (typeof attributePath !== 'string') throw `'attributePath' must be string.`;
        if (value === undefined || value === null) throw `'value' must be non-null`;
        passAction.forEach((a) => {
            if (!(a instanceof Action)) throw `'passAction' must be instance(s) of Action.`;
        });
    }

    /**
     * @param {Document} document
     * @param {object} data
     * @param {string} data.operation
     * @param {string} data.attributePath
     * @param {!*} data.value
     * @param {Action[]} data.passAction
     */
    static resolve(document, { operation, attributePath, value, passAction }) {
        let attributeValue = document;
        attributePath.split('.').forEach((pathToken) => {
            attributeValue = attributeValue?.[pathToken];
        });
        if (attributeValue === undefined) throw `'attributePath' does not exist or its value is undefined.`;
    }
}
