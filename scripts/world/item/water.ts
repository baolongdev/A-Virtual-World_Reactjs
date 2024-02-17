import { Polygon } from "../primitives";
//! Done

export class Water {
    polys: Polygon[]
    innerPolys

    constructor(polys?: Polygon[], osm_obj?: any) {
        const skipID = 1065353689;
        const innerPolyIDs = [23768192, 23768066, 5114043, 23767896, 941885044, 938810226, 941885043, 943545970];

        this.polys = polys.reduce((acc, poly) => {
            if (poly.id === skipID) return acc;
            let points = poly.points;
            if (poly.id === 650261846) points = points.reverse();
            if (poly.id === 23842938 || poly.id === 1065353686) acc.push(new Polygon(points));
            if (poly.id === 23767974) acc.push(poly);
            return acc;
        }, []);

        this.innerPolys = polys.filter(p => innerPolyIDs.includes(p.id));
    }

    static load(waterInfo: Water) {
        const water = new Water([]);
        water.polys = waterInfo.polys.map((p) =>
            new Polygon(p.points)
        );
        water.innerPolys = waterInfo.innerPolys.map((p) =>
            new Polygon(p.points)
        );
        return water;
    }

    draw(ctx: CanvasRenderingContext2D, season: seasonProp) {
        const color = season === "autumn" ? "#0078DD" : season === "winter" ? "#00BCFF" : "#0096FF";
        const polysToDraw = [...this.polys, ...this.innerPolys];

        for (const poly of polysToDraw) {
            const fill = poly === this.innerPolys ? "black" : color;
            const stroke = poly === this.innerPolys ? "black" : "rgba(0,0,0,0)";
            poly.draw(ctx, { fill, stroke });
        }

        ctx.globalCompositeOperation = "source-over";
    }
}