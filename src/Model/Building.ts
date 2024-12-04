import Room from "./Room";

export default class Building {
	private datas: Room[] = [];
	private name: string;
	constructor(name: string) {
		this.name = name;
	}

	public push(room: Room): number {
		this.datas.push(room);
		return this.datas.length;
	}
}
