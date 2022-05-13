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

