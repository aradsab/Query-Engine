
import React, {useEffect} from 'react';
import {useState} from 'react';
import './App.css';
import {
	APIProvider,
	Map,
	AdvancedMarker,
	Pin,
	useMap, useMapsLibrary
} from "@vis.gl/react-google-maps";

const APIkey = "AIzaSyD5jLSPFZ_cHH6XhpTSvMeGYGyGW4g5vMs"
const mapID = "b507d6f89beadb54"

type Building = {
	key: string;
	lat: number;
	lng: number;
	rooms: string[];
	seats: string[];
	address: string;
};


async function creatBuildings(response: Response) {
	const json = await response.json();
	const buildings: Building[] = []
	const BuildingJson: Record<any, any> = {}
	if (json) {
		for (const row of json.result) {
			if (BuildingJson[row.rooms_fullname]) {
				// rooms
				BuildingJson[row.rooms_fullname][4].push(row.rooms_name);
				// seats
				BuildingJson[row.rooms_fullname][5].push(row.rooms_seats);
			} else {
				BuildingJson[row.rooms_fullname] = [
					row.rooms_lat,
					row.rooms_lon,
					row.rooms_fullname,
					row.rooms_address,
					[row.rooms_name],
					[row.rooms_seats],
				];
			}
		}
		for (const key in BuildingJson) {
			const building: Building = {
				key: key,
				lat: BuildingJson[key][0],
				lng: BuildingJson[key][1],
				rooms: BuildingJson[key][4],
				seats: BuildingJson[key][5],
				address: BuildingJson[key][3],
			};
			buildings.push(building);
		}
	}
	return buildings;
}

async function fetchBuildingLocations(): Promise<any[]> {
	let response = await window.fetch('http://localhost:4321/datasets', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		}
	});
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	let json: Record<any, any> = await response.json();
	const jobs = []
	for (const info of json.result) {
		const dsId: string = info.id;
		jobs.push(window.fetch("http://localhost:4321/query", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				WHERE: {},
				OPTIONS: {
					COLUMNS: [`${dsId}_lat`, `${dsId}_lon`, `${dsId}_fullname`, `${dsId}_name`, `${dsId}_seats`, `${dsId}_address`],
					ORDER: `${dsId}_name`
				},
				TRANSFORMATIONS: {
					GROUP: [`${dsId}_fullname`, `${dsId}_lat`, `${dsId}_lon`, `${dsId}_name`, `${dsId}_seats`, `${dsId}_address`],
					APPLY: [],
				},
			}),
		}))
	}

	const responses = await Promise.all(jobs);
	const jobs2 = []
	for (const response of responses) {
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		jobs2.push(creatBuildings(response))
	}
	const listOfListOfBuildings = await Promise.all(jobs2);

	return listOfListOfBuildings.flat();
}


export default function App() {
	const position = {lat: 49.266824, lng: -123.250019}

	const [buildings, setData] = useState<Building[] | undefined>();

	useEffect(() => {
		fetchBuildingLocations().then(json => {
			setData(json)
		})
			.catch(error => console.error(error));
	}, []);

	return (
		<div style={{ height: "100vh", width: "100%", display: "flex" }}>
			<APIProvider apiKey={APIkey}>
				<div style={{ height: "100vh", width: "100vh" }}>
					<Map
						zoom={15.5}
						center={position}
						mapId={mapID}
						fullscreenControl={false}
						disableDefaultUI={true}
						clickableIcons={false}
					></Map>
				</div>

				<div style={{ height: "100vh", width: "100vh" }}>
					Select up to 5 Rooms by clicking on map markers. Click 2 or more rooms to view estimated walking time.
					<div style={{ marginBottom: "30vh" }}></div>
					{buildings && <Markers points={buildings} />}
				</div>
			</APIProvider>
		</div>
	);
}
type Point = google.maps.LatLngLiteral & {key: string, rooms: string[], seats: string[], address: string};
type Props = { points: Point[]}

const Markers = ({ points }: Props) => {
	const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
	const [selectedBuildings, setSelectedBuildings] = useState<Point[]>([]);
	const [openMarkerKey, setOpenMarkerKey] = useState<string | null>(null);
	const [modalContent, setModalContent] = useState<Point | null>(null);

	return (
		<>
			{points.map((point) => (
				<AdvancedMarker
					position={point}
					key={point.key}
					onClick={() => {
						setOpenMarkerKey(point.key);
						setModalContent(point);
					}}
				>
					<Pin background={"white"} borderColor={"red"} glyphColor={"blue"} />
				</AdvancedMarker>
			))}

			{/* Display selected rooms */}
			{selectedRooms && (
				<div style={{ height: "100vh", width: "100%", position: "fixed" }}>
					<b><div
						style={{
							height: "-10vh",
							width: "100vh",
							color: "rebeccapurple",
							textDecoration: "underline",
						}}
					>
						Selected Rooms
					</div></b>
					<div style={{ height: "10vh", width: "100vh", display: "flex" }}>
						<ShowRooms
							rooms={selectedRooms}
							buildings={selectedBuildings}
						/>
					</div>
				</div>
			)}

			{modalContent && (
				<div
					style={{
						position: "fixed",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						background: "white",
						boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
						padding: "20px",
						borderRadius: "8px",
						zIndex: 1000,
						width: "400px",
						height: "300px",
						display: "flex",
						flexDirection: "column",
					}}
				>
					<h3>{modalContent.key}</h3>
					<p>Address: {modalContent.address}</p>

					{/* Scrollable container for rooms */}
					<div
						style={{
							flex: 1,
							overflowY: "auto",
							marginTop: "10px",
							border: "1px solid #ccc",
							padding: "10px",
							borderRadius: "4px",
						}}
					>
						{modalContent.rooms.map((room, index) => (
							<p key={index}>
								{room}
								<button
									onClick={(event) => {
										event.preventDefault();
										if (
											selectedRooms.length < 5 &&
											!selectedRooms.includes(room)
										) {
											setSelectedRooms([...selectedRooms, room]);
											setSelectedBuildings([...selectedBuildings, modalContent]);
										}
									}}
								>
									Add Room
								</button>
							</p>
						))}
					</div>

					{/* Close button */}
					<button
						style={{
							marginTop: "10px",
							background: "red",
							color: "white",
							border: "none",
							padding: "5px 10px",
							borderRadius: "4px",
							cursor: "pointer",
						}}
						onClick={() => setModalContent(null)}
					>
						Close
					</button>
				</div>
			)}

		</>
	);
};



type Rooms = {
	rooms: string[],
	buildings: Point[]
}
function ShowRooms({rooms, buildings}: Rooms) {
	const divs = []
	for (let i = 0; i < rooms.length; i++) {
		divs.push(
			<div key={rooms[i]} style={{ fontSize: 'small' }}>
				<b>{i+1}. Room:</b> {rooms[i].split("_")[1]}
				{" "}
				<b>Seats:</b> {buildings[i].seats[i]}
				{" "}
				<b>Building:</b> {buildings[i].key} (Abbr: {rooms[i].split("_")[0]})
				{" "}
				<b>Address:</b> {buildings[i].address}
				{" "}
				{i === 0 && (
					<div style={{ marginBottom: '40px' }}>
						<b style={{color:"darkblue"}}>This is the starting room. </b>
					</div>
				)}
				{i > 0 && <Directions start={{lat: buildings[i-1].lat, lng: buildings[i-1].lng}}
									  end={{lat: buildings[i].lat, lng: buildings[i].lng}}
									  startAddr={buildings[i-1].key}
									  endAddr={buildings[i].key}
				/>}
			</div>
		);
	}
	return (
		<div>
			{divs}
		</div>

	);
}

type SrcDest = {
	start: Record<string, number>,
	end: Record<string, number>,
	startAddr: string,
	endAddr: string
}

// gpt code
function Directions({start, end, startAddr, endAddr}: SrcDest) {
	const map = useMap();
	const routesLibrary = useMapsLibrary("routes");
	const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
	const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();
	const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
	const [routeIndex, setRouteIndex] = useState(0);
	const selected = routes[routeIndex];
	const leg = selected?.legs[0];

	useEffect(() => {
		if (!routesLibrary || !map) return;
		setDirectionsService(new routesLibrary.DirectionsService());
		setDirectionsRenderer(new routesLibrary.DirectionsRenderer({
			map,
			suppressMarkers: true,
			polylineOptions: { strokeWeight: 2, strokeOpacity: 0.5, strokeColor: "blue" }
		}));

	}, [routesLibrary, map]);

	useEffect(() => {
		if (!directionsService || !directionsRenderer) return;

		directionsService
			.route({
				origin: start,
				destination: end,
				travelMode: google.maps.TravelMode.WALKING,
				provideRouteAlternatives: false,
			})
			.then((response) => {
				directionsRenderer.setDirections(response);
				setRoutes(response.routes);
			});
	}, [directionsService, directionsRenderer]);

	if (!leg) return null;

	return (
		<div className="direction">
			<div style={{ height: "10vh", width: "100vh", color:"darkblue"}}>
				<b style={{color: "black"}}>From:</b> {startAddr} <b style={{color: "black"}}>To:</b> {endAddr}
				<br/>
				<i>Estimated walking time</i>: <b style={{color:"darkorange"}}>{leg.duration?.text}</b>
			</div>
		</div>
	);
}

