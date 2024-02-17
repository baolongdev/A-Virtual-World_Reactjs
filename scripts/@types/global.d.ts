type ToolsState = {
    [key: string]: {
        title: string;
        editor: any;
    };
};
type nodeOsm = {
    id: number
    lat: number
    lon: number
    type: string
}

type tagOsm = {
    bridge: string
    bridge: boolean
    highway: string
    lanes: number
    layer: number
    maxspeed: number
    name: string
    oneway: boolean
    ref: string
}

type wayOsm = {
    id: number
    nodes: number[]
    tags: tagOsm
    type: string
}

type seasonProp = "winter" | "autumn";
