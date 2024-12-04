import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let rooms: string;
	let noRooms: string;
	let noIndexTable: string;
	let badClassIndex: string;
	// let badExtraBuilding: string;
	// let badAddress: string;
	// let badClassName: string;
	let badPath: string;
	let noIndex: string;
	let verySmallSections: string;
	let missingBuilding: string;
	let missingBuilding2: string;
	// let goodTdEmptyString: string;
	// let goodLinkNotExist: string;
	// let goodIndexManyTable: string;
	// let goodTest: string;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		rooms = await getContentFromArchives("campus.zip");
		noRooms = await getContentFromArchives("noRooms.zip");
		noIndexTable = await getContentFromArchives("noIndexTable.zip");
		badClassIndex = await getContentFromArchives("badClassIndex.zip");
		// badExtraBuilding = await getContentFromArchives("badExtraBuilding.zip");
		// badAddress = await getContentFromArchives("badAddress.zip");
		noIndex = await getContentFromArchives("noIndex.zip");
		badPath = await getContentFromArchives("badBuildingPath.zip");
		// badClassName = await getContentFromArchives("badClassName.zip");
		verySmallSections = await getContentFromArchives("smallSections.zip");
		missingBuilding = await getContentFromArchives("missingBuilding.zip");
		missingBuilding2 = await getContentFromArchives("missingBuilding2.zip");

		// goodTdEmptyString = await getContentFromArchives("goodTdEmptyString.zip");
		// goodLinkNotExist = await getContentFromArchives("goodLinkNotExist.zip");
		// goodIndexManyTable = await getContentFromArchives("goodIndexManyTable.zip");
		// goodTest = await getContentFromArchives("goodTest.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	describe("AddDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should successfully add room", async function () {
			try {
				const result = await facade.addDataset("room", rooms, InsightDatasetKind.Rooms);
				expect(result).to.deep.equal(["room"]);
			} catch (err) {
				expect.fail(`should have passed. the err: ${err}`);
			}
		});

		//rooms
		it("should reject content no index.htm", async function () {
			try {
				const result = await facade.addDataset("ubc", noIndex, InsightDatasetKind.Rooms);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		//rooms
		it("should reject content no campus/discover/buildings-and-classrooms/", async function () {
			try {
				const result = await facade.addDataset("ubc", badPath, InsightDatasetKind.Rooms);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		//rooms
		it("should reject dataset no room", async function () {
			try {
				const result = await facade.addDataset("ubc", noRooms, InsightDatasetKind.Rooms);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		//rooms
		it("should reject dataset no table in index.htm", async function () {
			try {
				const result = await facade.addDataset("ubc", noIndexTable, InsightDatasetKind.Rooms);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		//rooms ???
		it("should reject dataset no td.views-field-titl in index.htm", async function () {
			try {
				const result = await facade.addDataset("ubc", badClassIndex, InsightDatasetKind.Rooms);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// it("should reject dataset content has building that has no link to index.htm", async function () {
		// 	try {
		// 		const result = await facade.addDataset("ubc", badExtraBuilding, InsightDatasetKind.Rooms);
		// 		expect.fail(`should not have passed. the result: ${result}`);
		// 	} catch (err) {
		// 		expect(err).to.be.instanceOf(InsightError);
		// 	}
		// });

		// it("should reject dataset content has building that has rooms and has no valid geolocation", async function () {
		// 	try {
		// 		const result = await facade.addDataset("ubc", badAddress, InsightDatasetKind.Rooms);
		// 		expect.fail(`should not have passed. the result: ${result}`);
		// 	} catch (err) {
		// 		expect(err).to.be.instanceOf(InsightError);
		// 	}
		// });
		//
		// it("should reject dataset content has building that has rooms and has no valid key, or misses keys", async function () {
		// 	try {
		// 		const result = await facade.addDataset("ubc", badClassName, InsightDatasetKind.Rooms);
		// 		expect.fail(`should not have passed. the result: ${result}`);
		// 	} catch (err) {
		// 		expect(err).to.be.instanceOf(InsightError);
		// 	}
		// });

		it("should add dataset with missing building file", async function () {
			try {
				const result = await facade.addDataset("ubc", missingBuilding, InsightDatasetKind.Rooms);
				expect(result).to.deep.equal(["ubc"]);
			} catch (err) {
				expect.fail(`should not have passed. the result: ${err}`);
			}
		});

		it("should add dataset with missing building file2", async function () {
			try {
				const result = await facade.addDataset("ubc", missingBuilding2, InsightDatasetKind.Rooms);
				expect(result).to.deep.equal(["ubc"]);
			} catch (err) {
				expect.fail(`should not have passed. the result: ${err}`);
			}
		});

		// it("should pass dataset content has building that has rooms and has td empty or empty string", async function () {
		// 	try {
		// 		const maxRowsRooms = 364;
		// 		const result = await facade.addDataset("ubc", goodTdEmptyString, InsightDatasetKind.Rooms);
		// 		expect(result).to.deep.equal(["ubc"]);
		// 		const courseIds: InsightDataset[] = await facade.listDatasets();
		// 		expect(courseIds).to.be.an("array");
		// 		expect(courseIds).to.have.lengthOf(1);
		// 		expect(courseIds[0].id).to.equal("ubc");
		// 		expect(courseIds[0].numRows).to.equal(maxRowsRooms);
		// 	} catch (err) {
		// 		expect.fail(`should have passed. the err: ${err}`);
		// 	}
		// });
		//
		// it("should pass dataset index links to building that does not exist", async function () {
		// 	try {
		// 		const result = await facade.addDataset("ubc", goodLinkNotExist, InsightDatasetKind.Rooms);
		// 		expect(result).to.deep.equal(["ubc"]);
		// 	} catch (err) {
		// 		expect.fail(`should not have passed. the result: ${err}`);
		// 	}
		// });
		// it("should pass dataset index has many tables", async function () {
		// 	try {
		// 		const result = await facade.addDataset("ubc", goodIndexManyTable, InsightDatasetKind.Rooms);
		// 		expect(result).to.deep.equal(["ubc"]);
		// 	} catch (err) {
		// 		expect.fail(`should not have passed. the result: ${err}`);
		// 	}
		// });

		it("should pass add two datasets rooms", async function () {
			try {
				const result = await facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
				expect(result).to.deep.equal(["ubc"]);
				const result2 = await facade.addDataset("ubcc", rooms, InsightDatasetKind.Rooms);
				expect(result2).to.deep.equal(["ubc", "ubcc"]);
			} catch (err) {
				expect.fail(`should not have passed. the result: ${err}`);
			}
		});

		// it("should pass just testing", async function () {
		// 	try {
		// 		// const maxRowsRooms = 364;
		// 		const result = await facade.addDataset("ubc", goodTest, InsightDatasetKind.Rooms);
		// 		expect(result).to.deep.equal(["ubc"]);
		// 		// const courseIds: InsightDataset[] = await facade.listDatasets();
		// 		// expect(courseIds).to.be.an("array");
		// 		// expect(courseIds).to.have.lengthOf(1);
		// 		// expect(courseIds[0].id).to.equal("ubc");
		// 		// expect(courseIds[0].numRows).to.equal(maxRowsRooms);
		// 	} catch (err) {
		// 		expect.fail(`should not have passed. the result: ${err}`);
		// 	}
		// });
	});

	describe("listDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("listDatabase: should show dataset insights for one dataset", async function () {
			try {
				const numRowsInRooms = 364;
				await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				const courseIds: InsightDataset[] = await facade.listDatasets();
				expect(courseIds).to.be.an("array");
				expect(courseIds).to.have.lengthOf(1);
				expect(courseIds[0].numRows).to.equal(numRowsInRooms);
				expect(courseIds[0].id).to.equal("rooms");
				expect(courseIds[0].kind).to.equal(InsightDatasetKind.Rooms);
			} catch (err) {
				expect.fail("Should not have thrown above." + err);
			}
		});
	});

	describe("removeDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should remove two datas that was added", async function () {
			try {
				const jobs = [];
				jobs.push(facade.addDataset("pair", sections, InsightDatasetKind.Sections));
				jobs.push(facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms));
				// jobs.push(facade.removeDataset("pair"))
				await Promise.all(jobs);
				const newInstance = new InsightFacade();
				const res = await newInstance.removeDataset("pair");
				expect(res).to.equal("pair");
				return expect(await facade.removeDataset("rooms")).to.deep.equal("rooms");
			} catch (err) {
				return expect.fail("Unexpected Error:" + err);
			}
		});

		it("should remove many dataset added", async function () {
			try {
				// TODO: UNCOMMENT
				// await facade.addDataset("pair", sections, InsightDatasetKind.Sections);
				await facade.addDataset("pair2", sections, InsightDatasetKind.Sections);
				await facade.addDataset("pair3", sections, InsightDatasetKind.Sections);

				const remove2 = await facade.removeDataset("pair2");
				expect(remove2).to.deep.equal("pair2");

				const remove3 = await facade.removeDataset("pair3");
				expect(remove3).to.deep.equal("pair3");
			} catch (err) {
				return expect.fail("Unexpected Error:" + err);
			}
		});
	});

	describe("PerformQuery", function () {
		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */

		async function checkQuery(this: Mocha.Context): Promise<any> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);
			let result: InsightResult[];
			try {
				result = await facade.performQuery(input);
				//expect(result).to.deep.equal(expected); //to test sort
				expect(result).to.have.deep.members(expected);
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}
				//return expect.fail("Write your assertion(s) here."); // TODO: replace with your assertions

				if (errorExpected) {
					if (expected === "InsightError") {
						expect(err).to.be.instanceOf(InsightError);
					} else {
						expect(err).to.be.instanceOf(ResultTooLargeError);
					}
				}
				// expect.fail(
				//  `performQuery resolved when it should have rejected with ${expected}`
				// );
			}
			//return expect.fail("Write your assertion(s) here."); // TODO: replace with your assertions
		}

		before(async function () {
			facade = new InsightFacade();

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises: Promise<string[]>[] = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
				facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms),
				facade.addDataset("smallSections1", verySmallSections, InsightDatasetKind.Sections),
			];

			try {
				await Promise.all(loadDatasetPromises);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		after(async function () {
			await clearDisk();
		});
		it("[valid/countSection.json] count sections", checkQuery);
		it("[c2albert/ApplyAllTokens.json] Use all APPLY tokens", checkQuery);
		it("[c2albert/ApplyBodyNoKey.json] APPLY body missing key after token", checkQuery);
		it("[c2albert/ApplyBodyTwoKeys.json] APPLYKEY given two token+key", checkQuery);
		it("[c2albert/ApplyCountStringKey.json] APPLY Count given skey", checkQuery);
		it("[c2albert/ApplyEmptyArray.json] APPLY is empty array", checkQuery);
		it("[c2albert/ApplyEmptyKey.json] APPLY given empty key", checkQuery);
		it("[c2albert/ApplyKeyDuplicateString.json] APPLY given duplicate key", checkQuery);
		it("[c2albert/ApplyKeyEmptyString.json] APPLY given empty string as key name", checkQuery);
		it("[c2albert/ApplyKeyInvalidTargetKey.json] APPLY given invalid key", checkQuery);
		it("[c2albert/ApplyKeyInvalidToken.json] APPLY given invalid token", checkQuery);
		it("[c2albert/ApplyKeyNamedEmptyString.json] APPLYKEY name empty string", checkQuery);
		it("[c2albert/ApplyKeyNamedSpace.json] APPLYKEY name ' ' ", checkQuery);
		it("[c2albert/ApplyMaxInvalidKeyType.json] MAX given skey", checkQuery);
		it("[c2albert/ApplyMoreThanOneDataset.json] APPLY given more than one dataset", checkQuery);
		it("[c2albert/ApplyUnderscore.json] APPLY name given _", checkQuery);
		it("[c2albert/ColumnKeyDuplicate.json] COLUMN same key twice", checkQuery);
		it("[c2albert/ColumnKeyNotInGroupOrApply.json] COLUMN key not in group or apply", checkQuery);
		it("[c2albert/DirInvalid.json] Invalid direction", checkQuery);
		it("[c2albert/DirUpApplyMaxMin.json] Direction Up test", checkQuery);
		it("[c2albert/GroupApplykey.json] Group with APPLYKEY", checkQuery);
		it("[c2albert/GroupNotInColumn.json] Group not in COLUMN", checkQuery);
		it("[c2albert/OrderKeysEmptyArray.json] Order keys given empty array", checkQuery);
		it("[c2albert/OrderKeysNotInColumns.json] Order keys not in columns", checkQuery);
		it("[c2albert/OrderMissingKeys.json] Order no key field", checkQuery);
		it("[c2albert/OrderNoDirWithKeys.json] Order not given direction", checkQuery);
		it("[c2albert/OrderUsingApplyKey.json] Order given APPLYKEY", checkQuery);
		it("[c2albert/RoomsQueryAllKeys.json] Rooms querying all keys", checkQuery);
		it("[c2albert/RoomsQueryExample.json] Provided rooms example", checkQuery);
		it("[c2albert/RoomsQueryInvalidKey.json] Rooms IS invalid key type", checkQuery);
		it("[c2albert/RoomsQueryMultiDataset.json] Rooms querying multiple datasets", checkQuery);
		it("[c2albert/SimpleGroup.json] Simple Group", checkQuery);

		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.
		it("[valid/smallSections.json] fetch all data very small", checkQuery);
		// it("[valid/smallSections2.json] fetch all data", checkQuery);
		it("[valid/simple.json] SELECT dept, avg WHERE avg > 97", checkQuery);

		//
		it("[valid/fetchAllRooms.json] fetch all the rooms to check both perform query and addDataset", checkQuery);
		it("[invalid/ORDERnotincolumns.json] ORDER idstring not in COLUMNS", checkQuery);
		it("[invalid/ORempty.json] OR is empty array", checkQuery);
		it(
			"[valid/fetchAllRooms.json] fetch all the rooms to check both perform query and addDataset for the second time",
			checkQuery
		);
		it("[invalid/ORonekeyoneempty.json] OR has one key and one empty key", checkQuery);
		it("[invalid/QueryOVER5000.json] Query result too big", checkQuery);
		it("[invalid/zeroquery.json] References no datasets", checkQuery);

		//wildcard input tests
		it("[invalid/ISInputwildcardString.json] Wildcard in middle", checkQuery);
		it("[valid/ISInputStringwildcard.json] Wildcard at end", checkQuery);
		it("[valid/ISwildcardInputString.json] Wildcard at start", checkQuery);
		it("[valid/ISwildcardInputStringwildcard.json] Wildcard at start", checkQuery);

		//test with valid queries
		it("[valid/ANDonekey.json] AND given one key", checkQuery);
		it("[valid/ANDquerymulti.json] AND query with valid MCOMP, SCOMP, NEG, and all possible columns", checkQuery);
		it("[valid/ANDsimple.json] simple AND", checkQuery);
		it("[valid/defaultOrder.json] Order not specified", checkQuery);
		it("[valid/EQsimple.json] EQ field has valid key and value", checkQuery);
		it("[valid/GTSimple.json] GT field has valid key and value", checkQuery);
		it("[valid/ISsimple.json] IS field has valid key and value", checkQuery);

		//c2 tests

		it("[c2albert/GroupTwoKeys.json] GroupTwoKeys", checkQuery);

		it("[c2albert/OrderDirUp.json] Order with direction UP", checkQuery);
		it("[c2albert/OrderDirDown.json] Order with direction DOWN", checkQuery);
		it("[c2albert/Sortmany.json] Test sorting with many fields", checkQuery);
		it("[c2albert/SimpleColumnCheck.json] Testing Column only uses transform keys", checkQuery);
	});
});
