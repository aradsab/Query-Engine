import ID from "./ID";

const mfield: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
const sfield: string[] = [
	"dept",
	"id",
	"instructor",
	"title",
	"uuid",
	"fullname",
	"shortname",
	"number",
	"name",
	"address",
	"type",
	"furniture",
	"href",
];
const direction: string[] = ["UP", "DOWN"];
const applytokens: string[] = ["MAX", "MIN", "AVG", "COUNT", "SUM"];

const maxquerysize = 3;
//const keyList = 2;

export default class Validators extends ID {
	private columnsfield: string[] = [];
	constructor() {
		super(false, "", [], []);
	}

	public validateTransformations(transformations: any): boolean {
		if (
			transformations === null ||
			Array.isArray(transformations) ||
			Object.keys(transformations).length !== maxquerysize - 1
		) {
			return false;
		}
		const Tkeys = Object.keys(transformations);
		const validT = Tkeys.includes("GROUP") && Tkeys.includes("APPLY");
		let output = false;

		if (validT) {
			output = this.validateGroup(transformations.GROUP) && this.validateApply(transformations.APPLY);
		}
		return output;
	}
	//group very similar to column; need to refactor
	private validateGroup(group: string[]): boolean {
		if (group === null || group.length === 0 || !Array.isArray(group)) {
			return false;
		}
		let idstring: string;
		let field: string;

		//check each string in array is valid
		for (const element of group) {
			if (element === null) {
				return false;
			}

			idstring = element.split("_")[0];
			if (idstring.trim().length === 0) {
				//check idstring isn't empty or spaces
				return false;
			}
			//set datasetID if not yet set
			if (this.checkIDdeclared(ID.dIDdeclared)) {
				ID.datasetID = idstring;
			}
			//check id is from same dataset
			if (!this.verifyIDstring(idstring)) {
				return false;
			}
			field = element.split("_")[1];
			if (!mfield.includes(field) && !sfield.includes(field)) {
				return false;
			}
			ID.appfields.push(field); //this was columnsfield
		}
		return true;
	}

	private validateApply(apply: string[]): boolean {
		if (apply === null || !Array.isArray(apply)) {
			return false;
		}
		let output = true;
		const applykeys: string[] = [];

		for (const element of apply) {
			if (element === null) {
				return false;
			}
			output = output && this.validateApplyRule(element);
			if (output) {
				const key = Object.keys(element);
				if (key.length !== 1 || applykeys.includes(key[0])) {
					return false;
				} else {
					applykeys.push(key[0]);
				}
			}
		}
		ID.appkeys = applykeys;
		return output;
	}

	private validateApplyRule(applyrule: any): boolean {
		const key = Object.keys(applyrule);
		if (key.length !== 1) {
			return false;
		}
		const applykey = key[0];
		return this.validateApplyKey(applykey) && this.validateApplyVal(applyrule[applykey]);
	}

	private validateApplyKey(applykey: string): boolean {
		const applykeyname = applykey.split("_");
		return applykeyname.length === 1 && applykey.length >= 1;
	}

	private validateApplyVal(applyval: any): boolean {
		const keys = Object.keys(applyval);
		const key = keys[0];

		if (keys.length !== 1) {
			return false;
		}
		if (applytokens.includes(key)) {
			const keysplit = applyval[key].split("_");
			if (keysplit[0] !== ID.datasetID) {
				return false;
			}
			if (keysplit.length === maxquerysize - 1) {
				return this.validateField(keysplit[1], key);
			}
		}
		return false;
	}

	private validateField(field: string, token: string): boolean {
		let output: boolean;
		if (token === "COUNT") {
			output = mfield.includes(field) || sfield.includes(field);
			//ID.appfields.push(field);
		} else {
			output = mfield.includes(field);
			//ID.appfields.push(field);
		}
		return output;
	}

	public validateOption(options: any): boolean {
		if (options === null) {
			return false;
		}

		const Okeys = Object.keys(options);
		let output = false;
		//Check COLUMNS and validate; can be 1 or 2 long
		if (!Okeys.includes("COLUMNS")) {
			return false;
		}

		if (Okeys.length === 1 || (Okeys.length === maxquerysize - 1 && Okeys.includes("ORDER"))) {
			output = this.validateColumns(options.COLUMNS);
			if (!output) {
				return false;
			}
		}
		//Check ORDER and validate
		if (Okeys.includes("ORDER") && Okeys.length === maxquerysize - 1) {
			output = this.validateOrder(options);
		}
		return output;
	}

	private validateColumns(columns: string[]): boolean {
		if (columns === null || columns.length === 0 || !Array.isArray(columns)) {
			return false;
		}
		let idstring: string;
		let field: string;
		//check each string in array is valid
		for (const element of columns) {
			if (element === null) {
				return false;
			}
			if (this.verifyUnderscore(element)) {
				idstring = element.split("_")[0];
				if (idstring.trim().length === 0) {
					//check idstring isn't empty or spaces
					return false;
				}
				//set datasetID if not yet set
				if (this.checkIDdeclared(ID.dIDdeclared)) {
					ID.datasetID = idstring;
				}
				//check id is from same dataset
				if (!this.verifyIDstring(idstring)) {
					return false;
				}
				field = element.split("_")[1];
				if (!mfield.includes(field) && !sfield.includes(field)) {
					return false;
				}
				this.columnsfield.push(field);
			} else if (!ID.appkeys.includes(element)) {
				return false;
			}
		}
		return this.cfieldVal(ID.appfields, ID.appkeys, this.columnsfield);
	}

	private cfieldVal(afields: any, akeys: any, col: any): boolean {
		if (afields.length !== 0 || akeys.length !== 0) {
			for (const c of col) {
				if (!ID.appfields.includes(c) && !ID.appkeys.includes(c)) {
					return false;
				}
			}
		}
		return true;
	}

	private validateOrder(options: any): boolean {
		const order = options.ORDER;
		const column = options.COLUMNS;
		if (order === null || order === "" || Array.isArray(order)) {
			return false;
		}
		const Okeys = Object.keys(order);

		if (typeof order === "string") {
			return column.includes(order);
		} else if (Okeys.includes("dir") && Okeys.includes("keys") && Okeys.length === maxquerysize - 1) {
			const keylist = order.keys;
			const valid = keylist.length > 0 && Array.isArray(keylist);
			if (this.validateDir(order.dir) && valid) {
				for (const ele of keylist) {
					if (!column.includes(ele)) {
						return false;
					}
				}
				return true;
			}
		}
		return false;
	}

	private validateDir(dir: string): boolean {
		return direction.includes(dir);
	}

	private verifyUnderscore(idstring: string): boolean {
		return idstring.includes("_");
	}
}
