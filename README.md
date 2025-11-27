# companion-module-dhdaudio-ecp

Bitfocus Companion module for DHD Audio mixing consoles using the ECP (External Control Protocol).

## Features

This module provides control and monitoring of DHD Audio mixing consoles via the ECP protocol over TCP/IP.

**Supported Consoles:**

- Series 52
- RM4200D
- Other DHD consoles with ECP support

### Supported Commands

- **Set Logic State** - Control logic states (ON/OFF) with optional pulse mode
- **Pulse Logic** - Send edge-triggered pulses (0→1→0) for flip-flops and interlocks
- **Toggle Logic State** - Toggle between states
- **Request Logic State** - Query current state
- **Logic State Feedback** - Visual indication of logic states
- **Connection Status Variables** - Monitor connection health

### Actions

- **Set Logic State**: Set a specific logic ID to ON or OFF
- **Toggle Logic State**: Toggle a logic state (useful for buttons)
- **Request Logic State**: Query the current state of a logic

### Feedbacks

- **Logic State**: Visual feedback showing when a logic matches the expected state (ON or OFF)

### Variables

- `connection_status` - Current connection status
- `host` - Configured DHD host IP address
- `port` - Configured DHD port

## Configuration

- **Target IP**: IP address of the DHD console
- **Target Port**: TCP port (default: 2008 for ECP)

## DHD ECP Protocol

This module implements the DHD External Control Protocol (ECP) for TCP/IP communication:

- **Protocol**: TCP
- **Default Port**: 2008
- **Data Format**: 16-byte blocks with CAN bus-style addressing
- **Command**: Set Internal Logic States (0x110E0000)

### Logic Addresses

Logic addresses are dynamic and configured in your DHD Toolbox project. Logic IDs range from 0-65535.

**Converting from Export.dpx:**
DHD Export.dpx files use 32-bit hex addresses (e.g., `0x400002cf`). To use them with ECP:

1. Extract the **lower 16 bits** (last 4 hex digits): `0x02cf`
2. Convert to decimal: `719`
3. Use this decimal value as the Logic ID in Companion

Use the [online DHD Export.dpx Parser](https://daniellippens.github.io/companion-module-dhdaudio-ecp/parser.html) to automatically extract and convert all Logic IDs from your Export.dpx file.

## Documentation

For more information about the ECP protocol:

- [DHD ECP Communication](https://developer.dhd.audio/docs/API/ECP/communication)
- [DHD ECP Commands](https://developer.dhd.audio/docs/API/ECP/commands)

## Getting started

Executing a `yarn` command should perform all necessary steps to develop the module, if it does not then follow the steps below.

The module can be built once with `yarn build`. This should be enough to get the module to be loadable by companion.

While developing the module, by using `yarn dev` the compiler will be run in watch mode to recompile the files on change.

## Development

```bash
# Install dependencies
yarn install

# Build the module
yarn build

# Watch for changes during development
yarn dev

# Format code
yarn format

# Lint code
yarn lint
```
