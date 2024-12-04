import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import SectionHelper from "../Helpers/SectionHelper";
import JSZip from "jszip";
import fs from "fs-extra";
import Dataset from "../Model/Dataset";
import Section from "../Model/Section";
import QueryValidation from "../Helpers/QueryValidation";
import QueryEngineHelper from "../Helpers/QueryEngineHelper";
import RoomHelper from "../Helpers/RoomHelper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private dataSets: Record<string, Dataset> = {};
	private sectionHelper: SectionHelper = new SectionHelper();
	private roomHelper: RoomHelper = new RoomHelper();
	private queryEngineHelper: QueryEngineHelper = new QueryEngineHelper();
	private maxSection = 5000;

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		//validate input id, kind and content (just to the section JSON part)
		this.validateParams(id, kind);
		await fs.ensureDir("data");
		const parsedJson = await fs.readdir(`data`);
		let datasetsIDs: string[] = parsedJson.map((element) => {
			return element.split(".")[0];
		});
		datasetsIDs = datasetsIDs.filter((item) => item !== "addresses");
		if (datasetsIDs.includes(id) || Object.hasOwn(this.dataSets, id)) {
			throw new InsightError("id already exists");
		}

		// Parse
		interface FileData {
			files: Record<string, any>;
		}

		let byteInputDatas: FileData;
		const jobs: Promise<any>[] = [];
		// Validate id, content and kind
		// Data modeling
		try {
			byteInputDatas = await JSZip.loadAsync(content, { base64: true, createFolders: true, checkCRC32: true });
			const dataNames = this.makeJobs(byteInputDatas.files, jobs, kind);
			const inputDatas = await Promise.all(jobs);
			const datasetAdded = await this.addDatas(inputDatas, dataNames, kind);
			this.dataSets[id] = new Dataset(id, datasetAdded.datas, datasetAdded.numRows, kind);
			// Asynchronously write buffer to a file
			await fs.writeJSON(`data/${id}.json`, this.dataSets[id]);
			// Asynchronously write buffer to a file
			datasetsIDs.push(id);
		} catch (err) {
			throw new InsightError(`${err}`);
		}
		return datasetsIDs;
	}

	public async removeDataset(id: string): Promise<string> {
		// check if it's in the memory
		this.validateParams(id, InsightDatasetKind.Sections);
		if (this.dataSets[id]) {
			delete this.dataSets[id];
			return fs
				.remove(`data/${id}.json`)
				.then(() => {
					return id;
				})
				.catch((err) => {
					throw new InsightError(`Error removing file data/${id}.json: ${err.message}`);
				});
		} else {
			return fs
				.readdir(`data`)
				.then((parsedJson: string[]) => {
					return parsedJson.map((element) => {
						return element.split(".")[0];
					});
				})
				.then(async (dataSets: string[]) => {
					return await this.removeDatasetInDisk(dataSets, id);
				})
				.catch((err) => {
					throw new NotFoundError(`NOT FOUND${err}`);
				});
		}
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		if (typeof query !== "object" || query === null) {
			throw new InsightError("invalid query");
		}
		const queryValidationHelper: QueryValidation = new QueryValidation(false, "", [], []);
		const parsedJSON = JSON.parse(JSON.stringify(query));
		const datasetIDCheck: boolean | string = queryValidationHelper.validateQuery(parsedJSON);
		if (datasetIDCheck === false) {
			throw new InsightError("Query format invalid");
		}
		const datasetID = String(datasetIDCheck);
		const queryJSON: Record<string, any> = query;

		let dataset: Record<any, any> = {};
		if (this.dataSets[datasetID]) {
			dataset = this.dataSets[datasetID];
		} else {
			if (await fs.pathExists(`data/${datasetID}.json`)) {
				dataset = await fs.readJSON(`data/${datasetID}.json`);
			} else {
				throw new InsightError(`no dataset added`);
			}
		}
		let filteredDataset: any[] = this.evaluateQuery(dataset, queryJSON.WHERE);

		if (queryJSON.TRANSFORMATIONS) {
			filteredDataset = this.queryEngineHelper.transformResult(
				filteredDataset,
				queryJSON.TRANSFORMATIONS,
				queryJSON.OPTIONS.COLUMNS
			);
		}
		// evaluateQuery
		//     order the output (list of JSON)
		if (filteredDataset.length > this.maxSection) {
			throw new ResultTooLargeError("result too big");
		}

		return this.doSelectandSort(filteredDataset, queryJSON.OPTIONS);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		try {
			const stats = await fs.stat(`data`);
			if (stats.isDirectory()) {
				const parsedJson: string[] = await fs.readdir(`data`);
				let dataSets: string[] = parsedJson.map((element) => {
					return element.split(".")[0];
				});
				dataSets = dataSets.filter((item) => item !== "addresses");
				const jobs = [];
				const insights: InsightDataset[] = [];
				for (const dataset of dataSets) {
					if (this.dataSets[dataset]) {
						const insight: InsightDataset = {
							id: dataset,
							numRows: this.dataSets[dataset].getNumRows(),
							kind: this.dataSets[dataset].getKind(),
						};
						insights.push(insight);
					} else {
						jobs.push(fs.readJSON(`data/${dataset}.json`));
					}
				}

				return this.resolveJobsForInsights(jobs, insights);
			} else {
				return [];
			}
		} catch (error: any) {
			if (error.code === "ENOENT") {
				return [];
			} else {
				return [];
			}
		}
	}

	private validateParams(id: string, kind: InsightDatasetKind): void {
		if (id.length < 1 || id.trim().length === 0 || id.includes("_")) {
			throw new InsightError(`id is not allowed: ${id}`);
		}
		if (kind !== InsightDatasetKind.Sections && kind !== InsightDatasetKind.Rooms) {
			throw new InsightError(`id is not allowed: ${id}`);
		}
	}
	private evaluateQuery(dataset: Record<any, any>, WHERE: Record<any, any>): Section[] {
		const resultDatas: any[] = [];
		let numData = 0;
		let whereKey = "";
		let whereBody;
		if (Object.keys(WHERE).length !== 0) {
			whereKey = Object.keys(WHERE)[0];
			whereBody = WHERE[whereKey];
		}
		for (const dataSuperclassKey in dataset.datas) {
			const dataSuperclass: any = dataset.datas[dataSuperclassKey];
			//TODO
			if (dataSuperclass.datas.length !== 0) {
				const datas = dataSuperclass.datas;
				for (const data of datas) {
					if (whereBody !== undefined) {
						if (this.queryEngineHelper.applyFilter(data, whereKey, whereBody)) {
							numData = this.sectionHelper.addData(numData, resultDatas, data);
						}
					} else {
						numData = this.sectionHelper.addData(numData, resultDatas, data);
					}
				}
			}
		}
		return resultDatas;
	}

	private doSelectandSort(filteredDataset: any[], OPTIONS: any): InsightResult[] {
		let sortedInsight = filteredDataset;
		let dir = "";
		if (Object.hasOwn(OPTIONS, "ORDER")) {
			let sortBy = OPTIONS.ORDER;
			if (typeof sortBy === "string") {
				if (sortBy.includes("_")) {
					sortBy = sortBy.split("_")[1];
				}
				sortedInsight = filteredDataset.sort((a, b) => {
					return a[sortBy] > b[sortBy] ? 1 : a[sortBy] < b[sortBy] ? -1 : 0;
				});
			} else {
				dir = sortBy.dir;
				const keys = sortBy.keys;
				sortedInsight = filteredDataset.sort((a, b) => {
					return this.compareValues(a, b, keys);
				});
			}
		}
		const filteredInsight = this.select(OPTIONS, sortedInsight);
		if (dir === "DOWN") {
			filteredInsight.reverse();
		}
		return filteredInsight;
	}

	private select(OPTIONS: any, sortedInsight: any[]): InsightResult[] {
		const filteredInsight: InsightResult[] = [];
		const columns = OPTIONS.COLUMNS;
		for (const data of sortedInsight) {
			const insightResult: InsightResult = {};
			for (const column of columns) {
				let columnKey = "";
				if (column.includes("_")) {
					columnKey = column.split("_")[1];
				} else {
					columnKey = column;
				}
				insightResult[column] = data[columnKey];
			}
			filteredInsight.push(insightResult);
		}
		return filteredInsight;
	}

	private compareValues(a: any, b: any, keys: any[]): number {
		const key = keys[0].split("_")[1];
		if (a[key] < b[key]) {
			return -1;
		} else if (a[key] > b[key]) {
			return 1;
		} else {
			if (keys.length === 1) {
				return 0;
			} else {
				const subkeys = this.splitKeys(keys);
				return this.compareValues(a, b, subkeys);
			}
		}
	}

	private splitKeys(keys: any[]): any[] {
		const output: any[] = [];
		for (let i = 1; i < keys.length; i++) {
			output.push(keys[i]);
		}
		return output;
	}

	private async resolveJobsForInsights(jobs: Promise<any>[], insights: InsightDataset[]): Promise<InsightDataset[]> {
		const datasetsJSON: Record<any, any>[] = await Promise.all(jobs);
		for (const datasetJSON of datasetsJSON) {
			const insight: InsightDataset = {
				id: datasetJSON.id,
				numRows: datasetJSON.numRows,
				kind: datasetJSON.kind,
			};
			insights.push(insight);
		}
		return insights;
	}

	private async removeDatasetInDisk(dataSets: string[], id: string): Promise<string> {
		if (!dataSets.includes(id)) {
			throw new NotFoundError(`NOT FOUND`);
		} else {
			return fs
				.remove(`data/${id}.json`)
				.then(() => {
					return id;
				})
				.catch((err) => {
					throw new NotFoundError(`NOT FOUND ${err}`);
				});
		}
	}

	// sets data names and creat jobs to convert each data from bytes to that specific data type
	private makeJobs(files: Record<string, any>, jobs: Promise<any>[], kind: InsightDatasetKind): string[] {
		if (kind === InsightDatasetKind.Sections) {
			return this.sectionHelper.makeJobForCourses(files, jobs);
		} else {
			return this.roomHelper.makeJobForBuildings(files, jobs);
		}
	}

	private async addDatas(
		inputDatas: Awaited<any>[],
		dataNames: string[],
		kind: InsightDatasetKind
	): Promise<Record<any, any>> {
		if (kind === InsightDatasetKind.Sections) {
			return this.sectionHelper.addSections(inputDatas, dataNames);
		} else {
			return this.roomHelper.addRooms(inputDatas, dataNames);
		}
	}
}
