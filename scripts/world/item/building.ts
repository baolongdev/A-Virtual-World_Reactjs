import { getFake3dPoint, average } from "../math";
import { Point, Polygon } from "../primitives";
// TODO Config chua xong
export class Building {
    base: Polygon
    height: number
    imgOffset: Point
    imgScaler: number
    id: number
    img: HTMLImageElement
    floorPlan: HTMLImageElement
    floorPlanScaler: number
    floorPlanOffset: number

    constructor(poly: Polygon, height = 200) {
        this.base = poly;
        this.height = height;
        this.imgOffset = new Point(0, 0);
        this.imgScaler = 1;
        this.id = null
        this.img = null
        this.base.simplify();
        this.floorPlan = null
        this.floorPlanScaler = null
        this.floorPlanOffset = null


    }
    static load(info: Building, index) {
        const b = new Building(Polygon.load(info.base), info.height);
        if (info.id) {
            b.id = info.id;
        } else {
            b.id = index;
        }
        const imageDetails = {
            237888253: { src: "imgs/solenovo.png", scaler: 0.9, offset: new Point(-50, -550) },
            104710130: { src: "imgs/arbonaut.png" },
            40351427: { src: "imgs/karelics.png", scaler: 1.3 },
            87998750: { src: "imgs/tiedepuisto.png", scaler: 2.3, offset: new Point(200, 0) },
            1132503307: { src: "imgs/uef.png", scaler: 1.5 },
            88110497: { src: "imgs/karelia.png", scaler: 1.3, offset: new Point(-140, 430), floorPlan: "imgs/floorplan.png", floorPlanScaler: 1, floorPlanOffset: new Point(50, 320) },
            88040524: { src: "imgs/karelia.png", scaler: 1.4, offset: new Point(-330, 0) }
        };

        const details = imageDetails[b.id];
        if (details) {
            b.img = new Image();
            b.img.src = details.src;
            if (details.scaler) b.imgScaler = details.scaler;
            if (details.offset) b.imgOffset = details.offset;
            if (details.floorPlan) {
                b.floorPlan = new Image();
                b.floorPlan.src = details.floorPlan;
                b.floorPlanScaler = details.floorPlanScaler;
                b.floorPlanOffset = details.floorPlanOffset;
            }
        }

        b.base.simplify();
        return b;
    }

    update(viewPoint) {
        const topPoints = this.base.points.map((p) =>
            getFake3dPoint(p, viewPoint, this.height * 0.6)
        );
        const ceiling = new Polygon(topPoints);
        ceiling.base = this.base;

        const sides = [];
        for (let i = 0; i < this.base.points.length; i++) {
            const nextI = (i + 1) % this.base.points.length;
            const poly = new Polygon([
                this.base.points[i],
                this.base.points[nextI],
                topPoints[nextI],
                topPoints[i],
            ]);
            sides.push(poly);
        }

        if (this.floorPlan) {
            const minX = Math.min(...this.base.points.map((p) => p.x));
            const maxX = Math.max(...this.base.points.map((p) => p.x));
            const minY = Math.min(...this.base.points.map((p) => p.y));
            const maxY = Math.max(...this.base.points.map((p) => p.y));
            const center = new Point((minX + maxX) / 2, (minY + maxY) / 2);
            this.base.floorPlan = this.floorPlan;
            this.base.floorPlanOffset = this.floorPlanOffset;
            this.base.floorPlanLoc = center;
            this.base.floorPlanSize = 1000;
        }
        if (this.img) {
            ceiling.img = this.img;
            ceiling.imgOffset = this.imgOffset;
            ceiling.imgScaler = this.imgScaler;

            const minX = Math.min(...this.base.points.map((p) => p.x));
            const maxX = Math.max(...this.base.points.map((p) => p.x));
            const minY = Math.min(...this.base.points.map((p) => p.y));
            const maxY = Math.max(...this.base.points.map((p) => p.y));
            const center = add(
                ceiling.imgOffset,
                new Point((minX + maxX) / 2, (minY + maxY) / 2)
            );
            ceiling.imgLoc = getFake3dPoint(center, viewPoint, this.height * 0.6);

            let rad = Number.MAX_SAFE_INTEGER;

            for (const seg of this.base.segments) {
                const d = seg.distanceToPoint(center);
                if (d < rad) {
                    rad = d;
                }
            }
            rad /= Math.sqrt(2);
            rad *= 0.8;
            ceiling.imgSize = rad * 2 * ceiling.imgScaler;
        }

        let roofPolys = [];
        if (this.base.points.length == 4 || this.base.points.length == 5) {
            ceiling.dark = true;

            const baseMidpoints = [
                average(this.base.points[0], this.base.points[1]),
                average(this.base.points[2], this.base.points[3]),
            ];

            const topMidpoints = baseMidpoints.map((p) =>
                getFake3dPoint(p, viewPoint, this.height)
            );

            roofPolys = [
                new Polygon([
                    ceiling.points[0],
                    ceiling.points[3],
                    topMidpoints[1],
                    topMidpoints[0],
                ]),
                new Polygon([
                    ceiling.points[2],
                    ceiling.points[1],
                    topMidpoints[0],
                    topMidpoints[1],
                ]),
            ];
            roofPolys.sort(
                (a, b) =>
                    b.distanceToPoint(viewPoint) - a.distanceToPoint(viewPoint)
            );
        }
        return { ceiling, sides, roofPolys };
    }

    draw(ctx, viewPoint) {
        const topPoints = this.base.points.map((p) =>
            getFake3dPoint(p, viewPoint, this.height * 0.6)
        );
        const ceiling = new Polygon(topPoints);

        const sides: Polygon[] = [];
        for (let i = 0; i < this.base.points.length; i++) {
            const nextI = (i + 1) % this.base.points.length;
            const poly = new Polygon([
                this.base.points[i],
                this.base.points[nextI],
                topPoints[nextI],
                topPoints[i]
            ])
            sides.push(poly);
        }
        sides.sort(
            (a, b) =>
                b.distanceToPoint(viewPoint) -
                a.distanceToPoint(viewPoint)
        )

        // const baseMidpoints = [
        //     average(this.base.points[0], this.base.points[1]),
        //     average(this.base.points[2], this.base.points[3])
        // ];

        // const topMidpoints = baseMidpoints.map((p) =>
        //     getFake3dPoint(p, viewPoint, this.height)
        // );

        // const roofPolys = [
        //     new Polygon([
        //         ceiling.points[0], ceiling.points[3],
        //         topMidpoints[1], topMidpoints[0]
        //     ]),
        //     new Polygon([
        //         ceiling.points[2], ceiling.points[1],
        //         topMidpoints[0], topMidpoints[1]
        //     ])
        // ];

        // roofPolys.sort(
        //     (a, b) =>
        //         b.distanceToPoint(viewPoint) -
        //         a.distanceToPoint(viewPoint)
        // );

        this.base.draw(ctx, {
            fill: "white",
            stroke: "rgba(0,0,0,0.2)",
            lineWidth: 20
        });
        for (const side of sides) {
            side.draw(ctx, { fill: "#999", stroke: "#555", join: "round" });
        }
        ceiling.draw(ctx, { fill: "white", stroke: "white", lineWidth: 6 });
        // for (const poly of roofPolys) {
        //     poly.draw(ctx, { fill: "#D44", stroke: "#C44", lineWidth: 8, join: "round" });
        // }
    }
}