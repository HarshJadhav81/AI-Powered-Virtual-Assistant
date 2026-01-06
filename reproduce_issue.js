
import appsService from './backend/services/appsService.js';

async function testApp(name) {
    console.log(`\n--- Testing "${name}" ---`);
    const result = await appsService.findApp(name);
    console.log(`Result for "${name}":`, result ? `Found: ${result.name} at ${result.path}` : "NOT FOUND");
}

async function run() {
    console.log("Starting App Service Reproduction Test...");

    // Test 1: Simple known apps
    await testApp("calculator");
    await testApp("notes");

    // Test 2: With "the" prefix (common voice artifact)
    await testApp("the calculator");
    await testApp("the notes");

    // Test 3: Aliases
    await testApp("code");
    await testApp("vscode");

    // Test 4: Case sensitivity
    await testApp("Calculator");
    await testApp("CALCULATOR");

    // Test 5: "app" suffix (often captured by regex)
    await testApp("calculator app");

    // Test 6: Some potentially problematic apps
    await testApp("Google Chrome");
    await testApp("chrome");

    console.log("\nTest complete.");
}

run().catch(console.error);
