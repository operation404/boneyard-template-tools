import { _resolveParse } from './handler.js';

export class Validate {
    static #validate(validator, vals, ...args) {
        Object.entries(vals).forEach(([varName, val]) => {
            val = Array.isArray(val) ? val : [val];
            val.forEach((i) => validator(varName, i, ...args));
        });
    }

    /**
     * @param {object} vals
     * @param {Array<*>} arr
     * @throws ${varName} invalid option.
     */
    static isInArray(vals, arr) {
        function validator(varName, val, arr) {
            if (!arr.includes(val)) throw `${varName} invalid option.`;
        }
        this.#validate(validator, vals, arr);
    }

    /**
     * @param {object} vals
     * @param {object} arr
     * @throws ${varName} invalid option.
     */
    static isObjField(vals, obj) {
        function validator(varName, val, obj) {
            if (!obj.hasOwnProperty(val)) throw `${varName} invalid option.`;
        }
        this.#validate(validator, vals, obj);
    }

    /**
     * @param {object} vals
     * @throws ${varName} must be a number.
     */
    static isNumber(vals) {
        function validator(varName, val) {
            if (Number.isNaN(val) || typeof val !== 'number') throw `${varName} must be a number.`;
        }
        this.#validate(validator, vals);
    }

    /**
     * @param {object} vals
     * @throws ${varName} must be an integer.
     */
    static isInteger(vals) {
        function validator(varName, val) {
            if (!Number.isInteger(val)) throw `${varName} must be an integer.`;
        }
        this.#validate(validator, vals);
    }

    /**
     * @param {object} vals
     * @throws ${varName} must be non-negative.
     */
    static isNotNegative(vals) {
        function validator(varName, val) {
            if (val < 0) throw `${varName} must be non-negative.`;
        }
        this.#validate(validator, vals);
    }

    /**
     * @param {object} vals
     * @param {object} cls
     * @throws ${varName} must be instance of ${cls.name}.
     */
    static isClass(vals, cls) {
        function validator(varName, val, cls) {
            if (!(val instanceof cls)) throw `${varName} must be instance of ${cls.name}.`;
        }
        this.#validate(validator, vals, cls);
    }

    /**
     * @param {object} vals
     * @throws ${varName} must be a string.
     */
    static isString(vals) {
        function validator(varName, val) {
            if (typeof val !== 'string') throw `${varName} must be a string.`;
        }
        this.#validate(validator, vals);
    }

    /**
     * @param {object} vals
     * @throws ${varName} must be a boolean.
     */
    static isBoolean(vals) {
        function validator(varName, val) {
            if (typeof val !== 'boolean') throw `${varName} must be a boolean.`;
        }
        this.#validate(validator, vals);
    }

    /**
     * @param {object} vals
     * @throws ${varName} must be non-null.
     */
    static isNotNull(vals) {
        function validator(varName, val) {
            if (val === undefined || val === null) throw `${varName} must be non-null.`;
        }
        this.#validate(validator, vals);
    }
}

/**
 * @class
 * @abstract
 * @property {string} type
 * @property {object} data
 */
export class Action {
    static options = {};
    type;
    data;

    /**
     * @abstract
     * @param {object} data
     */
    constructor(data) {
        if (this.constructor.name === 'Action') throw `Cannot instantiate abstract class.`;
        this.constructor.validateData(data);
        this.type = this.constructor.name;
        this.data = data;
    }

    /**
     * Validate the action data, throwing an error for any invalid data.
     * @abstract
     * @param {object} data
     * @throws Throws an error if any data fields have invalid types or values.
     */
    static validateData(data) {
        throw `Cannot call abstract method.`;
    }

    /**
     * Execute a single action with the provided data.
     * @abstract
     * @param {Document} document
     * @param {object} data
     */
    static resolve(document, data) {
        throw `Cannot call abstract method.`;
    }
}

/**
 * @class
 * @extends Action
 * @classdesc       Action that compares an attribute of a document to a provided
 *                  value, resolving additional actions based on the result.
 */
export class Comparison extends Action {
    static options = {
        operations: {
            '=': (a, b) => a === b,
            '!=': (a, b) => a !== b,
            '>': (a, b) => a > b,
            '<': (a, b) => a < b,
            '>=': (a, b) => a >= b,
            '<=': (a, b) => a <= b,
        },
    };

    /**
     * @param {object} data
     * @param {string} data.operation
     * @param {string} data.attributePath
     * @param {!*} data.value
     * @param {Action|Action[]} data.trueActions
     * @param {Action|Action[]} [data.falseActions]
     */
    constructor(data) {
        data.trueActions = Array.isArray(data.trueActions) ? data.trueActions : [data.trueActions];
        if (!data.hasOwnProperty('falseActions')) data.falseActions = [];
        else data.falseActions = Array.isArray(data.falseActions) ? data.falseActions : [data.falseActions];
        super(data);
    }

    /**
     * @param {object} data
     * @param {string} data.operation
     * @param {string} data.attributePath
     * @param {!*} data.value
     * @param {Action[]} data.trueActions
     * @param {Action[]} data.falseActions
     */
    static validateData({ operation, attributePath, value, trueActions, falseActions }) {
        Validate.isInArray({ operation }, Object.keys(this.options.operations));
        Validate.isString({ attributePath });
        Validate.isNotNull({ value });
        Validate.isClass({ trueActions, falseActions }, Action);
    }

    /**
     * @param {Document} document
     * @param {object} data
     * @param {string} data.operation
     * @param {string} data.attributePath
     * @param {!*} data.value
     * @param {Action[]} data.trueActions
     * @param {Action[]} data.falseActions
     * @throws 'attributePath' does not exist or its value is undefined.
     * @throws Attribute value and 'value' parameter not same type.
     */
    static resolve(document, { operation, attributePath, value, trueActions, falseActions }) {
        let attributeValue = document;
        attributePath.split('.').forEach((pathToken) => (attributeValue = attributeValue?.[pathToken]));
        if (attributeValue === undefined) throw `'attributePath' does not exist or its value is undefined.`;
        if (typeof attributeValue !== typeof value) throw `Attribute value and 'value' parameter not same type.`;
        if (this.options.operations[operation](attributeValue, value)) _resolveParse(document, trueActions);
        else _resolveParse(document, falseActions);
    }
}

/**
 * @class
 * @extends Action
 * @classdesc       Action that updates a document with the provided values.
 */
export class UpdateDoc extends Action {
    static options = {
        operations: {
            replace: (val) => val,
            add: (val, orig) => orig + val,
        },
    };

    /**
     * @param {object} data
     * @param {object|object[]} data.updates
     */
    constructor(data) {
        data.updates = Array.isArray(data.updates) ? data.updates : [data.updates];
        super(data);
    }

    /**
     * @param {object} data
     * @param {object[]} data.updates
     * @param {string} data.updates[].attributePath
     * @param {string} data.updates[].method
     * @param {!*} data.updates[].value
     */
    static validateData({ updates }) {
        updates.forEach(({ attributePath, method, value }) => {
            Validate.isString({ attributePath });
            Validate.isInArray({ method }, Object.keys(this.options.operations));
            Validate.isNotNull({ value });
        });
    }

    /**
     * @param {Document} document
     * @param {object} data
     * @param {object[]} data.updates
     * @param {string} data.updates[].attributePath
     * @param {string} data.updates[].method
     * @param {!*} data.updates[].value
     * @throws 'attributePath' does not exist or its value is undefined.
     * @throws Attribute value and 'value' parameter not same type.
     */
    static resolve(document, { updates }) {
        const updateEntries = updates.map(({ attributePath, method, value }) => {
            let attributeValue = document;
            attributePath.split('.').forEach((pathToken) => (attributeValue = attributeValue?.[pathToken]));
            if (attributeValue === undefined) throw `'attributePath' does not exist or its value is undefined.`;
            if (typeof attributeValue !== typeof value) throw `Attribute value and 'value' parameter not same type.`;
            return [attributePath, this.options.operations[method](value, attributeValue)];
        });
        document.update(Object.fromEntries(updateEntries));
    }
}

export class Roll extends Action {
    static options = {
        operations: {
            '=': (a, b) => a === b,
            '!=': (a, b) => a !== b,
            '>': (a, b) => a > b,
            '<': (a, b) => a < b,
            '>=': (a, b) => a >= b,
            '<=': (a, b) => a <= b,
        },
    };

    /**
     * @param {object} data
     * @param {string} data.rollStr
     * @param {string} data.operation
     * @param {number} data.value
     * @param {Action|Action[]} data.trueActions
     * @param {Action|Action[]} [data.falseActions]
     * @param {boolean} [data.print]
     */
    constructor(data) {
        data.trueActions = Array.isArray(data.trueActions) ? data.trueActions : [data.trueActions];
        if (!data.hasOwnProperty('falseActions')) data.falseActions = [];
        else data.falseActions = Array.isArray(data.falseActions) ? data.falseActions : [data.falseActions];
        if (!data.hasOwnProperty('print')) data.print = false;
        super(data);
    }

    /**
     * @param {object} data
     * @param {string} data.rollStr
     * @param {string} data.operation
     * @param {number} data.value
     * @param {Action[]} data.trueActions
     * @param {Action[]} data.falseActions
     * @param {boolean} data.print
     */
    static validateData({ rollStr, operation, value, trueActions, falseActions, print }) {
        Validate.isString({ rollStr });
        Validate.isInArray({ operation }, Object.keys(this.options.operations));
        Validate.isNumber({ value });
        Validate.isClass({ trueActions, falseActions }, Action);
        Validate.isBoolean({ print });
    }

    static async _evalRoll(document, { rollStr, operation, value, print }) {
        const roll = await new Roll(rollStr).roll();
        if (print) roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: document }) });
        return this.options.operations[operation](roll.total, value);
    }

    static async resolve(document, data) {
        const { trueActions, falseActions } = data;
        if (await this._evalRoll(document, data)) await _resolveParse(document, trueActions);
        else await _resolveParse(document, falseActions);
    }
}

export const actions = [Comparison, UpdateDoc, Roll];
