import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../test/TestUtil";

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
	let verySmallSections: string;
	// let smallSections: string;
	// let aanb500: string;
	// let aanb504: string;
	let nosection: string;
	let empty: string;
	let emptycourse: string;
	let invaliddirectory: string;
	let invalidjsonsyntax: string;
	let pdffile: string;
	let test0Courses: string;
	let testCourseNotJSON: string;
	let testCourseJSONWithoutResult: string;
	let testSectionNoKeys: string;
	let testBadRootName: string;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		verySmallSections = await getContentFromArchives("smallSections.zip");
		// smallSections = await getContentFromArchives("smallSections2.zip");
		nosection = await getContentFromArchives("nosection.zip");
		empty = await getContentFromArchives("empty.zip");
		emptycourse = await getContentFromArchives("emptycourse.zip");
		invaliddirectory = await getContentFromArchives("invaliddirectory.zip");
		invalidjsonsyntax = await getContentFromArchives("invalidjsonsyntax.zip");
		pdffile = await getContentFromArchives("pdffile.zip");
		test0Courses = await getContentFromArchives("test0Courses.zip");
		testCourseNotJSON = await getContentFromArchives("testCourseNotJSON.zip");
		testCourseJSONWithoutResult = await getContentFromArchives("testCourseJSONWithoutResult.zip");
		testSectionNoKeys = await getContentFromArchives("testSectionNoKeys.zip");
		testBadRootName = await getContentFromArchives("testBadRootName.zip");

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

		//works
		it("should reject with an empty dataset id", async function () {
			try {
				const result = await facade.addDataset(
					//added based on c0 free mutant instruction
					"",
					sections,
					InsightDatasetKind.Sections
				);
				expect.fail(`should not have passed. Result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with an empty dataset iddd", async function () {
			try {
				const result = await facade.addDataset(
					//added based on c0 free mutant instruction
					"  ",
					sections,
					InsightDatasetKind.Sections
				);
				expect.fail(`should not have passed. Result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with a dataset without sections", async function () {
			try {
				const result = await facade.addDataset(
					//added based on c0 free mutant instruction
					"nosection",
					nosection,
					InsightDatasetKind.Sections
				);
				expect.fail(`should not have passed. Result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with a dataset with empty zip", async function () {
			try {
				const result = await facade.addDataset(
					//added based on c0 free mutant instruction
					"empty",
					empty,
					InsightDatasetKind.Sections
				);
				expect.fail(`should not have passed. Result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with a dataset with empty course", async function () {
			try {
				const result = await facade.addDataset("emptycourse", emptycourse, InsightDatasetKind.Sections);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with a dataset with invalid directory name", async function () {
			try {
				const result = await facade.addDataset("invaliddirectory", invaliddirectory, InsightDatasetKind.Sections);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with a dataset with invalid json syntax", async function () {
			try {
				const result = await facade.addDataset("invalidjsonsyntax", invalidjsonsyntax, InsightDatasetKind.Sections);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with a dataset with file that is not json", async function () {
			try {
				const result = await facade.addDataset("pdffile", pdffile, InsightDatasetKind.Sections);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// it("should reject with a null dataset id", async function () {
		//  try {
		//      const result = await facade.addDataset(
		//          null,
		//          sections,
		//          InsightDatasetKind.Sections
		//      );
		//      return expect(result).to.eventually.be.rejectedWith(InsightError);
		//  } catch (err) {
		//      expect(err).to.be.instanceOf(InsightError);
		//  }
		// });

		//works
		it("should reject with a dataset id with underscore", async function () {
			try {
				const result = await facade.addDataset("pair_", sections, InsightDatasetKind.Sections);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
			//expect.fail(Should have thrown above.");
		});

		it("AddDataset: should reject only white space ids", async function () {
			try {
				await facade.addDataset(" ", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown above.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		//seems to work
		it("should successfully add a dataset", async function () {
			try {
				const result = await facade.addDataset("pair", sections, InsightDatasetKind.Sections);
				return expect(result).to.deep.equal(["pair"]);
			} catch (err) {
				expect.fail("Unexpected Error:" + err);
			}
		});

		it("should successfully add 2 datasets", async function () {
			try {
				const result = await facade.addDataset("pair", sections, InsightDatasetKind.Sections);
				expect(result).to.deep.equal(["pair"]);
				const result1 = await facade.addDataset("pair1", sections, InsightDatasetKind.Sections);
				expect(result1).to.deep.equal(["pair", "pair1"]);
				// const result2 = await facade.addDataset("pair2", sections, InsightDatasetKind.Sections);
				// expect(result2).to.deep.equal(["pair", "pair1", "pair2"]);
				// const result3 = await facade.addDataset("pair3", sections, InsightDatasetKind.Sections);
				// return expect(result3).to.deep.equal(["pair", "pair1", "pair2", "pair3"]);
			} catch (err) {
				expect.fail("Unexpected Error:" + err);
			}
		});

		it("should successfully add two datasets", async function () {
			try {
				await facade.addDataset("first", sections, InsightDatasetKind.Sections);
				const result = await facade.addDataset("second", sections, InsightDatasetKind.Sections);
				return expect(result).to.deep.equal(["first", "second"]);
			} catch (err) {
				expect.fail("Unexpected Error:" + err);
			}
		});

		//doesn't work or sometimes works
		it("should reject with an empty dataset content", async function () {
			//commented out AI code suggestion
			//await expect(facade.addDataset("AANB500", "", InsightDatasetKind.Sections))
			//         .to.be.rejectedWith(InsightError);
			try {
				const result = await facade.addDataset("empty", "", InsightDatasetKind.Sections);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
			//expect.fail("Should have thrown above.");
		});
		//both
		it("should reject with a dataset content that is not a zip", async function () {
			try {
				const result = await facade.addDataset("empty", "hi", InsightDatasetKind.Sections);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		//section
		it("should reject content when has 0 courses", async function () {
			try {
				const result = await facade.addDataset("ubc", test0Courses, InsightDatasetKind.Sections);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		//section
		it("should reject content when course is not JSON", async function () {
			try {
				const result = await facade.addDataset("ubc", testCourseNotJSON, InsightDatasetKind.Sections);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		//section
		it("should reject content when course JSON deos not have result", async function () {
			try {
				const result = await facade.addDataset("ubc", testCourseJSONWithoutResult, InsightDatasetKind.Sections);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		//section
		it("should reject content does not have root directory courses", async function () {
			try {
				const result = await facade.addDataset("ubc", testBadRootName, InsightDatasetKind.Sections);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		//section
		it("should reject content section when keys dont exist", async function () {
			try {
				const result = await facade.addDataset("ubc", testSectionNoKeys, InsightDatasetKind.Sections);
				expect.fail(`should not have passed. the result: ${result}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject a dataset with same id", async function () {
			try {
				await facade.addDataset("pair", sections, InsightDatasetKind.Sections);
				const result2 = await facade.addDataset("pair", sections, InsightDatasetKind.Sections);
				expect.fail(`should not have passed. the result: ${result2}`);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("addDataset: with whitspace check name after", async function () {
			try {
				await facade.addDataset(" pair 2 ", sections, InsightDatasetKind.Sections);
				const courseIds: InsightDataset[] = await facade.listDatasets();
				expect(courseIds).to.be.an("array");
				expect(courseIds).to.have.lengthOf(1);
				expect(courseIds[0].id).to.equal(" pair 2 ");
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

		it("should remove a dataset that was added", async function () {
			try {
				await facade.addDataset("pair", sections, InsightDatasetKind.Sections);
				return expect(await facade.removeDataset("pair")).to.deep.equal("pair");
			} catch (err) {
				return expect.fail("Unexpected Error:" + err);
			}
		});

		it("should return not found error when trying to remove a nonexistent dataset", async function () {
			try {
				return expect(await facade.removeDataset("pair")).to.eventually.be.rejectedWith(NotFoundError);
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should return error when trying to remove a dataset with empty id", async function () {
			try {
				return expect(await facade.removeDataset("")).to.eventually.be.rejectedWith(InsightError);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should return error when trying to remove a dataset id with underscore", async function () {
			try {
				return expect(await facade.removeDataset("under_")).to.eventually.be.rejectedWith(InsightError);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject only white space ids", async function () {
			try {
				await facade.removeDataset(" ");
				expect.fail("Should have thrown above.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
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
				// TODO: UNCOMMENT
				// const remove = await facade.removeDataset("pair");
				// TODO: UNCOMMENT
				// expect(remove).to.deep.equal("pair");
				// TODO: UNCOMMENT
				// return expect(await facade.listDatasets()).to.deep.equal([]);
			} catch (err) {
				return expect.fail("Unexpected Error:" + err);
			}
		});
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
		//fix this; still doesn't work

		// it("list is empty", async function () {
		//  try {
		//      return expect(await facade.listDatasets()).to.eventually.be.deep.equal(
		//          []
		//      );
		//  } catch (err) {
		//      expect.fail("Unexpected Error.");
		//  }
		// });

		// //fix this still doesn't work
		// it("should list one dataset", async function () {
		//  try {
		//      await facade.addDataset("pair", sections, InsightDatasetKind.Sections);
		//      const result = facade.listDatasets();
		//      const expected: InsightDataset = {
		//          id: "pair",
		//          kind: InsightDatasetKind.Sections,
		//          numRows: 64612,
		//      };
		//      return expect(result).to.be.deep.equal([expected]);
		//  } catch (err) {
		//      expect.fail("Unexpected error.");
		//  }
		// });

		it("listDatabase: should return empty array when there is no database", async function () {
			try {
				const courseIds = await facade.listDatasets();
				expect(courseIds).to.be.an("array");
				expect(courseIds).to.have.lengthOf(0);
			} catch (err) {
				expect.fail("Should not have thrown above." + err);
			}
		});

		it("listDatabase: should show dataset insights for one dataset", async function () {
			try {
				const numRowsInPair = 64612;
				await facade.addDataset("pair2", sections, InsightDatasetKind.Sections);
				const courseIds: InsightDataset[] = await facade.listDatasets();
				expect(courseIds).to.be.an("array");
				expect(courseIds).to.have.lengthOf(1);
				expect(courseIds[0].numRows).to.equal(numRowsInPair);
			} catch (err) {
				expect.fail("Should not have thrown above." + err);
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

		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.
		it("[valid/smallSections.json] fetch all data very small", checkQuery);
		// it("[valid/smallSections2.json] fetch all data", checkQuery);
		it("[valid/simple.json] SELECT dept, avg WHERE avg > 97", checkQuery);
		it("[invalid/NoWHEREtobefound.json] Query missing WHERE", checkQuery);

		//tests with invalid query

		it("[invalid/ANDempty.json] AND is empty array", checkQuery);
		it("[invalid/ANDonekeyoneempty.json] AND has one key and one empty key", checkQuery);
		it("[invalid/COLUMNSinvalidkey.json] COLUMNS key is invalid", checkQuery);
		it("[invalid/Datasetnotadded.json] Dataset not added yet", checkQuery);
		it("[invalid/emptycolumn.json] columns is empty array", checkQuery);
		it("[invalid/EQempty.json] EQ field is empty", checkQuery);
		it("[invalid/EQinvalidkeytype.json] EQ key (idstring) is invalid", checkQuery);
		it("[invalid/EQinvalidvaluetype.json] EQ value is invalid (expect number but is string)", checkQuery);
		it("[invalid/GTempty.json] GT column no key", checkQuery);
		it("[invalid/GTinvalidkey.json] GT key is invalid", checkQuery);
		it("[invalid/GTinvalidvaluetype.json] GT value is invalid (expect number but is string)", checkQuery);
		it("[invalid/ISempty.json] IS field is empty", checkQuery);
		it("[invalid/ISinvalidkeytype.json] IS key invalid type", checkQuery);
		it("[invalid/ISinvalidvaluetype.json] IS value type invalid", checkQuery);
		it("[invalid/LTempty.json] LT field is empty", checkQuery);
		it("[invalid/LTinvalidkeytype.json] LT key invalid type", checkQuery);
		it("[invalid/LTinvalidvaluetype.json] LT value type invalid", checkQuery);
		it("[invalid/multidatasetquery.json] References more than 1 dataset", checkQuery);
		it("[invalid/NOTempty.json] NOT field is empty", checkQuery);
		it("[invalid/NOTnotobject.json] NOT is not an object", checkQuery);
		it("[invalid/OPTIONSempty.json] OPTIONS is empty", checkQuery);
		it("[invalid/OPTIONSmissing.json] OPTIONS field not included in query", checkQuery);
		it("[invalid/ORDERinvalidtype.json] ORDER invalid type", checkQuery);
		it("[invalid/ORDERnotincolumns.json] ORDER idstring not in COLUMNS", checkQuery);
		it("[invalid/ORempty.json] OR is empty array", checkQuery);
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
		it("[valid/LTSimple.json] LT field has valid key and value", checkQuery);
		it("[valid/NOTNOTsimple.json] double NOT call", checkQuery);
		it("[valid/NOTsimple.json] simple NOT", checkQuery);
		it("[valid/ORonekey.json] OR given one key", checkQuery);
		it("[valid/ORsimple.json] simple OR", checkQuery);

		//newly added tests
		//valid cases
		it("[valid/COLUMNsimple.json] COLUMN given one key", checkQuery);
		it("[valid/COLUMNdup.json] COLUMN given duplicate inputs", checkQuery);
		it("[valid/Complexquery.json] uses all the logic provided", checkQuery);
		it("[valid/ISemptystring.json] IS given empty string input", checkQuery);
		it("[valid/NOTfirst.json] NOT as first input after WHERE", checkQuery);
		it("[valid/NOTthenAND.json] NOT followed by AND inside", checkQuery);
		it("[valid/NOTthenOR.json] NOT followed by OR inside", checkQuery);
		it("[valid/ORDERnumber.json] ORDER by number field", checkQuery);
		it("[valid/ORDERstring.json] ORDER by string field", checkQuery);
		it("[valid/WHEREdouble.json] WHERE queried twice", checkQuery);

		//invalid cases
		it("[invalid/COLUMNnotarray.json] COLUMN not an array", checkQuery);
		it("[invalid/Datasetemptystring.json] referenced dataset is empty string", checkQuery);
		it("[invalid/EQnotobject.json] EQ is not an object", checkQuery);
		it("[invalid/EQnull.json] EQ input is null", checkQuery);
		it("[invalid/EQtwokeys.json] EQ input is 2 keys instead of 1", checkQuery);

		it("[invalid/GTnotobject.json] GT is not an object", checkQuery);
		it("[invalid/GTnull.json] GT input is null", checkQuery);
		it("[invalid/GTtwokeys.json] GT input is 2 keys instead of 1", checkQuery);

		it("[invalid/ISwildcard.json] IS with wildcard returns ResultTooLarge", checkQuery);
		it("[invalid/ISdoublewildcard.json] IS with two wildcard returns ResultTooLarge", checkQuery);
		it("[invalid/IStriplewildcard.json] IS given invalid triple wildcard input", checkQuery);

		it("[invalid/ISnotobject.json] IS is not an object", checkQuery);
		it("[invalid/ISnull.json] IS input is null", checkQuery);
		it("[invalid/IStwokeys.json] IS input is 2 keys instead of 1", checkQuery);

		it("[invalid/LTnotobject.json] LT is not an object", checkQuery);
		it("[invalid/LTnull.json] LT input is null", checkQuery);
		it("[invalid/LTtwokeys.json] LT input is 2 keys instead of 1", checkQuery);

		it("[invalid/NOTtheninvalidfilter.json] NOT given NOR logic, which is invalid", checkQuery);
		it("[invalid/NOTtwokeys.json] NOT input is 2 keys instead of 1", checkQuery);

		it("[invalid/OPTIONSnotobject.json] OPTIONS not an object (empty array)", checkQuery);
		it("[invalid/ORDERnull.json] ORDER given is null", checkQuery);

		it("[invalid/QUERYexcesskeys.json] too many keys in QUERY", checkQuery);
		it("[invalid/WHEREempty.json] WHERE is empty returns ResultTooLarge", checkQuery);
		it("[invalid/WHEREnotobject.json] WHERE is not an object", checkQuery);
		it("[invalid/WHEREtwokeys.json] WHERE input is 2 keys instead of 1", checkQuery);

		it("[invalid/ANDemptykeyfirst.json] AND first key is empty", checkQuery);
		it("[invalid/LTnullobject.json] LT object null", checkQuery);
		it("[invalid/ISnullobject.json] IS object null", checkQuery);
		it("[valid/LargeQuery.json] performs queries", checkQuery);

		it("[valid/NestedANDwith3filters.json] performs queries", checkQuery);
		it("[valid/ANDwithORnested.json] performs queries", checkQuery);
		it("[invalid/NestedANDwith3filtersfail.json] performs queries", checkQuery);
		it("[valid/OrderColumninverted.json] flipped ORDER and COLUMNS", checkQuery);
		it("[invalid/ColumnMissing.json] Column missing from OPTIONS", checkQuery);
		it("[invalid/ColumnNullArray.json] Column array contains null", checkQuery);
		it("[invalid/ColumnNull.json] Column contains null", checkQuery);
		it("[invalid/ORDERnoID.json] ORDER has no IDstring", checkQuery);
		it("[invalid/COLUMNSnoID.json] ORDER has no IDstring", checkQuery);
		it("[invalid/WHEREnull.json] WHERE given null", checkQuery);
		it("[invalid/WHEREnumber.json] WHERE given number", checkQuery);
		it("[invalid/WHEREstring.json] WHERE given string", checkQuery);

		it("[invalid/ANDnull.json] AND given null input", checkQuery);
		it("[invalid/ANDnullarray.json] AND given array containing null", checkQuery);
		it("[invalid/ANDvalidandnull.json] AND gien array with valid obj and null", checkQuery);
		//
	});
});
