import type { ModuleInstance } from './main.js'
import type { CompanionActionDefinitions } from '@companion-module/base'

export function UpdateActions(self: ModuleInstance): void {
	const actions: CompanionActionDefinitions = {
		set_logic_state: {
			name: 'Set Logic State',
			options: [
				{
					id: 'logic_id',
					type: 'number',
					label: 'Logic ID',
					default: 1,
					min: 0,
					max: 65535,
					tooltip: 'Logic address (0-65535). Use hex-to-decimal converter for Export.dpx values.',
				},
				{
					id: 'state',
					type: 'dropdown',
					label: 'State',
					default: 1,
					choices: [
						{ id: 0, label: 'OFF (0)' },
						{ id: 1, label: 'ON (1)' },
					],
				},
				{
					id: 'use_pulse',
					type: 'checkbox',
					label: 'Use Pulse Mode',
					default: false,
					tooltip: 'Sends rising edge (0→1→0) instead of holding state. Required for interlock logic sources.',
				},
				{
					id: 'pulse_duration',
					type: 'number',
					label: 'Pulse Duration (ms)',
					default: 100,
					min: 50,
					max: 1000,
					tooltip: 'Duration of pulse in milliseconds (only if pulse is enabled)',
					isVisible: (options) => options.use_pulse === true,
				},
			],
			callback: async (event) => {
				const logicId = Number(event.options.logic_id)
				const state = Number(event.options.state) === 1
				const usePulse = Boolean(event.options.use_pulse)
				const pulseDuration = Number(event.options.pulse_duration) || 100

				if (usePulse && state) {
					// Use pulse mode for interlock logic buses
					self.ecp.pulseLogic(logicId, pulseDuration)
				} else {
					// Normal set operation
					self.ecp.setLogicState(logicId, state)
				}
			},
		},
		toggle_logic_state: {
			name: 'Toggle Logic State',
			options: [
				{
					id: 'logic_id',
					type: 'number',
					label: 'Logic ID',
					default: 1,
					min: 0,
					max: 65535,
					tooltip: 'Logic address (0-65535)',
				},
			],
			callback: async (event) => {
				const logicId = Number(event.options.logic_id)
				const currentState = self.ecp.getLogicState(logicId)
				const newState = !currentState
				self.ecp.setLogicState(logicId, newState)
			},
		},
		pulse_logic: {
			name: 'Pulse Logic',
			options: [
				{
					id: 'logic_id',
					type: 'number',
					label: 'Logic ID',
					default: 1,
					min: 0,
					max: 65535,
					tooltip: 'Logic address (0-65535). Use hex-to-decimal converter for Export.dpx values.',
				},
				{
					id: 'pulse_duration',
					type: 'number',
					label: 'Pulse Duration (ms)',
					default: 100,
					min: 50,
					max: 1000,
					tooltip: 'Duration of pulse in milliseconds. Sends rising edge (0→1→0).',
				},
			],
			callback: async (event) => {
				const logicId = Number(event.options.logic_id)
				const pulseDuration = Number(event.options.pulse_duration) || 100
				self.ecp.pulseLogic(logicId, pulseDuration)
			},
		},
		request_logic_state: {
			name: 'Request Logic State',
			options: [
				{
					id: 'logic_id',
					type: 'number',
					label: 'Logic ID',
					default: 1,
					min: 0,
					max: 65535,
					tooltip: 'Logic address (0-65535)',
				},
			],
			callback: async (event) => {
				const logicId = Number(event.options.logic_id)
				self.ecp.requestLogicState(logicId)
			},
		},
	}

	self.setActionDefinitions(actions)
}
