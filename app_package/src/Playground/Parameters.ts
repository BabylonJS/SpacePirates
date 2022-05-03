import { Engine } from "@babylonjs/core";

export class Parameters {
    public static maxSpeed : number;
    public static maxAccel : number;
    public static missileCoolDownTime: number;

    public static mouseSensitivty : number;

    // time needed with ship on screen to lock missile
    public static timeToLockMissile : number;

    // max turn rate
    public static playerTurnRate : number;

    // time in ms for the IMMELMANN maneuver
    public static ImmelmannDuration : number;

    // Cone of perception that enemies can "see"
    // Higher values = wider cone
    public static AIPerceptionCone : number;

    // Distance behind a target ship that enemies will aim to follow
    // Higher values = enemies will keep their distance
    public static AIFollowDistance : number;

    public static AIPredictionRange : number;

    // how fast should they turn?
    public static AITurnRate : number;

    // magnitude of random offset to add to input every frame
    // this prevents AIs from having perfect accuracy
    public static AIInputRandomness : number;
    // how willing the AI is to fire
    // 0 = all the time
    // 1 = only with a perfect shot lined up
    public static AIFirePrecision : number;

    // how willing the AI is to when there's a friendly in front
    public static AIFriendlyFirePrecision : number;

    // how long the AI should evade for when hit (in ms)
    // evade basically means "panic and run away from shots"
    public static AIEvadeTime : number;

    // if the AI is slower than this, they won't break
    public static AIMinimumSpeed : number;

    // if the AI is faster than this, they won't burst
    public static AIMaximumSpeed : number;

    public static AIFireRange : number;

    public static AIBreakDistance : number;
    
    public static AIBurstDistance : number;

    public static AIMaxTargets : number;

    public static AIDebugLabels : boolean;

    public static AIImmelmannProbability : number;

    public static allyCount : number;

    public static enemyCount: number;

    public static recordFrameCount: number;

    public static allowSplitScreen: boolean;

    public static recorderActive: boolean;

    public static enableAudio: boolean;

    public static starfieldHeavyShader: boolean;

    public static guiFont = {
        family: "magistral, sans-serif",
        book: "300",
        bold: "700",
        style: "normal"
    }

    public static setFont(element: any, isBold: boolean) {
        element.fontFamily = Parameters.guiFont.family;
        if (isBold) {
            element.fontWeight = Parameters.guiFont.bold;
        } else {
            element.fontWeight = Parameters.guiFont.book;
        }
        element.fontStyle = Parameters.guiFont.style;
    }

    // paste exported parameters inside this function
    public static initialize() {
        this.maxSpeed = 2;
        this.maxAccel = 0.003;
        this.missileCoolDownTime = 10000;
        this.mouseSensitivty = 0.0003;
        this.timeToLockMissile = 2000;
        this.playerTurnRate = 0.04;
        this.AIPerceptionCone = -0.5;
        this.AIFollowDistance = -10;
        this.AIPredictionRange = 2;
        this.AITurnRate = 0.04;
        this.AIInputRandomness = 0;
        this.AIFirePrecision = 0.98;
        this.AIFriendlyFirePrecision = 0.97;
        this.AIEvadeTime = 3000;
        this.AIMinimumSpeed = 1;
        this.AIMaximumSpeed = 5;
        this.AIFireRange = 550;
        this.AIBreakDistance = 30;
        this.AIBurstDistance = 500;
        this.AIMaxTargets = 4;
        this.AIDebugLabels = false;
        this.AIImmelmannProbability = 0.2;
        this.ImmelmannDuration = 1000;
        this.allyCount = 10;
        this.enemyCount = 10;
        this.recordFrameCount = 2000;
        this.allowSplitScreen = false;
        this.recorderActive = true;
        this.enableAudio = true;
        this.starfieldHeavyShader = true;
    }

    public static getParameters(): (keyof Parameters)[] {
        const exclude = ["length", "name", "prototype", "initialize", "getParameters", "generateCode"];
        return Object.getOwnPropertyNames(Parameters).filter(name => exclude.indexOf(name) === -1) as (keyof Parameters)[];
    }

    public static generateCode(): string {
        let string = "";
        this.getParameters().forEach(param => {
            const value = this[param];
            let output;
            switch(typeof value) {
                case "string":
                    output = `"${value}""`;
                    break;
                case "number":
                    output = `${value}`;
                    break;
                case "boolean":
                    output = value ? "true" : "false";
                    break;
            }
            string += `this.${param} = ${output};\n`;
        })
        return string;
    }
}