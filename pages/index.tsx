import { Button } from "@nextui-org/react";
import { useInitialization } from "../hooks/useInitialization";
import OpenStreetMap from "../components/panel/OpenStreetMap";


export default function Home() {
    const {
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
    } = useInitialization();

    return (
        <div className=" min-h-screen w-screen bg-white items-center flex flex-row">
            <canvas ref={carCanvasRef} className="bg-green-600" />
            <div className="flex flex-col gap-2 items-center" >
                <Button
                    color="danger"
                    onClick={handleBtnDispose}
                >🗑️</Button>
                <Button
                    color="warning"
                    onClick={handleBtnSave}
                >💾</Button>
                <Button onPress={onOpenOsm} color="success">🗺️</Button>
                {Object.values(tools).map((tool, index) => (
                    <Button key={index} onClick={() => handleBtnTools(tool)}>
                        {tool.title}
                    </Button>
                ))}
            </div>
            <div>
                <canvas ref={networkCanvasRef} className="bg-black"></canvas>
                <canvas ref={miniMapCanvasRef} className="bg-black"></canvas>
            </div>

            <OpenStreetMap isOpenOsm={isOpenOsm} onOpenChangeOsm={onOpenChangeOsm} parseOseData={parseOseData} />
        </div >
    );
}
