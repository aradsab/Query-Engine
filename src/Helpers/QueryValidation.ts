import QueryLogic from "./QueryLogic";
import Validators from "./Validators";
import ID from "./ID";

const maxquerysize = 3;

export default class QueryValidation extends ID {
	private QueryL = QueryLogic;
	private Validator = Validators;
	private hastransf = false;

	//check query format is valid
	public validateQuery(query: Record<string, any>): boolean | string {
		if (query === null) {
			return false;
		}
		//query keys have WHERE, OPTIONS (length of 2); test case allowed two WHERE's and OPTION
		const Jkeys = Object.keys(query);
		const validQuery = Jkeys.includes("WHERE") && Jkeys.includes("OPTIONS");
		const transform =
			Jkeys.includes("WHERE") &&
			Jkeys.includes("OPTIONS") &&
			Jkeys.includes("TRANSFORMATIONS") &&
			Jkeys.length === maxquerysize;
		let output = false;

		//query is invalid if no WHERE and OPTIONS
		if (!validQuery || query.WHERE === null || query.WHERE !== Object(query.WHERE)) {
			return false;
		}

		const Wkeys = Object.keys(query.WHERE);
		const Validator = new Validators();
		const QueryL = new QueryLogic();

		if (transform) {
			this.hastransf = true;
			output =
				Validator.validateTransformations(query.TRANSFORMATIONS) &&
				QueryL.validateWhere(query.WHERE) &&
				Validator.validateOption(query.OPTIONS);
		} else if (Wkeys.length < 1 && !Array.isArray(query.WHERE)) {
			//whereEmpty = true;
			output = Validator.validateOption(query.OPTIONS);
		} else {
			output = QueryL.validateWhere(query.WHERE) && Validator.validateOption(query.OPTIONS);
		}
		if (!output) {
			return output;
		} else {
			return ID.datasetID;
		}
	}
}
