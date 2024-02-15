import { useEffect, useRef } from "react";
import { Graph } from "../scripts/math/graph";
import { Point } from "../scripts/primitives/point";
import { Segment } from "../scripts/primitives/segment";
import { Button } from "@geist-ui/core";
import { GraphEditor } from "../scripts/GraphEditor";

export default function Home() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    canvas.width = 500;
    canvas.height = 500;

    const p1 = new Point(50, 50);
    const p2 = new Point(150, 400);

    const s1 = new Segment(p1, p2);

    const graph = new Graph([p1, p2], [s1]);
    const graphEditor = new GraphEditor(canvas, graph);

    animate();

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      graphEditor.display();
      requestAnimationFrame(animate);
    }
  }, [])


  return (
    <div className=" min-h-screen w-screen bg-black items-center flex flex-col">
      <h1 className="text-white text-xl">Hello world</h1>
      <canvas ref={canvasRef} className="bg-green-600" />
      <div className="controls">
      </div>
    </div>
  );
}
