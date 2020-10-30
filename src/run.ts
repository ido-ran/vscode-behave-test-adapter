import * as vscode from "vscode";
import { TestSuiteInfo, TestSuiteEvent, TestEvent } from "vscode-test-adapter-api";
import { Option, AllTest, TestEventsAfterLoad } from "./types";


const runTestSuite = async (
	pythonExec: string,
	testSuite: TestSuiteInfo,
	tests: string[],
	testStatesEmitter: vscode.EventEmitter<TestEventsAfterLoad>,
	output: vscode.OutputChannel,
	featureDir: string
): Promise<void> => {

	tests.forEach(async name => {
		let node = findNode(testSuite, name);
		if (node != undefined) {
			await runTest(pythonExec, node, testStatesEmitter, output, featureDir)
		}
	})
}

const debugTest = async (
	testSuite: TestSuiteInfo,
	test: string,
	workspace: vscode.WorkspaceFolder,
	output: vscode.OutputChannel
): Promise<void> => {

	const node = findNode(testSuite, test);
	if (node && node.type == "test") {
		const scenarioName = node.id.split(":")[1];

		try {
			await vscode.debug.startDebugging(workspace,
				{
					name: "debug-behave",
					type: 'python',
					request: 'launch',
					console: 'internalConsole',
					justMyCode: true,
					module: "behave",
					args: [
						node.file,
						"-n",
						scenarioName
					]
				});
		} catch (exception) {
			output.clear();
			output.appendLine(`Failed to start debugging tests: ${exception}`);
			output.show();
		}

	}
}

const runTest = async (
	pythonExec: string,
	node: AllTest,
	testStatesEmitter: vscode.EventEmitter<TestEventsAfterLoad>,
	output: vscode.OutputChannel,
	featureDir: string
): Promise<void> => {

	if (node.type === "suite") {

		testStatesEmitter.fire(<TestSuiteEvent>{ type: "suite", suite: node.id, state: "running" });

		for (const child of node.children) {
			await runTest(pythonExec, child, testStatesEmitter, output, featureDir);
		}

		testStatesEmitter.fire(<TestSuiteEvent>{ type: "suite", suite: node.id, state: "completed" });

	} else { // node.type === "test"

		testStatesEmitter.fire(<TestEvent>{ type: "test", test: node.id, state: "running" });

		const { spawn } = require("child_process");

		const scenarioName = node.id.split(":")[1];
		const behaveArgs = ["-m", "behave", node.file, "-n", scenarioName];

		const child = await spawn(
			pythonExec, behaveArgs, {
			cwd: featureDir
		});

		var so = "";
		for await (const data of child.stdout) {
			so += data
		};

		for await (const data of child.stderr) {
			so += data
		};

		child.on("exit", (code: number) => {
			output.append(so + "\n\n");
			output.show(true);
			if (code === 0) {
				testStatesEmitter.fire(<TestEvent>{ type: "test", test: node.id, state: "passed" });
			} else {
				testStatesEmitter.fire(<TestEvent>{ type: "test", test: node.id, state: "failed" });
			}
		});
	}
}


const findNode = (searchNode: AllTest, id: string): Option<AllTest> => {
	if (searchNode.id === id) {
		return searchNode;
	} else if (searchNode.type === "suite") {
		for (const child of searchNode.children) {
			const found = findNode(child, id);
			if (found) return found;
		}
	}
	return undefined;
}

export { runTestSuite, debugTest };
