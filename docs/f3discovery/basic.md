# Basic commands

## setup works
1. connect usb-stlink and computer with a cable

2. connect
```bash
# connect
openocd -f interface/stlink-v2-1.cfg -f target/stm32f3x.cfg
```

3. debug
```bash
# load code and debug
arm-none-eabi-gdb -q -ex "target remote :3333" target/thumbv7em-none-eabihf/debug/led-roulette
```

or using Cargo by placing the following code to `.cargo/config.toml`
```tmol
[target.thumbv7em-none-eabihf]
runner = "arm-none-eabi-gdb -q"
rustflags = [
  "-C", "link-arg=-Tlink.x",
]

[build]
target = "thumbv7em-none-eabihf"
```
then run
```bash
cargo build
cargo run
(gdb) target remote:3333
```

## commands

 - `[c]ontinue` resume execution, and run until your program ends/crashes, or gdb encounters a breakpoint.
 - `[b]reak` set breakpoint
    - `break main` set breakpoint to entry point
    - `break main.rs:14` main.rs line 14
 - `clear [linenum | filename:linenum | funcname]` clear breakpoints