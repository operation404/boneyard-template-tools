
/**
 * @class
 * @property {string} action
 * @property {string} type
 * @property {object} data
 */
class Action {
    /**
     * @param {string} action
     * @param {string} type
     * @param {object} data
     * @returns {Action}
     */
    static create(action, type, data) {
        switch (action) {
            case 'effect':
                return Effect.create(type, data);
            case 'conditional':
                return Conditional.create(type, data);
            default:
                throw `Invalid Action type.`;
        }
    }

    constructor(action, type, data) {
        this.action = action;
        this.type = type;
        this.data = data;
    }
}

class Conditional extends Action {
    static options = {
        savingThrow: ['physical', 'evasion', 'mental'],
        attributes: ['hd', 'hp'],
        operations: ['=', '!=', '>', '<', '>=', '<='],
    };

    /**
     * @param {string} type
     * @param {object} data
     * @returns {Conditional}
     */
    static create(type, data) {
        switch (type) {
            case 'savingThrow':
                return new Conditional(type, Conditional.#savingThrow(data));
            case 'skillCheck':
                return new Conditional(type, Conditional.#skillCheck(data));
            case 'comparison':
                return new Conditional(type, Conditional.#comparison(data));
            default:
                throw `Invalid conditional type.`;
        }
    }

    /**
     * @param {object} data
     * @param {string} data.save
     * @param {number} [data.modifier]
     * @param {Action|Action[]} [data.pass]
     * @param {Action|Action[]} [data.fail]
     * @returns {object}
     */
    static #savingThrow({ save, modifier, pass, fail }) {
        if (!Conditional.options.savingThrow.includes(save)) throw `Invalid save type.`;
        if (modifier && !Number.isInteger(modifier)) throw `Modifier must be integer.`;
        if (!pass && !fail) throw `Conditional must perform at least one action.`;
        return { save, modifier, pass, fail };
    }

    /**
     * TODO skills can be added dynamically to sheets so there's no fixed
     * list of them. Hardcode a list in? I'd need to add ways to specify custom
     * skills if so.
     * @param {object} data
     * @param {string} data.skill
     * @param {number} data.difficulty
     * @param {number} [data.modifier]
     * @param {Action|Action[]} [data.pass]
     * @param {Action|Action[]} [data.fail]
     * @returns {object}
     */
    static #skillCheck({ skill, difficulty, modifier, pass, fail }) {
        if (typeof skill !== 'string') throw `Type must be string.`;
        if (!Number.isInteger(difficulty)) throw `Difficulty must be integer.`;
        if (modifier && !Number.isInteger(modifier)) throw `Modifier must be integer.`;
        if (!pass && !fail) throw `Conditional must perform at least one action.`;
        return { skill, difficulty, modifier, pass, fail };
    }

    /**
     * @param {object} data
     * @param {string} data.attribute
     * @param {string} data.operation
     * @param {number} data.value
     * @param {Action|Action[]} [data.pass]
     * @param {Action|Action[]} [data.fail]
     * @returns {object}
     */
    static #comparison({ attribute, operation, value, pass, fail }) {
        if (!Conditional.options.attributes.includes(attribute)) throw `Invalid attribute type.`;
        if (!Conditional.options.operations.includes(operation)) throw `Invalid operation type.`;
        if (Number.isNaN(value)) throw `Value must be number.`;
        if (!pass && !fail) throw `Conditional must perform at least one action.`;
        return { attribute, operation, value, pass, fail };
    }

    /**
     * @param {string} type
     * @param {object} data
     */
    constructor(type, data) {
        this.action = 'condition';
        this.type = type;
        this.data = data;
    }
}

class Effect extends Action {
    static options = {
        status: ['create', 'delete'],
    };

    /**
     * @param {string} type
     * @param {object} data
     * @returns {Effect}
     */
    static create(type, data) {
        switch (type) {
            case 'damage':
                return new Effect(type, Effect.#damage(data));
            case 'status':
                return new Effect(type, Effect.#status(data));
            default:
                throw `Invalid effect type.`;
        }
    }

    /**
     * TODO update this to take roll strings.
     * @param {object} data
     * @param {number} data.value   The damage to apply.
     * @returns {{value:number}}
     */
    static #damage({ value }) {
        if (!Number.isInteger(value)) throw `Value must be integer.`;
        return { value };
    }

    /**
     * @param {object} data
     * @param {string} data.action  'create' or 'delete'
     * @param {string} data.id      Id of the status.
     * @returns {{type:string, id:string}}}
     */
    static #status({ action, id }) {
        if (!Effect.options.status.includes(action)) throw `Invalid status action.`;
        if (!CONFIG.statusEffects.find((s) => s.id === id)) throw `Invalid status id.`;
        return { action, id };
    }

    /**
     * @param {string} type
     * @param {object} data
     */
    constructor(type, data) {
        this.action = 'effect';
        this.type = type;
        this.data = data;
    }
}
