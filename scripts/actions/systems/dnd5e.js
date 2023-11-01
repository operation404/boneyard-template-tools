import { Action } from '../generic.js';

export const systemId = 'dnd5e';

class Damage extends Action {
    /**
     * @param {object} data
     * @param {string} data.damageType
     * @param {number} data.value
     * @param {boolean} [data.print]
     */
    constructor(data) {
        if (!data.hasOwnProperty('print')) data.print = false;
        super(data);
    }

    /**
     * @param {object} data
     * @param {string} data.damageType
     * @param {number} data.value
     * @param {boolean} [data.print]
     * @throws 'damageType' invalid.
     * @throws 'value' must be integer.
     * @throws 'print' must be boolean.
     */
    static validateData({ damageType, value, print }) {
        if (!CONFIG.DND5E.damageTypes.hasOwnProperty(damageType)) throw `'damageType' invalid.`;
        if (!Number.isInteger(value)) throw `'value' must be integer.`;
        if (typeof print !== 'boolean') throw `'print' must be boolean.`;
    }

    /**
     * Determine the damage type's multiplier for the actor.
     * @param {ActorDocument} actor
     * @param {string} damageType
     */
    static _getMultiplier(actor, damageType) {
        const { di: damageImmunities, dr: damageResistances, dv: damageVulnerabilities } = actor.system.traits;
        if (damageResistances.value.has(damageType)) {
            return 0.5;
        } else if (damageImmunities.value.has(damageType)) {
            return 0;
        } else if (damageVulnerabilities.value.has(damageType)) {
            return 2;
        }
        return 1;
    }

    /**
     * Apply damage or healing to the actor, accounting for immunities, resistances,
     * and vulnerabilities.
     * @param {ActorDocument} actor
     * @param {object} data
     * @param {string} data.damageType
     * @param {number} data.value
     */
    static resolve(actor, { damageType, value }) {
        actor.applyDamage(value, this._getMultiplier(actor, damageType));
    }
}

class Healing extends Damage {
    /**
     * @param {object} data
     * @param {number} data.value
     * @param {boolean} [data.print]
     */
    constructor(data) {
        super(data);
    }

    /**
     * @param {object} data
     * @param {number} data.value
     * @param {boolean} [data.print]
     * @throws 'value' must be integer.
     * @throws 'print' must be boolean.
     */
    static validateData({ value }) {
        if (!Number.isInteger(value)) throw `'value' must be integer.`;
        if (typeof print !== 'boolean') throw `'print' must be boolean.`;
    }

    /** @override */
    static _getMultiplier() {
        return -1;
    }
}

class SavingThrow extends Action {
    /**
     * @param {object} data
     * @param {string} data.save
     * @param {number} [data.bonus]
     * @param {number} data.dc
     * @param {Action|Action[]} data.passActions
     * @param {Action|Action[]} [data.failActions]
     * @param {boolean} [data.print]
     */
    constructor(data) {
        data.passActions = Array.isArray(data.passActions) ? data.passActions : [data.passActions];
        if (!data.hasOwnProperty('bonus')) data.bonus = 0;
        if (!data.hasOwnProperty('failActions')) data.failActions = [];
        data.failActions = Array.isArray(data.failActions) ? data.failActions : [data.failActions];
        if (!data.hasOwnProperty('print')) data.print = false;
        super(data);
    }

    /**
     * @param {object} data
     * @param {string} data.save
     * @param {number} [data.bonus]
     * @param {number} data.dc
     * @param {Action[]} data.passActions
     * @param {Action[]} [data.failActions]
     * @param {boolean} [data.print]
     * @throws 'save' invalid.
     * @throws 'bonus' must be integer.
     * @throws 'dc' must be integer.
     * @throws 'passActions' must be instance(s) of Action.
     * @throws 'failActions' must be instance(s) of Action.
     * @throws 'print' must be boolean.
     */
    static validateData({ save, bonus, dc, passActions, failActions }) {
        if (!CONFIG.DND5E.abilities.hasOwnProperty(save)) throw `'save' invalid.`;
        if (!Number.isInteger(bonus)) throw `'bonus' must be integer.`;
        if (!Number.isInteger(dc)) throw `'dc' must be integer.`;
        passActions.forEach((a) => {
            if (!(a instanceof Action)) throw `'passActions' must be instances of Action.`;
        });
        failActions.forEach((a) => {
            if (!(a instanceof Action)) throw `'failActions' must be instances of Action.`;
        });
        if (typeof print !== 'boolean') throw `'print' must be boolean.`;
    }

    static resolve({ save, bonus, dc, passActions, failActions }) {}
}

class AbilityCheck extends Action {}

class CreatureType extends Action {}

export const actions = [Damage, Healing];
