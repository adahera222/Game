using UnityEngine;
using System.Collections;

public class GridNavigator : INavigator {
	
	private IMap _map;
	private int _currentRow;
	private int _currentCol;
	private Vector3 _currentFacing;
	private Vector3 _currentUpVector;
	
	public Vector3 CurrentPosition 
	{ 
		get 
		{
			if (_map.ValidMapCell (_currentRow, _currentCol) ) {
				return _map[_currentRow, _currentCol].transform.position;
			} else {
				return Vector3.zero;
			}
		}
	}
	
	public Vector3 CurrentFacing 
	{ 
		get
		{
			return _currentFacing;
		}
	}
	
	public Vector3 CurrentUpVector
	{
		get
		{
			return _currentUpVector;
		}
	}
	
	public void ConnectMap(IMap map) {
		_map = map;
		//initialize the current position
		_map.GetStartCell(out _currentRow, out _currentCol);
		//initialize the current facing and up vectors, based on the map cell, in worldspace
		_currentFacing = _map[_currentRow, _currentCol].transform.forward;
		_currentUpVector = _map[_currentRow, _currentCol].transform.up;		
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
	public bool Move(Direction moveDirection) {
		bool valid = false;
		int rowIndex;
		int colIndex;
		
		Direction facingDirection = GetFacingDirection();
		
		//If the move is valid, store the new row and column indexes
		if (CanMoveToCell(facingDirection, moveDirection, out rowIndex, out colIndex)) {
			_currentRow = rowIndex;
			_currentCol = colIndex;
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
	public void Turn(Direction turnDirection) {
		//calculate the turn angle, based on turn direction
		float turnAngle = 0f;
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
	private Direction GetFacingDirection() {
		//grab the current cell's transform
		Transform cell = _map[_currentRow, _currentCol].transform;
		//store the direction vectors for this cell
		Vector3 north = cell.forward;
		Vector3 east = cell.right;
		Vector3 south = -cell.forward;
		Vector3 west = -cell.right;
		//get the closest vector to the facing vector
		Vector3 directionVector = VectorHelper.GetClosestVector(_currentFacing, north, east, south, west);
		
		//now figure out the facing direction
		Direction facingDirection = Direction.None;
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
	private bool CanMoveToCell(Direction facingDirection, Direction moveDirection, out int rowIndex, out int colIndex) {
		bool canMove = false;
		
		rowIndex = _currentRow;
		colIndex = _currentCol;
		
		//stores the direction the character would be leaving the cell
		Direction leaveDirection = Direction.None;
		
		//predict the direction we will leave the cell and the new cell's indexes
		PredictMovement(facingDirection, moveDirection, out leaveDirection, out rowIndex, out colIndex);
		
		//make sure the new cell isn't off the map (out of range)
		if (_map.ValidMapCell(rowIndex, colIndex)) {
			//Now check to make sure there is a wall in the appropriate direction
			CellType currentCellType = _map.GetCellType(_currentRow, _currentCol);
			if (!CellHelper.HasWallInDirection(currentCellType, leaveDirection)) {
				canMove = true;
			}
		}
		
		return canMove;
	}
	
	/// <summary>
	/// Given a facing and a movement direction, this method will determine which direction the player
	/// would leave the grid cell from. It will also return the grid row and index for the space that the 
	/// player would be in at the end of this movement. This method does not actually move the player
	/// </summary>
	/// <param name='facing'>
	/// The direction the player would be facing during this move. Valid values are North, East, South, West
	/// </param>
	/// <param name='movement'>
	/// The direction that the player would move from the current cell. Valid values are forward, right, backward, and left.
	/// </param>
	/// <param name='leave'>
	/// This is the direction that the players movement would cause him to leave the current cell. For example, if
	/// the player is facing East, and they move right, this would cause them to leave the current cell by the south side.
	/// </param>
	/// <param name='rowModifier'>
	/// This is the new row index, based on the players current position, after the movement would play out.
	/// </param>
	/// <param name='colModifier'>
	/// This is the new column index, based on the players current position, after the movement would play out.
	/// </param>
	private void PredictMovement(Direction facing, Direction movement, out Direction leave, out int rowIndex, out int colIndex) {
		leave = Direction.None;
		
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
		
		GetAdjacentCellIndex(leave, _currentRow, _currentCol, out rowIndex, out colIndex);
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
	private void GetAdjacentCellIndex(Direction direction, int rowIndex, int colIndex, out int adjacentRowIndex, out int adjacentColIndex) {
		adjacentRowIndex = rowIndex;
		adjacentColIndex = colIndex;
		
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
	}
	
}
