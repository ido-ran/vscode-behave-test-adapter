import * as vscode from "vscode";
import { TestAdapter, TestLoadStartedEvent, TestLoadFinishedEvent,
	TestRunStartedEvent, TestRunFinishedEvent,
	TestSuiteInfo
} from "vscode-test-adapter-api";
import { Log } from "vscode-test-adapter-util";
import runTestSuite from "./run";
import loadTestSuite from "./load";
import { Option, TestEventsAfterLoad, TestLoadEvents } from "./types";


export class BehaveAdapter implements TestAdapter {

	private disposables: { dispose(): void }[] = [];

	private readonly testsEmitter = new vscode.EventEmitter<TestLoadEvents>();
	private readonly testStatesEmitter = new vscode.EventEmitter<TestEventsAfterLoad>();
	private readonly autorunEmitter = new vscode.EventEmitter<void>();

	private readonly output = vscode.window.createOutputChannel("Behave");
	private testSuite: Option<TestSuiteInfo> = undefined;
	private featureDir: Option<string> = undefined;

	constructor(
		public readonly workspace: vscode.WorkspaceFolder,
		private readonly log: Log
	) {
		this.disposables.push(this.testsEmitter);
		this.disposables.push(this.testStatesEmitter);
		this.disposables.push(this.autorunEmitter);
	}

	get tests(): vscode.Event<TestLoadEvents> { return this.testsEmitter.event; }
	get testStates(): vscode.Event<TestEventsAfterLoad> { return this.testStatesEmitter.event; }
	get autorun(): Option<vscode.Event<void>> { return this.autorunEmitter.event; }

	async load(): Promise<void> {

		this.log.info("Loading Behave tests");

		this.testsEmitter.fire(<TestLoadStartedEvent>{ type: "started" });

		const workspaceRoot = this.workspace.uri.fsPath;
		this.featureDir = await findFeatureRoot(workspaceRoot);

		if (this.featureDir === undefined) {
			return await this.fire_test_not_found();
		}

		try {
			this.testSuite = await loadTestSuite(workspaceRoot, this.featureDir);

			if (this.testSuite === undefined) {
				return await this.fire_test_not_found();
			}

			return await this.fire_run_test_suite(this.testSuite);
		} catch (err) {
			return await this.fire_loading_test_err(err);
		}

	}

	async getPythonExecutable(): Promise<string | undefined> {
		const extension = vscode.extensions.getExtension('ms-python.python')!;
		const usingNewInterpreterStorage = extension.packageJSON?.featureFlags?.usingNewInterpreterStorage;

		if (!usingNewInterpreterStorage) {
			return undefined;
		}

		if (!extension.isActive) {
			await extension.activate();
		}
		await extension.exports.ready;
		const pythonPath = extension.exports.settings.getExecutionDetails(this.workspace.uri).execCommand[0];
		return pythonPath;
	}

	async run(tests: string[]): Promise<void> {
		this.output.clear()

		const pythonExecutable = await this.getPythonExecutable();
		if (!pythonExecutable) {
			this.log.info("Python executable not found");
			return;
		}
		this.log.info(`Running behave tests ${JSON.stringify(tests)}`);

		this.testStatesEmitter.fire(<TestRunStartedEvent>{ type: "started", tests });

		if (this.featureDir == undefined) {
			this.log.warn("No features found in workspace");
			return
		}

		if (this.testSuite != undefined){
			await runTestSuite(
				pythonExecutable,
				this.testSuite, tests, this.testStatesEmitter,
				this.output, this.featureDir
			);
		}

		this.testStatesEmitter.fire(<TestRunFinishedEvent>{ type: "finished" });

	}

	cancel(): void {
		// in a "real" TestAdapter this would kill the child process for the current test run (if there is any)
		throw new Error("Method not implemented.");
	}

	dispose(): void {
		this.cancel();
		for (const disposable of this.disposables) {
			disposable.dispose();
		}
		this.disposables = [];
	}

    private async fire_test_not_found(): Promise<void> {
		this.log.warn("No features found in workspace");
		this.testsEmitter.fire(<TestLoadFinishedEvent>{
			type: "finished",
			errorMessage: "No test found in workspace"
		});
	}

    private async fire_loading_test_err(err: Error): Promise<void> {
		this.log.error(`Error loading tests: ${err}`);
		this.testsEmitter.fire(<TestLoadFinishedEvent>{
			type: "finished",
			errorMessage: err.message
		});
	}

    private async fire_run_test_suite(tests: TestSuiteInfo): Promise<void> {
		this.log.info("Tests found");
		this.testsEmitter.fire(<TestLoadFinishedEvent>{
			type: "finished", suite: tests
		});
	}
}


const findFeatureRoot = async (workspaceRoot: string): Promise<Option<string>> => {
	const fg = require("fast-glob");
	const path = require("path");
    const candidates = await fg(
        ["**/features"],
        { onlyDirectories: true, cwd: workspaceRoot }
	);
	if (candidates[0] === undefined) {
		return Promise.resolve(undefined)
	}
	const featureRoot = path.join(workspaceRoot, candidates[0]);
    return Promise.resolve<string>(featureRoot)
}
