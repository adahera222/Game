#pragma strict

public class GridNavigator implements INavigator {
	
	private var _map: IMap;
	private var _currentRow: int;
	private var _currentCol: int;
	private var _currentFacing: Vector3;
	private var _currentUpVector: Vector3;
	
	public function CurrentPosition(): Vector3 {
		if (_map.ValidMapCell (_currentRow, _currentCol) ) {
			return _map.Map(_currentRow, _currentCol).transform.position;
		} else {
			return Vector3.zero;
		}
	}
	
	public function CurrentFacing(): Vector3 {
		return _currentFacing;
	}
	
	public function CurrentUpVector(): Vector3 {
		return _currentUpVector;
	}
	
	//Connects this navigator to a map
	public function ConnectMap(newMap: IMap) {
		_map = newMap;
		//initialize the current position
		var startIndex: CellIndex = _map.GetStartCellIndex();
		_currentRow = startIndex.Row;
		_currentCol = startIndex.Col;
		//initialize the current facing and up vectors, based on the map cell, in worldspace
		_currentFacing = _map.Map(startIndex.Row, startIndex.Col).transform.forward;
		_currentUpVector = _map.Map(startIndex.Row, startIndex.Col).transform.up;		
	}
	
	/// <summary>
	/// Checks the map for a valid cell in the specified direction and
	/// returns it's position in space.
	/// </summary>
	/// <param name='direction'>
	/// Direction to "move". This method only supports forward, backward, left, and right. Any
	/// other directions return the current position;
	/// </param>
	/// <param name='newPosition'>
	/// Returns the new position for the current
	/// </param>
	/// <returns>
	/// If true, the move is valid and newPosition contains the new position in space.
	/// If false, the move is not valie, and newPosition contains the original position in space.
	/// </returns>
	public function Move(moveDirection: Direction): boolean {
		var valid: boolean = false;
		
		var facingDirection: Direction = GetFacingDirection();
		
		//If the move is valid, store the new row and column indexes
		var moveCellIndex: FlaggableCellIndex = CanMoveToCell(facingDirection, moveDirection);
		if (moveCellIndex.Flag) {
			_currentRow = moveCellIndex.Row;
			_currentCol = moveCellIndex.Col;
			valid = true;
		}
		
		return valid;
	}
	
	/// <summary>
	/// Turns the player's facing vector towards the specified direction.
	/// </summary>
	/// <param name='turnDirection'>
	/// Direction to turn. Valid values are Right and Left
	/// </param>
	public function Turn(turnDirection: Direction) {
		//calculate the turn angle, based on turn direction
		var turnAngle: float = 0f;
		if (turnDirection == Direction.Left) {
			turnAngle = 270f;
		} else if (turnDirection == Direction.Right) {
			turnAngle = 90f;
		}
		
		//rotate the current facing vector by the turn angle
		_currentFacing = Quaternion.AngleAxis(turnAngle, _currentUpVector) * _currentFacing;
	}
	
	/// <summary>
	/// Gets the direction that the current character should be facing, based on currentFacing vector
	/// </summary>
	/// <returns>
	/// returns a Direction indicating which way the character is facing
	/// </returns>
	private function GetFacingDirection(): Direction {
		//grab the current cell's transform
		var cell: Transform = _map.Map(_currentRow, _currentCol).transform;
		
		//store the direction vectors for this cell
		var north: Vector3 = cell.forward;
		var east: Vector3 = cell.right;
		var south: Vector3 = -cell.forward;
		var west: Vector3 = -cell.right;
		
		//get the closest vector to the facing vector
		var directionVector: Vector3 = VectorHelper.GetClosestVector(_currentFacing, [north, east, south, west]);
		
		//now figure out the facing direction
		var facingDirection: Direction = Direction.None;
		if (directionVector == north) {
			facingDirection = Direction.North;
		} else if (directionVector == east) {
			facingDirection = Direction.East;
		} else if (directionVector == south) {
			facingDirection = Direction.South;
		} else if (directionVector == west) {
			facingDirection = Direction.West;
		}
		
		return facingDirection;
	}
	
	/// <summary>
	/// Determines whether or not it is possible to move from the current cell to an adjacent cell, based
	/// on the move direction and the facing direction
	/// </summary>
	/// <returns>
	/// <c>true</c> if this instance can move to cell the specified facingDirection moveDirection; otherwise, <c>false</c>.
	/// </returns>
	/// <param name='facingDirection'>
	/// The direction that the player is facing
	/// </param>
	/// <param name='moveDirection'>
	/// The direction that the player wishes to move
	/// </param>
	private function CanMoveToCell(facingDirection: Direction, moveDirection: Direction): FlaggableCellIndex {
		var index: FlaggableCellIndex = new FlaggableCellIndex(0, 0, false);
				
		//Based on the facing direction and move direction, determine which direction we would leave the current cell
		var leaveDirection: Direction = GetLeaveDirection(facingDirection, moveDirection);
		
		//Return the cell index for the cell that we would be moving into
		var adjacentIndex: CellIndex = GetAdjacentCellIndex(leaveDirection, _currentRow, _currentCol);
		
		//make sure the new cell isn't off the map (out of range)
		if (_map.ValidMapCell(adjacentIndex.Row, adjacentIndex.Col)) {
			//Now check to make sure there is a wall in the appropriate direction
			var currentCellType: CellType = _map.GetCellType(_currentRow, _currentCol);
			if (!CellHelper.HasWallInDirection(currentCellType, leaveDirection)) {
				index.Row = adjacentIndex.Row;
				index.Col = adjacentIndex.Col;
				index.Flag = true;
			}
		}
		
		return index;
	}
	
	
	private function GetLeaveDirection(facing: Direction, movement: Direction): Direction {
		var leave: Direction = Direction.None;
		
		if (facing == Direction.North) {
			switch (movement) {
			case Direction.Forward :
				leave = Direction.North;
				break;
			case Direction.Right :
				leave = Direction.East;
				break;
			case Direction.Backward :
				leave = Direction.South;
				break;
			case Direction.Left :
				leave = Direction.West;
				break;
			}
		} else if (facing == Direction.East) {
			switch (movement) {
			case Direction.Forward :
				leave = Direction.East;
				break;
			case Direction.Right :
				leave = Direction.South;
				break;
			case Direction.Backward :
				leave = Direction.West;
				break;
			case Direction.Left :
				leave = Direction.North;
				break;
			}
		} else if (facing == Direction.South) {
			switch (movement) {
			case Direction.Forward :
				leave = Direction.South;
				break;
			case Direction.Right :
				leave = Direction.West;
				break;
			case Direction.Backward :
				leave = Direction.North;
				break;
			case Direction.Left :
				leave = Direction.East;
				break;
			}
		} else if (facing == Direction.West) {
			switch (movement) {
			case Direction.Forward :
				leave = Direction.West;
				break;
			case Direction.Right :
				leave = Direction.North;
				break;
			case Direction.Backward :
				leave = Direction.East;
				break;
			case Direction.Left :
				leave = Direction.South;
				break;
			}
		}
		
		return leave;
	}
	
	/// <summary>
	/// Gets the index of the cell next to the specified cell, in the specified direction
	/// </summary>
	/// <param name='direction'>
	/// The direction from the specified cell to check. Valid values are North, East, South, and West
	/// </param>
	/// <param name='rowIndex'>
	/// The row index of the cell being checked.
	/// </param>
	/// <param name='colIndex'>
	/// The column index of the cell being checked
	/// </param>
	/// <param name='adjacentRowIndex'>
	/// The row index of the adjacent cell. Note, this index may be out of bounds, so check it before using it.
	/// </param>
	/// <param name='adjacentColIndex'>
	/// The column index of the adjacent cell. Note, this index may be out of bounds, so check it before using it.
	/// </param>
	private function GetAdjacentCellIndex(direction: Direction, rowIndex: int, colIndex: int): CellIndex {
		var adjacentRowIndex: int = rowIndex;
		var adjacentColIndex: int = colIndex;
		
		switch (direction) {
		case Direction.North :
			adjacentRowIndex--;
			break;
		case Direction.South :
			adjacentRowIndex++;
			break;
		case Direction.East :
			adjacentColIndex++;
			break;
		case Direction.West :
			adjacentColIndex--;
			break;
		}
		
		return new CellIndex(adjacentRowIndex, adjacentColIndex);
	}
	
}