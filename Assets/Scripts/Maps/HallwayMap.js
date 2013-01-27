#pragma strict

public class HallwayMap extends BaseMap {
	/// <summary>
	/// Builds a random map and creates a navigator for it
	/// </summary>
	public override function Generate() {
	
//		//Create the starting hallway
//		var firstHallway: Hallway = new Hallway(null);
//		
//		//Create eight more hallway's, each one attached to the next
//		var hallway: Hallway = firstHallway;
//		for (var i = 0; i < 8; i++) {
//			hallway = new Hallway(hallway);
//		}	
	
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