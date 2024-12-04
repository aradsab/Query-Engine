export default class Section {
	private avg: number;
	private pass: number;
	private fail: number;
	private audit: number;
	private year: number;
	private dept: string;
	private id: string;
	private instructor: string;
	private title: string;
	private uuid: string;

	// Constructor with typed parameters
	constructor(
		avg: number,
		pass: number,
		fail: number,
		audit: number,
		year: number,
		dept: string,
		id: string,
		instructor: string,
		title: string,
		uuid: string
	) {
		this.avg = Number(avg);
		this.pass = Number(pass);
		this.fail = Number(fail);
		this.audit = Number(audit);
		this.year = Number(year);
		this.dept = String(dept);
		this.id = String(id);
		this.instructor = String(instructor);
		this.title = String(title);
		this.uuid = String(uuid);
	}
}
