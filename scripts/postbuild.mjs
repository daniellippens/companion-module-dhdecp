/**
 * Post-build script to add @companion-module/base/package.json to the package
 * This is required for Companion to verify the API version
 */
import { mkdirSync, copyFileSync } from 'fs'

const targetDir = 'pkg/node_modules/@companion-module/base'
const sourceFile = 'node_modules/@companion-module/base/package.json'
const targetFile = `${targetDir}/package.json`

// Create directory structure
mkdirSync(targetDir, { recursive: true })

// Copy the package.json
copyFileSync(sourceFile, targetFile)

console.log('Added @companion-module/base/package.json to package')
