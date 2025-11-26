import type { ModuleInstance } from './main.js'

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions([
		{ variableId: 'connection_status', name: 'Connection Status' },
		{ variableId: 'host', name: 'DHD Host IP' },
		{ variableId: 'port', name: 'DHD Port' },
	])

	// Set initial variable values
	self.setVariableValues({
		connection_status: 'Connecting...',
		host: self.config.host,
		port: self.config.port.toString(),
	})
}
