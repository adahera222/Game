#pragma strict

import System.Collections.Generic;
import System.Text;

public class SnakeMap extends BaseMap {
	
	/// The following constants control parameters for the map generation
	static private var CELL_SCRIPT: String = "CELL";
	static private var ROW_MINIMUM: int = 18;
	static private var ROW_MAXIMUM: int = 30;
	static private var COLUMN_MINIMUM: int = 18;
	static private var COLUMN_MAXIMUM: int = 30;
	static private var MAX_NUMBER_ROOMS: int = 8;
	
	private var mapItems: IList.<MapItem> = new List.<MapItem>();
	
	/// <summary>
	/// Builds a random map and creates a navigator for it
	/// </summary>
	public override function Generate() {
		BuildSnakeMap ();
		_navigator = new GridNavigator();
		_navigator.ConnectMap(this);
	}	
	
	/// <summary>
	/// Places the item in random room in the dungeon
	/// </summary>
	/// <param name='item'>
	/// Item to be placed
	/// </param>
	public override function PlaceItemInRandomRoom(item: Transform) {
		//First look for an empty cell, which will be in a room, otherwise stick in a east west hallway
		
		var roomsToSearch = [CellType.Empty, CellType.EWall, CellType.WWall, CellType.SWall, CellType.NWall];
		
		var count: int = 0;
		
		do {
		count++;
		var roomIndex: FlaggableCellIndex = GetRandomCell(roomsToSearch);
		var available: boolean = IsCellAvailable(roomIndex.Row, roomIndex.Col);
		}
		while ((!available) && (count < 20));
		
		if (roomIndex.Flag) {
			var cellIndex: CellIndex = new CellIndex(roomIndex.Row, roomIndex.Col);
			mapItems.Add(new MapItem(cellIndex, item));
			item.position = _map[roomIndex.Row, roomIndex.Col].transform.position;
		}
	}
	
	/// <summary>
	/// Clears the items from the mapItems, before calling the inherited reset method.
	/// </summary>
	public override function Reset() {
		for (var i: int = 0; i < mapItems.Count; i++) {
			GameObject.Destroy(mapItems[i].Item.gameObject);
		}
		mapItems.Clear();
		super();
	}
	
	/// <summary>
	/// Checks to see if a cell in the map is occupied by an item.
	/// </summary>
	/// <returns>
	/// Returns true if the cell specified is unoccupied.
	/// </returns>
	/// <param name='row'>
	/// The row index of the cell to check
	/// </param>
	/// <param name='col'>
	/// The column index of the cell to check
	/// </param>	
	private function IsCellAvailable(row: int, col: int): boolean {
		var available: boolean = true;
		
		for (var i: int = 0; i < mapItems.Count; i++) {
			if ((mapItems[i].Index.Row == row) && (mapItems[i].Index.Col == col)) {
				available = false;
				break;
			}
		}
		
		return available;
	}
	
	/// <summary>
	/// Creates the cell's game object and attaches the Cell script to it.
	/// </summary>
	/// <returns>
	/// The new game object
	/// </returns>
	/// <param name='type'>
	/// The type of cell (see CellHelper)
	/// </param>
	private function CreateCell(type: CellType, isStart: boolean): GameObject {
		var obj: GameObject = new GameObject();
		var script: Cell = obj.AddComponent.<Cell>();
		script.type = type;
		script.start = isStart;
		return obj;
	}
	
	/// <summary>
	/// This overloaded method calls the original CreateCell, passing false in for the second parameter.
	/// </summary>
	/// <returns>
	/// The new game object
	/// </returns>
	/// <param name='type'>
	/// The type of cell (see CellHelper)
	/// </param>
	private function CreateCell(type: CellType): GameObject {
		return CreateCell(type, false);
	}
	
	/// <summary>
	/// The pattern that this generator uses attempts to create a series of long hallways,
	/// which wind through the level like a snake. Rooms will be placed randomly along the hallways.
	/// </summary>
	private function BuildSnakeMap() {
		PrepareNewMap();
		
		var cursor: MapCursor = CreateStartingCell();
		
		var NSHallwayLength: int = DetermineNSHallwayLength(3);
		
		//Create the first North-South Hallway, and connect it to the first East-West Hallway
		CreateNSHallway(NSHallwayLength, cursor);
		var cornerType: CellType = CreateNorthCorner(cursor);
		var EWHallDirection: Direction = CreateEWHallway(cursor, cornerType);
		CreateSouthCorner(cursor, EWHallDirection);

		//Create the second North- South Hallway, and connect it to the second East-West Hallway
		CreateNSHallway(NSHallwayLength, cursor);
		cornerType = CreateNorthCorner(cursor);
		EWHallDirection = CreateEWHallway(cursor, cornerType);
		CreateSouthCorner(cursor, EWHallDirection);
		
		//Create the second North- South Hallway, and connect it to the second East-West Hallway
		CreateNSHallway(NSHallwayLength, cursor);
		cornerType = CreateNorthCorner(cursor);
		EWHallDirection = CreateEWHallway(cursor, cornerType);
		CreateEWDeadEnd(cursor, EWHallDirection);

		//attempt to randomly add rooms to the map
		AddRooms();
	}
	
	/// <summary>
	/// Initializes the map array, randomly selecting a number of rows and columns
	/// </summary>
	private function PrepareNewMap() {
		//determine the dimensions of the array
		var rows: int = ROW_MINIMUM + Random.Range(0, ROW_MAXIMUM + 1);
		var cols: int = COLUMN_MINIMUM + Random.Range(0, COLUMN_MAXIMUM + 1);
		
		//initialize the map array
		_map = new GameObject[rows, cols];
	}
	
	/// <summary>
	/// Randomly picks the starting cell, which lies along the bottom of the map (last row)
	/// </summary>	
	private function CreateStartingCell(): MapCursor {
		var currentRow: int = NumRows() - 1;
		var currentCol: int = Random.Range (0, NumCols());
		_map[currentRow, currentCol] = CreateCell (CellType.NDeadEnd, true);
		return new MapCursor(currentRow, currentCol);
	}
	
	/// <summary>
	/// Returns the length that vertical hallways should be. This is calculated
	/// By dividing the number of rows in the grid by the number of hallways passed in.
	/// This isn't the most efficient way to do this, since rows may be wasted, but it will
	/// work for now.
	/// </summary>		
	/// <returns>
	/// The length that all North-South running hallways should be.
	/// </returns>	
	/// <param name='numHallways'>
	/// The number of vertical hallways intended to be built in the dungeon
	/// </param>	
	private function DetermineNSHallwayLength(numHallways: int): int {
		return NumRows() / numHallways;
	}
	
	/// <summary>
	/// Builds a horizontal row, starting from position 'cursor' and 
	/// traveling up the map by 'hallLength'. The 'cursor' CellIndex will
	/// be updated to the end of the hallway.
	/// </summary>		
	/// <param name='hallLength'>
	/// The number of map cells to draw up the map from 'cursor' position.
	/// </param>
	/// <param name='cursor'>
	/// The position in the map being drawn. This object will be updated as
	/// the hallway is drawn.
	/// </param>	
	private function CreateNSHallway(hallLength: int, cursor: MapCursor) {
		var row: int = cursor.Row;
		for (var count: int = 1; count <= hallLength; count++) {
			row--;
			if (row >= 0) {
				cursor.Row = row;
				_map[cursor.Row, cursor.Col] = CreateCell(CellType.NSHall);
			}
		}	
	}
	
	/// <summary>
	/// Creates an East-West running hallway from the cursor, and heading in a direction
	/// based on the startingCellType passed in, which must be a NE or NW corner. This method
	/// will update the cursor as it draws the hallway
	/// </summary>	
	/// <returns>
	/// Returns the direction that the hallway was drawn. This will either be East or West
	/// </returns>			
	/// <param name='cursor'>
	/// The position in the map being drawn.
	/// </param>
	/// <param name='startingCellType'>
	/// All EW Hallways will start from either a North-East hallway, or a North-West Hallway
	/// </param>	
	private function CreateEWHallway(cursor: MapCursor, startingCellType: CellType): Direction {
		var hallDirection: Direction = startingCellType == CellType.NECorner ? Direction.West : Direction.East;
		var hallLength: int = GetAvailableSpaceFromCursor(cursor, hallDirection);
		var col: int = cursor.Col;
		var colModifier: int = hallDirection == Direction.West ? -1 : 1;
		
		for (var count: int = 1; count <= hallLength; count++) {
			col += colModifier;
			if ((col > 0) && (col < NumCols())) {
				cursor.Col = col;
				_map[cursor.Row, cursor.Col] = CreateCell(CellType.EWHall);
			}
		}
		
		return hallDirection;	
	}
	
	/// <summary>
	/// Evaluates the cusor position and then builds a corner that connects
	/// a North-South hallway with an East-West Hallway, turning either east
	/// or west.
	/// </summary>
	/// <returns>
	/// Returns the celltype that was created
	/// </returns>		
	/// <param name='cursor'>
	/// The position in the map being drawn.
	/// </param>	
	private function CreateNorthCorner(cursor: MapCursor): CellType {
		var westSpace: int = GetAvailableSpaceFromCursor(cursor, Direction.West);
		var eastSpace: int = GetAvailableSpaceFromCursor(cursor, Direction.East);
		var availableHallLength: int = Mathf.Max(westSpace, eastSpace);
		var hallDirection: Direction = westSpace >= eastSpace ? Direction.West : Direction.East;
		var cellType: CellType = hallDirection == Direction.West ? CellType.NECorner : CellType.NWCorner;
		_map[cursor.Row, cursor.Col] = CreateCell(cellType);
		return cellType;
	}
	
	/// <summary>
	/// Creates a South-West or South-East corner at the specified cursor position, based on the direction
	/// passed in.
	/// </summary>	
	/// <param name='cursor'>
	/// The position in the map being drawn.
	/// </param>
	/// <param name='direction'>
	/// The direction of the East-West hallway that this corner is being placed on. Valid values are East and West
	/// </param>	
	private function CreateSouthCorner(cursor: MapCursor, direction: Direction) {
		_map[cursor.Row, cursor.Col] = direction == Direction.West ? CreateCell(CellType.SWCorner) : CreateCell(CellType.SECorner);	
	}
	
	/// <summary>
	/// Create a dead end cap on an East or West running Hallway
	/// </summary>	
	/// <param name='cursor'>
	/// The position in the map being drawn.
	/// </param>
	/// <param name='direction'>
	/// The direction of the East-West hallway that this dead-end is being placed on. Valid values are East and West
	/// </param>
	private function CreateEWDeadEnd(cursor: MapCursor, EWHallDirection: Direction) {
		_map[cursor.Row, cursor.Col] = EWHallDirection == Direction.East ? CreateCell(CellType.EDeadEnd) : CreateCell(CellType.WDeadEnd);
	}
	
	/// <summary>
	/// Returns the number of spaces to the left or right of the cursor, but not including cursor.
	/// </summary>
	/// <returns>
	/// Returns the number of spaces in the specified direction
	/// </returns>		
	/// <param name='cursor'>
	/// The position in the map to check spaces to the left or right of.
	/// </param>
	/// <param name='direction'>
	/// The direction fromt he cursor to check. Valid values are Left or Right, or East and West
	/// </param>	
	private function GetAvailableSpaceFromCursor(cursor: MapCursor, direction: Direction): int {
		var space: int;
		switch (direction) {
		case Direction.Left:
		case Direction.West:
			space = cursor.Col;
			break;
		case Direction.Right:
		case Direction.East:
			space = NumCols() - (cursor.Col + 1);
			break;
		default:
			space = 0;
			break;
		}
		return space;
	}
	
	/// <summary>
	/// Attempts to add up to MAX_NUMBER_ROOMS to map. Each room will be added
	/// along EW Hallways
	/// </summary>
	private function AddRooms() {
		var countRooms: int = 0;
		
		var spaces: List.<CellIndex> = new List.<CellIndex>();
		
		for (var row: int = 0; row < NumRows(); row++) {
			for (var col: int = 0; col < NumCols(); col++) {
				if (GetCellType(row, col) == CellType.EWHall) {
					spaces.Add (new CellIndex(row, col));
				}
			}
		}
		
		while ((countRooms < MAX_NUMBER_ROOMS) && (spaces.Count > 0)) {
			var roomIndex: int = Random.Range(0, spaces.Count);
			var index: CellIndex = spaces[roomIndex];
			spaces.RemoveAt(roomIndex);
			if (SpaceForRoomToNorth(index.Row, index.Col)) {
				BuildRoomToNorth(index.Row, index.Col);
				countRooms++;
			} else if (SpaceForRoomToSouth(index.Row, index.Col)) {
				BuildRoomToSouth(index.Row, index.Col);
				countRooms++;
			}
		}
	}
	
	/// <summary>
	/// Builds a room of a set size to the north of the specified hallway space
	/// </summary>
	/// <param name='row'>
	/// The row index of the map cell that the room will be attached to
	/// </param>
	/// <param name='col'>
	/// The column index of the map cell that the room will be attached to
	/// </param>	
	private function BuildRoomToNorth(row: int, col: int) {
		//change the current cell to a T intersection
		var script: Cell = _map[row, col].GetComponent.<Cell>();
		script.type = CellType.SWall;
		
		_map[row - 1, col] = CreateCell(CellType.NSHall);
		_map[row - 2, col] = CreateCell (CellType.Empty);
		_map[row - 2, col - 1] = CreateCell (CellType.SWCorner);
		_map[row - 2, col + 1] = CreateCell (CellType.SECorner);
		_map[row - 3, col] = CreateCell (CellType.Empty);
		_map[row - 3, col - 1] = CreateCell (CellType.WWall);
		_map[row - 3, col + 1] = CreateCell (CellType.EWall);
		_map[row - 4, col] = CreateCell (CellType.NWall);
		_map[row - 4, col - 1] = CreateCell (CellType.NWCorner);
		_map[row - 4, col + 1] = CreateCell (CellType.NECorner);
	}
	
	/// <summary>
	/// Builds a room of a set size to the south of the specified hallway space
	/// </summary>
	/// <param name='row'>
	/// The row index of the map cell that the room will be attached to
	/// </param>
	/// <param name='col'>
	/// The column index of the map cell that the room will be attached to
	/// </param>	
	private function BuildRoomToSouth(row: int, col: int) {
		//change the current cell to a T intersection
		var script: Cell = _map[row, col].GetComponent.<Cell>();
		script.type = CellType.NWall;
		
		_map[row + 1, col] = CreateCell(CellType.NSHall);
		_map[row + 2, col] = CreateCell (CellType.Empty);
		_map[row + 2, col - 1] = CreateCell (CellType.NWCorner);
		_map[row + 2, col + 1] = CreateCell (CellType.NECorner);
		_map[row + 3, col] = CreateCell (CellType.Empty);
		_map[row + 3, col - 1] = CreateCell (CellType.WWall);
		_map[row + 3, col + 1] = CreateCell (CellType.EWall);
		_map[row + 4, col] = CreateCell (CellType.SWall);
		_map[row + 4, col - 1] = CreateCell (CellType.SWCorner);
		_map[row + 4, col + 1] = CreateCell (CellType.SECorner);
	}	
	
	/// <summary>
	/// Checks to see if there is enough space for a room to the north of the specified hallway space
	/// </summary>
	/// <returns>
	/// If there is enough space, returns true
	/// </returns>
	/// <param name='row'>
	/// The row index of the map cell that the room will be attached to
	/// </param>
	/// <param name='col'>
	/// The column index of the map cell that the room will be attached to
	/// </param>
	private function SpaceForRoomToNorth(row: int, col: int): boolean {
		var blocked: boolean = false;

		//make sure we won't go out of bounds to build this room
		if ((row - 4 < 0) || (col - 1 < 0) || (col + 1 > NumCols() - 1)) {
			blocked = true;
		}
		
		if (!blocked) {
			blocked = GetCellType(row - 1, col) != CellType.None ? true : blocked;
			blocked = GetCellType(row - 2, col) != CellType.None ? true : blocked;
			blocked = GetCellType(row - 2, col - 1) != CellType.None ? true : blocked;
			blocked = GetCellType(row - 2, col + 1) != CellType.None ? true : blocked;
			blocked = GetCellType(row - 3, col) != CellType.None ? true : blocked;
			blocked = GetCellType(row - 3, col - 1) != CellType.None ? true : blocked;
			blocked = GetCellType(row - 3, col + 1) != CellType.None ? true : blocked;
			blocked = GetCellType(row - 4, col) != CellType.None ? true : blocked;
			blocked = GetCellType(row - 4, col - 1) != CellType.None ? true : blocked;
			blocked = GetCellType(row - 4, col + 1) != CellType.None ? true : blocked;
		}
		
		return !blocked;
	}
	
	/// <summary>
	/// Checks to see if there is enough space for a room to the south of the specified hallway space
	/// </summary>
	/// <returns>
	/// If there is enough space, returns true
	/// </returns>
	/// <param name='row'>
	/// The row index of the map cell that the room will be attached to
	/// </param>
	/// <param name='col'>
	/// The column index of the map cell that the room will be attached to
	/// </param>	
	private function SpaceForRoomToSouth(row: int, col: int): boolean {
		var blocked: boolean = false;
		
		//make sure we won't go out of bounds to build this room
		if ((row + 4 > NumRows() - 1) || (col - 1 < 0) || (col + 1 > NumCols() - 1)) {
			blocked = true;
		}		
		
		if (!blocked) {
			blocked = GetCellType(row + 1, col) != CellType.None ? true : blocked;
			blocked = GetCellType(row + 2, col) != CellType.None ? true : blocked;
			blocked = GetCellType(row + 2, col - 1) != CellType.None ? true : blocked;
			blocked = GetCellType(row + 2, col + 1) != CellType.None ? true : blocked;
			blocked = GetCellType(row + 3, col) != CellType.None ? true : blocked;
			blocked = GetCellType(row + 3, col - 1) != CellType.None ? true : blocked;
			blocked = GetCellType(row + 3, col + 1) != CellType.None ? true : blocked;
			blocked = GetCellType(row + 4, col) != CellType.None ? true : blocked;
			blocked = GetCellType(row + 4, col - 1) != CellType.None ? true : blocked;
			blocked = GetCellType(row + 4, col + 1) != CellType.None ? true : blocked;
		}
		
		return !blocked;
	}
	
	/// <summary>
	/// Randomly selects a specific type of cell from the map. If it can't find one, the
	/// FlaggableCellIndex will contain false.
	/// </summary>
	/// <returns>
	/// The index of the map cell. If no cell was found, return value will have flag set to false.
	/// </returns>
	/// <param name='type'>
	/// The type of cell to look for
	/// </param>	
	private function GetRandomCell(cellTypes: CellType[]): FlaggableCellIndex {
		var validCells: List.<CellIndex> = new List.<CellIndex>();
		
		var cell = new FlaggableCellIndex(-1, -1, false);
				
		for (var row: int = 0; row < NumRows(); row++) {
			for (var col: int = 0; col < NumCols(); col++) {
				if (ValidMapCell(row, col)) {
					var type: CellType = GetCellType(row, col);
					var index = System.Array.IndexOf(cellTypes, type);
					if ( index > -1 ) {
						validCells.Add (new CellIndex(row, col));
					}
				}
			}
		}
		
		if (validCells.Count > 0) {
			var randomIndex: int = Random.Range (0, validCells.Count);
			cell.Row = validCells[randomIndex].Row;
			cell.Col = validCells[randomIndex].Col;
			cell.Flag = true;
		}
		
		return cell;
	}
	
	///This Class is used by the SnakeMap generation algorithm to track a drawing cursor. The reason
	///it is a class is so that it can be passed by reference to different methods, allowing each
	///method to update the cursor's position in the map grid.
	private class MapCursor {
		public var Row: int;
		public var Col: int;
		
		public function MapCursor(rowIndex: int, colIndex: int) {
			this.Row = rowIndex;
			this.Col = colIndex;
		}
		
		public override function ToString(): String {
			return "{" + this.Row + ", " + this.Col + "}";
		}	
	}
	
	///This class is used to track Items placed in the map
	private class MapItem {
		public var Index: CellIndex;
		public var Item: Transform;
		
		public function MapItem(spot: CellIndex, thing: Transform) {
			Index = spot;
			Item = thing;
		}
	}
	
}