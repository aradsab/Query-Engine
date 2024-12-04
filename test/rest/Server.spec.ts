import { expect } from "chai";
import request, { Response } from "supertest";
import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";
import { clearDisk, getContentFromArchives } from "../TestUtil";
import Server from "../../src/rest/Server";
import * as fs from "fs-extra";
import InsightFacade from "../../src/controller/InsightFacade";
import { InsightDatasetKind } from "../../src/controller/IInsightFacade";

describe("Facade C3", function () {
	const port = 4321;
	const server = new Server(port);

	before(function () {
		server.start().catch((err: Error) => {
			Log.error(`App::initServer() - ERROR: ${err.message}`);
		});
	});

	after(function () {
		server.stop().catch((err: Error) => {
			Log.error(`App::stop() - ERROR: ${err.message}`);
		});
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	afterEach(async function () {
		// might want to add some process logging here to keep track of what is going on
		await clearDisk();
	});

	it("GET test for echo", function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/echo/hello";

		try {
			return request(SERVER_URL)
				.get(ENDPOINT_URL)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(StatusCodes.OK);
					expect(res.body.result).to.be.equal("hello...hello");
				})
				.catch(function () {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("GET test for courses dataset", function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/datasets";

		try {
			return request(SERVER_URL)
				.get(ENDPOINT_URL)
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(StatusCodes.OK);
				})
				.catch(function () {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	// Sample on how to format PUT requests
	it("PUT test for courses dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/smallPair/sections";
		const name = "smallSections.zip";
		const ZIP_FILE_DATA = await fs.readFile("test/resources/archives/" + name);

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(StatusCodes.OK);
				})
				.catch(function () {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("POST test for courses dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/query";
		const query: Record<any, any> = {
			WHERE: {
				AND: [
					{
						LT: {
							sections_avg: 60,
						},
					},
					{
						GT: {
							sections_avg: 50,
						},
					},
				],
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg",
			},
		};

		const facade: InsightFacade = new InsightFacade();
		const sections = await getContentFromArchives("pair.zip");
		await facade.addDataset("sections", sections, InsightDatasetKind.Sections);

		try {
			return request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(query)
				.set("Content-Type", "application/json")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(StatusCodes.OK);
				})
				.catch(function () {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("DELETE test for courses dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/smallPair";

		const facade: InsightFacade = new InsightFacade();
		const sections = await getContentFromArchives("pair.zip");
		await facade.addDataset("smallPair", sections, InsightDatasetKind.Sections);

		try {
			return request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(StatusCodes.OK);
				})
				.catch(function () {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	// The other endpoints work similarly. You should be able to find all instructions in the supertest documentation
});
