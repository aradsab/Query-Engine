import Section from "./Section";

export default class Course {
	private datas: Section[] = [];
	private name: string;
	constructor(name: string) {
		this.name = name;
	}

	public push(section: Section): number {
		this.datas.push(section);
		return this.datas.length;
	}
}
