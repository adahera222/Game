#pragma strict

/***************************************
 * Maps will use the following numbers
 * to represent various wall configurations:
 * 0  [None]     : Nothing in this Cell. Unreachable.
 * 1  [NSHall]   : Hallway running north and south
 * 2  [EWHall]   : Hallway running east and west
 * 3  [WWall]    : one wall to the west
 * 4  [SWall]    : one wall to the south
 * 5  [EWall]    : one wall to the east
 * 6  [NWall]    : one wall to the north
 * 7  [Empty]    : no walls
 * 8  [NDeadEnd] : walls east, west, and south. No north wall.
 * 9  [EDeadEnd] : walls west, north, and south. No east wall.
 * 10 [SDeadEnd] : walls west, north, and east. No south wall.
 * 11 [WDeadEnd] : walls north, south,and east. Now west wall.
 * 12 [NWCorner] : Corner with North and West Walls
 * 13 [NECorner] : Corner with North and East walls
 * 14 [SECorner] : Corner with East and South walls
 * 15 [SWCorner] : Corner with West and South walls
 ***************************************/
public enum CellType {None, NSHall, EWHall, WWall, SWall, EWall, NWall, Empty, NDeadEnd, EDeadEnd, SDeadEnd, WDeadEnd, NWCorner, NECorner, SECorner, SWCorner};

//Define a struct for tracking cell indexes
public class CellIndex extends System.ValueType {
	public var Row: int;
	public var Col: int;
	
	public function CellIndex(rowIndex: int, colIndex: int) {
		this.Row = rowIndex;
		this.Col = colIndex;
	}
}

//Similar to CellIndex class, but includes a boolean flag. Useful for things like returning whether or not the indicated index meets a specific condition
public class FlaggableCellIndex extends System.ValueType {
	public var Row: int;
	public var Col: int;
	public var Flag: boolean;
	
	public function FlaggableCellIndex(rowIndex: int, colIndex: int, flag: boolean) {
		this.Row = rowIndex;
		this.Col = colIndex;
		this.Flag = flag;
	}
}

public static class CellHelper {
	private var cellTypesWithNorthWalls = [CellType.EWHall, CellType.NWall, CellType.EDeadEnd, CellType.SDeadEnd, CellType.WDeadEnd, CellType.NWCorner, CellType.NECorner];
	private var cellTypesWithEastWalls = [CellType.NSHall, CellType.EWall, CellType.NDeadEnd, CellType.SDeadEnd, CellType.WDeadEnd, CellType.NECorner, CellType.SECorner];
	private var cellTypesWithSouthWalls = [CellType.EWHall, CellType.SWall, CellType.NDeadEnd, CellType.EDeadEnd, CellType.WDeadEnd, CellType.SECorner, CellType.SWCorner];
	private var cellTypesWithWestWalls = [CellType.NSHall, CellType.WWall, CellType.NDeadEnd, CellType.EDeadEnd, CellType.SDeadEnd, CellType.NWCorner, CellType.SWCorner];
	
	public function HasNorthWall(type: CellType): boolean {
		return System.Array.IndexOf (cellTypesWithNorthWalls, type) > -1;
	}
	
	public function HasEastWall(type: CellType): boolean {
		return System.Array.IndexOf (cellTypesWithEastWalls, type) > -1;
	}
	
	public function HasSouthWall(type: CellType): boolean {
		return System.Array.IndexOf (cellTypesWithSouthWalls, type) > -1;
	}
	
	public function HasWestWall(type: CellType): boolean {
		return System.Array.IndexOf (cellTypesWithWestWalls, type) > -1;
	}
		
	/// <summary>
	/// Determines whether this cell type has a wall in the specified direction 
	/// </summary>
	/// <returns>
	/// <c>true</c> if this instance has a wall in the specified direction; otherwise, <c>false</c>.
	/// </returns>
	/// <param name='type'>
	/// The type of cell to check
	/// </param>
	/// <param name='direction'>
	/// The direction to check. Only supports North, South, East, and West
	/// </param>
	public function HasWallInDirection(type: CellType, direction: Direction): boolean {
		var hasWall: boolean = false;
		
		switch (direction) {
		case Direction.North :
			hasWall = HasNorthWall(type);
			break;
		case Direction.East :
			hasWall = HasEastWall (type);
			break;
		case Direction.South :
			hasWall = HasSouthWall (type);
			break;
		case Direction.West :
			hasWall = HasWestWall (type);
			break;
		}
		
		return hasWall;
	}
	
}