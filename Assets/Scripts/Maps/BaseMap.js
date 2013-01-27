#pragma strict

public class BaseMap implements IMap {

	protected var _navigator: INavigator;
	protected var _map = new GameObject[0,0];
	
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
	
	/// <summary>
	/// Returns the number of columns in the map's grid
	/// </summary>
	public function NumCols(): int {
		return _map.GetLength(1);
	}	

	/// <summary>
	/// This function will generate the map. It is specific to each particular
	/// implementation of BaseMap, so it must be overidden.
	public function Generate() {}
	
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
	/// This function places an item in a random room in the dungeon. It is specific to
	/// each implementation of BaseMap, so it must be overriden.
	/// </summary>
	public function PlaceItemInRandomRoom(item: Transform) {}
	
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

}