import * as CONST from '../constants.js';

/** @inheritdoc */
export class ByMeasuredTemplateDocument extends CONFIG.MeasuredTemplate.documentClass {
    /**
     * Attempt to override the core MeasuredTemplateDocument class.
     * If the targeting mode setting cannot be read, the core class is not overriden.
     */
    static overrideMeasuredTemplateDocument() {
        console.log(CONFIG.MeasuredTemplate);
        ByMeasuredTemplateDocument._defaultTargetingMode = game.settings.get(
            CONST.MODULE,
            CONST.SETTINGS.TARGETING_MODE
        );
        if (ByMeasuredTemplateDocument._defaultTargetingMode) {
            
            //
            //
            //
            //
            /* 

            Overriding like this doesn't work. It does replace the original in the config, and when drawing templates
            it calls my new instance methods. But when it comes time to actually create the document for real, foundry
            has a complicated process of client-server communication, and along that process the way the documents
            are truly created is by first finding the collection they will be embedded into, and then passing the data
            that will be used to the collection, which contains a reference to the document class that the collction contains.
            It uses that document class reference along with the passed in data to create the actual documents, it completely
            ignores what I set in config.

            So I either need to find a way to change the collection's document class reference somehow, or I need to do
            what was mentioned by someone and directly modify the prototype of the document class that I want to override
            currently.

            Libwrapper was also suggested for this, though I'm not sure if it'll really do what I want since I'm not intending
            to overwrite any existing methods or properties, rather solely add new ones. At least for now.

            Not sure which of these is easier/better practice to do.
            
            */
            CONFIG.MeasuredTemplate.documentClass = ByMeasuredTemplateDocument;




            console.log(`====== Boneyard ======\n - ByMeasuredTemplateDocument override success`);
        } else {
            console.error(
                `\n==\n==\nFailed to read '${CONST.SETTINGS.TARGETING_MODE}' setting. MeasuredTemplateDocument will not be extended.\n==\n==\n`
            );
        }
    }

    static _defaultTargetingMode;

    constructor(...args) {
        super(...args);
        console.log('BY successful override');
        console.log(this.containedTokens());
        console.log(this.containsToken());
        console.log(this.id);
    }

    containsToken(tokenDocument) {
        return false;
    }

    containedTokens() {
        return [];
    }
}
