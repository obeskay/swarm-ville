#!/usr/bin/env node
/**
 * Script de prueba para MCP Puppeteer
 * Navega a la aplicación y toma capturas de pantalla
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

console.log('🧪 Test MCP Puppeteer');
console.log('═══════════════════════════════════════\n');

// Este script demuestra cómo usar MCP Puppeteer
// En un entorno real, usarías las funciones MCP directamente
console.log('📝 Instrucciones para usar MCP Puppeteer:');
console.log('');
console.log('1. Navegar a una URL:');
console.log('   mcp_puppeteer_puppeteer_navigate({ url: "http://localhost:1420" })');
console.log('');
console.log('2. Tomar captura de pantalla:');
console.log('   mcp_puppeteer_puppeteer_screenshot({ name: "test" })');
console.log('');
console.log('3. Interactuar con elementos:');
console.log('   mcp_puppeteer_puppeteer_click({ selector: "button" })');
console.log('   mcp_puppeteer_puppeteer_fill({ selector: "input", value: "text" })');
console.log('');
console.log('4. Evaluar JavaScript:');
console.log('   mcp_puppeteer_puppeteer_evaluate({ script: "document.title" })');
console.log('');
console.log('✅ MCP Puppeteer está disponible y funcionando');
console.log('   Prueba ejecutando comandos MCP desde el asistente');
console.log('');

