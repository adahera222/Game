using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Text;

public class SnakeMap : IMap {
	
	const string CELL_SCRIPT = "CELL";
	
	private INavigator _navigator;
	private GameObject[,] map = new GameObject[0,0]; 
	
	public INavigator Navigator 
	{ 
		get
		{
			return _navigator;
		}
	}
	
	/// <summary>
	/// Gets the number rows.
	/// </summary>
	/// <value>
	/// The number rows.
	/// </value>
	public int NumRows { 
		get {
			return map.GetLength(0);
		}
	}
	
	/// <summary>
	/// Gets the number cols.
	/// </summary>
	/// <value>
	/// The number cols.
	/// </value>
	public int NumCols { 
		get {
			return map.GetLength(1);
		}
	}
	
	/// <summary>
	/// Indexer for accessing GameObjects in map array
	/// </summary>
	/// <param name='row'>
	/// Row.
	/// </param>
	/// <param name='col'>
	/// Col.
	/// </param>
	public GameObject this[int row, int col] { 
		get {
			return map[row, col];
		}
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
	public CellType GetCellType(int row, int col) {
		if ((row < 0) || (row >= NumRows)) return CellType.None;
		if ((col < 0) || (col >= NumCols)) return CellType.None;
		
		if (map[row, col] == null) return CellType.None;
		
		Cell script = map[row, col].GetComponent<Cell>();
		return script.type;
	}
	
	/// <summary>
	/// Gets the start cell.
	/// </summary>
	/// <returns>
	/// The start cell.
	/// </returns>
	public GameObject GetStartCell(out int startRow, out int startCol) {
		startRow = 0;
		startCol = 0;
		
		for (int row = 0; row < NumRows; row++) {
			for (int col = 0; col < NumCols; col++) {
				if (map[row,col] != null) {
					Cell script = map[row,col].GetComponent<Cell>();
					if (script.start) {
						startRow = row;
						startCol = col;
						return map[startRow,startCol];
					}
				}
			}
		}
		
		return null;
	}
	
	/// <summary>
	/// Destroys all current cell game objects and resets the map array to be 0,0 size
	/// </summary>
	public void Reset() {
		for (int row = 0; row < NumRows; row++) {
			for (int col = 0; col < NumCols; col++) {
				if (map[row,col] != null) {
					GameObject.Destroy(map[row,col]);
					map[row,col] = null;
				}
			}
		}
		
		//reset the length of the map array
		map = new GameObject[0,0];
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
	private GameObject CreateCell(CellType type, bool isStart = false) {
		GameObject obj = new GameObject();
		Cell script = obj.AddComponent<Cell>();
		script.type = type;
		script.start = isStart;
		return obj;
	}
	
	/// <summary>
	/// Returns a <see cref="System.String"/> that represents the current <see cref="SnakeMap"/>.
	/// </summary>
	/// <returns>
	/// A <see cref="System.String"/> that represents the current <see cref="SnakeMap"/>.
	/// </returns>
	public override string ToString() {
		StringBuilder text = new StringBuilder();
		
		text.AppendFormat("Rows: {0}", NumRows).AppendLine();
		text.AppendFormat("Cols: {0}", NumCols).AppendLine();
		
		for (int row = 0; row < NumRows; row++) {
			text.Append("[");
			for (int col = 0; col < NumCols; col++) {
				GameObject cell = map[row,col];
				CellType cellType = CellType.None;
				if (cell != null) {
					Cell script = cell.GetComponent<Cell>();
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
	public void Generate() {
		BuildSnakeMap ();
		_navigator = new GridNavigator();
		_navigator.ConnectMap(this);
	}
	
	/// <summary>
	/// The pattern that this generator attempts to use is it creates a series of long hallways,
	/// which wind through the level like a snake. Rooms will be placed randomly along the hallways.
	/// </summary>
	private void BuildSnakeMap() {
		//determine the dimensions of the array, minimum size is 10x10
		int rows = 10 + Random.Range(0, 21);
		int cols = 10 + Random.Range(0, 21);
		
		//initialize the map
		map = new GameObject[rows, cols];
		
		//Pick starting location
		int currentRow = rows - 1;
		int currentCol = Random.Range (0, cols);
		map[currentRow, currentCol] = CreateCell (CellType.NDeadEnd, true);
		
		//3 NS Hallways (traverse entire length of map area)
		int NSHall1Length = rows / 3 - 1;
		int NSHall2Length = rows / 3 - 1;
		int NSHall3Length = rows - (NSHall1Length + NSHall2Length + 1);
		
		//draw the first hallway to the north of the starting spot, don't draw last cell of hallway
		for (int count = 1; count <= NSHall1Length; count++) {
			currentRow--;
			if (currentRow >= 0) {
				map[currentRow, currentCol] = CreateCell(CellType.NSHall);
			}
		}
		
		//now determine which direction to go and how much space is available
		int leftSpace = currentCol;
		int rightSpace = cols - (currentCol + 1);
		int hallDirection = leftSpace >= rightSpace ? -1 : 1;
		int availableHallLength = leftSpace >= rightSpace ? leftSpace : rightSpace;
		
		//place a corner in this hallway
		map[currentRow, currentCol] = hallDirection < 0 ? CreateCell(CellType.NECorner) : CreateCell (CellType.NWCorner);
		
		//draw the first horizontal hallway
		int hallLength = Random.Range (availableHallLength / 2, availableHallLength);
		for (int count = 1; count <= hallLength; count++) {
			currentCol += hallDirection;
			if ((currentCol > 0) && (currentCol < cols)) {
				map[currentRow, currentCol] = CreateCell(CellType.EWHall);
			}
		}
		
		//based on the direction, build the corner at the last space
		map[currentRow, currentCol] = hallDirection < 0 ? CreateCell(CellType.SWCorner) : CreateCell(CellType.SECorner);
		
		//draw the second vertical hallway
		//draw the first hallway to the north of the starting spot, don't draw last cell of hallway
		for (int count = 1; count <= NSHall2Length; count++) {
			currentRow--;
			if (currentRow >= 0) {
				map[currentRow, currentCol] = CreateCell(CellType.NSHall);
			}
		}
		
		//now determine which direction to go and how much space is available
		leftSpace = currentCol;
		rightSpace = cols - (currentCol + 1);
		hallDirection = leftSpace >= rightSpace ? -1 : 1;
		availableHallLength = leftSpace >= rightSpace ? leftSpace : rightSpace;
		
		//place a corner in this hallway
		map[currentRow, currentCol] = hallDirection < 0 ? CreateCell(CellType.NECorner) : CreateCell (CellType.NWCorner);		
		
		//draw the second horizontal hallway
		hallLength = Random.Range (availableHallLength / 2, availableHallLength);
		for (int count = 1; count <= hallLength; count++) {
			currentCol += hallDirection;
			if ((currentCol > 0) && (currentCol < cols)) {
				map[currentRow, currentCol] = CreateCell(CellType.EWHall);
			}
		}
		
		//based on the direction, build the corner at the last space
		map[currentRow, currentCol] = hallDirection < 0 ? CreateCell(CellType.SWCorner) : CreateCell(CellType.SECorner);	
		
		//draw the third vertical hallway
		//draw the first hallway to the north of the starting spot, don't draw last cell of hallway
		for (int count = 1; count <= NSHall3Length; count++) {
			currentRow--;
			if (currentRow >= 0) {
				map[currentRow, currentCol] = CreateCell(CellType.NSHall);
			}
		}
		
		//now determine which direction to go and how much space is available
		leftSpace = currentCol;
		rightSpace = cols - (currentCol + 1);
		hallDirection = leftSpace >= rightSpace ? -1 : 1;
		availableHallLength = leftSpace >= rightSpace ? leftSpace : rightSpace;
		
		//place a corner in this hallway
		map[currentRow, currentCol] = hallDirection < 0 ? CreateCell(CellType.NECorner) : CreateCell (CellType.NWCorner);		
		
		//draw the third horizontal hallway
		hallLength = Random.Range (availableHallLength / 2, availableHallLength);
		for (int count = 1; count <= hallLength; count++) {
			currentCol += hallDirection;
			if ((currentCol > 0) && (currentCol < cols)) {
				map[currentRow, currentCol] = CreateCell(CellType.EWHall);
			}
		}
		
		//based on the direction, build a deadend
		map[currentRow, currentCol] = hallDirection < 0 ? CreateCell(CellType.EDeadEnd) : CreateCell(CellType.WDeadEnd);		
		
		//attempt to randomly add rooms to the map
		AddRooms();
	}
	
	private void AddRooms() {
		int numRooms = 6;
		int countRooms = 0;
		
		IList<Vector2> spaces = new List<Vector2>();
		
		for (int row = 0; row < NumRows; row++) {
			for (int col = 0; col < NumCols; col++) {
				if (CellHelper.GetCellType(map[row, col]) == CellType.EWHall) {
					spaces.Add (new Vector2(row, col));
				}
			}
		}
		
		while ((countRooms < numRooms) && (spaces.Count > 0)) {
			int index = Random.Range(0, spaces.Count);
			Vector2 cellIndex = spaces[index];
			spaces.RemoveAt(index);
			if (SpaceForRoomToNorth((int)cellIndex.x, (int)cellIndex.y)) {
				BuildRoomToNorth((int)cellIndex.x, (int)cellIndex.y);
				countRooms++;
			} else if (SpaceForRoomToSouth((int)cellIndex.x, (int)cellIndex.y)) {
				BuildRoomToSouth((int)cellIndex.x, (int)cellIndex.y);
				countRooms++;
			}
		}
	}
	
	private void BuildRoomToNorth(int row, int col) {
		//change the current cell to a T intersection
		Cell script = map[row, col].GetComponent<Cell>();
		script.type = CellType.SWall;
		
		map[row - 1, col] = CreateCell(CellType.NSHall);
		map[row - 2, col] = CreateCell (CellType.Empty);
		map[row - 2, col - 1] = CreateCell (CellType.SWCorner);
		map[row - 2, col + 1] = CreateCell (CellType.SECorner);
		map[row - 3, col] = CreateCell (CellType.Empty);
		map[row - 3, col - 1] = CreateCell (CellType.WWall);
		map[row - 3, col + 1] = CreateCell (CellType.EWall);
		map[row - 4, col] = CreateCell (CellType.NWall);
		map[row - 4, col - 1] = CreateCell (CellType.NWCorner);
		map[row - 4, col + 1] = CreateCell (CellType.NECorner);
	}
	
	private void BuildRoomToSouth(int row, int col) {
		//change the current cell to a T intersection
		Cell script = map[row, col].GetComponent<Cell>();
		script.type = CellType.NWall;
		
		map[row + 1, col] = CreateCell(CellType.NSHall);
		map[row + 2, col] = CreateCell (CellType.Empty);
		map[row + 2, col - 1] = CreateCell (CellType.NWCorner);
		map[row + 2, col + 1] = CreateCell (CellType.NECorner);
		map[row + 3, col] = CreateCell (CellType.Empty);
		map[row + 3, col - 1] = CreateCell (CellType.WWall);
		map[row + 3, col + 1] = CreateCell (CellType.EWall);
		map[row + 4, col] = CreateCell (CellType.SWall);
		map[row + 4, col - 1] = CreateCell (CellType.SWCorner);
		map[row + 4, col + 1] = CreateCell (CellType.SECorner);
	}	
	
	private bool SpaceForRoomToNorth(int row, int col) {
		bool blocked = false;

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
	
	private bool SpaceForRoomToSouth(int row, int col) {
		bool blocked = false;
		
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
	public bool ValidMapCell(int row, int col) {
		return (map != null) &&
			(row >= 0) && (row < NumRows) &&
			(col >= 0) && (col < NumCols) &&
			map[row, col] != null;
	}
	
	/// <summary>
	/// Places the item in random room in the dungeon
	/// </summary>
	/// <param name='item'>
	/// Item to be placed
	/// </param>
	public void PlaceItemInRandomRoom(Transform item) {
		int rowIndex;
		int colIndex;
		//First look for an empty cell, which will be in a room, otherwise stick in a east west hallway
		if (GetRandomCell(CellType.Empty, out rowIndex, out colIndex)) {
			item.position = map[rowIndex, colIndex].transform.position;
		} else if (GetRandomCell(CellType.EWHall, out rowIndex, out colIndex)) {
			item.position = map[rowIndex, colIndex].transform.position;
		}
	}
	
	private bool GetRandomCell(CellType type, out int rowIndex, out int colIndex) {
		IList<Vector2> validCells = new List<Vector2>();
		
		rowIndex = 0;
		colIndex = 0;
		
		for (int row = 0; row < NumRows; row++) {
			for (int col = 0; col < NumCols; col++) {
				if (ValidMapCell(row, col)) {
					if (CellHelper.GetCellType(map[row, col]) == type) {
						validCells.Add (new Vector2((float)row, (float)col));
					}
				}
			}
		}
		
		if (validCells.Count > 0) {
			int index = Random.Range (0, validCells.Count);
			rowIndex = (int)validCells[index].x;
			colIndex = (int)validCells[index].y;
			return true;
		} else {
			return false;
		}
	}
	
}
