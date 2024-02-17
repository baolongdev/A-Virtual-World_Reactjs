import { Point } from "../primitives";
import { Crossing } from "./crossing";
import { Light } from "./light";
import { Marking } from "./marking";
import { Parking } from "./parking";
import { Start } from "./start";
import { Stop } from "./stop";
import { Target } from "./target";
import { Yield } from "./yield";
//! Done


export function load(info: Marking) {
    const point = new Point(info.center.x, info.center.y);
    const dir = new Point(info.directionVector.x, info.directionVector.y);
    const classes = {
        "crossing": Crossing,
        "light": Light,
        "marking": Marking,
        "parking": Parking,
        "start": Start,
        "stop": Stop,
        "target": Target,
        "yield": Yield
    };
    const SelectedClass = classes[info.type];
    if (SelectedClass) {
        return new SelectedClass(point, dir, info.width, info.height);
    } else {
        throw new Error("Unsupported marking type: " + info.type);
    }
}
