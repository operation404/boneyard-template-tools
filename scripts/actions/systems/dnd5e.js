import { Action } from '../generic.js';

export const systemId = 'dnd5e';

class Damage extends Action {
    static options = {
        extraDamageTypes: ['healing'],
    };

    /**
     * @param {object} data
     * @param {string} data.damageType
     * @param {number} data.value
     */
    constructor(data) {
        this.constructor.validateData(data);
        super(data);
        this.type = this.constructor.name;
        this.data = data;
    }

    /**
     * @param {object} data
     * @param {string} data.damageType
     * @param {number} data.value
     * @throws 'damageType' invalid.
     * @throws 'value' must be integer.
     */
    static validateData({ damageType, value }) {
        if (!(CONFIG.DND5E.damageTypes[damageType] || this.options.extraDamageTypes.includes(damageType)))
            throw `'damageType' invalid.`;
        if (!Number.isInteger(value)) throw `'value' must be integer.`;
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
        const { di: damageImmunities, dr: damageResistances, dv: damageVulnerabilities } = actor.system.traits;
        let multiplier = 1;
        if (damageType === 'healing') {
            multiplier = -1;
        } else if (damageResistances.value.has(damageType)) {
            multiplier = 0.5;
        } else if (damageImmunities.value.has(damageType)) {
            multiplier = 0;
        } else if (damageVulnerabilities.value.has(damageType)) {
            multiplier = 2;
        }
        actor.applyDamage(value, multiplier);
    }
}


class SavingThrow extends Action {}

class AbilityCheck extends Action {}

class CreatureType extends Action {}

export const actions = [Damage, Healing];
