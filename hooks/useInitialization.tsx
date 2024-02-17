import { useEffect, useRef, useState } from "react";
import { Car, CrossingEditor, Graph, GraphEditor, LightEditor, NeuralNetwork, Osm, ParkingEditor, Point, Sensor, Start, StartEditor, StopEditor, TargetEditor, Viewport, Visualizer, World, YieldEditor, angle, scale } from "../scripts";
import { useDisclosure } from "@nextui-org/react";
import { MiniMap } from "../scripts/world/miniMap";
// import 
export const useInitialization = () => {
    const carCanvasRef = useRef(null);
    const networkCanvasRef = useRef(null);
    const miniMapCanvasRef = useRef(null);
    const [viewport, setViewport] = useState<Viewport>(null);
    const [miniMap, setMiniMap] = useState<MiniMap>(null);
    const [world, setWorld] = useState<World>(null);
    const [graph, setGraph] = useState<Graph>(null);
    const [tools, setTools] = useState<ToolsState>({})
    const [bestCar, setBestCar] = useState(null)
    const [selectedTool, setSelectedTool] = useState(null);
    const { isOpen: isOpenOsm, onOpen: onOpenOsm, onOpenChange: onOpenChangeOsm } = useDisclosure();

    const parseOseData = (data) => {
        const res = Osm.parseRoads(JSON.parse(data))
        graph.points = res.points;
        graph.segments = res.segments;
    }

    const handleBtnTools = (tool) => {
        Object.values(tools).forEach((t) => t.editor.disable());

        tool.editor.enable();

        setSelectedTool(tool);
    };

    const handleBtnDispose = () => {
        localStorage.removeItem("bestBrain");
        tools.graph.editor.dispose()
        world.markings.length = 0;
    }

    const handleBtnSave = () => {
        world.cars.forEach(car => {
            delete car.sensor;
        });
        localStorage.setItem("bestBrain",
            JSON.stringify(bestCar.brain));

        // World Save!
        world.zoom = viewport.zoom;
        world.offset = viewport.offset;

        const element = document.createElement("a");
        element.setAttribute(
            "href",
            "data:application/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(world))
        );

        const fileName = "name.world";
        element.setAttribute("download", fileName);

        element.click();

        localStorage.setItem("world", JSON.stringify(world));
        world.cars.forEach(car => {
            car.sensor = new Sensor(car);
        });
    }

    useEffect(() => {
        const carCanvas = carCanvasRef.current as HTMLCanvasElement;
        const networkCanvas = networkCanvasRef.current as HTMLCanvasElement;
        const miniMapCanvas = miniMapCanvasRef.current as HTMLCanvasElement;
        carCanvas.width = window.innerWidth - 380;
        carCanvas.height = window.innerHeight;
        networkCanvas.width = 300;
        networkCanvas.height = window.innerHeight - 300;
        miniMapCanvas.width = 300;
        miniMapCanvas.height = 300;

        const carCtx = carCanvas.getContext('2d');
        const networkCtx = networkCanvas.getContext('2d');
        const miniMapCtx = miniMapCanvas.getContext('2d');

        const worldString = localStorage.getItem("world");
        const worldInfo = worldString ? JSON.parse(worldString) : null;
        const world = worldInfo
            ? World.load(worldInfo)
            : new World(new Graph());
        const graph = world.graph;
        const viewport = new Viewport(carCanvas, world.zoom, world.offset);
        const miniMap = new MiniMap(miniMapCanvas, world.graph, 300);

        const tools = {
            graph: { id: "graphBtn", title: "🌐", editor: new GraphEditor(viewport, graph) },
            stop: { id: "stopBtn", title: "🛑", editor: new StopEditor(viewport, world) },
            crossing: { id: "crossingBtn", title: "🚶", editor: new CrossingEditor(viewport, world) },
            start: { id: "startBtn", title: "🚙", editor: new StartEditor(viewport, world) },
            parking: { id: "parkingBtn", title: "🅿️", editor: new ParkingEditor(viewport, world) },
            light: { id: "lightBtn", title: "🚦", editor: new LightEditor(viewport, world) },
            target: { id: "targetBtn", title: "🎯", editor: new TargetEditor(viewport, world) },
            yield: { id: "yieldBtn", title: "⚠️", editor: new YieldEditor(viewport, world) },
        };

        setGraph(graph);
        setWorld(world);
        setViewport(viewport);
        setMiniMap(miniMap);
        setTools(tools);

        const N = 100;
        const cars = generateCars(N, world);

        let bestCar = cars[0];
        setBestCar(bestCar);
        if (localStorage.getItem("bestBrain")) {
            for (let i = 0; i < cars.length; i++) {
                cars[i].brain = JSON.parse(
                    localStorage.getItem("bestBrain"));
                if (i != 0) {
                    NeuralNetwork.mutate(cars[i].brain, 0.1);
                }
            }
        }

        const traffic = [];
        const roadBorders = world.roadBorders.map((s) => [s.p1, s.p2]);
        let oldGraphHash = graph.hash();
        animate();
        function animate(time?) {
            for (let i = 0; i < traffic.length; i++) {
                traffic[i].update(roadBorders, []);
            }
            for (let i = 0; i < cars.length; i++) {
                cars[i].update(roadBorders, traffic);
            }
            bestCar = cars.find(
                c => c.fittness == Math.max(
                    ...cars.map(c => c.fittness)
                ));

            world.cars = cars;
            world.bestCar = bestCar;

            viewport.offset.x = -bestCar.x;
            viewport.offset.y = -bestCar.y;

            viewport.reset();
            if (graph.hash() != oldGraphHash) {
                world.generate();
                oldGraphHash = graph.hash();
            }
            const viewPoint = scale(viewport.getOffset(), -1);
            world.draw(carCtx, viewPoint, false);
            miniMap.update(viewPoint);

            // for (const tool of Object.values(tools)) {
            //     tool.editor.display();
            // }

            for (let i = 0; i < traffic.length; i++) {
                traffic[i].draw(carCtx);
            }

            networkCtx.lineDashOffset = -time / 50;
            networkCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);
            Visualizer.drawNetwork(networkCtx, bestCar.brain);
            requestAnimationFrame(animate);
        }
    }, [])

    const generateCars = (N: number, world: World) => {
        const startPoints = world.markings.filter((m) => m instanceof Start);
        const startPoint = startPoints.length > 0
            ? startPoints[0].center
            : new Point(300, 180);
        const dir = startPoints.length > 0
            ? startPoints[0].directionVector
            : new Point(0, -1);
        const startAngle = - angle(dir) + Math.PI / 2;

        const cars = [];
        for (let i = 1; i <= N; i++) {
            cars.push(new Car(startPoint.x, startPoint.y, 30, 50, "AI", startAngle));
        }
        return cars;
    }
    return {
        carCanvasRef,
        networkCanvasRef,
        miniMapCanvasRef,
        handleBtnDispose,
        handleBtnSave,
        handleBtnTools,
        tools,
        isOpenOsm,
        onOpenOsm,
        onOpenChangeOsm,
        parseOseData,
    };
}