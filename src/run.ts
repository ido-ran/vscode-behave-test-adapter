import * as vscode from "vscode";
import { TestSuiteInfo, TestSuiteEvent, TestEvent } from "vscode-test-adapter-api";
import { Option, AllTest, TestEventsAfterLoad } from "./types";


const runTestSuite = async (
	testSuite: TestSuiteInfo,
	tests: string[],
	testStatesEmitter: vscode.EventEmitter<TestEventsAfterLoad>,
	output: vscode.OutputChannel,
	featureDir: string
): Promise<void> => {

	tests.forEach( async name => {
		let node = findNode(testSuite, name);
		if (node != undefined) {
			await runTest(node, testStatesEmitter, output, featureDir)
		}
	})
}


const runTest = async (
	node: AllTest,
	testStatesEmitter: vscode.EventEmitter<TestEventsAfterLoad>,
	output: vscode.OutputChannel,
	featureDir: string
): Promise<void> => {

	if (node.type === "suite") {

		testStatesEmitter.fire(<TestSuiteEvent>{ type: "suite", suite: node.id, state: "running" });

		for (const child of node.children) {
			await runTest(child, testStatesEmitter, output, featureDir);
		}

		testStatesEmitter.fire(<TestSuiteEvent>{ type: "suite", suite: node.id, state: "completed" });

	} else { // node.type === "test"

		testStatesEmitter.fire(<TestEvent>{ type: "test", test: node.id, state: "running" });

		const { spawn } = require("child_process");

		const child = await spawn(
			"behave", [ "-n", node.id.split(":")[1] ], {
			cwd: featureDir
		});

		var so = "";
		for await (const data of child.stdout) {
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

export default runTestSuite;