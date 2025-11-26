import { InstanceBase } from '@companion-module/base'
import { Socket } from 'net'
import type { ModuleConfig } from './config.js'

/**
 * DHD ECP Protocol Handler
 * Implements TCP communication with DHD Audio mixing consoles
 */
export class ECPConnection {
	private socket: Socket | null = null
	private host: string
	private port: number
	private instance: InstanceBase<ModuleConfig>
	private reconnectTimer: NodeJS.Timeout | null = null
	private logicStates: Map<number, boolean> = new Map()

	constructor(instance: InstanceBase<ModuleConfig>, host: string, port: number) {
		this.instance = instance
		this.host = host
		this.port = port
	}

	/**
	 * Connect to the DHD console
	 */
	connect(): void {
		if (this.socket) {
			this.socket.destroy()
		}

		this.instance.log('info', `Connecting to DHD at ${this.host}:${this.port}`)

		this.socket = new Socket()
		this.socket.setKeepAlive(true)

		this.socket.on('connect', () => {
			this.instance.log('info', 'Connected to DHD console')
			this.instance.updateStatus('ok' as any)
			this.instance.setVariableValues({ connection_status: 'Connected' })
			if (this.reconnectTimer) {
				clearTimeout(this.reconnectTimer)
				this.reconnectTimer = null
			}
		})

		this.socket.on('error', (err) => {
			this.instance.log('error', `Connection error: ${err.message}`)
			this.instance.updateStatus('connection_failure' as any, err.message)
			this.instance.setVariableValues({ connection_status: `Error: ${err.message}` })
			this.scheduleReconnect()
		})

		this.socket.on('close', () => {
			this.instance.log('warn', 'Connection closed')
			this.instance.updateStatus('disconnected' as any)
			this.instance.setVariableValues({ connection_status: 'Disconnected' })
			this.scheduleReconnect()
		})

		this.socket.on('data', (data) => {
			this.handleIncomingData(data)
		})

		this.socket.connect(this.port, this.host)
	}

	/**
	 * Disconnect from the DHD console
	 */
	disconnect(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}

		if (this.socket) {
			this.socket.destroy()
			this.socket = null
		}
	}

	/**
	 * Schedule a reconnection attempt
	 */
	private scheduleReconnect(): void {
		if (this.reconnectTimer) {
			return
		}

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null
			this.connect()
		}, 5000)
	}

	/**
	 * Handle incoming data from the console
	 */
	private handleIncomingData(data: Buffer): void {
		// Process 16-byte blocks
		for (let i = 0; i + 16 <= data.length; i += 16) {
			const block = data.subarray(i, i + 16)
			this.processBlock(block)
		}
	}

	/**
	 * Process a single 16-byte ECP block
	 */
	private processBlock(block: Buffer): void {
		const length = block[0]
		const id = (block[2] << 24) | (block[3] << 16) | (block[4] << 8) | block[5]

		// Check if this is a logic state response (0x110E0000)
		if (id === 0x110e0000 && length >= 3) {
			const logicId = (block[6] << 8) | block[7]
			const state = block[8] !== 0

			this.logicStates.set(logicId, state)
			this.instance.log('debug', `Logic ${logicId} state: ${state}`)

			// Trigger feedback updates
			this.instance.checkFeedbacks('logic_state')
		}
	}

	/**
	 * Send a 16-byte ECP block to the console
	 */
	private sendBlock(id: number, data: number[]): void {
		if (!this.socket || !this.socket.writable) {
			this.instance.log('warn', 'Cannot send command: not connected')
			return
		}

		const buffer = Buffer.alloc(16)

		// Length (number of data bytes)
		buffer[0] = data.length
		buffer[1] = 0

		// ID (28-bit, big-endian)
		buffer[2] = (id >> 24) & 0xff
		buffer[3] = (id >> 16) & 0xff
		buffer[4] = (id >> 8) & 0xff
		buffer[5] = id & 0xff

		// Data bytes (up to 8)
		for (let i = 0; i < 8; i++) {
			buffer[6 + i] = i < data.length ? data[i] : 0
		}

		// Unused bytes
		buffer[14] = 0
		buffer[15] = 0

		this.socket.write(buffer)
		this.instance.log('debug', `Sent ECP block: ID=0x${id.toString(16).padStart(8, '0')}, Data=[${data.join(', ')}]`)
	}

	/**
	 * Set a logic state (0x110E0000)
	 * @param logicId Logic address (0-65535 for Series 52)
	 * @param state true = ON (1), false = OFF (0)
	 */
	setLogicState(logicId: number, state: boolean): void {
		const data = [
			(logicId >> 8) & 0xff, // LogicID high byte
			logicId & 0xff, // LogicID low byte
			state ? 1 : 0, // On/Off
		]

		this.sendBlock(0x110e0000, data)
		this.instance.log('info', `Set Logic ${logicId} to ${state ? 'ON' : 'OFF'}`)
	}

	/**
	 * Request the current state of a logic
	 * @param logicId Logic address
	 */
	requestLogicState(logicId: number): void {
		// Send a request with only the LogicID (2 bytes)
		const data = [
			(logicId >> 8) & 0xff, // LogicID high byte
			logicId & 0xff, // LogicID low byte
		]

		this.sendBlock(0x110e0000, data)
		this.instance.log('debug', `Requested Logic ${logicId} state`)
	}

	/**
	 * Get the cached state of a logic
	 */
	getLogicState(logicId: number): boolean | undefined {
		return this.logicStates.get(logicId)
	}

	/**
	 * Pulse a logic (set to 1, then back to 0 after a delay)
	 * This is required for DHD interlock logic buses to work properly
	 * @param logicId Logic address (0-65535 for Series 52)
	 * @param pulseDuration Duration in milliseconds (default: 100ms)
	 */
	pulseLogic(logicId: number, pulseDuration: number = 100): void {
		// Set logic to ON
		this.setLogicState(logicId, true)

		// Set logic back to OFF after the pulse duration
		setTimeout(() => {
			this.setLogicState(logicId, false)
		}, pulseDuration)

		this.instance.log('info', `Pulsed Logic ${logicId} (${pulseDuration}ms)`)
	}
}
