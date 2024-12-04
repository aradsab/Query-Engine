import Building from "../Model/Building";
import Room from "../Model/Room";
import { InsightError } from "../controller/IInsightFacade";
import * as http from "node:http";
import fs from "fs-extra";
const parse5 = require("parse5");

export default class RoomHelper {
	private cachedGeolocations: Record<string, any> = {};
	public makeJobForBuildings(files: Record<string, any>, jobs: any[]): string[] {
		let i = 0;
		const firstThreeFolders = 3;
		const buildingNames: string[] = [];
		const indexObject = files["index.htm"];
		delete files["index.htm"];
		jobs.push(indexObject.async("arraybuffer"));
		buildingNames.push("index");
		for (const buildingPath of Object.keys(files)) {
			if (i < firstThreeFolders) {
				i++;
				if (i === firstThreeFolders) {
					if (buildingPath !== "campus/discover/buildings-and-classrooms/") {
						throw new InsightError("bad path");
					}
				}
				continue;
			}
			jobs.push(files[buildingPath].async("arraybuffer"));
			const buildingName: string = buildingPath.toString().split("/")[firstThreeFolders];
			buildingNames.push(buildingName.split(".")[0]);
		}
		return buildingNames;
	}

	public async addRooms(inputBuildings: Awaited<Buffer>[], buildingNames: string[]): Promise<Record<any, any>> {
		const buildings: Record<string, Building> = {};
		const textDecoder = new TextDecoder();
		const index = inputBuildings[0];
		const indexHTMLString = textDecoder.decode(index);
		const indexBuildings: Record<string, any> = this.getBuildings(indexHTMLString);
		let roomCount = 0;
		const jobs: any[] = [];
		const allRooms: Room[] = [];
		await this.readCacheAdresses();
		for (let i = 1; i < buildingNames.length; i++) {
			if (indexBuildings[buildingNames[i]]) {
				const indexBuilding = indexBuildings[buildingNames[i]];
				buildings[buildingNames[i]] = new Building(buildingNames[i]);
				const buildingHTMLString = textDecoder.decode(inputBuildings[i]);
				const document = parse5.parse(buildingHTMLString);
				const rooms = this.getRooms(document);
				if (rooms === null) {
					continue;
				}
				const geolocation = this.getCachedAddresses(indexBuilding, jobs, buildingNames, i);
				for (const room of rooms) {
					roomCount++;
					const roomObject: Room = this.createRoom(room, indexBuilding, geolocation);
					buildings[buildingNames[i]].push(roomObject);
					allRooms.push(roomObject);
				}
			}
		}
		if (allRooms.length === 0) {
			throw new InsightError(`rooms has no room`);
		}
		return await this.addGeoLocations(jobs, roomCount, allRooms, buildings);
	}

	private getCachedAddresses(
		indexBuilding: any,
		jobs: Promise<Record<any, any>>[],
		buildingNames: string[],
		i: number
	): Record<any, any> {
		let geolocation: Record<any, any> = {};
		if (this.cachedGeolocations[indexBuilding.shortname]) {
			geolocation = this.cachedGeolocations[indexBuilding.shortname];
		} else {
			jobs.push(this.getGeoLocation(indexBuilding.address, buildingNames[i]));
		}
		return geolocation;
	}

	private createRoom(room: Record<any, any>, indexBuilding: any, geolocation: Record<any, any>): Room {
		return new Room(
			geolocation.lat, //geo loc building
			geolocation.lon, // geo loc building
			room.seats, // room
			room.type, // room
			room.furniture, // room
			room.href, // room
			indexBuilding.fullname, // building
			indexBuilding.shortname,
			room.number, // room
			`${indexBuilding.shortname}_${room.number}`, // r
			indexBuilding.address // building
		);
	}

	private async addGeoLocations(
		jobs: Promise<Record<any, any>>[],
		roomCount: number,
		allRooms: any[],
		buildings: Record<string, Building>
	): Promise<Record<string, any>> {
		if (jobs.length === 0) {
			return { datas: buildings, numRows: roomCount };
		}
		await Promise.all(jobs)
			.then(async (geoLocs) => {
				const res: Record<any, any> = {};
				for (const jsonGeo of geoLocs) {
					res[Object.keys(jsonGeo)[0]] = jsonGeo[Object.keys(jsonGeo)[0]];
				}
				for (let i = 0; i < roomCount; i++) {
					if (!allRooms[i].getLat()) {
						if (res[allRooms[i].shortname].error) {
							throw new InsightError("geolocation fail");
						}
						allRooms[i].setLat(res[allRooms[i].shortname].lat);
						allRooms[i].setLon(res[allRooms[i].shortname].lon);
						this.cachedGeolocations[allRooms[i].shortname] = res[allRooms[i].shortname];
					}
				}
				await this.writeCacheAdresses(res);
			})
			.catch((err) => {
				throw err;
			});
		return { datas: buildings, numRows: roomCount };
	}

	private getBuildings(index: string): Record<any, any> {
		const document = parse5.parse(index);
		const buildings: Record<string, any> | null = this.runDFS(document, "views-field views-field-field-building-image");
		const validBuildings: Record<any, any> = {};
		if (buildings === null) {
			throw new InsightError("index has no buildings");
		}
		for (const node of buildings.childNodes) {
			if (node.nodeName === "tr") {
				const building = { fullname: "", shortname: "", address: "" };
				for (const trNode of node.childNodes) {
					if (trNode.nodeName === "td") {
						switch (trNode.attrs[0].value) {
							case "views-field views-field-field-building-code":
								building.shortname = trNode.childNodes[0].value.trim();
								break;
							case "views-field views-field-title":
								building.fullname = trNode.childNodes[1].childNodes[0].value.trim();
								break;
							case "views-field views-field-field-building-address":
								building.address = trNode.childNodes[0].value.trim();
								break;
							default:
								break;
						}
					}
				}
				validBuildings[building.shortname] = building;
			}
		}
		return validBuildings;
	}

	// return a list of JSON room
	private getRooms(document: Record<any, any>): Record<any, any>[] | null {
		const rooms: Record<string, any> | null = this.runDFS(document, "views-field views-field-field-room-number");
		const roomsArray = [];
		if (rooms === null) {
			return null;
		}
		for (const node of rooms.childNodes) {
			if (node.nodeName === "tr") {
				const room = { type: "", furniture: "", seats: 0, href: "", number: "" };
				for (const trNode of node.childNodes) {
					if (trNode.nodeName === "td") {
						this.setRoomParameter(trNode, room);
					}
				}
				roomsArray.push(room);
			}
		}
		return roomsArray;
	}

	private setRoomParameter(
		trNode: Record<any, any>,
		room: {
			number: string;
			furniture: string;
			href: string;
			type: string;
			seats: number;
		}
	): void {
		switch (trNode.attrs[0].value) {
			case "views-field views-field-field-room-number":
				room.number = trNode.childNodes[1].childNodes[0].value.trim();
				break;
			case "views-field views-field-field-room-capacity":
				room.seats = trNode.childNodes[0].value.trim();
				break;
			case "views-field views-field-field-room-furniture":
				room.furniture = trNode.childNodes[0].value.trim();
				break;
			case "views-field views-field-field-room-type":
				room.type = trNode.childNodes[0].value.trim();
				break;
			case "views-field views-field-nothing":
				room.href = trNode.childNodes[1].attrs[0].value.trim();
				break;
			default:
				break;
		}
	}

	private runDFS(document: Record<any, any>, goal: string): Record<any, any> | null {
		const todo: Record<any, any>[] = [];
		document.childNodes.map((n: Record<any, any>) => todo.push(n));
		let node = todo.pop();
		while (node) {
			if (this.checkGoal(node, goal)) {
				return this.returnGoal(node);
			}
			if (node.childNodes) {
				node.childNodes.map((n: Record<any, any>) => todo.push(n));
			}
			node = todo.pop();
		}
		return null;
	}

	private checkGoal(node: any, goal: string): boolean {
		if (node.attrs) {
			for (const attr of node.attrs) {
				if (attr.name === "class") {
					return attr.value === goal;
				}
			}
		}
		return false;
	}

	private returnGoal(node: any): Record<any, any> {
		return node.parentNode.parentNode;
	}

	private async getGeoLocation(address: string, buildingName: string): Promise<Record<any, any>> {
		interface GeoResponse {
			lat?: number;
			lon?: number;
			error?: string;
		}
		// copied from HTTP documentation
		return new Promise((resolve, reject) => {
			http
				.get(`http://cs310.students.cs.ubc.ca:11316/api/v1/project_team133/${address}`, (res) => {
					const { statusCode } = res;
					const success = 200;
					if (statusCode !== success) {
						res.resume();
						reject(new Error("Request Failed.\n" + `Status Code: ${statusCode}`));
					}

					res.setEncoding("utf8");
					let rawData = "";
					res.on("data", (chunk) => {
						rawData += chunk;
					});
					res.on("end", () => {
						try {
							const parsedData = JSON.parse(rawData);
							resolve({ [buildingName]: parsedData as GeoResponse });
						} catch (e: any) {
							reject(e);
						}
					});
				})
				.on("error", (e) => {
					reject(e);
				});
		});
	}

	private async writeCacheAdresses(res: Record<string, any>): Promise<void> {
		const result = Object.assign({}, res, this.cachedGeolocations);
		await fs.ensureDir("data");
		await fs.writeJSON(`data/addresses.json`, result);
	}

	private async readCacheAdresses(): Promise<void> {
		if (await fs.pathExists(`data/addresses.json`)) {
			this.cachedGeolocations = await fs.readJSON(`data/addresses.json`);
		}
	}
}
