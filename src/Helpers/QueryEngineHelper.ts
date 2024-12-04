import { InsightError } from "../controller/IInsightFacade";
import Decimal from "decimal.js";

export default class QueryEngineHelper {
	private roundNumber = 2;
	public applyFilter(section: any, key: string, value: any): boolean {
		switch (key) {
			case "OR": {
				return this.doOR(section, value);
			}
			case "AND": {
				return this.doAND(section, value);
			}
			case "NOT": {
				const conditionKey = Object.keys(value)[0];
				const val = value[conditionKey];
				if (!this.applyFilter(section, conditionKey, val)) {
					return true;
				}
				return false;
			}
			case "LT": {
				return this.doLT(section, value);
			}
			case "GT": {
				return this.doGT(section, value);
			}
			case "EQ": {
				return this.doEQ(section, value);
			}
			default: {
				return this.doIS(section, value);
			}
		}
	}
	public doLT(section: any, value: any): boolean {
		const conditionKey = Object.keys(value)[0];
		const id = conditionKey.split("_")[1];
		if (section[id] < value[conditionKey]) {
			return true;
		}
		return false;
	}

	public doGT(section: any, value: any): boolean {
		const conditionKey = Object.keys(value)[0];
		const id = conditionKey.split("_")[1];
		if (section[id] > value[conditionKey]) {
			return true;
		}
		return false;
	}

	public doEQ(section: any, value: any): boolean {
		const conditionKey = Object.keys(value)[0];
		const id = conditionKey.split("_")[1];
		if (section[id] === value[conditionKey]) {
			return true;
		}
		return false;
	}

	public doIS(section: any, value: any): boolean {
		const conditionKey = Object.keys(value)[0];
		const id = conditionKey.split("_")[1];
		const sectionValue: string = section[id];
		const conditionValue: string = value[conditionKey];
		if (conditionValue[0] === "*") {
			if (conditionValue[conditionValue.length - 1] === "*") {
				return sectionValue.includes(conditionValue.split("*")[1]);
			}
			return sectionValue.endsWith(conditionValue.split("*")[1]);
		} else if (conditionValue[conditionValue.length - 1] === "*") {
			return sectionValue.startsWith(conditionValue.split("*")[0]);
		} else {
			if (section[id] === value[conditionKey]) {
				return true;
			}
			return false;
		}
	}

	private doOR(section: any, value: Record<any, any>[]): boolean {
		try {
			return value.some((condition: Record<any, any>) => {
				const whereKey = Object.keys(condition)[0];
				const whereBody = condition[whereKey];
				return this.applyFilter(section, whereKey, whereBody);
			});
		} catch (err) {
			throw new InsightError(`Error in OR ${err}`);
		}
	}

	private doAND(section: any, value: Record<any, any>[]): boolean {
		try {
			return value.every((condition: Record<any, any>) => {
				const whereKey = Object.keys(condition)[0];
				const whereBody = condition[whereKey];
				return this.applyFilter(section, whereKey, whereBody);
			});
		} catch (err) {
			throw new InsightError(`Error in AND ${err}`);
		}
	}

	public transformResult(filteredDataset: any[], TRANSFORMATIONS: any, COLUMNS: any): any[] {
		let groupBy = TRANSFORMATIONS.GROUP;
		groupBy = groupBy.map((x: string) => {
			return x.split("_")[1];
		});
		const applyTokens = TRANSFORMATIONS.APPLY;

		const groups: Record<any, any> = {};

		for (const data of filteredDataset) {
			const groupValues = [];
			for (const group of groupBy) {
				groupValues.push(data[group]);
			}
			if (Object.hasOwn(groups, groupValues.join(""))) {
				groups[groupValues.join("")].push(data);
			} else {
				groups[groupValues.join("")] = [data];
			}
		}
		const keysToRemove = applyTokens.flatMap((obj: Record<any, any>) => Object.keys(obj));
		COLUMNS = COLUMNS.filter((item: string) => !keysToRemove.includes(item));
		const result = this.doApply(applyTokens, groups);

		let i = 0;
		for (const key of Object.keys(groups)) {
			for (const column of COLUMNS) {
				const columnName = column.split("_")[1];
				const firstElement = groups[key][0];
				result[i][columnName] = firstElement[columnName];
			}
			i = i + 1;
		}

		return result;
	}

	private doApply(applyTokens: any[], groups: Record<any, any>): any[] {
		const result: any[] = [];
		if (applyTokens.length === 0) {
			Object.keys(groups).forEach(() => result.push({}));
			return result;
		}
		for (const key of Object.keys(groups)) {
			const resultRow: Record<any, any> = {};
			for (const applyToken of applyTokens) {
				let newDataPoint;
				switch (Object.keys(applyToken[Object.keys(applyToken)[0]])[0]) {
					case "MAX":
						newDataPoint = this.max(groups[key], applyToken[Object.keys(applyToken)[0]]);
						break;
					case "MIN":
						newDataPoint = this.min(groups[key], applyToken[Object.keys(applyToken)[0]]);
						break;
					case "AVG":
						newDataPoint = this.avg(groups[key], applyToken[Object.keys(applyToken)[0]]);
						break;
					case "COUNT":
						newDataPoint = this.count(groups[key], applyToken[Object.keys(applyToken)[0]]);
						break;
					case "SUM":
						newDataPoint = this.sum(groups[key], applyToken[Object.keys(applyToken)[0]]);
						break;
					default:
						break;
				}
				resultRow[Object.keys(applyToken)[0]] = newDataPoint;
			}
			result.push(resultRow);
		}

		return result;
	}

	private max(group: any, applyTokenElement: any): number {
		let max = -999999999999999;
		const key = applyTokenElement.MAX.split("_")[1];
		for (const data of group) {
			if (data[key] > max) {
				max = data[key];
			}
		}
		return max;
	}

	private min(group: any, applyTokenElement: any): number {
		let min = 999999999999999;
		const key = applyTokenElement.MIN.split("_")[1];
		for (const data of group) {
			if (data[key] < min) {
				min = data[key];
			}
		}
		return min;
	}

	private avg(group: any, applyTokenElement: any): Number {
		let sum = new Decimal(0);
		let i = 0;
		const key = applyTokenElement.AVG.split("_")[1];
		for (const data of group) {
			const decimalNum = new Decimal(data[key]);
			sum = decimalNum.add(sum);
			i = i + 1;
		}
		return Number((sum.toNumber() / i).toFixed(this.roundNumber));
	}

	private count(group: any, applyTokenElement: any): number {
		const unique: Record<any, any> = {};
		const key = applyTokenElement.COUNT.split("_")[1];
		let data;
		for (data of group) {
			unique[data[key]] = 1;
		}
		return Object.keys(unique).length;
	}

	private sum(group: any, applyTokenElement: any): Number {
		let sum = 0;
		const key = applyTokenElement.SUM.split("_")[1];
		for (const data of group) {
			sum = data[key] + sum;
		}
		return Number(sum.toFixed(this.roundNumber));
	}
}
