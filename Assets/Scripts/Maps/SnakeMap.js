#pragma strict

import System.Collections.Generic;
import System.Text;

public class SnakeMap implements IMap {
	
	static private var CELL_SCRIPT: String = "CELL";
	static private var ROW_MINIMUM: int = 10;
	static private var ROW_MAXIMUM: int = 20;
	static private var COLUMN_MINIMUM: int = 10;
	static private var COLUMN_MAXIMUM: int = 20;
	
	private var _navigator: INavigator;
	private var _map = new GameObject[0,0];
	
	/// <summary>
	/// Returns this maps Navigator. Navigators are used for movement through the map
	/// </summary>
	public function Navigator() : INavigator {
		return _navigator;
	}
	
	/// <summary>
	/// A 2 dimensional grid that stores gameobjects that make up the map
	/// </summary>
	public function Map(row: int, col: int): GameObject {
		return _map[row, col];
	}	
	
	/// <summary>
	/// Returns the number of rows in the map's grid
	/// </summary>
	public function NumRows(): int {
		return _map.GetLength(0);
	}	
	
	// REturns the number of columns in the map's grid
	function NumCols(): int {
		return _map.GetLength(1);
	}		
	
	/// <summary>
	/// Returns the type of the cell requested by row and column in the map's grid
	/// </summary>
	/// <returns>
	/// The type of the cell at the grid index requested
	/// </returns>
	/// <param name='row'>
	/// The row index of the requested cell
	/// </param>
	/// <param name='col'>
	/// The column index of the requested cell
	/// </param>
	public function GetCellType(row: int, col: int): CellType {
		var typeOfCell: CellType = CellType.None;
		
		if (ValidMapCell(row, col)) {
			var script: Cell = _map[row, col].GetComponent.<Cell>();
			if (script != null) {
				typeOfCell = script.type;
			}
		}
		
		return typeOfCell;
	}
	
	/// <summary>
	/// Returns the starting cell in the dungeon.
	/// This is used to determine where the player character should begin.
	/// </summary>
	/// <returns>
	/// A struct indicating the row and column index of the starting cell. Default is 0, 0
	/// </returns>
	public function GetStartCellIndex(): CellIndex {
		var index: CellIndex = new CellIndex(0, 0);
		
		for (var row: int = 0; row < NumRows(); row++) {
			for (var col: int = 0; col < NumCols(); col++) {
				if (_map[row,col] != null) {
					var script: Cell = _map[row,col].GetComponent.<Cell>();
					if (script.start) {
						index.Row = row;
						index.Col = col;
					}
				}
			}
		}
		
		return index;
	}
	
	/// <summary>
	/// Destroys all current cell game objects and resets the map array to be 0,0 size
	/// </summary>
	public function Reset() {
		for (var row: int = 0; row < NumRows(); row++) {
			for (var col: int = 0; col < NumCols(); col++) {
				if (_map[row,col] != null) {
					GameObject.Destroy(_map[row,col]);
					_map[row,col] = null;
				}
			}
		}
		
		//reset the length of the map array
		_map = new GameObject[0,0];
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
	/// Returns a <see cref="System.String"/> that represents the current <see cref="SnakeMap"/>.
	/// </summary>
	/// <returns>
	/// A <see cref="System.String"/> that represents the current <see cref="SnakeMap"/>.
	/// </returns>
	public override function ToString(): String {
		var text: StringBuilder = new StringBuilder();
		
		text.AppendFormat("Rows: {0}", NumRows()).AppendLine();
		text.AppendFormat("Cols: {0}", NumCols()).AppendLine();
		
		for (var row: int = 0; row < NumRows(); row++) {
			text.Append("[");
			for (var col: int = 0; col < NumCols(); col++) {
				var cell: GameObject = _map[row,col];
				var cellType: CellType = CellType.None;
				if (cell != null) {
					var script: Cell = cell.GetComponent.<Cell>();
					cellType = script.type;
				};
			    text.AppendFormat(" {0,4} ", cellType);
			}
			text.Append("]").AppendLine();
		}
		
		return text.ToString();
	}
	
	/// <summary>
	/// Builds a random map and creates a navigator for it
	/// </summary>
	public function Generate() {
		BuildSnakeMap ();
		_navigator = new GridNavigator();
		_navigator.ConnectMap(this);
	}
	
	/// <summary>
	/// The pattern that this generator uses attempts to create a series of long hallways,
	/// which wind through the level like a snake. Rooms will be placed randomly along the hallways.
	/// </summary>
	private function BuildSnakeMap() {
//		//Create the starting hallway
//		var firstHallway: Hallway = new Hallway(null);
//		
//		//Create eight more hallway's, each one attached to the next
//		var hallway: Hallway = firstHallway;
//		for (var i = 0; i < 8; i++) {
//			hallway = new Hallway(hallway);
//		}
	
		//determine the dimensions of the array
		var rows: int = ROW_MINIMUM + Random.Range(0, ROW_MAXIMUM + 1);
		var cols: int = COLUMN_MINIMUM + Random.Range(0, COLUMN_MAXIMUM + 1);
		
		_map = new GameObject[rows, cols];
		
		//Create the starting cell, along the bottom of the grid
		var currentRow: int = rows - 1;
		var currentCol: int = Random.Range (0, cols);
		_map[currentRow, currentCol] = CreateCell (CellType.NDeadEnd, true);
		
		//3 NS Hallways (traverse entire length of map area)
		var NSHall1Length: int = rows / 3 - 1;
		var NSHall2Length: int = rows / 3 - 1;
		var NSHall3Length: int = rows - (NSHall1Length + NSHall2Length + 1);
		
		//draw the first hallway to the north of the starting spot, don't draw last cell of hallway
		for (var count: int = 1; count <= NSHall1Length; count++) {
			currentRow--;
			if (currentRow >= 0) {
				_map[currentRow, currentCol] = CreateCell(CellType.NSHall);
			}
		}
		
		//now determine which direction to go and how much space is available
		var leftSpace: int = currentCol;
		var rightSpace: int = cols - (currentCol + 1);
		var hallDirection: int = leftSpace >= rightSpace ? -1 : 1;
		var availableHallLength: int = leftSpace >= rightSpace ? leftSpace : rightSpace;
		
		//place a corner in this hallway
		_map[currentRow, currentCol] = hallDirection < 0 ? CreateCell(CellType.NECorner) : CreateCell (CellType.NWCorner);
		
		//draw the first horizontal hallway
		var hallLength: int = Random.Range (availableHallLength / 2, availableHallLength);
		for (var count2: int = 1; count2 <= hallLength; count2++) {
			currentCol += hallDirection;
			if ((currentCol > 0) && (currentCol < cols)) {
				_map[currentRow, currentCol] = CreateCell(CellType.EWHall);
			}
		}
		
		//based on the direction, build the corner at the last space
		_map[currentRow, currentCol] = hallDirection < 0 ? CreateCell(CellType.SWCorner) : CreateCell(CellType.SECorner);
		
		//draw the second vertical hallway
		//draw the first hallway to the north of the starting spot, don't draw last cell of hallway
		for (var count3: int = 1; count3 <= NSHall2Length; count3++) {
			currentRow--;
			if (currentRow >= 0) {
				_map[currentRow, currentCol] = CreateCell(CellType.NSHall);
			}
		}
		
		//now determine which direction to go and how much space is available
		leftSpace = currentCol;
		rightSpace = cols - (currentCol + 1);
		hallDirection = leftSpace >= rightSpace ? -1 : 1;
		availableHallLength = leftSpace >= rightSpace ? leftSpace : rightSpace;
		
		//place a corner in this hallway
		_map[currentRow, currentCol] = hallDirection < 0 ? CreateCell(CellType.NECorner) : CreateCell (CellType.NWCorner);		
		
		//draw the second horizontal hallway
		hallLength = Random.Range (availableHallLength / 2, availableHallLength);
		for (var count4: int = 1; count4 <= hallLength; count4++) {
			currentCol += hallDirection;
			if ((currentCol > 0) && (currentCol < cols)) {
				_map[currentRow, currentCol] = CreateCell(CellType.EWHall);
			}
		}
		
		//based on the direction, build the corner at the last space
		_map[currentRow, currentCol] = hallDirection < 0 ? CreateCell(CellType.SWCorner) : CreateCell(CellType.SECorner);	
		
		//draw the third vertical hallway
		//draw the first hallway to the north of the starting spot, don't draw last cell of hallway
		for (var count5: int = 1; count5 <= NSHall3Length; count5++) {
			currentRow--;
			if (currentRow >= 0) {
				_map[currentRow, currentCol] = CreateCell(CellType.NSHall);
			}
		}
		
		//now determine which direction to go and how much space is available
		leftSpace = currentCol;
		rightSpace = cols - (currentCol + 1);
		hallDirection = leftSpace >= rightSpace ? -1 : 1;
		availableHallLength = leftSpace >= rightSpace ? leftSpace : rightSpace;
		
		//place a corner in this hallway
		_map[currentRow, currentCol] = hallDirection < 0 ? CreateCell(CellType.NECorner) : CreateCell (CellType.NWCorner);		
		
		//draw the third horizontal hallway
		hallLength = Random.Range (availableHallLength / 2, availableHallLength);
		for (var count6: int = 1; count6 <= hallLength; count6++) {
			currentCol += hallDirection;
			if ((currentCol > 0) && (currentCol < cols)) {
				_map[currentRow, currentCol] = CreateCell(CellType.EWHall);
			}
		}
		
		//based on the direction, build a deadend
		_map[currentRow, currentCol] = hallDirection < 0 ? CreateCell(CellType.EDeadEnd) : CreateCell(CellType.WDeadEnd);		
		
		//attempt to randomly add rooms to the map
		AddRooms();
	}
	
	private function AddRooms() {
		var numRooms: int = 6;
		var countRooms: int = 0;
		
		var spaces: List.<CellIndex> = new List.<CellIndex>();
		
		for (var row: int = 0; row < NumRows(); row++) {
			for (var col: int = 0; col < NumCols(); col++) {
				if (GetCellType(row, col) == CellType.EWHall) {
					spaces.Add (new CellIndex(row, col));
				}
			}
		}
		
		while ((countRooms < numRooms) && (spaces.Count > 0)) {
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
	/// Ensures that the cell at the specified location is a valid cell for the player to occupy
	/// </summary>
	/// <returns>
	/// if the specified cell is a valid locatio for the player to occupy it returns <c>true</c>, else it returns <c>false</c>;
	/// </returns>
	/// <param name='row'>
	/// The row index of the map grid to check
	/// </param>
	/// <param name='col'>
	/// The col index of the map grid to check
	/// </param>
	public function ValidMapCell(row: int, col: int): boolean {
		return (_map != null) &&
			(row >= 0) && (row < NumRows()) &&
			(col >= 0) && (col < NumCols()) &&
			_map[row, col] != null;
	}
	
	/// <summary>
	/// Places the item in random room in the dungeon
	/// </summary>
	/// <param name='item'>
	/// Item to be placed
	/// </param>
	public function PlaceItemInRandomRoom(item: Transform) {
		//First look for an empty cell, which will be in a room, otherwise stick in a east west hallway
		var roomIndex: FlaggableCellIndex = GetRandomCell(CellType.Empty);

		if (!roomIndex.Flag) {
			roomIndex = GetRandomCell(CellType.EWHall);
			
		}
		
		if (roomIndex.Flag) {
			item.position = _map[roomIndex.Row, roomIndex.Col].transform.position;
			}
	}
	
	private function GetRandomCell(type: CellType): FlaggableCellIndex {
		var validCells: List.<CellIndex> = new List.<CellIndex>();
		
		var index = new FlaggableCellIndex(-1, -1, false);
				
		for (var row: int = 0; row < NumRows(); row++) {
			for (var col: int = 0; col < NumCols(); col++) {
				if (ValidMapCell(row, col)) {
					if (GetCellType(row, col) == type) {
						validCells.Add (new CellIndex(row, col));
					}
				}
			}
		}
		
		if (validCells.Count > 0) {
			var randomIndex: int = Random.Range (0, validCells.Count);
			index.Row = validCells[randomIndex].Row;
			index.Col = validCells[randomIndex].Col;
			index.Flag = true;
		}
		
		return index;
	}
	
	private class Hallway {
		static private var LENGTH: int = 7;
	
		private var _previous: Hallway;
		private var _next: Hallway;
		private var _orientation: Direction;
		
		public var WidthIndex: int;
		public var HeightIndex: int;
		
		//Hallways represent a path through the dungeon. Each hallway is connected
		//to another hallway. Only the first hallway has on previous hallway. The
		//constructor will place the new hallway on the end of the passed in Hallway,
		//choosing a random orientation, while trying not to overlap other hallways.
		public function Hallway(link: Hallway) {
			//If a link was provided, store it in this hallway's previous link,
			//and store this hallway in the previous one's next link
			if (link != null) {
				SetPrevious(link);
				link.SetNext(this);
			}
			
			//Determine where this hall exists in relation to the others.
			//This must occur before the hallway can orient itself
			DeterminePositionIndex();			
			
			//determine the hallway's direction
			_orientation = PickADirection();
		}
		
		public function SetPrevious(hallway: Hallway) {
			_previous = hallway;
		}
		
		public function GetPrevious(): Hallway {
			return _previous;
		}
		
		public function SetNext(hallway: Hallway) {
			_next = hallway;
		}
		
		public function GetOrientation(): Direction {
			return _orientation;
		}
		
		//Chooses a random direction for this hallway
		private function PickADirection(): Direction {
			var direction: Direction;
		
			//If there is no previous link, this hallway can pick any direction it likes, 
			//as it must be the first hallway in the snake
			if (_previous == null) {
				//randomly choose a direction
				direction = DirectionHelper.GetRandomDirectionFromSubset([Direction.North, Direction.East, Direction.South, Direction.West]);
			} else {
				//build a list of all 4 directions
				var directions: List.<Direction> = new List.<Direction>();
				directions.Add(Direction.North);
				directions.Add(Direction.East);
				directions.Add(Direction.South);
				directions.Add(Direction.West);
				
				//remove the direction opposite of the previous hallway's orientation
				directions.Remove(DirectionHelper.GetOppositeDirection(_previous.GetOrientation()));
				
				//check the remaining directions
				//for ( choice in directions) {
				var numDirections = directions.Count;
				for (var i = numDirections - 1; i >= 0; i--) {
					//Determine this choices possible end index (where the next hallway would potentially start)
					var index: CellIndex = GetEndIndex(directions[i]);
					
					//now check all children to see if this index intersects with them
					if (IndexInUse(_previous, index.Row, index.Col)) {
						directions.RemoveAt(i);
					}
				}
				
				//randomly select a direction
				var error: boolean = directions.Count <= 0;
				if (!error) {
					var selectedIndex: int = Random.Range(0, directions.Count);
					direction = directions[selectedIndex];
				} else {
					throw new System.Exception("No valid directions for this hallway!");
				}
			}
			
			return direction;
		}
		
		//The position index refers to the starting cell for this hallway,
		//which begins in the exact same location as the previous hallway's
		//last cell.
		private function DeterminePositionIndex() {
			if (_previous != null) {
				
				var direction: Direction = _previous.GetOrientation();
				var error: boolean = false;
				
				switch (direction) {
				case Direction.North:
					WidthIndex = _previous.WidthIndex;
					HeightIndex = _previous.HeightIndex + 1;
					break;
				case Direction.East:
					WidthIndex = _previous.WidthIndex + 1;
					HeightIndex = _previous.HeightIndex;
					break;
				case Direction.South:
					WidthIndex = _previous.WidthIndex;
					HeightIndex = _previous.HeightIndex - 1;
					break;
				case Direction.West:
					WidthIndex = _previous.WidthIndex - 1;
					HeightIndex = _previous.HeightIndex;
					break;
				default:
					error = true;
					break;
				}
				
				//check for an error
				if (error) {
					throw new System.Exception("Invalid Hallway Direction specified.");
				}
			} else {
				//this is the first hallway in the list of hallways
				WidthIndex = 0;
				HeightIndex = 0;
			}
		}
		
		//Determines what this hallway's ending index might be if it were to extend this
		//direction. Uses CellIndex, where Row = width, and Col = height
		private function GetEndIndex(direction: Direction): CellIndex {
			var index: CellIndex = new CellIndex(0, 0);
		
			switch (direction) {
			case Direction.North:
				index.Row = _previous.WidthIndex;
				index.Col = _previous.HeightIndex + 1;
				break;
			case Direction.East:
				index.Row = _previous.WidthIndex + 1;
				index.Col = _previous.HeightIndex;
				break;
			case Direction.South:
				index.Row = _previous.WidthIndex;
				index.Col = _previous.HeightIndex - 1;
				break;
			case Direction.West:
				index.Row = _previous.WidthIndex - 1;
				index.Col = _previous.HeightIndex;
				break;
			}		
			
			return index;
		}
		
		//recursive function that checks the chain of hallways, all the way to the beginning,
		//for a matching index
		private function IndexInUse(hallway: Hallway, width: int, height: int): boolean {
			if (hallway == null) {
				return false;
			}
			
			if ((hallway.WidthIndex == width) && (hallway.HeightIndex == height)) {
				return true;
			}
			
			return IndexInUse(hallway.GetPrevious(), width, height);
			
		}
	}
	
}