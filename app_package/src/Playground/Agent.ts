import { Nullable, Vector3, Quaternion, TransformNode } from "@babylonjs/core";
import { Input } from "./Inputs/Input";

export class Agent {
    forward:Vector3 = new Vector3();
    up:Vector3 = new Vector3();
    right:Vector3 = new Vector3();
    quat: Quaternion = new Quaternion();
    position:Vector3 = new Vector3();

    input:Input = new Input();
    transformNode:Nullable<TransformNode> = null;

    // modify input to go toward a direction and return dot product 
    public goToward(aimPos: Vector3, aimAt: Vector3, turnRatio: number) {
        const dif = aimPos.subtract(aimAt);
        dif.normalize();
        const dotTgt = Vector3.Dot(dif, this.forward);
        this.input.dx = Vector3.Dot(dif, this.right) * turnRatio;//0.02;
        this.input.dy = -Vector3.Dot(dif, this.up) * turnRatio;//0.02;
        return dotTgt;
    }
}
