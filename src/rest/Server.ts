import express, { Application, Request, Response } from "express";
import Log from "@ubccpsc310/folder-test/build/Log";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import { StatusCodes } from "http-status-codes";
import { InsightDatasetKind, InsightError, NotFoundError } from "../controller/IInsightFacade";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	private static facade: InsightFacade;

	constructor(port: number) {
		Log.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();
		Server.facade = new InsightFacade();

		this.registerMiddleware();
		this.registerRoutes();

		// NOTE: you can serve static frontend files in from your express server
		// by uncommenting the line below. This makes files in ./frontend/public
		// accessible at http://localhost:<port>/
		// this.express.use(express.static("./frontend/public"))
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			Log.info("Server::start() - start");
			if (this.server !== undefined) {
				Log.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express
					.listen(this.port, () => {
						Log.info(`Server::start() - server listening on port: ${this.port}`);
						resolve();
					})
					.on("error", (err: Error) => {
						// catches errors in server start
						Log.error(`Server::start() - server ERROR: ${err.message}`);
						reject(err);
					});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public async stop(): Promise<void> {
		Log.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				Log.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					Log.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware(): void {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({ type: "application/*", limit: "10mb" }));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes(): void {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);
		this.express.get("/datasets", Server.handleList);
		this.express.put("/dataset/:id/:kind", Server.handleAddDataset);
		this.express.post("/query", Server.handlePerformQuery);
		this.express.delete("/dataset/:id", Server.handleRemoveDataset);
	}

	public static async handleList(req: Request, res: Response): Promise<void> {
		Log.info(`Server::handleList(..) - params: ${JSON.stringify(req.params)}`);
		const response = await Server.facade.listDatasets();
		res.status(StatusCodes.OK).json({ result: response });
	}

	public static async handleAddDataset(req: Request, res: Response): Promise<void> {
		try {
			Log.info(`Server::handleAddDataset(..) - params: ${JSON.stringify(req.params)}`);

			const { id, kind } = req.params;

			// Input Validation
			if (!id || !kind) {
				throw new InsightError("Missing required parameters: id and kind.");
			}

			// Convert and Validate 'kind'
			const datasetKind = Server.convertKind(kind);

			// Ensure req.body is a Buffer
			if (!Buffer.isBuffer(req.body)) {
				throw new InsightError("Request body must be a Buffer.");
			}

			const datasetContent = req.body.toString("base64");

			const response = await Server.facade.addDataset(req.params.id, datasetContent, datasetKind);
			res.status(StatusCodes.OK).json({ result: response });
		} catch (err) {
			res.status(StatusCodes.BAD_REQUEST).json({ error: err });
		}
	}

	private static convertKind(kind: string): InsightDatasetKind {
		if (kind === "sections") {
			return InsightDatasetKind.Sections;
		} else if (kind === "rooms") {
			return InsightDatasetKind.Rooms;
		} else {
			throw new InsightError(`Invalid kind: ${kind}`);
		}
	}

	// The next two methods handle the echo service.
	// These are almost certainly not the best place to put these, but are here for your reference.
	// By updating the Server.echo function pointer above, these methods can be easily moved.
	public static echo(req: Request, res: Response): void {
		try {
			Log.info(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(StatusCodes.OK).json({ result: response });
		} catch (err) {
			res.status(StatusCodes.BAD_REQUEST).json({ error: err });
		}
	}

	public static async handlePerformQuery(req: Request, res: Response): Promise<void> {
		try {
			Log.info(`Server::handlePerformQuery(..) - params: ${JSON.stringify(req.params)}`);
			const response = await Server.facade.performQuery(req.body);
			res.status(StatusCodes.OK).json({ result: response });
		} catch (err) {
			res.status(StatusCodes.BAD_REQUEST).json({ error: Server.getErrorMessage(err) });
		}
	}

	public static async handleRemoveDataset(req: Request, res: Response): Promise<void> {
		try {
			Log.info(`Server::handleRemoveDataset(..) - params: ${JSON.stringify(req.params)}`);
			const response = await Server.facade.removeDataset(req.params.id);
			res.status(StatusCodes.OK).json({ result: response });
		} catch (err) {
			if (err instanceof NotFoundError) {
				res.status(StatusCodes.NOT_FOUND).json({ error: err });
			} else {
				res.status(StatusCodes.BAD_REQUEST).json({ error: err });
			}
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	private static getErrorMessage(err: any): string {
		return err.message;
	}
}
