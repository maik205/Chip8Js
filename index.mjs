"use strict"
import { chip8 } from "./chip8.mjs";
/**
 * @type {CanvasRenderingContext2D}
 */
const canvas = document.getElementById("renderer").getContext("2d");
var romReader = new FileReader();
const rom = await (await fetch('./programs/tetris.c8')).blob();
chip8.initialize();
romReader.onload = (e) =>{
    /**
     * @type {Uint8Array} arrayBuffer
     */
    const buffer = new Uint8Array(e.target.result);
    console.log(buffer);
    chip8.loadProgram(buffer);
    const loop = setInterval(()=>{
        chip8.emulateCycle();
        if (chip8.drawFlag) {
            draw();
        }
    }, 16.67)
}
romReader.readAsArrayBuffer(rom);
function draw() {
    canvas.clearRect(0,0,640,320);
    for(let y = 0; y<32; y++){
        for (let x = 0; x<64; x++){
            if (chip8.screen[y][x] == 0x1){
                canvas.fillStyle = "rgb(255 255 255)";
            }
            else canvas.fillStyle = "rgb(0 0 0)";
            canvas.fillRect(x*10,y*10,10,10);
        }
    }
    chip8.drawFlag = false;
}