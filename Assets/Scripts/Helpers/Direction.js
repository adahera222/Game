#pragma strict

public enum Direction {Up, Down, Right, Left, Forward, Backward, North, South, East, West, None}

public static class DirectionHelper {
	
	public function GetRandomDirectionFromSubset(directions: Direction[]): Direction {
		//if no subset was passed in, return None
		if (directions.Length == 0) {
			return Direction.None;
		}
		
		//Randomly select an index from the available directions
		var index: int = Random.Range(0, directions.Length);
		
		return directions[index];
	}
	
	public function GetOppositeDirection(direction: Direction): Direction {
		if (direction == Direction.Up) { return Direction.Down; }
		if (direction == Direction.Down) { return Direction.Up; }
		if (direction == Direction.Right) { return Direction.Left; }
		if (direction == Direction.Left) { return Direction.Right; }
		if (direction == Direction.Forward) { return Direction.Backward; }
		if (direction == Direction.Backward) { return Direction.Forward; }
		if (direction == Direction.North) { return Direction.South; }
		if (direction == Direction.South) { return Direction.North; }
		if (direction == Direction.East) { return Direction.West; }
		if (direction == Direction.West) { return Direction.East; }
		return Direction.None;
	}
	
}