export default class Room {
	private lat: number;
	private lon: number;
	private seats: number;
	private type: string;
	private furniture: string;
	private href: string;
	private fullname: string;
	private shortname: string;
	private number: string;
	private name: string;
	private address: string;

	// Constructor with typed parameters
	constructor(
		lat: number,
		lon: number,
		seats: number,
		type: string,
		furniture: string,
		href: string,
		fullname: string,
		shortname: string,
		number: string,
		name: string,
		address: string
	) {
		this.lat = Number(lat);
		this.lon = Number(lon);
		this.seats = Number(seats);
		this.type = String(type);
		this.furniture = String(furniture);
		this.href = String(href);
		this.fullname = String(fullname);
		this.shortname = String(shortname);
		this.number = String(number);
		this.name = String(name);
		this.address = String(address);
	}

	public setLat(lat: any): void {
		this.lat = lat;
	}
	public setLon(lon: any): void {
		this.lon = lon;
	}

	public getLat(): number {
		return this.lat;
	}
}
