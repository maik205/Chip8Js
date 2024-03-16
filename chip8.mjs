export const chip8 = {
    opcode: 0x0,
    memory: [],
    register: [],
    Iregister: 0x0,
    pc: 0x0,
    screen: [[]],
    delayTimer: 0x0,
    soundTimer: 0x0,
    stack: [],
    stackPointer: 0,
    keys: [],
    drawFlag: false,
    initialize: () => {
        // Clears and initialize the above variables.
        chip8.opcode = 0x0;
        chip8.memory = new Array(4096).fill(0x0);
        chip8.register = new Array(16).fill(0x0);
        chip8.Iregister = 0x0;
        chip8.pc = 0x200;
        chip8.screen = new Array(32).fill(Array(64).fill(0));
        chip8.stack = new Array(16).fill(0);
        chip8.stackPointer = 0x0;
        chip8.keys = new Array(16).fill(0x0);
        // Load chip8's fontset into memory
        for (let i = 0; i < 0x50; i++) {
            memory[i] = chip8_fontset[i];
        }

        // Reset timers:
        chip8.delayTimer = 60;
        chip8.soundTimer = 60;
    },
    loadProgram: (buffer) => {
        for (let i = 0; i < buffer.size; i++) {
            chip8.memory[i + 0x200] = buffer[i];
        }
    },
    emulateCycle: () => {

        // Chip8 stores 1 OPcode in 2 memory locations next to each other (eg pc, pc+1)
        chip8.opcode = chip8.memory[chip8.pc] << 8 | chip8.memory[chip8.pc + 1];
        switch (chip8.opcode & 0xF000) {
            case 0x0000:
                switch (chip8.opcode) {
                    case 0x00E0:
                        chip8.screen = new Array(32).fill(Array(64).fill(0));
                        chip8.pc += 2;
                    case 0x00EE:
                        chip8.pc = chip8.stack[chip8.stackPointer - 1];
                        chip8.stackPointer--;
                    default:
                        console.log("invalid opcode");
                }
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
                if (chip8.register[chip8.opcode & 0x0F00 >> 8] == chip8.opcode & 0x00FF) {
                    chip8.pc += 4;
                }
                break;
            case 0x4000:
                if (chip8.register[chip8.opcode & 0x0F00 >> 8] != chip8.opcode & 0x00FF) {
                    chip8.pc += 4;
                }
                break;
            case 0x5000:
                if (chip8.register[chip8.opcode & 0x0F00 >> 8] == chip8.register[chip8.opcode & 0x000F]) {
                    chip8.pc += 4;
                }
                break;
            case 0x6000:
                chip8.register[chip8.opcode & 0x0F00 >> 8] = chip8.opcode & 0x00FF;
                chip8.pc += 2;
                break;
            case 0x7000:
                chip8.register[chip8.opcode & 0x0F00 >> 8] += chip8.opcode & 0x00FF;
                chip8.pc += 2;
                break;
            case 0x8000:
                switch (chip8.opcode & 0x000F) {
                    case 0:
                        chip8.register[chip8.opcode & 0x0F00 >> 8] = chip8.register[chip8.opcode & 0x00F0 >> 4];
                        break;
                    case 1:
                        chip8.register[chip8.opcode & 0x0F00 >> 8] |= chip8.register[chip8.opcode & 0x00F0 >> 4];
                        break;
                    case 2:
                        chip8.register[chip8.opcode & 0x0F00 >> 8] &= chip8.register[chip8.opcode & 0x00F0 >> 4];
                        break;
                    case 3:
                        chip8.register[chip8.opcode & 0x0F00 >> 8] ^= chip8.register[chip8.opcode & 0x00F0 >> 4];
                        break;
                    case 4:
                        if (chip8.register[chip8.opcode & 0x00F0 >> 4] + chip8.register[chip8.opcode & 0x0F00 >> 8] > 0xFF) {
                            chip8.register[0xF] = 1;
                        }
                        else {
                            chip8.register[0xF] = 0;
                        }
                        chip8.register[chip8.opcode & 0x0F00 >> 8] += chip8.register[chip8.opcode & 0x00F0 >> 4];
                        break;
                    case 5:
                        if (chip8.register[chip8.opcode & 0x0F00 >> 8] - chip8.register[chip8.opcode & 0x00F0 >> 4] < 0x00) {
                            chip8.register[0xF] = 0;
                        }
                        else {
                            chip8.register[0xF] = 1;
                        }
                        chip8.register[chip8.opcode & 0x0F00 >> 8] -= chip8.register[chip8.opcode & 0x00F0 >> 4];
                        break;
                    case 6:
                        chip8.register[0xF] = chip8.register[chip8.opcode & 0x0F00 >> 8] & 0b0001;
                        chip8.register[chip8.opcode & 0x0F00 >> 8] = chip8.register[chip8.opcode & 0x0F00 >> 8] >>> 1;
                        break;
                    case 7:
                        if (chip8.register[chip8.opcode & 0x00F0 >> 4] - chip8.register[chip8.opcode & 0x0F00 >> 8] < 0x00) {
                            chip8.register[0xF] = 0;
                        }
                        else {
                            chip8.register[0xF] = 1;
                        }
                        chip8.register[chip8.opcode & 0x0F00 >> 8] = chip8.register[chip8.opcode & 0x00F0 >> 4] - chip8.register[chip8.opcode & 0x0F00 >> 8];
                        break;
                    case 0xE:
                        chip8.register[0xF] = chip8.register[chip8.opcode & 0x0F00 >> 8] & 0b1000;
                        chip8.register[chip8.opcode & 0x0F00 >> 8] = chip8.register[chip8.opcode & 0x0F00 >> 8] << 1;
                        chip8.register[chip8.opcode & 0x0F00 >> 8] = chip8.register[chip8.opcode & 0x0F00 >> 8] & 0xFFFF;
                        break;
                    default:
                        console.log('Invalid opcode');
                }
                chip8.pc += 2;
                break;
            case 0x9000:
                if (chip8.register[chip8.opcode & 0x0F00 >> 8] != chip8.register[chip8.opcode & 0x00F0 >> 4]) {
                    chip8.pc += 4;
                }
                else chip8.pc += 2;
                break;
            case 0xA000:
                chip8.Iregister = chip8.opcode & 0x0FFF;
                chip8.pc += 2;
                break;
            case 0xB000:
                chip8.pc = chip8.register[0x0] + (chip8.opcode & 0x0FFF);
                break;
            case 0xC000:
                chip8.register[chip8.opcode & 0x0F00 >> 8] = generateRandomInteger(0x0, 0xFF) & (chip8.opcode & 0x00FF);
                break;
            case 0xD000:
                const REG_VX = chip8.register[chip8.opcode & 0x0F00 >> 8];
                const REG_VY = chip8.register[chip8.opcode & 0x00F0 >> 4];
                const N = chip8.opcode & 0x000F;
                chip8.register[0xF] = 0;
                for (let y = 0; y <= N; y++) {
                    const pixelLine = chip8.memory[chip8.Iregister + y];
                    for (let x = 0; x < 8; x++) {
                        // 0b10000000 is a bitmask to check if pixel at position [x] is going to be drawn or not.
                        // This bitmask is shifted by [x] to check for the pixelLine's [x] binary value.
                        if (pixelLine & (0b10000000 >>> x) == 0b1) {
                            if (chip8.screen[y + REG_VY][x + REG_VX] ^ 1 == 0) chip8.register[0xF] = 1;
                            chip8.screen[y + REG_VY][x + REG_VX] ^= 1;
                        }
                    }
                }
                // Redraws the screen.
                chip8.drawFlag = true;
                chip8.pc += 2;
            case 0xE000:
                switch(chip8.opcode & 0x00FF){
                    case 0x00A1:
                        if (chip8.keys[chip8.register[chip8.opcode & 0x0F00 >> 8]] != 0){
                            chip8.pc +=4;
                        }
                        else chip8.pc +=2;
                        break;
                    case 0x00A1:
                        if (chip8.keys[chip8.register[chip8.opcode & 0x0F00 >> 8]] == 0){
                            chip8.pc +=4;
                        }
                        else chip8.pc +=2;
                        break;
                }
                break;
            case 0xF000:
                switch (chip8.opcode & 0x00FF){
                    case 0x0007:
                        chip8.register[chip8.opcode & 0x0F00 >> 8] = chip8.delayTimer;
                        break;
                    case 0x0018:
                        chip8.register[chip8.opcode & 0x0F00 >> 8] = chip8.soundTimer;
                        break;
                    case 0x001E:
                        chip8.Iregister += chip8.register[chip8.opcode & 0x0F00 >> 8];
                        chip8.Iregister &= 0xFFF;
                        break;
                    case 0x0029:
                        chip8.Iregister = (chip8.register[chip8.opcode & 0x0F00 >> 8] & 0xF) * 5;
                        break;
                    case 0x0033:
                        const REG_VX = chip8.register[chip8.opcode & 0x0F00 >> 8];
                        chip8.memory[chip8.Iregister] = Math.floor(REG_VX/100);
                        chip8.memory[chip8.Iregister + 1] = Math.floor(REG_VX%100/10);
                        chip8.memory[chip8.Iregister + 2] = Math.floor(REG_VX%10);
                        break;
                    case 0x0055:
                        for (let i = 0; i <= (chip8.opcode & 0x0F00 >> 8); i++) {
                            chip8.memory[chip8.Iregister + i] = chip8.register[i];
                        }
                        break;
                    case 0x0065:
                        for (let i = 0; i <= (chip8.opcode & 0x0F00 >> 8); i++) {
                            chip8.register[i] = chip8.memory[chip8.Iregister + i];
                        }
                        break;
                }
                chip8.pc+=2;
                break;
            default:
                console.log(`Invalid opcode: 0x%X`, chip8.opcode);
                break;
        }


        if (chip8.delayTimer > 0) chip8.delayTimer--;
        if (chip8.soundTimer > 0) {
            if (chip8.soundTimer == 1) console.log("beep");
            chip8.delayTimer--;
        };

    }
}

const chip8_fontset = []

function generateRandomInteger(low, high) {
    const lowCeil = Math.ceil(low);
    const highFloor = Math.floor(high);
    const randomFloat = lowCeil + Math.random() * (highFloor - lowCeil);
    return Math.floor(randomFloat);
}