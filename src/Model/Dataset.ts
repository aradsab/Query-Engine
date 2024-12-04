import { InsightDatasetKind } from "../controller/IInsightFacade";

export default class Dataset {
	private datas: Record<string, any> = {};
	private numRows: number;
	private id: string;
	private kind: InsightDatasetKind;
	constructor(id: string, datas: Record<string, any>, numRows: number, kind: InsightDatasetKind) {
		this.datas = datas;
		this.id = id;
		this.numRows = numRows;
		this.kind = kind;
	}

	public getNumRows(): number {
		return this.numRows;
	}
	public getKind(): InsightDatasetKind {
		return this.kind;
	}
}
