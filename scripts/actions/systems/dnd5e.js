import { Action } from '../generic.js';

export const systemId = 'dnd5e';

class Damage extends Action {
    /**
     * @param {object} data
     * @param {string} data.damageType
     * @param {number} data.value
     */
    constructor(data) {
        super(data);
    }

    /**
     * @param {object} data
     * @param {string} data.damageType
     * @param {number} data.value
     * @throws 'damageType' invalid.
     * @throws 'value' must be integer.
     */
    static validateData({ damageType, value }) {
        if (!CONFIG.DND5E.damageTypes[damageType]) throw `'damageType' invalid.`;
        if (!Number.isInteger(value)) throw `'value' must be integer.`;
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
    /** @override */
    static validateData({ value }) {
        if (!Number.isInteger(value)) throw `'value' must be integer.`;
    }

    /** @override */
    static _getMultiplier() {
        return -1;
    }
}

class SavingThrow extends Action {}

class AbilityCheck extends Action {}

class CreatureType extends Action {}

export const actions = [Damage, Healing];
