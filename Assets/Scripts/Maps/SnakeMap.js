import System.Collections.Generic;
import System.Text;

public class SnakeMap implements IMap {
	
	private var CELL_SCRIPT: String = "CELL";
	
	private var _navigator: INavigator;
	
	private var _map = new GameObject[0,0]; 
	
	/// <summary>
	/// Gets the number rows.
	/// </summary>
	/// <value>
	/// The number rows.
	/// </value>
	public function get NumRows(): int {
		return _map.GetLength(0);
	}	
	
	/// <summary>
	/// Returns this maps assigned navigator
	/// </summary>
	/// <value>
	/// The navigator.
	/// </value>
	public function get Navigator() : INavigator {
		return _navigator;
	}
	
	/// <summary>
	/// Gets the number cols.
	/// </summary>
	/// <value>
	/// The number cols.
	/// </value>
	function get NumCols(): int {
		return _map.GetLength(1);
	}	
	
	/// <summary>
	/// Used for accessing GameObjects in map array
	/// </summary>
	/// <param name='row'>
	/// Row.
	/// </param>
	/// <param name='col'>
	/// Col.
	/// </param>
	public function Map(row: int, col: int): GameObject {
		return _map[row, col];
	}	
	
	/// <summary>
	/// Gets the type of the cell.
	/// </summary>
	/// <returns>
	/// The cell type.
	/// </returns>
	/// <param name='row'>
	/// Row.
	/// </param>
	/// <param name='col'>
	/// Col.
	/// </param>
	public function GetCellType(row: int, col: int): CellType {
		var typeOfCell: CellType = CellType.None;
		
		if (ValidMapCell(row, col)) {
			var script: Cell = _map[row, col].GetComponent(Cell);
			if (script != null) {
				typeOfCell = script.type;
			}
		}
		
		return typeOfCell;
	}
	
	/// <summary>
	/// Gets the start cell.
	/// </summary>
	/// <returns>
	/// The start cell.
	/// </returns>
	public function GetStartCellIndex(): CellIndex {
		var index: CellIndex = new CellIndex(0, 0);
		
		for (var row: int = 0; row < _map.GetLength(0); row++) {
			for (var col: int = 0; col < _map.GetLength(1); col++) {
				if (_map[row,col] != null) {
					var script: Cell = _map[row,col].GetComponent(Cell);
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
		for (var row: int = 0; row < _map.GetLength(0); row++) {
			for (var col: int = 0; col < _map.GetLength(1); col++) {
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
		var script: Cell = obj.AddComponent(Cell);
		script.type = type;
		script.start = isStart;
		return obj;
	}
	
	/// <summary>
	/// This overloaded method calls the original CreateCell, passing false in for the second parameter.
	/// This is my implementation for supporting (kinda) optional parameters in Unity Script
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
		
		text.AppendFormat("Rows: {0}", NumRows).AppendLine();
		text.AppendFormat("Cols: {0}", NumCols).AppendLine();
		
		for (var row: int = 0; row < _map.GetLength(0); row++) {
			text.Append("[");
			for (var col: int = 0; col < _map.GetLength(1); col++) {
				var cell: GameObject = _map[row,col];
				var cellType: CellType = CellType.None;
				if (cell != null) {
					var script: Cell = cell.GetComponent(Cell);
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
	/// The pattern that this generator attempts to use is it creates a series of long hallways,
	/// which wind through the level like a snake. Rooms will be placed randomly along the hallways.
	/// </summary>
	private function BuildSnakeMap() {
		//determine the dimensions of the array, minimum size is 10x10
		var rows: int = 10 + Random.Range(0, 21);
		var cols: int = 10 + Random.Range(0, 21);
		
		//initialize the map
		_map = new GameObject[rows, cols];
		
		//Pick starting location
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
		
		for (var row: int = 0; row < _map.GetLength(0); row++) {
			for (var col: int = 0; col < _map.GetLength(1); col++) {
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
		var script: Cell = _map[row, col].GetComponent(Cell);
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
		var script: Cell = _map[row, col].GetComponent(Cell);
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
		if ((row - 4 < 0) || (col - 1 < 0) || (col + 1 > NumCols - 1)) {
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
		if ((row + 4 > NumRows - 1) || (col - 1 < 0) || (col + 1 > NumCols - 1)) {
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
			(row >= 0) && (row < _map.GetLength(0)) &&
			(col >= 0) && (col < _map.GetLength(1)) &&
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
				
		for (var row: int = 0; row < _map.GetLength(0); row++) {
			for (var col: int = 0; col < _map.GetLength(1); col++) {
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
	
}