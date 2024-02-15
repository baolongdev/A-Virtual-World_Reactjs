import { Polygon } from "./Polygon";
import { Segment } from "./primitives/segment";

export class Envelope {
    skeleton: Segment
    poly
    constructor(skeleton, width) {
        this.skeleton = skeleton;
        this.poly = this.generatePolygon(width);
    }

    private generatePolygon(width) {
        const { p1, p2 } = this.skeleton;

        const radius = width / 2;
        const alpha = Math.atan2(p1.y - p2.y, p1.x - p2.x);
        const alpha_cw = alpha * Math.PI / 2;
        const alpha_ccw = alpha - Math.PI / 2;
        const p1_ccw = translate(p1, alpha_ccw, radius);
        const p2_ccw = translate(p2, alpha_ccw, radius);
        const p2_cw = translate(p2, alpha_cw, radius);
        const p1_cw = translate(p1, alpha_cw, radius);

        return new Polygon([p1_ccw, p2_ccw, p2_cw, p1_cw]);
    }

}