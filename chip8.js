export let chip8 = {
    opcode,
    memory,
    register,
    Iregister,
    pc,
    screen,
    delayTimer,
    soundTimer,
    stack,
    stackPointer: 0,
    keys,
    initialize: () => {
        // Clears the OP code, memory, register, Iregister, Program Counter, Screen, Stack, StackPointer.
        chip8.opcode = 0x0;
        chip8.memory = new Array(4096).fill(0);
        chip8.register = new Array(16).fill(0),
            chip8.Iregister = 0x0;
        chip8.pc = 0x200;
        chip8.screen = new Array(32).fill(Array(64).fill(0));
        chip8.stack = new Array(16).fill(0);
        chip8.stackPointer = 0x0;
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
                chip8.pc +=2;
                break;
            case 0x7000:
                chip8.register[chip8.opcode & 0x0F00 >> 8] += chip8.opcode & 0x00FF;
                chip8.pc +=2;
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
                        if (chip8.register[chip8.opcode & 0x00F0 >> 4] + chip8.register[chip8.opcode & 0x0F00 >> 8] > 0xFF){
                            chip8.register[0xF] = 1;
                        }
                        else {
                            chip8.register[0xF] = 0;
                        }
                        chip8.register[chip8.opcode & 0x0F00 >> 8] += chip8.register[chip8.opcode & 0x00F0 >> 4];
                        break;
                    case 5:
                        if (chip8.register[chip8.opcode & 0x00F0 >> 4] - chip8.register[chip8.opcode & 0x0F00 >> 8] < 0x00){
                            chip8.register[0xF] = 0;
                        }
                        else {
                            chip8.register[0xF] = 1;
                        }
                        chip8.register[chip8.opcode & 0x0F00 >> 8] &= chip8.register[chip8.opcode & 0x00F0 >> 4];
                        break;
                    case 6:
                        chip8.register[chip8.opcode & 0x0F00 >> 8] &= chip8.register[chip8.opcode & 0x00F0 >> 4];
                        break;
                    case 7:
                        chip8.register[chip8.opcode & 0x0F00 >> 8] &= chip8.register[chip8.opcode & 0x00F0 >> 4];
                        break;
                    case 0xE:
                        chip8.register[chip8.opcode & 0x0F00 >> 8] &= chip8.register[chip8.opcode & 0x00F0 >> 4];
                        break;


                }
                break;
            case 0xA000:
                chip8.Iregister = chip8.opcode & 0x0FFF;
                pc += 2;
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