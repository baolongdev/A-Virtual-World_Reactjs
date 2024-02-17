import { Marking } from "./markings/marking";
import { Building } from "./item/building";
import { Tree } from "./item/tree";
import { Graph } from "./math/graph";
import { add, distance, getNearestPoint, getNearestSegments, lerp, scale } from "./math/utils";
import { Envelope } from "./primitives/envelope";
import { Point } from "./primitives/point";
import { Polygon } from "./primitives/polygon";
import { Segment } from "./primitives/segment";
import { load } from "./markings/load";
import { Car } from "../car";
import { Light, Start, Target } from "./markings";
import { Water } from "./item";
import { Grid, drawCell } from "./grid";

export class World {
    graph: Graph
    roadWidth: number
    roadRoundness: number
    envelopes: Envelope[]
    intersections: Point[]
    roadBorders: Segment[]
    buildingWidth: number
    buildingMinLength: number
    spacing: number
    buildings: Building[]
    trees: Tree[]
    treeSize: number
    laneGuides: Segment[]
    markings: Marking[]
    zoom: number
    offset: Point
    cars: Car[]
    bestCar: Car
    frameCount: number
    drawContents: ("envelopes" | "items" | "3d" | "markings")[]
    water: Water
    grid: Grid
    activeRoadBorders

    constructor(
        graph: Graph,
        roadWidth: number = 100,
        roadRoundness: number = 10,
        buildingWidth: number = 150,
        buildingMinLength: number = 150,
        spacing: number = 50,
        treeSize: number = 160
    ) {
        this.graph = graph;
        this.roadWidth = roadWidth;
        this.roadRoundness = roadRoundness;
        this.buildingWidth = buildingWidth
        this.buildingMinLength = buildingMinLength
        this.spacing = spacing
        this.treeSize = treeSize

        this.envelopes = [];
        this.roadBorders = [];
        this.buildings = [];
        this.trees = [];
        this.laneGuides = [];

        this.markings = [];

        this.cars = [];

        this.bestCar = null;

        this.frameCount = 100;

        this.drawContents = ["envelopes", "items", "3d", "markings"];

        // NEW //!!
        this.water = null;

        this.generate();
    }

    static load(info: World) {
        const world = new World(new Graph());
        world.graph = Graph.load(info.graph);
        world.roadWidth = info.roadWidth;
        world.roadRoundness = info.roadRoundness;
        world.buildingWidth = info.buildingWidth;
        world.buildingMinLength = info.buildingMinLength;
        world.spacing = info.spacing;
        world.treeSize = info.treeSize;
        world.envelopes = info.envelopes.map((e) => Envelope.load(e));
        /*
        if (info.layer0) {
            world.layer0 = info.layer0.map(
            (s) => new Segment(s.p1, s.p2, s.oneWay, s.layer)
            );
            world.layer1 = info.layer1.map(
            (s) => new Segment(s.p1, s.p2, s.oneWay, s.layer)
            );
        }
        */
        if (info.roadBorders) {
            world.roadBorders = info.roadBorders.map((b) => new Segment(b.p1, b.p2, b.oneWay, b.layer));
        } else {
            world.roadBorders = info.roadPoly.segments.map((b) => new Segment(b.p1, b.p2));
        }
        // world.roadBorders = info.roadBorders.map((b) => new Segment(b.p1, b.p2));
        world.buildings = info.buildings.map((e, index) => Building.load(e, index));
        world.trees = info.trees.map((t) => new Tree(t.center, info.treeSize));
        world.laneGuides = info.laneGuides.map((g) => new Segment(g.p1, g.p2));
        world.markings = info.markings.map((m) => load(m));
        try {
            world.water = Water.load(info.water);
        } catch (err) { }
        world.zoom = info.zoom;
        world.offset = info.offset;
        world.grid = info.grid;
        return world;
    }

    isOnRoad(car) {
        const data = this.grid.getDataFromNearbyCells(car);

        for (const e of data.envelopes) {
            if (e.poly.containsPoly(new Polygon(car.polygon))) {
                return true;
            }
        }
        return false;
    }

    getNearbyRoadBorders(car) {
        //const data = grid.getDataFromCellsInActiveRegion(car.getBounds());
        const data = this.grid.getDataFromNearbyCells(car);

        return data.roadBorders;
    }

    getNearbyItemBorders(car) {
        //const data = grid.getDataFromCellsInActiveRegion(car.getBounds());
        const data = this.grid.getDataFromNearbyCells(car);

        return data.buildings
            .concat(data.trees)
            .map((i) => i.base.segments)
            .flat();
    }

    getNearestGraphSegments(car) {
        //const data = grid.getDataFromCellsInActiveRegion(car.getBounds());
        const data = this.grid.getDataFromNearbyCells(car);
        const segs = getNearestSegments(car, data.graphSegments, 300);
        return segs;
    }

    generate() {
        this.envelopes.length = 0;
        for (const seg of this.graph.segments) {
            const e = new Envelope(seg, this.roadWidth, this.roadRoundness);
            e.layer = seg.layer;
            this.envelopes.push(e);
        }

        const layer0 = Polygon.union(
            this.envelopes.filter((e) => e.layer != 1).map((e) => e.poly)
        );
        const layer1 = Polygon.union(
            this.envelopes.filter((e) => e.layer == 1).map((e) => e.poly)
        );
        for (const seg of layer1) {
            seg.layer = 1;
        }

        this.roadBorders = [...layer0, ...layer1];
        // this.roadBorders = Polygon.union(this.envelopes.map((e) => e.poly));
        this.buildings = this.generateBuildings();
        this.trees = this.generateTrees();

        this.laneGuides.length = 0;
        this.laneGuides.push(...this.generateLaneGuides());
        this.intersections = null;
    }

    addMoreTrees(maxTryCount = 10) {
        const points = [
            ...this.roadBorders.map((s) => [s.p1, s.p2]).flat(),
            ...this.buildings.map((b) => b.base.points).flat(),
        ];
        const left = Math.min(...points.map((p) => p.x));
        const right = Math.max(...points.map((p) => p.x));
        const top = Math.min(...points.map((p) => p.y));
        const bottom = Math.max(...points.map((p) => p.y));

        const illegalPolys = [
            ...this.buildings.map((b) => b.base),
            ...this.envelopes.map((e) => e.poly),
        ];
        if (this.water) {
            illegalPolys.push(...this.water.polys);
        }

        const trees = this.trees;
        let tryCount = 0;
        while (tryCount < maxTryCount) {
            const p = new Point(
                lerp(left, right, Math.random()),
                lerp(bottom, top, Math.random())
            );

            // check if tree inside or nearby building / road
            let keep = true;
            for (const poly of illegalPolys) {
                if (
                    poly.containsPoint(p) ||
                    poly.distanceToPoint(p) < this.treeSize / 2
                ) {
                    keep = false;
                    break;
                }
            }
            if (keep == false && this.water) {
                for (const poly of this.water.innerPolys) {
                    if (
                        poly.containsPoint(p) ||
                        poly.distanceToPoint(p) < this.treeSize / 2
                    ) {
                        keep = true;
                        break;
                    }
                }
            }

            // check if tree too close to other trees
            if (keep) {
                for (const tree of trees) {
                    if (distance(tree.center, p) < this.treeSize) {
                        keep = false;
                        break;
                    }
                }
            }

            // avoiding trees in the middle of nowhere
            if (keep) {
                let closeToSomething = false;
                for (const poly of illegalPolys) {
                    if (poly.distanceToPoint(p) < this.treeSize * 2) {
                        closeToSomething = true;
                        break;
                    }
                }
                keep = closeToSomething;
            }

            if (keep) {
                trees.push(new Tree(p, this.treeSize));
                tryCount = 0;
            }
            tryCount++;
        }
        return trees;
    }

    generateShortestPathBorders(car, endPoint: Point) {
        if (!car.segment) {
            return [];
        }
        //let start = performance.now()
        const path = this.graph.shortestPath(car, endPoint);
        //let mid=performance.now();
        //const path2 = this.graph.shortestPath_SLOW(car, endPoint);
        //let end=performance.now();
        /*for(let i=0;i<path.length;i++){
              if(!path[i].equals(path2[i])){
                  console.log("PROBLEM");
                  break;
              }
          }*/
        let st = performance.now();
        const tmpEnvelopes = [];
        const skels = [];
        for (let i = 1; i < path.length; i++) {
            const seg = new Segment(path[i - 1], path[i]);
            skels.push(seg);
            tmpEnvelopes.push(
                new Envelope(seg, this.roadWidth, this.roadRoundness)
            );
        }
        car.shortestPath = skels;
        let mid = performance.now();
        const segments = Polygon.union(tmpEnvelopes.map((e) => e.poly));
        let end = performance.now();
        //console.log(mid-st,end-mid);

        return segments.map((s) => [s.p1, s.p2]);
    }

    private generateLaneGuides() {
        const tmpEnvelopes: Envelope[] = [];
        for (const seg of this.graph.segments) {
            tmpEnvelopes.push(
                new Envelope(
                    seg,
                    this.roadWidth / 2,
                    this.roadRoundness
                )
            )
        }
        const segments = Polygon.union(tmpEnvelopes.map((e) => e.poly));
        return segments;
    }

    private generateTrees() {
        const points = [
            ...this.roadBorders.map((s) => [s.p1, s.p2]).flat(),
            ...this.buildings.map((b) => b.base.points).flat()
        ];
        const left = Math.min(...points.map((p) => p.x));
        const right = Math.max(...points.map((p) => p.x));
        const top = Math.min(...points.map((p) => p.y));
        const bottom = Math.max(...points.map((p) => p.y));

        const illegalPolys = [
            ...this.buildings.map((b) => b.base),
            ...this.envelopes.map((e) => e.poly)
        ];
        if (this.water) {
            illegalPolys.push(...this.water.polys);
        }

        const trees: Tree[] = [];
        let tryCount = 0;
        while (tryCount < 50) {
            const p = new Point(
                lerp(left, right, Math.random()),
                lerp(bottom, top, Math.random()),
            );

            // check if tree inside or nearby building / road
            let keep = true;
            for (const poly of illegalPolys) {
                if (poly.containsPoint(p) || poly.distanceToPoint(p) < this.treeSize / 2) {
                    keep = false;
                    break;
                }
            }
            if (keep == false && this.water) {
                for (const poly of this.water.innerPolys) {
                    if (poly.containsPoint(p) || poly.distanceToPoint(p) < this.treeSize / 2
                    ) {
                        keep = true;
                        break;
                    }
                }
            }

            // check if tree too close to other trees
            if (keep) {
                for (const tree of trees) {
                    if (distance(tree.center, p) < this.treeSize) {
                        keep = false;
                        break;
                    }
                }
            }

            // avoiding trees in the middle of nowhere
            if (keep) {
                let closeToSomething = false;
                for (const poly of illegalPolys) {
                    if (poly.distanceToPoint(p) < this.treeSize * 2) {
                        closeToSomething = true;
                        break
                    }
                }
                keep = closeToSomething;
            }

            if (keep) {
                trees.push(new Tree(p, this.treeSize));
                tryCount = 0;
            }
            tryCount++;
        }
        return trees;
    }
    private generateBuildings() {
        const tmpEnvelopes: Envelope[] = [];
        for (const seg of this.graph.segments) {
            tmpEnvelopes.push(
                new Envelope(
                    seg,
                    this.roadWidth + this.buildingWidth + this.spacing * 2,
                    this.roadRoundness
                )
            )
        }

        const guides: Segment[] = Polygon.union(tmpEnvelopes.map((e) => e.poly))

        for (let i = 0; i < guides.length; i++) {
            const seg = guides[i];
            if (seg.length() < this.buildingMinLength) {
                guides.splice(i, 1);
                i--;
            }
        }

        const supports: Segment[] = [];
        for (let seg of guides) {
            const len = seg.length() + this.spacing;
            const buildingCount = Math.floor(
                len / (this.buildingMinLength + this.spacing)
            )
            const buildingLength = len / buildingCount - this.spacing;

            const dir = seg.directionVector();

            let q1 = seg.p1;
            let q2 = add(q1, scale(dir, buildingLength));
            supports.push(new Segment(q1, q2));

            for (let i = 2; i <= buildingCount; i++) {
                q1 = add(q2, scale(dir, this.spacing));
                q2 = add(q1, scale(dir, buildingLength));
                supports.push(new Segment(q1, q2));
            }
        }

        const bases: Polygon[] = [];
        for (const seg of supports) {
            bases.push(new Envelope(seg, this.buildingWidth).poly);
        }

        const eps = 0.001;
        for (let i = 0; i < bases.length - 1; i++) {
            for (let j = i + 1; j < bases.length; j++) {
                if (
                    bases[i].intersectsPoly(bases[j]) ||
                    bases[i].distanceToPoly(bases[j]) < this.spacing - eps
                ) {
                    bases.splice(j, 1);
                    j--;
                }
            }
        }

        return bases.map((b) => new Building(b));
    }

    private getIntersections() {
        const subset = [];
        for (const point of this.graph.points) {
            let degree = 0;
            for (const seg of this.graph.segments) {
                if (seg.includes(point)) {
                    degree++;
                }
            }

            if (degree > 2) {
                subset.push(point);
            }
        }
        return subset;
    }

    private updateLights() {
        if (this.intersections == null) {
            this.intersections = this.getIntersections();
        }
        const lights = this.markings.filter((m) => m instanceof Light);
        const controlCenters = [];
        for (const light of lights) {
            const point = getNearestPoint(light.center, this.intersections);
            let controlCenter = controlCenters.find((c) => c.equals(point));
            if (!controlCenter) {
                controlCenter = new Point(point.x, point.y);
                controlCenter.lights = [light];
                controlCenters.push(controlCenter);
            } else {
                controlCenter.lights.push(light);
            }
        }
        const greenDuration = 2,
            yellowDuration = 1;
        for (const center of controlCenters) {
            center.ticks = center.lights.length * (greenDuration + yellowDuration);
        }
        const tick = Math.floor(this.frameCount / 60);
        for (const center of controlCenters) {
            const cTick = tick % center.ticks;
            const greenYellowIndex = Math.floor(
                cTick / (greenDuration + yellowDuration)
            );
            const greenYellowState =
                cTick % (greenDuration + yellowDuration) < greenDuration
                    ? "green"
                    : "yellow";
            for (let i = 0; i < center.lights.length; i++) {
                if (i == greenYellowIndex) {
                    center.lights[i].state = greenYellowState;
                } else {
                    center.lights[i].state = "red";
                }
            }
        }
        this.frameCount++;
    }

    draw3dItems(ctx: CanvasRenderingContext2D,
        viewPoint: Point, buildings: Building[], trees: Tree[], season: seasonProp) {
        const allCeilings: Polygon[] = [];
        const allRoofPolys: Polygon[] = [];
        const allSides: Polygon[] = [];
        const allBases: Polygon[] = [];
        const treeBases: Polygon[] = [];
        for (const b of buildings) {
            const { ceiling, sides, roofPolys } = b.update(viewPoint);
            allSides.push(...sides);
            allBases.push(b.base);
            allCeilings.push(ceiling);
            allRoofPolys.push(...roofPolys);
        }

        for (const t of trees) {
            treeBases.push(t.base);
        }

        if (this.drawContents.includes("3d")) {
            for (const b of allBases) {
                b.draw(ctx, {
                    fill: "rgba(0,0,0,0)",
                    stroke: "rgba(0,0,0,0.2)",
                    lineWidth: 10,
                });
                if (b.floorPlan) {
                    ctx.drawImage(
                        b.floorPlan,
                        b.floorPlanLoc.x + b.floorPlanOffset.x - b.floorPlanSize / 2,
                        b.floorPlanLoc.y + b.floorPlanOffset.y - b.floorPlanSize / 2,
                        b.floorPlanSize,
                        b.floorPlanSize
                    );
                    //ctx.drawImage(c.img,center.x,center.y,100,100);
                    //center.draw(ctx);
                }
            }
        } else {
            for (const b of allBases) {
                b.draw(ctx, {
                    fill: "#DDD",
                    stroke: "#555",
                });
            }
            for (const t of treeBases) {
                t.draw(ctx, {
                    fill: "#4F9",
                    stroke: "green",
                });
            }
        }

        if (this.drawContents.includes("3d")) {
            for (const s of allSides) {
                // s.base = s.segments[0];
                s.base = s.segments[0];
            }
            const items = [...allSides, ...trees];
            //this.items=items;
            items.sort(
                (a, b) =>
                    b.base.distanceToPoint(viewPoint) -
                    a.base.distanceToPoint(viewPoint)
            );
            allRoofPolys.sort(
                (a, b) =>
                    b.distanceToPoint(viewPoint) - a.distanceToPoint(viewPoint)
            );
            for (const item of items) {
                if (item instanceof Tree) {
                    item.draw(ctx, viewPoint);
                } else {
                    //side
                    item.draw(ctx, {
                        fill: "#BBB",
                        stroke: "#555",
                        join: "round",
                    });
                }
            }

            for (const c of allCeilings) {
                for (const car of this.cars) {
                    if (
                        car.state != "helicopter" &&
                        (c.base as Polygon).containsPoly(new Polygon(car.polygon))
                    ) {
                        ctx.globalAlpha = 0.5;
                        break;
                    }
                }


                if (c.dark) {
                    c.draw(ctx, {
                        fill: "#BBB",
                        stroke: "#BBB",
                        join: "round",
                        lineWidth: 6,
                    });
                } else {
                    if (season == "autumn") {
                        c.draw(ctx, {
                            fill: "#CCC",
                            stroke: "#444",
                            join: "round",
                        });
                    } else {
                        c.draw(ctx, {
                            fill: "#DDD",
                            stroke: "#555",
                            join: "round",
                        });
                    }
                }

                if (c.img) {
                    ctx.drawImage(
                        c.img,
                        c.imgLoc.x - c.imgSize / 2,
                        c.imgLoc.y - c.imgSize / 2,
                        c.imgSize,
                        c.imgSize
                    );
                    //ctx.drawImage(c.img,center.x,center.y,100,100);
                    //center.draw(ctx);
                }
                ctx.globalAlpha = 1;
            }

            for (const poly of allRoofPolys) {
                //poly.draw(ctx, { fill: "#D44", stroke: "#C44", lineWidth: 8, join: "round" });
                if (season == "winter") {
                    poly.draw(ctx, {
                        fill: "#DDD",
                        stroke: "#AAA",
                        lineWidth: 6,
                        join: "round",
                    });
                    poly.draw(ctx, {
                        fill: "#DDD",
                        stroke: "#AAA",
                        lineWidth: 2,
                        join: "round",
                    });
                } else if (season == "autumn") {
                    poly.draw(ctx, {
                        fill: "#A88",
                        stroke: "#555",
                        lineWidth: 6,
                        join: "round",
                    });
                    poly.draw(ctx, {
                        fill: "#A88",
                        stroke: "#A88",
                        lineWidth: 2,
                        join: "round",
                    });
                } else {
                    poly.draw(ctx, {
                        fill: "#E88",
                        stroke: "#555",
                        lineWidth: 6,
                        join: "round",
                    });
                    poly.draw(ctx, {
                        fill: "#E88",
                        stroke: "#E88",
                        lineWidth: 2,
                        join: "round",
                    });
                }
            }
        }
    }

    private drawCars(ctx: CanvasRenderingContext2D, optimizing, layerCheck = null, boats = false) {
        if (optimizing) {
            ctx.globalAlpha = 0.2;
            for (const car of this.cars) {
                if (car.state == "boat" && boats == false) {
                    continue;
                }
                if (car.state != "boat" && boats == true) {
                    continue;
                }
                if (car.layer == layerCheck) {
                    car.draw(ctx, true);
                }
            }
            ctx.globalAlpha = 1;
            if (
                this.bestCar &&
                ((this.bestCar.state == "boat" && boats == true) ||
                    (this.bestCar.state != "boat" && boats == false))
            ) {
                if (this.bestCar.layer == layerCheck) {
                    this.bestCar.draw(ctx);
                }
            }
        } else {
            for (const car of this.cars) {
                if (car.state == "boat" && boats == false) {
                    continue;
                }
                if (car.state != "boat" && boats == true) {
                    continue;
                }
                if (car.layer == layerCheck) {
                    car.draw(ctx);
                }
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, viewPoint: Point, showStartMarkings = true, renderRadius = 1000,
        season: seasonProp,
        activeRegion,
        optimizing = false,
        useGrid = true
    ) {
        this.updateLights();

        if (this.water) {
            this.water.draw(ctx);
        }
        //ctx.globalAlpha=0.5;
        //ctx.globalAlpha=0.5;
        if (!this.grid || useGrid == false) {
            this.drawCars(ctx, optimizing, null, true);
            if (this.drawContents.includes("envelopes")) {
                for (const env of this.envelopes) {
                    env.draw(ctx, {
                        fill: "#BBB",
                        stroke: "#BBB",
                        lineWidth: 15,
                    });
                }
            }
            if (this.drawContents.includes("markings")) {
                for (const marking of this.markings) {
                    if (
                        !(marking instanceof Start || marking instanceof Target) ||
                        showStartMarkings
                    ) {
                        marking.draw(ctx);
                    }
                }
            }
            if (this.drawContents.includes("envelopes")) {
                for (const seg of this.graph.segments) {
                    seg.draw(ctx, { color: "white", width: 4, dash: [10, 10] });
                }
                for (const seg of this.roadBorders) {
                    seg.draw(ctx, { color: "white", width: 4 });
                }
            }

            this.drawCars(ctx, optimizing, null);

            if (this.drawContents.includes("items")) {
                const rad = 3000;
                const buildings = this.buildings.filter(
                    (b) => b.base.distanceToPoint(viewPoint) < rad
                );
                const trees = this.trees.filter(
                    (b) => b.base.distanceToPoint(viewPoint) < rad
                );

                this.draw3dItems(ctx, viewPoint, buildings, trees, season);
            }
            /*
            for (const env of this.envelopes.filter((e) => e.layer == 1)) {
               env.draw(ctx, { fill: "#BBB", stroke: "#BBB", lineWidth: 15 });
            }*/

            if (this.drawContents.includes("envelopes")) {
                for (const seg of this.graph.segments.filter((e) => e.layer == 1)) {
                    seg.draw(ctx, {
                        color: "#BBB",
                        width: this.roadWidth + 15,
                    });
                }

                for (const seg of this.graph.segments.filter((b) => b.layer == 1)) {
                    seg.draw(ctx, { color: "white", width: 4, dash: [10, 10] });
                }

                for (const seg of this.roadBorders.filter((b) => b.layer == 1)) {
                    seg.draw(ctx, { color: "white", width: 4 });
                }
            }

            this.drawCars(ctx, optimizing, 1);
        } else {
            if (season == "winter") {
                ctx.canvas.style.background =
                    "radial-gradient(circle farthest-side, #FFF, #DDD)";
            } else if (season == "autumn") {
                ctx.canvas.style.background =
                    "radial-gradient(circle farthest-side, #987, #554)";
            }
            const data = this.grid.getDataFromCellsInActiveRegion(activeRegion);
            this.activeRoadBorders = data.roadBorders;


            this.drawCars(ctx, optimizing, null, true);

            if (this.drawContents.includes("envelopes")) {
                for (const env of data.envelopes) {
                    env.draw(ctx, {
                        fill: "#BBB",
                        stroke: "#BBB",
                        lineWidth: 15,
                    });
                }
            }

            if (this.drawContents.includes("markings")) {
                for (const marking of data.markings) {
                    if (
                        !(marking instanceof Start || marking instanceof Target) ||
                        showStartMarkings
                    ) {
                        marking.draw(ctx);
                    }
                }
            }

            if (this.drawContents.includes("envelopes")) {
                for (const seg of data.graphSegments) {
                    seg.draw(ctx, { color: "white", width: 4, dash: [10, 10] });
                }
                for (const seg of data.roadBorders) {
                    seg.draw(ctx, { color: "white", width: 4 });
                }
            }

            /*
            try {
               for (const seg of this.bestCar.assignedBorders) {
                  ctx.beginPath();
                  ctx.strokeStyle = "red";
                  ctx.moveTo(seg[0].x, seg[0].y);
                  ctx.lineTo(seg[1].x, seg[1].y);
                  ctx.stroke();
               }
            } catch (err) {}
            */

            this.drawCars(ctx, optimizing, null);

            if (this.drawContents.includes("items")) {
                this.draw3dItems(ctx, viewPoint, data.buildings, data.trees, season);
            }
            /*
            for (const env of data.envelopes.filter(e=>e.layer==1)) {
               env.draw(ctx, { fill: "#BBB", stroke: "#BBB", lineWidth: 15 });
            }*/

            if (this.drawContents.includes("envelopes")) {
                for (const seg of data.graphSegments.filter((e) => e.layer == 1)) {
                    seg.draw(ctx, {
                        color: "#BBB",
                        width: this.roadWidth + 15,
                    });
                }
                for (const seg of data.graphSegments.filter((e) => e.layer == 1)) {
                    seg.draw(ctx, { color: "white", width: 4, dash: [10, 10] });
                }
                for (const seg of data.roadBorders.filter((e) => e.layer == 1)) {
                    seg.draw(ctx, { color: "white", width: 4 });
                }
            }

            this.drawCars(ctx, optimizing, 1);


            if (showGrid) {
                for (const row of this.grid.cells) {
                    for (const cell of row) {
                        const poly = new Polygon([
                            new Point(cell.left, cell.top),
                            new Point(cell.right, cell.top),
                            new Point(cell.right, cell.bottom),
                            new Point(cell.left, cell.bottom),
                        ]);
                        if (activeRegion.containsPoly(poly) || poly.containsPoly(activeRegion)) {
                            drawCell(cell, ctx);
                        }/*
                  cell.selected=activeRegion.containsPoly(poly) || poly.containsPoly(activeRegion);
                  drawCell(cell,ctx);*/
                    }
                }
            }
        }

        /*
          try {
              for (const car of cars) {
                  for (const seg of car.assignedBorders) {
                      ctx.beginPath();
                      ctx.strokeStyle = "red";
                      ctx.moveTo(seg[0].x, seg[0].y);
                      ctx.lineTo(seg[1].x, seg[1].y);
                      ctx.stroke();
                  }
              }
          } catch (err) {}
          */


        // ! OLD VERSION
        // for (const env of this.envelopes) {
        //     env.draw(ctx, { fill: "#BBB", stroke: "#BBB", lineWidth: 15 });
        // }
        // for (const marking of this.markings) {
        //     if (!(marking instanceof Start) || showStartMarkings) {
        //         marking.draw(ctx);
        //     }
        // }
        // for (const seg of this.graph.segments) {
        //     seg.draw(ctx, { color: "white", width: 4, dash: [10, 10] });
        // }
        // for (const seg of this.roadBorders) {
        //     seg.draw(ctx, { color: 'white', width: 4 });
        // }

        // ctx.globalAlpha = 0.2;
        // for (const car of this.cars) {
        //     car.draw(ctx);
        // }
        // ctx.globalAlpha = 1;
        // if (this.bestCar) {
        //     this.bestCar.draw(ctx, true);
        // }

        // const items: (Tree | Building)[] = [...this.buildings, ...this.trees].filter(
        //     (i) => i.base.distanceToPoint(viewPoint) < renderRadius
        // );
        // items.sort(
        //     (a, b) =>
        //         b.base.distanceToPoint(viewPoint) -
        //         a.base.distanceToPoint(viewPoint)
        // )
        // for (const item of items) {
        //     item.draw(ctx, viewPoint);
        // }
    }
}