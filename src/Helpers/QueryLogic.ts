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
const Lcomp: string[] = ["AND", "OR"];
const Mcomp: string[] = ["LT", "GT", "EQ"];
const Scomp: string[] = ["IS"];
const Neg: string[] = ["NOT"];
const wildcardNum = 2;

export default class QueryLogic extends ID {
	constructor() {
		super(false, "", [], []);
	}

	public validateWhere(where: any): boolean {
		if (
			where === null ||
			Array.isArray(where) ||
			(Object.keys(where).length !== 1 && Object.keys(where).length !== 0)
		) {
			return false;
		}
		if (Object.keys(where).length === 0) {
			return true;
		}

		const Wkeys = Object.keys(where);
		let output = false;

		const Wkey = Wkeys[0];

		if (where[Wkey] === null || Object.keys(where[Wkey]) === null || where[Wkey].length === 0) {
			return false;
		}

		const step = Object.keys(Object.keys(where[Wkey]));

		if (Lcomp.includes(Wkey) && Wkeys.length === 1) {
			output = this.validateLcomp(where[Wkey]);
		} else if (Mcomp.includes(Wkey)) {
			output = this.validateMcomp(where[Wkey]);
		} else if (Scomp.includes(Wkey)) {
			output = this.validateScomp(where[Wkey]);
		} else if (Neg.includes(Wkey) && step.length === 1) {
			output = this.validateWhere(where[Wkey]);
		} else {
			output = false;
		}
		return output;
	}

	private validateLcomp(Lcomparison: string[]): boolean {
		let output = false;
		//AI recommended
		if (Lcomparison.length > 0) {
			output = true;
			output = Lcomparison.every((element) => this.validateWhere(element)) && output;
		}
		return output;
	}

	private validateMcomp(Mcomparison: any): boolean {
		let output = false;
		const Mkey = Object.keys(Mcomparison);
		if (Mcomparison === null || !(typeof Mcomparison === "object") || Mkey.length !== 1) {
			return false;
		}
		//set global to check that all fields use same datasetID if not yet declared
		if (this.checkIDdeclared(ID.dIDdeclared)) {
			ID.datasetID = Mkey[0].split("_")[0];
		}
		//split "idstring_field"
		const idstring = Mkey[0].split("_")[0];
		const field = Mkey[0].split("_")[1];
		//check idstring and mfield values, and that key is a number
		if (this.verifyIDstring(idstring) && mfield.includes(field) && typeof Mcomparison[Mkey[0]] === "number") {
			output = true;
		}
		return output;
	}

	private validateScomp(Scomparison: any): boolean {
		let output = false;
		const Skey = Object.keys(Scomparison);
		if (Scomparison === null || !(typeof Scomparison === "object") || Skey.length !== 1) {
			return false;
		}
		if (this.checkIDdeclared(ID.dIDdeclared)) {
			ID.datasetID = Skey[0].split("_")[0];
		}
		//split "idstring_field"
		const idstring = Skey[0].split("_")[0];
		const field = Skey[0].split("_")[1];
		//check idstring and sfield values, and that key is a string
		if (this.verifyIDstring(idstring) && sfield.includes(field) && typeof Scomparison[Skey[0]] === "string") {
			if (this.wildcardCheck(Scomparison[Skey[0]])) {
				output = true;
			}
		}
		return output;
	}

	private wildcardCheck(input: string): boolean {
		let wildcards = 0;
		const splitInput = input.split("*");
		for (const element of input) {
			if (element === "*") {
				wildcards += 1;
			}
		}
		if (wildcards === 0) {
			return true;
		} else if (wildcards === 1) {
			if (input.startsWith(splitInput[0]) && splitInput[1].length === 0) {
				return true;
			} else if (input.endsWith(splitInput[1]) && splitInput[0].length === 0) {
				return true;
			}
		} else if (wildcards === wildcardNum && splitInput[0].length === 0 && splitInput[wildcardNum].length === 0) {
			return true;
		}
		return false;
	}
}
