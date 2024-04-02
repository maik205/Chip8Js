/**
 * The `chip8` object represents a Chip-8 emulator.
 * @typedef {Object} chip8
 * @property {number} opcode - The current opcode.
 * @property {Uint8Array} memory - The memory of the emulator.
 * @property {Uint8Array} register - The registers of the emulator.
 * @property {number} Iregister - The index register.
 * @property {number} pc - The program counter.
 * @property {Array<Uint8Array>} screen - The screen data.
 * @property {number} delayTimer - The delay timer.
 * @property {number} soundTimer - The sound timer.
 * @property {Uint8Array} stack - The stack of the emulator.
 * @property {number} stackPointer - The stack pointer.
 * @property {Uint8Array} keys - The state of the keys.
 * @property {boolean} drawFlag - The draw flag.
 * @property {function} initialize - Function to initialize the emulator.
 * @property {function} loadProgram - Function to load a program into the emulator's memory.
 * @property {function} emulateCycle - Function to emulate a single cycle of the emulator.
 */
export let chip8 = {
    opcode: 0x0,
    memory: [],
    register: [],
    Iregister: 0x0,
    pc: 0x0,
    screen: new Array(32).fill(0).map(() => new Uint8Array(64).fill(0)),
    delayTimer: 0x0,
    soundTimer: 0x0,
    stack: [],
    stackPointer: 0,
    keys: [],
    drawFlag: false,
    threadBlocked: false,
    initialize: () => {
        // Clears and initialize the above variables.
        chip8.pc = 0x200;
        chip8.opcode = 0x0;
        chip8.Iregister = 0x0;
        chip8.stackPointer = 0x0;

        chip8.register = new Uint8Array(16).fill(0x0);
        chip8.memory = new Uint8Array(4096).fill(0x0);
        chip8.screen = new Array(32).fill(0).map(() => new Uint8Array(64).fill(0));
        chip8.stack = new Uint16Array(16).fill(0x0);
        chip8.keys = new Uint8Array(16).fill(0x0);
        chip8.threadBlocked = false;
        // Load chip8's fontset into memory
        for (let i = 0; i < 0x50; i++) {
            chip8.memory[i] = chip8_fontset[i];
        }

        // Reset timers:
        chip8.delayTimer = 0;
        chip8.soundTimer = 0;
        chip8.drawFlag = true;
    },
    loadProgram: (buffer) => {
        for (let i = 0; i < buffer.length; i++) {
            chip8.memory[i + 0x200] = buffer[i];
        }
    },
    emulateCycle: () => {

        // Chip8 stores 1 OPcode in 2 memory locations next to each other (eg pc, pc+1)
        chip8.opcode = (chip8.memory[chip8.pc] << 8) | chip8.memory[chip8.pc + 1];
        // console.log(`Executing 0x${chip8.opcode.toString(16).toUpperCase()}`);
        switch (chip8.opcode & 0xF000) {
            case 0x0000:
                switch (chip8.opcode) {
                    case 0x00E0:
                        chip8.screen = new Array(32).fill(0).map(() => new Uint8Array(64).fill(0));
                        chip8.drawFlag = true;
                        break;
                    case 0x00EE:
                        chip8.stackPointer--;
                        chip8.pc = chip8.stack[chip8.stackPointer];
                        break;
                    default:
                        console.log("Invalid opcode")
                        chip8.pc -= 2;
                        break;
                }
                chip8.pc += 2;
                break;
            case 0x1000:
                chip8.pc = chip8.opcode & 0x0FFF;
                break;
            case 0x2000:
                chip8.stack[chip8.stackPointer] = chip8.pc;
                chip8.stackPointer++;
                chip8.pc = chip8.opcode & 0x0FFF;
                break;
            case 0x3000:
                if (chip8.register[(chip8.opcode & 0x0F00) >> 8] == (chip8.opcode & 0x00FF)) {
                    chip8.pc += 4;
                }
                else chip8.pc += 2;
                break;
            case 0x4000:
                if (chip8.register[(chip8.opcode & 0x0F00) >> 8] != (chip8.opcode & 0x00FF)) {
                    chip8.pc += 4;
                }
                else chip8.pc += 2;
                break;
            case 0x5000:
                if (chip8.register[(chip8.opcode & 0x0F00) >> 8] == chip8.register[(chip8.opcode & 0x00F0) >> 4]) {
                    chip8.pc += 4;
                }
                else chip8.pc += 2;
                break;
            case 0x6000:
                chip8.register[(chip8.opcode & 0x0F00) >> 8] = chip8.opcode & 0x00FF;
                chip8.pc += 2;
                break;
            case 0x7000:
                chip8.register[(chip8.opcode & 0x0F00) >> 8] += chip8.opcode & 0x00FF;
                chip8.pc += 2;
                break;
            case 0x8000:
                switch (chip8.opcode & 0x000F) {
                    case 0:
                        chip8.register[(chip8.opcode & 0x0F00) >> 8] = chip8.register[(chip8.opcode & 0x00F0) >> 4];
                        break;
                    case 1:
                        chip8.register[(chip8.opcode & 0x0F00) >> 8] |= chip8.register[(chip8.opcode & 0x00F0) >> 4];
                        break;
                    case 2:
                        chip8.register[(chip8.opcode & 0x0F00) >> 8] &= chip8.register[(chip8.opcode & 0x00F0) >> 4];
                        break;
                    case 3:
                        chip8.register[(chip8.opcode & 0x0F00) >> 8] ^= chip8.register[(chip8.opcode & 0x00F0) >> 4];
                        break;
                    case 4:
                        if (chip8.register[(chip8.opcode & 0x00F0) >> 4] > (0xFF - chip8.register[(chip8.opcode & 0x0F00) >> 8])) {
                            chip8.register[0xF] = 1;
                        }
                        else {
                            chip8.register[0xF] = 0;
                        }
                        chip8.register[(chip8.opcode & 0x0F00) >> 8] += chip8.register[(chip8.opcode & 0x00F0) >> 4];
                        break;
                    case 5:
                        if (chip8.register[(chip8.opcode & 0x0F00) >> 8] < chip8.register[(chip8.opcode & 0x00F0) >> 4]) {
                            chip8.register[0xF] = 0;
                        }
                        else {
                            chip8.register[0xF] = 1;
                        }
                        chip8.register[(chip8.opcode & 0x0F00) >> 8] -= chip8.register[(chip8.opcode & 0x00F0) >> 4];
                        break;
                    case 6:
                        chip8.register[0xF] = chip8.register[(chip8.opcode & 0x0F00) >> 8] & 0b0001;
                        chip8.register[(chip8.opcode & 0x0F00) >> 8] >>= 1;
                        break;
                    case 7:
                        if (chip8.register[(chip8.opcode & 0x00F0) >> 4] - chip8.register[(chip8.opcode & 0x0F00) >> 8] < 0x00) {
                            chip8.register[0xF] = 0;
                        }
                        else {
                            chip8.register[0xF] = 1;
                        }
                        chip8.register[(chip8.opcode & 0x0F00) >> 8] = chip8.register[(chip8.opcode & 0x00F0) >> 4] - chip8.register[(chip8.opcode & 0x0F00) >> 8];
                        break;
                    case 0xE:
                        chip8.register[0xF] = chip8.register[(chip8.opcode & 0x0F00) >> 8] >> 7;
                        chip8.register[(chip8.opcode & 0x0F00) >> 8] <<= 1;
                        break;
                    default:
                        console.log('Invalid opcode');
                        chip8.pc -= 2;
                        break;
                }
                chip8.pc += 2;
                break;
            case 0x9000:
                if (chip8.register[(chip8.opcode & 0x0F00) >> 8] != chip8.register[(chip8.opcode & 0x00F0) >> 4]) {
                    chip8.pc += 4;
                }
                else chip8.pc += 2;
                break;
            case 0xA000:
                chip8.Iregister = (chip8.opcode & 0x0FFF);
                chip8.pc += 2;
                break;
            case 0xB000:
                chip8.pc = chip8.register[0x0] + (chip8.opcode & 0x0FFF);
                break;
            case 0xC000:
                chip8.register[(chip8.opcode & 0x0F00) >> 8] = (generateRandomInteger(0, 255) & (chip8.opcode & 0x00FF));
                chip8.pc += 2;
                break;
            case 0xD000:
                const REG_VX = chip8.register[(chip8.opcode & 0x0F00) >> 8];
                const REG_VY = chip8.register[(chip8.opcode & 0x00F0) >> 4];
                const N = chip8.opcode & 0x000F;
                chip8.register[0xF] = 0;
                for (let y = 0; y < N; y++) {
                    const pixelLine = chip8.memory[chip8.Iregister + y];
                    for (let x = 0; x < 8; x++) {
                        // 0b10000000 is a bitmask to check if pixel at position [x] is going to be drawn or not.
                        // This bitmask is shifted by [x] to check for the pixelLine's [x] binary value.
                        if (((0b10000000 >> x) & pixelLine) != 0b0) {
                            const screenX = REG_VX + x;
                            const screenY = REG_VY + y;
                            if (chip8.screen[screenY][screenX] == 1) chip8.register[0xF] = 1;
                            chip8.screen[screenY][screenX] ^= 1;

                        }
                    }
                }
                // Redraws the screen.
                chip8.drawFlag = true;
                chip8.pc += 2;
                break;
            case 0xE000:
                switch (chip8.opcode & 0x00FF) {
                    case 0x009E:
                        if (chip8.keys[chip8.register[(chip8.opcode & 0x0F00) >> 8]] != 0) {
                            chip8.pc += 4;
                        }
                        else chip8.pc += 2;
                        break;
                    case 0x00A1:
                        if (chip8.keys[chip8.register[(chip8.opcode & 0x0F00) >> 8]] == 0) {
                            chip8.pc += 4;
                        }
                        else chip8.pc += 2;
                        break;
                    default:
                        console.log("Invalid opcode");
                }
                break;
            case 0xF000:
                switch (chip8.opcode & 0x00FF) {
                    case 0x0007:
                        chip8.register[(chip8.opcode & 0x0F00) >> 8] = chip8.delayTimer;
                        break;
                    case 0x000A:
                        if (chip8.keys.reduce((a, b) => a + b) != 0) {
                            chip8.register[(chip8.opcode & 0x0F00) >> 8] = chip8.keys.indexOf(1);
                            chip8.threadBlocked = false;
                        }
                        else chip8.threadBlocked = true;
                        break;
                    case 0x0015:
                        chip8.delayTimer = chip8.register[(chip8.opcode & 0x0F00) >> 8];
                        break;
                    case 0x0018:
                        chip8.soundTimer = chip8.register[(chip8.opcode & 0x0F00) >> 8];
                        break;
                    case 0x001E:
                        chip8.Iregister += chip8.register[(chip8.opcode & 0x0F00) >> 8];
                        break;
                    case 0x0029:
                        chip8.Iregister = chip8.register[(chip8.opcode & 0x0F00) >> 8] * 5;
                        break;
                    case 0x0033:
                        const REG_VX = chip8.register[(chip8.opcode & 0x0F00) >> 8];
                        chip8.memory[chip8.Iregister] = Math.floor(REG_VX / 100);
                        chip8.memory[chip8.Iregister + 1] = Math.floor(REG_VX % 100 / 10);
                        chip8.memory[chip8.Iregister + 2] = Math.floor(REG_VX % 10);
                        break;
                    case 0x0055:
                        for (let i = 0; i <= ((chip8.opcode & 0x0F00) >> 8); i++) {
                            chip8.memory[chip8.Iregister + i] = chip8.register[i];
                        }
                        chip8.Iregister += ((chip8.opcode & 0x0F00) >> 8) + 1;
                        break;
                    case 0x0065:
                        for (let i = 0; i <= ((chip8.opcode & 0x0F00) >> 8); i++) {
                            chip8.register[i] = chip8.memory[chip8.Iregister + i];
                        }
                        chip8.Iregister += ((chip8.opcode & 0x0F00) >> 8) + 1;
                        break;
                    default:
                        console.log(`Invalid opcode: 0x%X`, chip8.opcode.toString(16));
                        chip8.pc -= 2;
                }
                chip8.pc += 2;
                break;
            default:
                console.log(`Invalid opcode: 0x%X`, chip8.opcode);
                break;
        }


        if (chip8.delayTimer > 0) chip8.delayTimer--;
        if (chip8.soundTimer > 0) {
            //TODO: Will add beeping SFX
            if (chip8.soundTimer == 1) console.log("beep");
            chip8.delayTimer--;
        };

    }
}

const chip8_fontset = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80  // F
]

function generateRandomInteger(low, high) {
    const lowCeil = Math.ceil(low);
    const highFloor = Math.floor(high);
    const randomFloat = lowCeil + Math.random() * (highFloor - lowCeil);
    return Math.floor(randomFloat);
}