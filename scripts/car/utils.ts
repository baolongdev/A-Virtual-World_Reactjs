import { getIntersection } from "../world/math";

//polylines
export function polysIntersect(poly1, poly2) {
    for (let i = 0; i < poly1.length - 1; i++) {
        for (let j = 0; j < poly2.length - 1; j++) {
            const touch = getIntersection(
                poly1[i],
                poly1[i + 1],
                poly2[j],
                poly2[j + 1]
            );
            if (touch) {
                return true;
            }
        }
    }
    return false;
}

export function getRGBA(value) {
    const alpha = Math.abs(value);
    const R = value < 0 ? 0 : 255;
    const G = R;
    const B = value > 0 ? 0 : 255;
    return "rgba(" + R + "," + G + "," + B + "," + alpha + ")";
}

function getRandomColor() {
    const hue = 290 + Math.random() * 260;
    return "hsl(" + hue + ", 100%, 60%)";
}