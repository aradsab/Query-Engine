export default abstract class ID {
	protected static dIDdeclared: boolean;
	protected static datasetID: string;
	protected static appkeys: string[];
	protected static appfields: string[];

	constructor(dIDdeclared: boolean, datasetID: string, appkeys: string[], appfields: string[]) {
		ID.dIDdeclared = dIDdeclared;
		ID.datasetID = datasetID;
		ID.appkeys = appkeys;
		ID.appfields = appfields;
	}

	protected verifyIDstring(idstring: string): boolean {
		return idstring === ID.datasetID;
	}

	protected checkIDdeclared(iddeclared: boolean): boolean {
		if (!iddeclared) {
			ID.dIDdeclared = true;
		}
		return !iddeclared;
	}
}
