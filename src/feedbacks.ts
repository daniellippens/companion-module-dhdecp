import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'

export function UpdateFeedbacks(self: ModuleInstance): void {
	const feedbacks: CompanionFeedbackDefinitions = {
		logic_state: {
			name: 'Logic State',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
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
				{
					id: 'state',
					type: 'dropdown',
					label: 'Expected State',
					default: 1,
					choices: [
						{ id: 0, label: 'OFF (0)' },
						{ id: 1, label: 'ON (1)' },
					],
				},
			],
			callback: (feedback) => {
				const logicId = Number(feedback.options.logic_id)
				const expectedState = Number(feedback.options.state) === 1
				const currentState = self.ecp.getLogicState(logicId)

				// Return true if current state matches expected state
				return currentState === expectedState
			},
		},
	}

	self.setFeedbackDefinitions(feedbacks)
}
