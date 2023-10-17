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
